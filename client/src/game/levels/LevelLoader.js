const levelPairs = [
  ["Level_1A", "Level_1B"],
  ["Level_2A", "Level_2B"],
  ["Level_3A", "Level_3B"],
  ["Level_4A", "Level_4B"],
  ["Level_5A", "Level_5B"],
  ["Level_6A", "Level_6B"],
];
const tilesetKey = "combined-tileset";
const mapOffsetY = 0;
const grassTopTiles = [
  4, 5, 6,
  7, 8, 9,
  10, 11, 12,
  13, 14, 15,
];
const treeTiles = [
  25, 26, 27, 28, 29, 30,
  55, 56, 57, 58, 59, 60,
  85, 86, 87, 88, 89, 90,
  91, 92, 93, 94, 95, 96,
  121, 122, 123, 124, 125, 126,
  151, 152, 153, 154, 155, 156,
];

export const spikeTiles = [79, 80];

function getLevelPair(level) {
  return levelPairs[level] || levelPairs[0];
}

export function preloadPlayground(scene, level) {
  const levelPair = getLevelPair(level);

  levelPair.forEach((mapKey) => {
    scene.load.tilemapTiledJSON(
      mapKey,
      `/assets/levels/${mapKey}.json`
    );
  });

  scene.load.image(
    tilesetKey,
    "/assets/tilesets/combined_tileset.png"
  );
  scene.load.spritesheet(
    "placedBlock",
    "/assets/tilesets/combined_tileset.png",
    { frameWidth: 32, frameHeight: 32 }
  );
}

function createLayer(scene, mapKey) {
  const map = scene.make.tilemap({ key: mapKey });
  const tileset = map.addTilesetImage(
    "combined_tileset",
    tilesetKey,
    32,
    32
  );
  const layer = map.createLayer(
    "Tile Layer 1",
    tileset,
    0,
    mapOffsetY
  );

  return { map, layer };
}

export function createPlayground(scene, level, playerSlot) {
  const [levelA, levelB] = getLevelPair(level);
  const collisionMapKey = playerSlot === 2 ? levelB : levelA;
  const visibleMapKey = playerSlot === 2 ? levelA : levelB;
  const visibleWorld = createLayer(scene, visibleMapKey);
  const collisionWorld = createLayer(scene, collisionMapKey);

  collisionWorld.layer.setCollisionByExclusion([
    -1,
    17,
    18,
    ...grassTopTiles,
    ...treeTiles,
  ]);
  collisionWorld.layer.setVisible(false);
  visibleWorld.layer.setDepth(10);

  return {
    map: visibleWorld.map,
    platforms: visibleWorld.layer,
    collisions: collisionWorld.layer,
    mapOffsetY,
  };
}
