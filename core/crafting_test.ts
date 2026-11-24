import { assertEquals, fail } from "@std/assert";
import {
  apply,
  copyInventory,
  type GameState,
  items,
  recipes,
  recipesList,
} from "./mod.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

function generateVertebraeState(numVertebrae: number): GameState {
  return {
    seed: SEED,
    player: { x: 0, y: 0 },
    changedCells: [],
    inventory: numVertebrae !== 0
      ? [{ type: items.vertebrae, stackSize: numVertebrae }]
      : [{ type: items.vertebrae, stackSize: 3 }],
    gameEnded: false,
  };
}

Deno.test("crafting is successful when inventory has required items", () => {
  const state = generateVertebraeState(10);

  const events = apply(state, { type: "craft", recipe: recipes.tail });

  assertEquals(state.inventory.length, 2);
  assertEquals(events, [{
    type: "crafted",
    result: { type: items.tail, stackSize: 1 },
    inventory: [{ type: items.vertebrae, stackSize: 2 }, {
      type: items.tail,
      stackSize: 1,
    }],
  }]);
});

Deno.test("crafting is successful when inventory has required items, and removes itemstack from inventory at zero leftover", () => {
  const state = generateVertebraeState(8);

  const events = apply(state, { type: "craft", recipe: recipes.tail });

  assertEquals(state.inventory.length, 1);
  assertEquals(events, [{
    type: "crafted",
    result: { type: items.tail, stackSize: 1 },
    inventory: [{ type: items.tail, stackSize: 1 }],
  }]);
});

Deno.test("crafting is unsuccessful when inventory lacks required items", () => {
  const state = generateVertebraeState(0);

  const oldInventory = copyInventory(state.inventory);
  const events = apply(state, { type: "craft", recipe: recipes.tail });

  assertEquals(state.inventory.length, 1);
  assertEquals(state.inventory, oldInventory);
  assertEquals(events, [{
    type: "failedCraft",
    result: { type: items.tail, stackSize: 1 },
  }]);
});

Deno.test("gather event position remains unchanged after subsequent move commands", () => {
  const state = generateVertebraeState(16);

  const event = apply(state, { type: "gather" });
  const eventCopy = event;
  apply(state, { type: "gather" });
  assertEquals(event[0], eventCopy[0]);
});

Deno.test("recipes list does not have any recipes with duplicate item types", () => {
  for (const recipe of recipesList) {
    const recipeIDs: Set<string> = new Set();
    for (const recipeInput of recipe.items) {
      if (recipeIDs.has(recipeInput.type.id)) {
        fail(`Duplicate ${recipeInput.type.id} found in recipesList`);
      }
      recipeIDs.add(recipeInput.type.id);
    }
  }
});
