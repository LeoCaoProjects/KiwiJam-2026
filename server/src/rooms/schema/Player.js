const { Schema, type } = require("@colyseus/schema");

class Player extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rotationY = 0;
    this.name = "Player";
  }
}

type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
type("number")(Player.prototype, "rotationY");
type("string")(Player.prototype, "name");

module.exports = { Player };
