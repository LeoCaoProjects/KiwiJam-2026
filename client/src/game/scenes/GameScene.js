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
    this.terrainRevealActive = false;
    this.wasMovingUp = false;
    this.hiddenCeilingContact = null;
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
    this.terrainRevealActive = false;

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
    this.fadedPlatforms = level.fadedPlatforms;
    this.collisions = level.collisions;
    this.mapOffsetY = level.mapOffsetY;
    this.spawnTile = this.collisions.findByIndex(17);
    this.goalTile = this.collisions.findByIndex(18);
    this.createBackground();
    this.createChapterLabel();
    this.createTutorialGuide();
    this.createChapterDialogue();
    this.createParticleTextures();
    this.createGoalParticles();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R,E");
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.drawPlayers();
    this.createTerrainReveal();
    this.createHiddenSurfaceOutline();
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
      this.destroyTerrainReveal();
      this.hiddenSurfaceOutline.destroy();
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
            this.startTutorialGuide();
          },
        });
        return;
      }

      this.dialogueReady = true;
      this.showNextDialogueLine();
    });
  }

  createTutorialGuide() {
    if (this.level > 1) {
      return;
    }

    this.tutorialGuidePanel = this.add
      .rectangle(1030, 95, 460, 126, 0x04111d, 0.88)
      .setStrokeStyle(1, 0x8edcff, 0.4)
      .setScrollFactor(0)
      .setDepth(250)
      .setVisible(false);
    this.tutorialGuideAccent = this.add
      .rectangle(810, 95, 3, 102, 0x8edcff, 0.9)
      .setScrollFactor(0)
      .setDepth(251)
      .setVisible(false);
    this.tutorialGuideTitle = this.add
      .text(824, 43, "TUTORIAL", {
        fontFamily: "Cinzel, serif",
        fontSize: "13px",
        color: "#8edcff",
      })
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(252)
      .setVisible(false);
    this.tutorialGuideText = this.add
      .text(824, 70, "", {
        fontFamily: "Cinzel, serif",
        fontSize: "14px",
        color: "#e8f7ff",
        align: "left",
        lineSpacing: 6,
        wordWrap: { width: 410, useAdvancedWrap: true },
      })
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(252)
      .setVisible(false);
    this.tutorialPingText = this.add
      .text(824, 139, "LEFT CLICK TO PING", {
        fontFamily: "Cinzel, serif",
        fontSize: "11px",
        color: "#a9bac4",
      })
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(252)
      .setVisible(false);
  }

  startTutorialGuide() {
    if (this.level === 0) {
      this.showTutorialGuide(
        "These platforms belong to your partner.\nYour own path lives only on their screen.\nTell them what you see. Ask where to step."
      );
      return;
    }

    if (this.level === 1) {
      this.showTutorialGuide(
        "Hover, then press E, or right click, to place a block.\nOnly your partner sees it. Only you can stand on it.\nAsk where it landed. It fades after five seconds."
      );
    }
  }

  showTutorialGuide(text) {
    if (!this.tutorialGuidePanel) {
      return;
    }

    this.tutorialGuideText.setText(text);
    this.tutorialGuidePanel.setVisible(true);
    this.tutorialGuideAccent.setVisible(true);
    this.tutorialGuideTitle.setVisible(true);
    this.tutorialGuideText.setVisible(true);
    this.tutorialPingText.setVisible(true);
  }

  createParticleTextures() {
    this.createParticleTexture("playerParticle", 0xffffff, 5);
    this.createParticleTexture("playerGlow", 0x8edcff, 4);
    this.createParticleTexture("playerSpark", 0xdff8ff, 2);
    this.createParticleTexture("goalParticle", 0x62ff8a, 4);
    this.createParticleTexture("goalGlow", 0xc8ffd5, 3);
  }

  createTerrainReveal() {
    this.terrainRevealOutsideShape = this.make.graphics({
      add: false,
    });
    this.terrainRevealInsideShape = this.make.graphics({
      add: false,
    });
    this.terrainRevealOutsideMask =
      this.terrainRevealOutsideShape.createGeometryMask();
    this.terrainRevealInsideMask =
      this.terrainRevealInsideShape.createGeometryMask();
  }

  updateTerrainReveal(sprite) {
    const body = sprite.body;
    const startX = Math.floor(body.left / 32);
    const endX = Math.floor(body.right / 32);
    const startY = Math.floor(
      (body.top - this.mapOffsetY) / 32
    );
    const endY = Math.floor(
      (body.bottom - this.mapOffsetY) / 32
    );
    let behindTerrain = false;

    for (let tileY = startY; tileY <= endY; tileY += 1) {
      for (let tileX = startX; tileX <= endX; tileX += 1) {
        const tile = this.platforms.getTileAt(tileX, tileY);

        if (!tile || tile.index === -1) {
          continue;
        }

        if (!tile.collides) {
          continue;
        }

        const left = tile.pixelX;
        const right = left + tile.width;
        const top = tile.pixelY + this.mapOffsetY;
        const bottom = top + tile.height;

        if (
          body.right <= left ||
          body.left >= right ||
          body.bottom <= top ||
          body.top >= bottom
        ) {
          continue;
        }

        behindTerrain = true;
        break;
      }

      if (behindTerrain) {
        break;
      }
    }

    if (!behindTerrain) {
      this.clearTerrainReveal();
      return;
    }

    this.localPlayer?.setDimmed(true);

    const radius = 30;

    this.terrainRevealOutsideShape
      .clear()
      .beginPath()
      .fillRect(
        0,
        0,
        this.map.widthInPixels,
        this.map.heightInPixels
      )
      .moveTo(sprite.x + radius, sprite.y)
      .arc(
        sprite.x,
        sprite.y,
        radius,
        0,
        Math.PI * 2,
        true
      )
      .closePath();
    this.terrainRevealInsideShape
      .clear()
      .fillCircle(sprite.x, sprite.y, radius);

    if (!this.terrainRevealActive) {
      this.platforms.setMask(this.terrainRevealOutsideMask);
      this.fadedPlatforms
        .setMask(this.terrainRevealInsideMask)
        .setVisible(true);
      this.terrainRevealActive = true;
    }
  }

  clearTerrainReveal() {
    this.localPlayer?.setDimmed(false);

    if (this.terrainRevealActive) {
      this.platforms.clearMask();
      this.fadedPlatforms.clearMask().setVisible(false);
      this.terrainRevealActive = false;
    }
  }

  destroyTerrainReveal() {
    this.clearTerrainReveal();
    this.terrainRevealOutsideMask?.destroy();
    this.terrainRevealInsideMask?.destroy();
    this.terrainRevealOutsideShape?.destroy();
    this.terrainRevealInsideShape?.destroy();
  }

  createHiddenSurfaceOutline() {
    this.hiddenSurfaceOutline = this.add
      .graphics()
      .setDepth(9);
  }

  isOwnerBlockAt(worldX, worldY) {
    for (const block of this.blockObjects.values()) {
      const body = block.gameObject?.body;

      if (
        block.isOwner &&
        body &&
        worldX >= body.left &&
        worldX <= body.right &&
        worldY >= body.top &&
        worldY <= body.bottom
      ) {
        return true;
      }
    }

    return false;
  }

  isHiddenSurfaceAt(worldX, worldY) {
    const tileX = Math.floor(worldX / 32);
    const tileY = Math.floor(
      (worldY - this.mapOffsetY) / 32
    );
    const hiddenTile = this.collisions.getTileAt(tileX, tileY);

    if (
      !hiddenTile?.collides &&
      !this.isOwnerBlockAt(worldX, worldY)
    ) {
      return false;
    }

    const visibleTile = this.platforms.getTileAt(tileX, tileY);

    return !visibleTile?.collides;
  }

  getPointAlongSurface(points, progress) {
    const lengths = [];
    let totalLength = 0;

    for (let index = 1; index < points.length; index += 1) {
      const length = Phaser.Math.Distance.Between(
        points[index - 1].x,
        points[index - 1].y,
        points[index].x,
        points[index].y
      );

      lengths.push(length);
      totalLength += length;
    }

    let remaining = totalLength * progress;

    for (let index = 0; index < lengths.length; index += 1) {
      if (remaining <= lengths[index]) {
        const amount = remaining / lengths[index];

        return {
          x: Phaser.Math.Linear(
            points[index].x,
            points[index + 1].x,
            amount
          ),
          y: Phaser.Math.Linear(
            points[index].y,
            points[index + 1].y,
            amount
          ),
        };
      }

      remaining -= lengths[index];
    }

    return points[points.length - 1];
  }

  drawHiddenSurfacePath(points) {
    const pulse =
      0.12 + (Math.sin(this.time.now / 240) + 1) * 0.03;
    const shimmer =
      0.15 +
      ((Math.sin(this.time.now / 420) + 1) / 2) * 0.7;
    const shimmerPoint = this.getPointAlongSurface(
      points,
      shimmer
    );

    this.hiddenSurfaceOutline
      .lineStyle(7, 0x8edcff, pulse)
      .beginPath()
      .moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
      this.hiddenSurfaceOutline.lineTo(
        points[index].x,
        points[index].y
      );
    }

    this.hiddenSurfaceOutline
      .strokePath()
      .lineStyle(3, 0xdff8ff, 0.78)
      .beginPath()
      .moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
      this.hiddenSurfaceOutline.lineTo(
        points[index].x,
        points[index].y
      );
    }

    this.hiddenSurfaceOutline.strokePath();

    points.forEach((point) => {
      this.hiddenSurfaceOutline
        .fillStyle(0x8edcff, pulse)
        .fillCircle(point.x, point.y, 3.5)
        .fillStyle(0xdff8ff, 0.78)
        .fillCircle(point.x, point.y, 1.5);
    });

    this.hiddenSurfaceOutline
      .fillStyle(0xffffff, 0.85)
      .fillCircle(shimmerPoint.x, shimmerPoint.y, 2);
  }

  updateHiddenSurfaceOutline(sprite) {
    const body = sprite.body;
    const halfLine = 18;
    const groundContact =
      body.blocked.down || body.touching.down;
    const groundHidden =
      groundContact &&
      [
        body.left + 2,
        sprite.x,
        body.right - 2,
      ].some((x) =>
        this.isHiddenSurfaceAt(x, body.bottom + 1)
      );

    this.hiddenSurfaceOutline.clear();

    const pressingLeft =
      !this.dialoguePlaying &&
      (this.cursors.left.isDown || this.keys.A.isDown);
    const pressingRight =
      !this.dialoguePlaying &&
      (this.cursors.right.isDown || this.keys.D.isDown);
    const wallSampleY = [
      body.top + 2,
      sprite.y,
      body.bottom - 2,
    ];
    const ceilingHiddenNow =
      this.wasMovingUp &&
      (body.blocked.up || body.touching.up) &&
      [
        body.left + 2,
        sprite.x,
        body.right - 2,
      ].some((x) =>
        this.isHiddenSurfaceAt(x, body.top - 1)
      );

    if (ceilingHiddenNow) {
      this.hiddenCeilingContact = {
        x: sprite.x,
        y: body.top,
        until: this.time.now + 220,
      };
    } else if (
      this.hiddenCeilingContact &&
      this.time.now > this.hiddenCeilingContact.until
    ) {
      this.hiddenCeilingContact = null;
    }

    const leftHidden =
      pressingLeft &&
      (body.blocked.left || body.touching.left) &&
      wallSampleY.some((y) =>
        this.isHiddenSurfaceAt(body.left - 1, y)
      );
    const rightHidden =
      pressingRight &&
      (body.blocked.right || body.touching.right) &&
      wallSampleY.some((y) =>
        this.isHiddenSurfaceAt(body.right + 1, y)
      )
    const groundY = body.bottom;
    const topY = sprite.y - halfLine;
    const ceilingCanJoin = Boolean(
      this.hiddenCeilingContact
    );
    const ceilingY = this.hiddenCeilingContact?.y;
    let leftDrawn = false;
    let rightDrawn = false;

    if (groundHidden && leftHidden && rightHidden) {
      this.drawHiddenSurfacePath([
        { x: body.left, y: topY },
        { x: body.left, y: groundY },
        { x: body.right, y: groundY },
        { x: body.right, y: topY },
      ]);
      leftDrawn = true;
      rightDrawn = true;
    } else if (groundHidden && leftHidden) {
      this.drawHiddenSurfacePath([
        { x: body.left, y: topY },
        { x: body.left, y: groundY },
        { x: sprite.x + halfLine, y: groundY },
      ]);
      leftDrawn = true;
    } else if (groundHidden && rightHidden) {
      this.drawHiddenSurfacePath([
        { x: sprite.x - halfLine, y: groundY },
        { x: body.right, y: groundY },
        { x: body.right, y: topY },
      ]);
      rightDrawn = true;
    } else if (groundHidden) {
      this.drawHiddenSurfacePath([
        { x: sprite.x - halfLine, y: groundY },
        { x: sprite.x + halfLine, y: groundY },
      ]);
    }

    if (ceilingCanJoin && leftHidden && rightHidden) {
      this.drawHiddenSurfacePath([
        { x: body.left, y: sprite.y + halfLine },
        { x: body.left, y: ceilingY },
        { x: body.right, y: ceilingY },
        { x: body.right, y: sprite.y + halfLine },
      ]);
      leftDrawn = true;
      rightDrawn = true;
    } else if (ceilingCanJoin && leftHidden) {
      this.drawHiddenSurfacePath([
        { x: body.left, y: sprite.y + halfLine },
        { x: body.left, y: ceilingY },
        { x: sprite.x + halfLine, y: ceilingY },
      ]);
      leftDrawn = true;
    } else if (ceilingCanJoin && rightHidden) {
      this.drawHiddenSurfacePath([
        { x: sprite.x - halfLine, y: ceilingY },
        { x: body.right, y: ceilingY },
        { x: body.right, y: sprite.y + halfLine },
      ]);
      rightDrawn = true;
    } else if (this.hiddenCeilingContact) {
      this.drawHiddenSurfacePath([
        {
          x: this.hiddenCeilingContact.x - halfLine,
          y: this.hiddenCeilingContact.y,
        },
        {
          x: this.hiddenCeilingContact.x + halfLine,
          y: this.hiddenCeilingContact.y,
        },
      ]);
    }

    if (leftHidden && !leftDrawn) {
      this.drawHiddenSurfacePath([
        { x: body.left, y: sprite.y - halfLine },
        { x: body.left, y: sprite.y + halfLine },
      ]);
    }

    if (rightHidden && !rightDrawn) {
      this.drawHiddenSurfacePath([
        { x: body.right, y: sprite.y - halfLine },
        { x: body.right, y: sprite.y + halfLine },
      ]);
    }
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

    this.updateTerrainReveal(sprite);
    this.updateHiddenSurfaceOutline(sprite);

    if (this.dialoguePlaying) {
      sprite.body.setVelocityX(0);
      this.wasMovingUp = sprite.body.velocity.y < -1;

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

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.placeBlock(this.input.activePointer);
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

    this.wasMovingUp = sprite.body.velocity.y < -1;
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
    if (this.level < 1) {
      return;
    }

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
      this.wasMovingUp = false;
      this.hiddenCeilingContact = null;
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
