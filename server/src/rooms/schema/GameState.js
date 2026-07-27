const { Schema, type, MapSchema } = require("@colyseus/schema");
const { Player } = require("./Player");
const { Block } = require("./Block");

class GameState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.blocks = new MapSchema();
    this.level = 0;
    this.finished = false;
  }
}

type({ map: Player })(GameState.prototype, "players");
type({ map: Block })(GameState.prototype, "blocks");
type("number")(GameState.prototype, "level");
type("boolean")(GameState.prototype, "finished");

module.exports = { GameState };
