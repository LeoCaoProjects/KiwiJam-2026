const { Room } = require("colyseus");
const { GameState } = require("./schema/GameState");
const { Player } = require("./schema/Player");
const { Block } = require("./schema/Block");

const lastLevel = 5;
const spawnX = [176, 176, 176, 80, 144, 80];
const spawnY = [408, 408, 408, 888, 376, 472];
const mapWidths = [60, 60, 60, 120, 120, 240];
const mapHeights = [22, 22, 22, 40, 22, 22];
const blockLifetime = 5000;
const blockCooldown = 1000;

function getSpawnX(slot, level) {
  const offset = slot === 1 ? -8 : 8;
  return spawnX[level] + offset;
}

class GameRoom extends Room {
  onCreate() {
    this.setState(new GameState());
    this.maxClients = 2;
    this.playersAtGoal = new Set();
    this.blockTimers = new Map();
    this.blockCooldowns = new Map();

    this.onMessage("ping", (client, message) => {
      if (
        !this.state.players.has(client.sessionId) ||
        this.state.players.size !== 2 ||
        message?.level !== this.state.level ||
        !Number.isFinite(message?.x) ||
        !Number.isFinite(message?.y) ||
        message.x < 0 ||
        message.x >= mapWidths[this.state.level] * 32 ||
        message.y < 0 ||
        message.y >= mapHeights[this.state.level] * 32
      ) {
        return;
      }

      this.broadcast("ping", {
        x: Math.round(message.x),
        y: Math.round(message.y),
        level: this.state.level,
      });
    });

    this.onMessage("placeBlock", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      const tileX = message?.tileX;
      const tileY = message?.tileY;

      if (
        !player ||
        this.state.players.size !== 2 ||
        this.state.level < 1 ||
        this.state.blocks.has(client.sessionId) ||
        Date.now() <
          (this.blockCooldowns.get(client.sessionId) || 0) ||
        message?.level !== this.state.level ||
        !Number.isInteger(tileX) ||
        !Number.isInteger(tileY) ||
        tileX < 0 ||
        tileX >= mapWidths[this.state.level] ||
        tileY < 0 ||
        tileY >= mapHeights[this.state.level]
      ) {
        return;
      }

      const block = new Block();
      block.x = tileX * 32;
      block.y = tileY * 32;
      block.level = this.state.level;
      block.ownerSlot = player.slot;
      block.expiresAt = Date.now() + blockLifetime;
      this.state.blocks.set(client.sessionId, block);

      const timer = this.clock.setTimeout(() => {
        this.removeBlock(client.sessionId);
      }, blockLifetime);
      this.blockTimers.set(client.sessionId, timer);

      this.broadcast("blockPlaced", {
        ownerSessionId: client.sessionId,
        x: block.x,
        y: block.y,
        level: block.level,
      });
    });

    this.onMessage("move", (client, position) => {
      const player = this.state.players.get(client.sessionId);

      if (!player) {
        return;
      }

      if (Number.isFinite(position.x)) {
        player.x = Math.max(
          8,
          Math.min(
            mapWidths[this.state.level] * 32 - 8,
            position.x
          )
        );
      }

      if (Number.isFinite(position.y)) {
        player.y = Math.max(
          8,
          Math.min(
            mapHeights[this.state.level] * 32 - 8,
            position.y
          )
        );
      }
    });

    this.onMessage("goal", (client, message) => {
      if (
        this.state.finished ||
        message?.level !== this.state.level
      ) {
        return;
      }

      if (message?.touching) {
        this.playersAtGoal.add(client.sessionId);
      } else {
        this.playersAtGoal.delete(client.sessionId);
      }

      const everyoneAtGoal =
        this.state.players.size === 2 &&
        [...this.state.players.keys()].every((sessionId) =>
          this.playersAtGoal.has(sessionId)
        );

      if (!everyoneAtGoal) {
        return;
      }

      if (this.state.level < lastLevel) {
        this.state.level += 1;
        this.playersAtGoal.clear();
        this.removeAllBlocks();
        this.resetPlayers();
        this.broadcast("level", this.state.level);
      } else {
        this.state.finished = true;
        this.playersAtGoal.clear();
        this.removeAllBlocks();
        this.broadcast("finished");
      }
    });

    this.onMessage("fall", (client) => {
      if (!this.state.players.has(client.sessionId)) {
        return;
      }

      this.playersAtGoal.clear();
      this.removeAllBlocks();
      this.resetPlayers();
      this.broadcast("reset");
    });

    this.onMessage("reset", (client) => {
      if (!this.state.players.has(client.sessionId)) {
        return;
      }

      this.playersAtGoal.clear();
      this.removeAllBlocks();
      this.resetPlayers();
      this.broadcast("reset");
    });

    console.log("GameRoom created:", this.roomId);
  }

  onJoin(client, options) {
    const player = new Player();
    const usedSlots = new Set(
      [...this.state.players.values()].map(
        (currentPlayer) => currentPlayer.slot
      )
    );

    player.slot = usedSlots.has(1) ? 2 : 1;
    player.name = options?.name || `Player ${player.slot}`;

    player.x = getSpawnX(player.slot, this.state.level);
    player.y = spawnY[this.state.level];

    this.state.players.set(client.sessionId, player);
    console.log(`${player.name} joined ${this.roomId}`);
  }

  onLeave(client) {
    const player = this.state.players.get(client.sessionId);
    console.log(`${player?.name || client.sessionId} left ${this.roomId}`);
    this.playersAtGoal.delete(client.sessionId);
    this.removeBlock(client.sessionId, false);
    this.blockCooldowns.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  removeBlock(sessionId, startCooldown = true) {
    const timer = this.blockTimers.get(sessionId);

    timer?.clear();
    this.blockTimers.delete(sessionId);

    if (!this.state.blocks.delete(sessionId)) {
      return;
    }

    if (startCooldown) {
      this.blockCooldowns.set(
        sessionId,
        Date.now() + blockCooldown
      );
    }
  }

  removeAllBlocks() {
    [...this.state.blocks.keys()].forEach((sessionId) => {
      this.removeBlock(sessionId);
    });
  }

  resetPlayers() {
    this.state.players.forEach((player) => {
      this.resetPlayer(player);
    });
  }

  resetPlayer(player) {
    player.x = getSpawnX(player.slot, this.state.level);
    player.y = spawnY[this.state.level];
  }

  onDispose() {
    console.log("GameRoom disposed:", this.roomId);
  }
}

module.exports = { GameRoom };
