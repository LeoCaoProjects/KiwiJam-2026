const { Room } = require("colyseus");
const { GameState } = require("./schema/GameState");
const { Player } = require("./schema/Player");

class GameRoom extends Room {
  onCreate(options) {
    this.setState(new GameState());
    this.maxClients = 16;

    // Player sends movement updates
    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.x = data.x;
      player.y = data.y;
      player.z = data.z;
      player.rotationY = data.rotationY ?? player.rotationY;
    });

    // Basic chat, broadcasts to everyone in the room
    this.onMessage("chat", (client, text) => {
      const player = this.state.players.get(client.sessionId);
      const name = player?.name || "Player";
      this.broadcast("chat", `${name}: ${text}`);
    });

    console.log("GameRoom created:", this.roomId);
  }

  onJoin(client, options) {
    const player = new Player();
    player.name = options?.name || `Player ${client.sessionId.slice(0, 4)}`;

    // simple spread-out spawn so players don't stack on top of each other
    player.x = Math.random() * 10 - 5;
    player.z = Math.random() * 10 - 5;

    this.state.players.set(client.sessionId, player);
    console.log(`${player.name} joined ${this.roomId}`);
  }

  onLeave(client) {
    const player = this.state.players.get(client.sessionId);
    console.log(`${player?.name || client.sessionId} left ${this.roomId}`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("GameRoom disposed:", this.roomId);
  }
}

module.exports = { GameRoom };
