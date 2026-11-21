import { assertEquals } from "@std/assert";
import {
  apply,
  type GameState,
  isGatherable,
  isPassable,
  naturalTerrainAt,
  willHarvestItem,
} from "./mod.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

// A state with the player just west of a cell that is, or is not, passable.
// Searching keeps these tests honest if the terrain formula changes.
function findGatherableCell(gatherable: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isGatherable(naturalTerrainAt(SEED, x, 0));
    if (here === gatherable) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        changedCells: [],
        inventory: [],
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

function findWillHarvestCell(willGather: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = willHarvestItem(SEED, x, 0, naturalTerrainAt(SEED, x, 0));
    if (here === willGather && isGatherable(naturalTerrainAt(SEED, x, 0))) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        changedCells: [],
        inventory: [],
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

function gatherableAndBesideEasternCell(
  passable: boolean,
  gatherable: boolean,
): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isPassable(naturalTerrainAt(SEED, x, 0));
    const east = isPassable(naturalTerrainAt(SEED, x + 1, 0));
    const hereGatherable = isGatherable(naturalTerrainAt(SEED, x, 0));
    if (here && east === passable && hereGatherable === gatherable) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        changedCells: [],
        inventory: [],
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

Deno.test("gather is successful on a gatherable tile, and an item successfully harvested is added to inventory", () => {
  const state = findWillHarvestCell(true);
  const { x, y } = state.player;

  const events = apply(state, { type: "gather" });

  assertEquals(Object.keys(state.inventory).length, 1);
  assertEquals(events[0].type, "gathered");

  if (events[0].type === "gathered") {
    assertEquals(events[0].at, { x, y });
  }
});

Deno.test("gather is successful on a gatherable tile, and inventory remains the same on a failed harvest", () => {
  const state = findWillHarvestCell(false);
  const { x, y } = state.player;

  const events = apply(state, { type: "gather" });

  assertEquals(Object.keys(state.inventory).length, 0);
  assertEquals(events[0].type, "gathered");

  if (events[0].type === "gathered") {
    assertEquals(events[0].at, { x, y });
  }
});

Deno.test("gather is unsuccessful on a ungatherable tile and doesn't gather", () => {
  const state = findGatherableCell(false);
  const { x, y } = state.player;

  const events = apply(state, { type: "gather" });

  assertEquals(Object.keys(state.inventory).length, 0);
  assertEquals(events[0].type, "failedGather");

  if (events[0].type === "failedGather") {
    assertEquals(events, [{
      type: "failedGather",
      at: { x, y },
    }]);
  }
});

Deno.test("gather event position remains unchanged after subsequent move commands", () => {
  const state = gatherableAndBesideEasternCell(true, true);

  const gatherEvents = apply(state, { type: "gather" });
  assertEquals(gatherEvents[0].type, "gathered");

  if (gatherEvents[0].type === "gathered") {
    const position = { ...gatherEvents[0].at };
    apply(state, { type: "move", direction: "east" });
    assertEquals(position, gatherEvents[0].at);
  }
});
