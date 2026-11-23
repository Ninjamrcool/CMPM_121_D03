import { assertEquals } from "@std/assert";
import {
  apply,
  type GameState,
  isGatherable,
  isPassable,
  items,
  ItemType,
  naturalTerrainAt,
  willHarvestItem,
} from "./mod.ts";

const SEED = 121;

function blockedByItemCell(
  itemToPass: ItemType,
): GameState {
  for (let x = 2; x < 10_000; x++) {
    const eastTerrain = naturalTerrainAt(SEED, x + 1, 0);
    const east = isPassable(eastTerrain, []);
    if (
      east === false &&
      eastTerrain.itemToPass === itemToPass &&
      isGatherable(eastTerrain) &&
      willHarvestItem(SEED, x + 1, 0, eastTerrain)
    ) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        changedCells: [],
        inventory: [],
        gameEnded: false,
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

Deno.test("can't enter a blocked cell without item", () => {
  const state = blockedByItemCell(items.boneLadder);
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x, y });

  if (events[0].type === "blocked") {
    assertEquals(events[0].at, { x, y });
  }
});

Deno.test("can enter a blocked cell with required item", () => {
  const state = blockedByItemCell(items.boneLadder);
  state.inventory.push({ type: items.boneLadder, stackSize: 1 });
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: x + 1, y });
  assertEquals(events, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
    direction: "east",
  }]);
});

Deno.test("can gather from a blocked, gatherable cell with required item", () => {
  const state = blockedByItemCell(items.boneLadder);
  state.inventory.push({ type: items.boneLadder, stackSize: 1 });
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });
  const gatherEvents = apply(state, { type: "gather" });

  assertEquals(state.player, { x: x + 1, y });
  assertEquals(events, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
    direction: "east",
  }]);

  assertEquals(Object.keys(state.inventory).length, 2);
  assertEquals(gatherEvents[0].type, "gathered");
});
