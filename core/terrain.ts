import { ChangedCell } from "./rules.ts";

// The world is a pure function of a seed and coordinates. Nothing here is stored,
// so the world can be effectively unbounded while saved state stays small.
export interface TerrainGatherInfo {
  itemYield: string;
  gatheredTerrain: TerrainType;
  harvestChance: number;
}

export interface TerrainType {
  id: string;
  name: string;
  passable: boolean;
  gatherInfo?: TerrainGatherInfo;
}

const gravelTerrain: TerrainType = {
  id: "gravel",
  name: "Gravel",
  passable: true,
};

const gatheredSandstoneTerrain: TerrainType = {
  id: "gatheredSandstone",
  name: "Gathered Sandstone",
  passable: true,
};

const sandstoneTerrain: TerrainType = {
  id: "sandstone",
  name: "Sandstone",
  passable: true,
  gatherInfo: {
    itemYield: "bone",
    gatheredTerrain: gatheredSandstoneTerrain,
    harvestChance: 0.1,
  },
};

const gatheredSandTerrain: TerrainType = {
  id: "gatheredSand",
  name: "Gathered Sand",
  passable: true,
};

const sandTerrain: TerrainType = {
  id: "sand",
  name: "Sand",
  passable: true,
  gatherInfo: {
    itemYield: "sandyBone",
    gatheredTerrain: gatheredSandTerrain,
    harvestChance: 0.1,
  },
};

const rockyTerrain: TerrainType = {
  id: "rocky",
  name: "Rocks",
  passable: false,
};

const waterTerrain: TerrainType = {
  id: "water",
  name: "Water",
  passable: false,
};

export function terrainAt(
  changedCells: ChangedCell[],
  seed: number,
  x: number,
  y: number,
): TerrainType {
  let terrain = checkTerrainChanged(changedCells, x, y);
  if (terrain === undefined) {
    terrain = naturalTerrainAt(seed, x, y);
  }
  return terrain;
}

export function naturalTerrainAt(
  seed: number,
  x: number,
  y: number,
): TerrainType {
  const raw = 0.65 * noise(seed, x, y, 9) + 0.35 * noise(seed + 1, x, y, 3);
  // Every game starts at the origin, so flatten the land there. Otherwise some
  // seeds would start inside a lake or walled into a pocket.
  const height = 0.5 + (raw - 0.5) * Math.min(1, Math.hypot(x, y) / 10);
  if (height < 0.3) return waterTerrain;
  if (height > 0.7) return rockyTerrain;

  const noiseValue = noise(seed + 2, x, y, 6);
  if (noiseValue < 0.35) return gravelTerrain;
  if (noiseValue < 0.65) return sandstoneTerrain;
  return sandTerrain;
}

export function checkTerrainChanged(
  changedCells: ChangedCell[],
  x: number,
  y: number,
): TerrainType | undefined {
  for (const changedCell of changedCells) {
    if (changedCell.cell.x === x && changedCell.cell.y === y) {
      return changedCell.terrain;
    }
  }
  return undefined;
}

export function isPassable(terrain: TerrainType): boolean {
  return terrain.passable;
}

export function isGatherable(terrain: TerrainType): boolean {
  return terrain.gatherInfo !== undefined;
}

export function willHarvestItem(
  seed: number,
  x: number,
  y: number,
  terrain: TerrainType,
): boolean {
  if (terrain.gatherInfo === undefined) {
    return false;
  }

  if (gridValue(seed, x, y) > terrain.gatherInfo.harvestChance) {
    return false;
  }

  return true;
}

// Value noise: random numbers at coarse grid points, blended between them, so
// that terrain forms regions instead of static.
function noise(seed: number, x: number, y: number, scale: number): number {
  const left = Math.floor(x / scale);
  const top = Math.floor(y / scale);
  const blendX = smooth(x / scale - left);
  const blendY = smooth(y / scale - top);
  return mix(
    mix(gridValue(seed, left, top), gridValue(seed, left + 1, top), blendX),
    mix(
      gridValue(seed, left, top + 1),
      gridValue(seed, left + 1, top + 1),
      blendX,
    ),
    blendY,
  );
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// A hash, not a generator: the same inputs give the same number in [0, 1), with
// no memory of earlier calls.
function gridValue(seed: number, x: number, y: number): number {
  let hash = Math.imul(seed, 0x9e3779b1) ^ Math.imul(x, 0x85ebca6b) ^
    Math.imul(y, 0xc2b2ae35);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);
  return ((hash ^ (hash >>> 15)) >>> 0) / 2 ** 32;
}
