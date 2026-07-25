import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor(room, players) {
    super("GameScene");
    this.room = room;
    this.players = players;
    this.dots = new Map();
    this.localX = null;
    this.localY = null;
    this.lastMoveSent = 0;
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
    this.drawPlayers();
  }

  update(time, delta) {
    const player = this.players.find(
      (currentPlayer) => currentPlayer.sessionId === this.room.sessionId
    );

    if (!player) {
      return;
    }

    if (this.localX === null) {
      this.localX = player.x;
      this.localY = player.y;
    }

    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      moveX = -1;
    }

    if (this.cursors.right.isDown || this.keys.D.isDown) {
      moveX = 1;
    }

    if (this.cursors.up.isDown || this.keys.W.isDown) {
      moveY = 1;
    }

    if (this.cursors.down.isDown || this.keys.S.isDown) {
      moveY = -1;
    }

    if (moveX === 0 && moveY === 0) {
      return;
    }

    const speed = 0.004 * delta;
    this.localX = Phaser.Math.Clamp(this.localX + moveX * speed, -4.7, 4.7);
    this.localY = Phaser.Math.Clamp(this.localY + moveY * speed, -2.7, 2.7);

    const dot = this.dots.get(this.room.sessionId);

    if (dot) {
      dot.setPosition(this.toScreenX(this.localX), this.toScreenY(this.localY));
    }

    if (time - this.lastMoveSent >= 50) {
      this.room.send("move", { x: this.localX, y: this.localY });
      this.lastMoveSent = time;
    }
  }

  setPlayers(players) {
    this.players = players;

    if (this.sys && this.sys.isActive()) {
      this.drawPlayers();
    }
  }

  drawPlayers() {
    const connectedPlayers = new Set();

    this.players.forEach((player) => {
      connectedPlayers.add(player.sessionId);

      let dot = this.dots.get(player.sessionId);

      if (!dot) {
        dot = this.add.circle(0, 0, 8, 0x000000);
        this.dots.set(player.sessionId, dot);
      }

      if (player.sessionId !== this.room.sessionId || this.localX === null) {
        dot.setPosition(this.toScreenX(player.x), this.toScreenY(player.y));
      }
    });

    this.dots.forEach((dot, sessionId) => {
      if (!connectedPlayers.has(sessionId)) {
        dot.destroy();
        this.dots.delete(sessionId);
      }
    });
  }

  toScreenX(x) {
    return 160 + x * 30;
  }

  toScreenY(y) {
    return 90 - y * 30;
  }
}
