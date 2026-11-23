import { apply, GameState, recipes } from "./mod.ts";
import { assertEquals } from "@std/assert";

const SEED = 121;

const endedGameState: GameState = {
  seed: SEED,
  player: { x: 0, y: 0 },
  changedCells: [],
  inventory: [],
  gameEnded: true,
};

Deno.test("commands after completed game do nothing and return nothing.", () => {
  const state = JSON.parse(JSON.stringify(endedGameState));

  let events = apply(state, { type: "move", direction: "east" });
  assertEquals(events, []);
  assertEquals(state, endedGameState);

  events = apply(state, { type: "gather" });
  assertEquals(events, []);
  assertEquals(state, endedGameState);

  events = apply(state, { type: "craft", recipe: recipes.dinosaur });
  assertEquals(events, []);
  assertEquals(state, endedGameState);
});
