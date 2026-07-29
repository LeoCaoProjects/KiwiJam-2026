import { getMixedVolume } from "../../audioSettings.js";

const placedBlockFrame = 15;
const blockLifetime = 5000;

export default class BuildBlock {
  constructor(scene, block, isOwner, playerSprite) {
    this.x = block.x;
    this.y = block.y;
    this.level = block.level;
    this.expiresAt = block.expiresAt;
    this.isOwner = isOwner;

    if (isOwner) {
      this.gameObject = scene.physics.add
        .staticImage(
          block.x + 16,
          block.y + 16,
          "placedBlock",
          placedBlockFrame
        )
        .setVisible(false);
      this.collider = scene.physics.add.collider(
        playerSprite,
        this.gameObject
      );
    } else {
      const centerX = block.x + 16;
      const centerY = block.y + 16;

      this.outerGlow = scene.add
        .rectangle(
          centerX,
          centerY,
          32,
          32,
          0x8edcff,
          0.12
        )
        .setStrokeStyle(1, 0xdff8ff, 0.35)
        .setDepth(10);
      this.gameObject = scene.add
        .rectangle(
          centerX,
          centerY,
          26,
          26,
          0x123f58,
          0.72
        )
        .setStrokeStyle(2, 0xdff8ff, 0.9)
        .setDepth(11);
      this.pulse = scene.tweens.add({
        targets: this.outerGlow,
        scale: 1.08,
        alpha: 0.5,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.countdown = scene.add
        .text(centerX, centerY, "5", {
          fontFamily: "Cinzel, serif",
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setStroke("#123f58", 3)
        .setShadow(0, 0, "#8edcff", 6)
        .setDepth(13);
      this.countdownSound = scene.sound.add(
        "blockCountdownSound",
        { volume: getMixedVolume("blockCountdown") }
      );
      this.countdownEndsAt =
        performance.now() + blockLifetime;
      this.countdownSound.play();
      this.updateCountdown();
    }
  }

  matches(block, isOwner) {
    return (
      this.x === block.x &&
      this.y === block.y &&
      this.level === block.level &&
      this.expiresAt === block.expiresAt &&
      this.isOwner === isOwner
    );
  }

  updateCountdown() {
    if (!this.countdown) {
      return;
    }

    const secondsLeft = Math.max(
      1,
      Math.ceil(
        (this.countdownEndsAt - performance.now()) / 1000
      )
    );

    this.countdown.setText(String(secondsLeft));
  }

  destroy() {
    this.collider?.destroy();
    this.pulse?.destroy();
    this.outerGlow?.destroy();
    this.countdown?.destroy();
    this.countdownSound?.stop();
    this.countdownSound?.destroy();
    this.gameObject.destroy();
  }
}
