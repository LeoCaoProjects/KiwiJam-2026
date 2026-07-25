import Phaser from "phaser";
import Player from "../objects/player.js";
import character from "./character.png"; 

export default class GameScene extends Phaser.Scene {
  constructor(room, players) {
    super("GameScene");
    this.room = room;
    this.players = players;
    this.playerObjects = new Map(); // renamed from `dots` since these are Player instances now
    this.localX = null;
    this.localY = null;
    this.lastMoveSent = 0;
  }

  preload() {
    this.load.image("player", character);
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

    if (this.cursors.left.isDown || this.keys.A.isDown) moveX = -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) moveX = 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) moveY = 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) moveY = -1;

    if (moveX === 0 && moveY === 0) {
      return;
    }

    const speed = 0.004 * delta;
    this.localX = Phaser.Math.Clamp(this.localX + moveX * speed, -4.7, 4.7);
    this.localY = Phaser.Math.Clamp(this.localY + moveY * speed, -2.7, 2.7);

    const localPlayer = this.playerObjects.get(this.room.sessionId);

    if (localPlayer) {
      localPlayer.setLogicalPosition(this.localX, this.localY);
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

    this.players.forEach((playerState) => {
      connectedPlayers.add(playerState.sessionId);

      let playerObj = this.playerObjects.get(playerState.sessionId);

      if (!playerObj) {
        playerObj = new Player(this, playerState.sessionId, playerState.x, playerState.y);
        this.playerObjects.set(playerState.sessionId, playerObj);
      }

      if (playerState.sessionId !== this.room.sessionId || this.localX === null) {
        playerObj.setLogicalPosition(playerState.x, playerState.y);
      }
    });

    this.playerObjects.forEach((playerObj, sessionId) => {
      if (!connectedPlayers.has(sessionId)) {
        playerObj.destroy();
        this.playerObjects.delete(sessionId);
      }
    });
  }
}