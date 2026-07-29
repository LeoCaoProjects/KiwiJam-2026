export default class Player {
  constructor(scene, sessionId, x, y) {
    this.sessionId = sessionId;
    this.dimmed = false;
    this.halo = scene.add
      .circle(x, y, 24, 0x8edcff, 0.12)
      .setStrokeStyle(1, 0xdff8ff, 0.35);
    this.innerGlow = scene.add.circle(x, y, 17, 0xdff8ff, 0.2);
    this.sprite = scene.add
      .circle(x, y, 12, 0xffffff)
      .setStrokeStyle(2, 0xb9ecff);

    this.pulse = scene.tweens.add({
      targets: this.halo,
      scale: 1.15,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.emitters = [
      scene.add.particles(0, 0, "playerParticle", {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 450, max: 800 },
        frequency: 18,
        quantity: 2,
        blendMode: "ADD",
      }),
      scene.add.particles(0, 0, "playerGlow", {
        speed: { min: 12, max: 48 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 0.85, end: 0 },
        lifespan: { min: 600, max: 1000 },
        frequency: 30,
        quantity: 1,
        blendMode: "ADD",
      }),
      scene.add.particles(0, 0, "playerSpark", {
        speed: { min: 45, max: 95 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 300, max: 550 },
        frequency: 45,
        quantity: 1,
        blendMode: "ADD",
      }),
    ];

    this.emitters.forEach((emitter) => {
      emitter.startFollow(this.sprite);
    });
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.updateVisuals();
  }

  updateVisuals() {
    this.halo.setPosition(this.sprite.x, this.sprite.y);
    this.innerGlow.setPosition(this.sprite.x, this.sprite.y);
  }

  setDimmed(dimmed) {
    if (this.dimmed === dimmed) {
      return;
    }

    this.dimmed = dimmed;
    this.sprite.setAlpha(dimmed ? 0.48 : 1);
    this.innerGlow.setAlpha(dimmed ? 0.35 : 1);
    this.halo.setVisible(!dimmed);
    this.emitters.forEach((emitter) => {
      if (dimmed) {
        emitter.stop();
      } else {
        emitter.start();
        emitter.emitParticle();
      }
    });
  }

  destroy() {
    this.pulse.destroy();
    this.emitters.forEach((emitter) => emitter.destroy());
    this.halo.destroy();
    this.innerGlow.destroy();
    this.sprite.destroy();
  }
}
