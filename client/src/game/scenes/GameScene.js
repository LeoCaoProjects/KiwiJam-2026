import Phaser from "phaser";
import Player from "../objects/Player.js";
import {
  createPlayground,
  preloadPlayground,
} from "../levels/LevelLoader.js";

export default class GameScene extends Phaser.Scene {
  constructor(room, players, level) {
    super("GameScene");
    this.room = room;
    this.players = players;
    this.level = level;
    this.playerObjects = new Map();
    this.touchingGoal = false;
    this.lastMoveSent = 0;
  }

  preload() {
    this.load.image(
      "gradientBackground",
      "/assets/backgrounds/gradient-bottom-to-top.png"
    );
    preloadPlayground(this, this.level);
  }

  create() {
    this.playerObjects = new Map();
    this.localPlayer = null;
    this.touchingGoal = false;
    this.lastMoveSent = 0;
    this.fallResetSent = false;
    this.isRestarting = false;

    const localPlayerData = this.players.find(
      (player) => player.sessionId === this.room.sessionId
    );
    const level = createPlayground(
      this,
      this.level,
      localPlayerData?.slot
    );

    this.map = level.map;
    this.platforms = level.platforms;
    this.collisions = level.collisions;
    this.mapOffsetY = level.mapOffsetY;
    this.spawnTile = this.collisions.findByIndex(17);
    this.goalTile = this.collisions.findByIndex(18);
    this.createBackground();
    this.createParticleTextures();
    this.createGoalParticles();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R");
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.drawPlayers();
    this.removeResetListener = this.room.onMessage("reset", () => {
      this.resetPlayersToSpawn();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeResetListener();
    });

    const camera = this.cameras.main;
    const localPlayer = this.playerObjects.get(this.room.sessionId);

    camera.setRoundPixels(true);
    camera.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    if (localPlayer) {
      this.localPlayer = localPlayer;
      this.updateCamera();
      this.events.on(
        Phaser.Scenes.Events.POST_UPDATE,
        this.updateCamera,
        this
      );
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.events.off(
          Phaser.Scenes.Events.POST_UPDATE,
          this.updateCamera,
          this
        );
      });
    }
  }

  createBackground() {
    this.cameras.main.setBackgroundColor("#123f58");
    this.add
      .image(0, 0, "gradientBackground")
      .setOrigin(0)
      .setDisplaySize(1280, 704)
      .setScrollFactor(0)
      .setDepth(-10);
  }

  createParticleTextures() {
    this.createParticleTexture("playerParticle", 0xffffff, 5);
    this.createParticleTexture("playerGlow", 0x8edcff, 4);
    this.createParticleTexture("playerSpark", 0xdff8ff, 2);
    this.createParticleTexture("goalParticle", 0x62ff8a, 4);
    this.createParticleTexture("goalGlow", 0xc8ffd5, 3);
  }

  createParticleTexture(key, color, size) {
    if (this.textures.exists(key)) {
      return;
    }

    const texture = this.add.graphics();

    texture.fillStyle(color);
    texture.fillCircle(size / 2, size / 2, size / 2);
    texture.generateTexture(key, size, size);
    texture.destroy();
  }

  createGoalParticles() {
    const x = this.goalTile.pixelX + 16;
    const y = this.goalTile.pixelY + this.mapOffsetY + 16;

    this.add
      .circle(x, y, 5, 0x62ff8a)
      .setStrokeStyle(1, 0xffffff);

    this.add.particles(x, y, "goalParticle", {
      speed: { min: 20, max: 55 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 500, max: 850 },
      frequency: 25,
      quantity: 2,
      blendMode: "ADD",
    });

    this.add.particles(x, y, "goalGlow", {
      speed: { min: 8, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 650, max: 950 },
      frequency: 45,
      quantity: 1,
      blendMode: "ADD",
    });
  }

  update(time) {
    const player = this.players.find(
      (currentPlayer) => currentPlayer.sessionId === this.room.sessionId
    );
    const localPlayer = this.playerObjects.get(this.room.sessionId);
    const sprite = localPlayer?.sprite;

    if (!player || !sprite?.body) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.room.send("reset");
    }

    if (
      sprite.y > this.map.heightInPixels + 32 &&
      !this.fallResetSent
    ) {
      this.fallResetSent = true;
      this.room.send("fall");
    }

    let moveX = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      moveX = -1;
    }

    if (this.cursors.right.isDown || this.keys.D.isDown) {
      moveX = 1;
    }

    sprite.body.setVelocityX(moveX * 200);

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W);
    const onGround =
      sprite.body.blocked.down ||
      sprite.body.touching.down;

    if (jumpPressed && onGround) {
      sprite.body.setVelocityY(-460);
    }

    const insideGoal =
      sprite.body.left >= this.goalTile.pixelX &&
      sprite.body.right <= this.goalTile.pixelX + 32 &&
      sprite.body.top >=
        this.goalTile.pixelY + this.mapOffsetY &&
      sprite.body.bottom <=
        this.goalTile.pixelY + this.mapOffsetY + 32;
    const standingInGoal =
      insideGoal &&
      onGround &&
      moveX === 0;

    if (standingInGoal !== this.touchingGoal) {
      this.touchingGoal = standingInGoal;
      this.room.send("goal", {
        touching: standingInGoal,
        level: this.level,
      });
    }

    if (time - this.lastMoveSent >= 50) {
      this.room.send("move", { x: sprite.x, y: sprite.y });
      this.lastMoveSent = time;
    }
  }

  updateCamera() {
    this.localPlayer.updateVisuals();

    const camera = this.cameras.main;
    const maxScrollX = this.map.widthInPixels - camera.width;
    const scrollX = Phaser.Math.Clamp(
      Math.round(this.localPlayer.sprite.x - camera.width / 2),
      0,
      maxScrollX
    );

    camera.setScroll(scrollX, 0);
  }

  setPlayers(players) {
    this.players = players;

    if (this.sys && this.sys.isActive() && !this.isRestarting) {
      this.drawPlayers();
    }
  }

  setLevel(level) {
    if (level === this.level) {
      return;
    }

    this.level = level;
    this.isRestarting = true;
    this.scene.restart();
  }

  resetPlayersToSpawn() {
    this.players.forEach((player) => {
      this.resetPlayerToSpawn(player.sessionId);
    });
  }

  resetPlayerToSpawn(sessionId) {
    const player = this.players.find(
      (currentPlayer) => currentPlayer.sessionId === sessionId
    );
    const playerObject = this.playerObjects.get(sessionId);

    if (!player || !playerObject) {
      return;
    }

    const spawnOffset = player.slot === 1 ? -8 : 8;
    const spawnX = this.spawnTile.pixelX + 16 + spawnOffset;
    const spawnY =
      this.spawnTile.pixelY + this.mapOffsetY + 24;

    if (playerObject.sprite.body) {
      playerObject.sprite.body.reset(spawnX, spawnY);
    } else {
      playerObject.setPosition(spawnX, spawnY);
    }

    playerObject.updateVisuals();

    if (sessionId === this.room.sessionId) {
      this.touchingGoal = false;
      this.fallResetSent = false;
    }
  }

  drawPlayers() {
    const connectedPlayers = new Set();

    this.players.forEach((player) => {
      connectedPlayers.add(player.sessionId);

      let playerObject = this.playerObjects.get(player.sessionId);
      const isNewPlayer = !playerObject;

      if (!playerObject) {
        const spawnOffset = player.slot === 1 ? -8 : 8;
        const spawnX = this.spawnTile.pixelX + 16 + spawnOffset;
        const spawnY =
          this.spawnTile.pixelY + this.mapOffsetY + 24;

        playerObject = new Player(
          this,
          player.sessionId,
          spawnX,
          spawnY
        );
        this.playerObjects.set(player.sessionId, playerObject);

        if (player.sessionId === this.room.sessionId) {
          this.physics.add.existing(playerObject.sprite);
          playerObject.sprite.body.setCircle(8, 4, 4);
          playerObject.sprite.body.setCollideWorldBounds(true);
          this.physics.add.collider(
            playerObject.sprite,
            this.collisions
          );
        }
      }

      if (
        player.sessionId !== this.room.sessionId &&
        !isNewPlayer
      ) {
        playerObject.setPosition(player.x, player.y);
      }
    });

    this.playerObjects.forEach((playerObject, sessionId) => {
      if (!connectedPlayers.has(sessionId)) {
        playerObject.destroy();
        this.playerObjects.delete(sessionId);
      }
    });
  }
}
