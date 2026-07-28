import Phaser from "phaser";
import Player from "../objects/Player.js";
import BuildBlock from "../objects/BuildBlock.js";
import {
  getMixedVolume,
  playTypewriterSound,
} from "../../audioSettings.js";
import {
  createPlayground,
  preloadPlayground,
  spikeTiles,
} from "../levels/LevelLoader.js";

const chapterTitles = [
  "Chapter 1: One spark",
  "Chapter 2: Apart",
  "Chapter 3: What I Didn't Say",
  "Chapter 4: Closer Still",
  "Chapter 5: Not Yet",
  "Chapter 6: Entangled",
];

const chapterDialogue = [
  [
    "What you can't see may still be true.",
    "So say what you see. That's the only way through.",
  ],
  [
    "They drifted further this time. The gap grew wide.",
    "Something will place where you decide.",
    "You won't see it land, but they're not blind.",
    "So don't be in shock. Right click to place a block.",
    "Don't wait too long. Five seconds, then gone.",
  ],
  [
    "I've never said this to anyone before,",
    "but I don't want to lose you. Not anymore.",
  ],
  [
    "I'd stay in this dark forever with you,",
    "closer still, whatever we go through.",
    "I don't need the light to know you're near.",
    "Your voice is enough. I just want you here.",
  ],
  [
    "Whatever's coming, it can wait one more breath.",
    "I have something left to say",
    "before there's nothing left.",
    "I love you. Not yet, please. Not yet...",
  ],
  [
    "Two worlds tried to pull us far,",
    "to make us choose and want to lose.",
    "But entangled things don't break apart,",
    "holding together, right from the start.",
    "Not one, not two, just one bright spark.",
    "I love you, from the bottom of my heart.",
  ],
];

export default class GameScene extends Phaser.Scene {
  constructor(room, players, blocks, level) {
    super("GameScene");
    this.room = room;
    this.players = players;
    this.blocks = blocks;
    this.level = level;
    this.playerObjects = new Map();
    this.blockObjects = new Map();
    this.touchingGoal = false;
    this.lastMoveSent = 0;
    this.dialogueIndex = -1;
    this.dialogueReady = false;
    this.dialoguePlaying = false;
  }

  preload() {
    this.load.image(
      "gradientBackground",
      "./assets/backgrounds/gradient-bottom-to-top.png"
    );

    if (!this.cache.audio.exists("jumpSound")) {
      this.load.audio(
        "jumpSound",
        "./assets/audio/Player/Jump.wav"
      );
    }

    if (!this.cache.audio.exists("fallSound")) {
      this.load.audio(
        "fallSound",
        "./assets/audio/Player/Falling.wav"
      );
    }

    if (!this.cache.audio.exists("placeBlockSound")) {
      this.load.audio(
        "placeBlockSound",
        "./assets/audio/Player/Placing Block_tile.wav"
      );
    }

    if (!this.cache.audio.exists("blockCountdownSound")) {
      this.load.audio(
        "blockCountdownSound",
        "./assets/audio/Place block countdown woosh boosted.wav"
      );
    }

    preloadPlayground(this, this.level);
  }

  create() {
    this.playerObjects = new Map();
    this.blockObjects = new Map();
    this.localPlayer = null;
    this.touchingGoal = false;
    this.lastMoveSent = 0;
    this.fallResetSent = false;
    this.spikeResetSent = false;
    this.isRestarting = false;
    this.dialogueLines = null;
    this.dialogueIndex = -1;
    this.dialogueReady = false;
    this.dialoguePlaying = false;

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
    this.createChapterLabel();
    this.createChapterDialogue();
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
    this.drawBlocks();
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.removeResetListener = this.room.onMessage("reset", () => {
      this.resetPlayersToSpawn();
    });
    this.removeBlockPlacedListener = this.room.onMessage(
      "blockPlaced",
      (block) => {
        if (
          block.ownerSessionId === this.room.sessionId &&
          block.level === this.level
        ) {
          this.showBlockPlacementEffect(block.x, block.y);
        }
      }
    );
    this.removePingListener = this.room.onMessage("ping", (ping) => {
      if (ping.level === this.level) {
        this.showPing(ping.x, ping.y);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeResetListener();
      this.removeBlockPlacedListener();
      this.removePingListener();
      this.input.off(
        "pointerdown",
        this.handlePointerDown,
        this
      );
      this.destroyBlocks();
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

  createChapterLabel() {
    this.add
      .text(20, 18, chapterTitles[this.level] || "", {
        fontFamily: "Cinzel, serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);
  }

  createChapterDialogue() {
    const lines = chapterDialogue[this.level];

    if (!lines) {
      return;
    }

    this.dialogueLines = lines;
    this.dialogueIndex = -1;
    this.dialogueReady = false;
    this.dialoguePlaying = true;
    this.dialoguePanel = this.add
      .rectangle(640, 612, 1040, 96, 0x04111d, 0.82)
      .setStrokeStyle(1, 0x8edcff, 0.45)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
    this.dialogueText = this.add
      .text(640, 612, "", {
        fontFamily: "Cinzel, serif",
        fontSize: "26px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 850, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202)
      .setAlpha(0);

    this.time.delayedCall(700, () => {
      this.dialogueReady = true;
      this.showNextDialogueLine();
    });
  }

  showNextDialogueLine() {
    if (!this.dialogueReady || !this.dialogueLines) {
      return;
    }

    const nextIndex = this.dialogueIndex + 1;

    if (nextIndex >= this.dialogueLines.length) {
      return;
    }

    this.dialogueReady = false;
    this.dialogueIndex = nextIndex;
    const line = this.dialogueLines[nextIndex];
    const dialogueObjects = [
      this.dialoguePanel,
      this.dialogueText,
    ];

    this.tweens.add({
      targets: dialogueObjects,
      alpha: 0,
      duration: this.dialogueIndex === 0 ? 0 : 250,
      ease: "Sine.easeInOut",
      onComplete: () => this.revealDialogueLine(line, dialogueObjects),
    });
  }

  revealDialogueLine(line, dialogueObjects) {
    this.dialogueText.setText("");

    this.tweens.add({
      targets: dialogueObjects,
      alpha: 1,
      duration: 450,
      ease: "Sine.easeInOut",
    });

    let character = 0;

    this.dialogueTypingEvent?.remove();
    this.dialogueTypingEvent = this.time.addEvent({
      delay: 58,
      repeat: line.length - 1,
      callback: () => {
        character += 1;
        this.dialogueText.setText(line.slice(0, character));

        const typedCharacter = line[character - 1];

        if (/[a-z0-9]/i.test(typedCharacter)) {
          playTypewriterSound(
            typedCharacter,
            this.sound.context
          );
        }

        if (character === line.length) {
          this.waitAfterDialogueLine(line, dialogueObjects);
        }
      },
    });
  }

  waitAfterDialogueLine(line, dialogueObjects) {
    const wordCount = line.split(" ").length;
    const readingTime = Phaser.Math.Clamp(
      wordCount * 550,
      3200,
      7000
    );

    this.time.delayedCall(readingTime, () => {
      if (this.dialogueIndex === this.dialogueLines.length - 1) {
        this.tweens.add({
          targets: dialogueObjects,
          alpha: 0,
          duration: 700,
          ease: "Sine.easeInOut",
          onComplete: () => {
            this.dialoguePlaying = false;
          },
        });
        return;
      }

      this.dialogueReady = true;
      this.showNextDialogueLine();
    });
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
    this.blockObjects.forEach((block) => {
      block.updateCountdown();
    });

    const player = this.players.find(
      (currentPlayer) => currentPlayer.sessionId === this.room.sessionId
    );
    const localPlayer = this.playerObjects.get(this.room.sessionId);
    const sprite = localPlayer?.sprite;

    if (!player || !sprite?.body) {
      return;
    }

    if (this.dialoguePlaying) {
      sprite.body.setVelocityX(0);

      if (time - this.lastMoveSent >= 50) {
        this.room.send("move", {
          x: sprite.x,
          y: sprite.y,
        });
        this.lastMoveSent = time;
      }

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
      this.sound.play("fallSound", {
        volume: getMixedVolume("fall"),
      });
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
      this.sound.play("jumpSound", {
        volume: getMixedVolume("jump"),
      });
    }

    const goalLeft = this.goalTile.pixelX;
    const goalRight = goalLeft + 32;
    const goalTop =
      this.goalTile.pixelY + this.mapOffsetY;
    const goalBottom = goalTop + 32;
    const goalOverlapX =
      Math.min(sprite.body.right, goalRight) -
      Math.max(sprite.body.left, goalLeft);
    const goalOverlapY =
      Math.min(sprite.body.bottom, goalBottom) -
      Math.max(sprite.body.top, goalTop);
    const standingInGoal =
      goalOverlapX >= 4 &&
      goalOverlapY >= 4 &&
      onGround;

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

  handlePointerDown(pointer) {
    if (this.dialoguePlaying) {
      return;
    }

    if (!this.localPlayer?.sprite?.body) {
      return;
    }

    if (pointer.button === 0) {
      this.room.send("ping", {
        x: Math.round(pointer.worldX),
        y: Math.round(pointer.worldY),
        level: this.level,
      });
    }

    if (pointer.button === 2) {
      this.placeBlock(pointer);
    }
  }

  placeBlock(pointer) {
    const tileX = Math.floor(pointer.worldX / 32);
    const tileY = Math.floor((pointer.worldY - this.mapOffsetY) / 32);

    if (
      tileX < 0 ||
      tileX >= this.map.width ||
      tileY < 0 ||
      tileY >= this.map.height
    ) {
      return;
    }

    const mapTile = this.collisions.getTileAt(tileX, tileY);

    if (mapTile) {
      return;
    }

    this.room.send("placeBlock", {
      tileX,
      tileY,
      level: this.level,
    });
  }

  showPing(x, y) {
    const ring = this.add
      .circle(x, y, 6)
      .setStrokeStyle(2, 0xffffff, 0.75)
      .setDepth(101);
    const dot = this.add
      .circle(x, y, 2, 0xffffff, 0.75)
      .setDepth(101);

    this.tweens.add({
      targets: ring,
      scale: 2.5,
      alpha: 0,
      duration: 750,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: dot,
      alpha: 0,
      duration: 750,
      onComplete: () => dot.destroy(),
    });
  }

  showBlockPlacementEffect(x, y) {
    const outline = this.add
      .rectangle(x + 16, y + 16, 28, 28)
      .setStrokeStyle(3, 0xffffff)
      .setDepth(20);

    this.tweens.add({
      targets: outline,
      scale: 1.6,
      alpha: 0,
      duration: 300,
      onComplete: () => outline.destroy(),
    });
    this.sound.play("placeBlockSound", {
      volume: getMixedVolume("placeBlock"),
    });
  }

  handleTileCollision(player, tile) {
    if (
      spikeTiles.includes(tile.index) &&
      !this.spikeResetSent
    ) {
      this.spikeResetSent = true;
      this.room.send("reset");
    }
  }

  updateCamera() {
    this.localPlayer.updateVisuals();

    const camera = this.cameras.main;
    const maxScrollX = this.map.widthInPixels - camera.width;
    const maxScrollY = this.map.heightInPixels - camera.height;
    const scrollX = Phaser.Math.Clamp(
      Math.round(this.localPlayer.sprite.x - camera.width / 2),
      0,
      maxScrollX
    );
    const scrollY = Phaser.Math.Clamp(
      Math.round(this.localPlayer.sprite.y - camera.height / 2),
      0,
      maxScrollY
    );

    camera.setScroll(scrollX, scrollY);
  }

  setPlayers(players) {
    this.players = players;

    if (this.sys && this.sys.isActive() && !this.isRestarting) {
      this.drawPlayers();
    }
  }

  setBlocks(blocks) {
    this.blocks = blocks;

    if (this.sys && this.sys.isActive() && !this.isRestarting) {
      this.drawBlocks();
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
      this.spikeResetSent = false;
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
            this.collisions,
            this.handleTileCollision,
            null,
            this
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

  drawBlocks() {
    const localPlayer = this.players.find(
      (player) => player.sessionId === this.room.sessionId
    );
    const localSprite = this.playerObjects.get(
      this.room.sessionId
    )?.sprite;
    const activeBlocks = new Set();

    if (!localPlayer || !localSprite?.body) {
      return;
    }

    this.blocks.forEach((block) => {
      if (block.level !== this.level) {
        return;
      }

      activeBlocks.add(block.ownerSessionId);
      const isOwner =
        block.ownerSessionId === this.room.sessionId;
      const oldBlock = this.blockObjects.get(
        block.ownerSessionId
      );

      if (oldBlock?.matches(block, isOwner)) {
        return;
      }

      oldBlock?.destroy();
      this.blockObjects.set(
        block.ownerSessionId,
        new BuildBlock(this, block, isOwner, localSprite)
      );
    });

    this.blockObjects.forEach((block, ownerSessionId) => {
      if (!activeBlocks.has(ownerSessionId)) {
        block.destroy();
        this.blockObjects.delete(ownerSessionId);
      }
    });
  }

  destroyBlocks() {
    this.blockObjects.forEach((block) => block.destroy());
    this.blockObjects.clear();
  }
}
