const { Schema, type, MapSchema } = require("@colyseus/schema");
const { Player } = require("./Player");

class GameState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}

type({ map: Player })(GameState.prototype, "players");

module.exports = { GameState };
