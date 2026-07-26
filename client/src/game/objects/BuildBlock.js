const placedBlockFrame = 15;

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
      this.gameObject = scene.add
        .image(
          block.x + 16,
          block.y + 16,
          "placedBlock",
          placedBlockFrame
        )
        .setDepth(10);
      this.countdown = scene.add
        .text(block.x + 16, block.y + 16, "5", {
          fontFamily: "Cinzel, serif",
          fontSize: "18px",
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(11);
      this.countdownSound = scene.sound.add(
        "blockCountdownSound",
        { volume: 1 }
      );
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
      Math.ceil((this.expiresAt - Date.now()) / 1000)
    );

    this.countdown.setText(String(secondsLeft));
  }

  destroy() {
    this.collider?.destroy();
    this.countdown?.destroy();
    this.countdownSound?.stop();
    this.countdownSound?.destroy();
    this.gameObject.destroy();
  }
}
