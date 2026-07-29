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
const endWallTile = 62;
const closedEndLevels = [0, 2, 3];
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
const nonCollisionTiles = [
  -1,
  17,
  18,
  46,
  ...grassTopTiles,
  ...treeTiles,
];

export const spikeTiles = [79, 80];
const visibleNonCollisionTiles = [
  ...nonCollisionTiles,
  ...spikeTiles,
];

function getLevelPair(level) {
  return levelPairs[level] || levelPairs[0];
}

export function preloadPlayground(scene, level) {
  const levelPair = getLevelPair(level);

  levelPair.forEach((mapKey) => {
    scene.load.tilemapTiledJSON(
      mapKey,
      `./assets/levels/${mapKey}.json`
    );
  });

  scene.load.image(
    tilesetKey,
    "./assets/tilesets/combined_tileset.png"
  );
  scene.load.spritesheet(
    "placedBlock",
    "./assets/tilesets/combined_tileset.png",
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

function fillEndWall(world) {
  let wallStart = world.map.width;

  findWallStart:
  for (let x = world.map.width - 1; x >= 0; x -= 1) {
    for (let y = 0; y < world.map.height; y += 1) {
      const tile = world.layer.getTileAt(x, y);

      if (tile && tile.index !== -1) {
        wallStart = x + 1;
        break findWallStart;
      }
    }
  }

  for (let y = 0; y < world.map.height; y += 1) {
    for (
      let x = wallStart;
      x < world.map.width;
      x += 1
    ) {
      world.layer.putTileAt(endWallTile, x, y);
    }
  }
}

function hideTiles(layer, indexes) {
  const hiddenIndexes = new Set(indexes);

  layer.forEachTile((tile) => {
    if (hiddenIndexes.has(tile.index)) {
      tile.visible = false;
    }
  });
}

function showOnlyTiles(layer, indexes) {
  const visibleIndexes = new Set(indexes);

  layer.forEachTile((tile) => {
    tile.visible = visibleIndexes.has(tile.index);
  });
}

export function createPlayground(scene, level, playerSlot) {
  const [levelA, levelB] = getLevelPair(level);
  const collisionMapKey = playerSlot === 2 ? levelB : levelA;
  const visibleMapKey = playerSlot === 2 ? levelA : levelB;
  const visibleWorld = createLayer(scene, visibleMapKey);
  const fadedVisibleWorld = createLayer(scene, visibleMapKey);
  const visibleSpikes = createLayer(scene, visibleMapKey);
  const collisionWorld = createLayer(scene, collisionMapKey);

  if (closedEndLevels.includes(level)) {
    fillEndWall(visibleWorld);
    fillEndWall(fadedVisibleWorld);
    fillEndWall(visibleSpikes);
    fillEndWall(collisionWorld);
  }

  visibleWorld.layer.setCollisionByExclusion(
    visibleNonCollisionTiles
  );
  collisionWorld.layer.setCollisionByExclusion(nonCollisionTiles);
  hideTiles(visibleWorld.layer, spikeTiles);
  hideTiles(fadedVisibleWorld.layer, spikeTiles);
  showOnlyTiles(visibleSpikes.layer, spikeTiles);
  collisionWorld.layer.setVisible(false);
  visibleSpikes.layer.setDepth(-1);
  visibleWorld.layer.setDepth(10);
  fadedVisibleWorld.layer
    .setAlpha(0.58)
    .setDepth(10)
    .setVisible(false);

  return {
    map: visibleWorld.map,
    platforms: visibleWorld.layer,
    fadedPlatforms: fadedVisibleWorld.layer,
    collisions: collisionWorld.layer,
    mapOffsetY,
  };
}
