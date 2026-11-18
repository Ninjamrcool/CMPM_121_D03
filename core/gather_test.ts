import { assertEquals } from "@std/assert";
import { apply, type GameState, isGatherable, terrainAt } from "./mod.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

// A state with the player just west of a cell that is, or is not, passable.
// Searching keeps these tests honest if the terrain formula changes.
function findGatherableCell(gatherable: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isGatherable(terrainAt(SEED, x, 0));
    if (here === gatherable) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        changedCells: [],
        inventory: {},
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

Deno.test("a gathering is successful on a gatherable tile and actually gathers", () => {
  const state = findGatherableCell(true);
  const { x, y } = state.player;

  const events = apply(state, { type: "gather", direction: "north" });

  assertEquals(Object.keys(state.inventory).length, 1);
  assertEquals(events[0].type, "gathered");

  if (events[0].type === "gathered") {
    assertEquals(events[0].at, { x, y });
  }
});

Deno.test("a gathering is unsuccessful on a ungatherable tile and doesn't gather", () => {
  const state = findGatherableCell(false);
  const { x, y } = state.player;

  const events = apply(state, { type: "gather", direction: "north" });

  assertEquals(Object.keys(state.inventory).length, 0);
  assertEquals(events[0].type, "failedGather");

  if (events[0].type === "failedGather") {
    assertEquals(events, [{
      type: "failedGather",
      at: { x, y },
    }]);
  }
});
