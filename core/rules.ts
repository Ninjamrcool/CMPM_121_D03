// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import {
  checkTerrainChanged,
  isPassable,
  terrainAt,
  type TerrainType,
} from "./terrain.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

export type ChangedCell = {
  cell: Cell;
  terrain: TerrainType;
};

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  changedCells: ChangedCell[];
  inventory: Record<string, number>;
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command = { type: "move" | "gather"; direction: Direction };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: TerrainType }
  | {
    type: "gathered";
    at: Cell;
    item: string;
    inventory: Record<string, number>;
    changedCell: ChangedCell;
  }
  | { type: "failedGather"; at: Cell };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return { seed, player: { x: 0, y: 0 }, changedCells: [], inventory: {} };
}

// The single way in. It updates the state it is given and returns the events.
export function apply(state: GameState, command: Command): GameEvent[] {
  switch (command.type) {
    case "move":
      return move(state, command.direction);
    case "gather":
      return gather(state);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step: Cell = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from: Cell = { ...state.player };
  const to: Cell = { x: from.x + step.x, y: from.y + step.y };

  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }

  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

function gather(state: GameState): GameEvent[] {
  let terrain = checkTerrainChanged(
    state.changedCells,
    state.player.x,
    state.player.y,
  );
  if (terrain === undefined) {
    terrain = terrainAt(
      state.seed,
      state.player.x,
      state.player.y,
    );
  }
  const gatherPosition: Cell = { ...state.player };

  if (terrain.itemYield === undefined) {
    return [{ type: "failedGather", at: gatherPosition }];
  }
  if (terrain.gatheredTerrain === undefined) {
    throw new Error(
      `terrain ${terrain.name} has itemYield but no gatheredTerrain`,
    );
  }

  if (state.inventory[terrain.itemYield] === undefined) {
    state.inventory[terrain.itemYield] = 1;
  } else {
    state.inventory[terrain.itemYield] += 1;
  }

  const changedCell: ChangedCell = {
    cell: { ...gatherPosition },
    terrain: terrain.gatheredTerrain,
  };
  state.changedCells.push(changedCell);

  return [{
    type: "gathered",
    at: gatherPosition,
    item: terrain.itemYield,
    inventory: { ...state.inventory },
    changedCell: { ...changedCell },
  }];
}
