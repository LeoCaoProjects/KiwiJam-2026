import Phaser from 'phaser';

export default class Player {
  constructor(scene, sessionId, x, y, texture = "player") {
    this.sessionId = sessionId;
    this.scene = scene;

    this.sprite = scene.add.sprite(0, 0, texture);

    // Particle emitter, attached to follow the sprite
    this.emitter = scene.add.particles(0, 0, "particleTexture", {
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      frequency: 50, // emit every 50ms; set to -1 for a manual burst-only emitter
    });

    /*
    this.emitter = scene.add.particles(0, 0, "particleTexture", {
        speed: { min: 100, max: 150 },
        angle: { min: -85, max: -95 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 4,
        // Add the color property here:
        
        color: [ 0xffff00, 0xffa500, 0xff0000 ] // Yellow -> Orange -> Red
    });
    */

    this.emitter.startFollow(this.sprite);

    this.setLogicalPosition(x, y); 
  }

  setLogicalPosition(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(this.toScreenX(x), this.toScreenY(y));
    // no need to manually move the emitter — startFollow handles it
  }

  toScreenX(x) {
    return 160 + x * 30;
  }

  toScreenY(y) {
    return 90 - y * 30;
  }

  destroy() {
    this.emitter.destroy();
    this.sprite.destroy();
  }
}