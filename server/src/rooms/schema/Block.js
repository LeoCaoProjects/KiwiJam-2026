const { Schema, type } = require("@colyseus/schema");

class Block extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.level = 0;
    this.ownerSlot = 0;
    this.expiresAt = 0;
  }
}

type("number")(Block.prototype, "x");
type("number")(Block.prototype, "y");
type("number")(Block.prototype, "level");
type("number")(Block.prototype, "ownerSlot");
type("number")(Block.prototype, "expiresAt");

module.exports = { Block };
