const { Schema, type } = require("@colyseus/schema");

class Player extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.name = "Player";
    this.slot = 0;
  }
}

type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("string")(Player.prototype, "name");
type("number")(Player.prototype, "slot");

module.exports = { Player };
