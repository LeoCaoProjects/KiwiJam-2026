const levelPairs = [
  ["Level_1A", "Level_1B"],
  ["Level_2A", "Level_2B"],
  ["Level_3A", "Level_3B"],
];
const tilesetKey = "combined-tileset";
const mapOffsetY = 0;
const grassTopTiles = [
  4, 5, 6,
  7, 8, 9,
  10, 11, 12,
  13, 14, 15,
];

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
