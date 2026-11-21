// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import {
  isPassable,
  terrainAt,
  type TerrainType,
  willHarvestItem,
} from "./terrain.ts";
import { type ItemStack } from "./items.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

export type ChangedCell = {
  cell: Cell;
  terrain: TerrainType;
};

// Plain data that survives JSON. Besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  changedCells: ChangedCell[];
  inventory: ItemStack[];
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command = { type: "move" | "gather"; direction: Direction };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell; direction: Direction }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: TerrainType }
  | {
    type: "gathered";
    at: Cell;
    item?: ItemStack;
    inventory: ItemStack[];
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
  return { seed, player: { x: 0, y: 0 }, changedCells: [], inventory: [] };
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

  const terrain = terrainAt(state.changedCells, state.seed, to.x, to.y);
  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }

  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to, direction: direction }];
}

function gather(state: GameState): GameEvent[] {
  const terrain = terrainAt(
    state.changedCells,
    state.seed,
    state.player.x,
    state.player.y,
  );
  const gatherPosition: Cell = { ...state.player };

  if (terrain.gatherInfo === undefined) {
    return [{ type: "failedGather", at: gatherPosition }];
  }

  const changedCell: ChangedCell = {
    cell: { ...gatherPosition },
    terrain: terrain.gatherInfo.gatheredTerrain,
  };
  state.changedCells.push(changedCell);

  if (!willHarvestItem(state.seed, state.player.x, state.player.y, terrain)) {
    return [{
      type: "gathered",
      at: gatherPosition,
      item: undefined,
      inventory: copyInventory(state.inventory),
      changedCell: { ...changedCell, cell: { ...changedCell.cell } },
    }];
  }

  let foundItem: boolean = false;
  const itemYieldType = terrain.gatherInfo.itemYield;
  for (const itemStack of state.inventory) {
    if (itemStack.type === itemYieldType) {
      itemStack.stackSize += 1;
      foundItem = true;
      break;
    }
  }
  if (!foundItem) {
    state.inventory.push({ type: itemYieldType, stackSize: 1 });
  }

  return [{
    type: "gathered",
    at: gatherPosition,
    item: { type: itemYieldType, stackSize: 1 },
    inventory: copyInventory(state.inventory),
    changedCell: { ...changedCell, cell: { ...changedCell.cell } },
  }];
}

function copyInventory(inventory: ItemStack[]): ItemStack[] {
  const inventoryCopy: ItemStack[] = [];
  for (const itemStack of inventory) {
    inventoryCopy.push({ ...itemStack });
  }
  return inventoryCopy;
}
