const { Room } = require("colyseus");
const { GameState } = require("./schema/GameState");
const { Player } = require("./schema/Player");

class GameRoom extends Room {
  onCreate() {
    this.setState(new GameState());
    this.maxClients = 2;

    console.log("GameRoom created:", this.roomId);
  }

  onJoin(client, options) {
    const player = new Player();
    player.slot = this.state.players.size + 1;
    player.name = options?.name || `Player ${player.slot}`;

    player.x = player.slot === 1 ? -3 : 3;
    player.y = 0;

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
