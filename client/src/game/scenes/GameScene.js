import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor(players) {
    super("GameScene");
    this.players = players;
  }

  create() {
    this.drawPlayers();
  }

  setPlayers(players) {
    this.players = players;

    if (this.sys && this.sys.isActive()) {
      this.drawPlayers();
    }
  }

  drawPlayers() {
    this.children.removeAll(true);

    this.players.forEach((player) => {
      this.add.circle(160 + player.x * 30, 90 - player.y * 30, 8, 0x000000);
    });
  }
}
