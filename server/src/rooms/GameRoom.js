const { Room } = require("colyseus");
const { GameState } = require("./schema/GameState");
const { Player } = require("./schema/Player");

const lastLevel = 2;
const spawnY = 472;

function getSpawnX(slot) {
  return slot === 1 ? 168 : 184;
}

class GameRoom extends Room {
  onCreate() {
    this.setState(new GameState());
    this.maxClients = 2;
    this.level = 0;
    this.playersAtGoal = new Set();

    this.onMessage("move", (client, position) => {
      const player = this.state.players.get(client.sessionId);

      if (!player) {
        return;
      }

      if (Number.isFinite(position.x)) {
        player.x = Math.max(8, Math.min(3832, position.x));
      }

      if (Number.isFinite(position.y)) {
        player.y = Math.max(8, Math.min(696, position.y));
      }
    });

    this.onMessage("goal", (client, message) => {
      if (message?.level !== this.level) {
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

      if (everyoneAtGoal && this.level < lastLevel) {
        this.level += 1;
        this.playersAtGoal.clear();
        this.resetPlayers();
        this.broadcast("level", this.level);
      }
    });

    this.onMessage("fall", (client) => {
      if (!this.state.players.has(client.sessionId)) {
        return;
      }

      this.playersAtGoal.clear();
      this.resetPlayers();
      this.broadcast("reset");
    });

    this.onMessage("reset", (client) => {
      if (!this.state.players.has(client.sessionId)) {
        return;
      }

      this.playersAtGoal.clear();
      this.resetPlayers();
      this.broadcast("reset");
    });

    console.log("GameRoom created:", this.roomId);
  }

  onJoin(client, options) {
    const player = new Player();
    player.slot = this.state.players.size + 1;
    player.name = options?.name || `Player ${player.slot}`;

    player.x = getSpawnX(player.slot);
    player.y = spawnY;

    this.state.players.set(client.sessionId, player);
    console.log(`${player.name} joined ${this.roomId}`);
  }

  onLeave(client) {
    const player = this.state.players.get(client.sessionId);
    console.log(`${player?.name || client.sessionId} left ${this.roomId}`);
    this.playersAtGoal.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  resetPlayers() {
    this.state.players.forEach((player) => {
      this.resetPlayer(player);
    });
  }

  resetPlayer(player) {
    player.x = getSpawnX(player.slot);
    player.y = spawnY;
  }

  onDispose() {
    console.log("GameRoom disposed:", this.roomId);
  }
}

module.exports = { GameRoom };
