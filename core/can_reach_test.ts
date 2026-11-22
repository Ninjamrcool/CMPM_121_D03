import { testReachability } from "./can_reach.ts";
import { items } from "./items.ts";
import { recipesList } from "./recipes.ts";
import { assertEquals } from "@std/assert";

Deno.test("dinosaur is reachable", () => {
  const unmadeRecipes = testReachability(recipesList);

  assertEquals(
    unmadeRecipes.some((r) => r.result.type === items.dinosaur),
    false,
  );
});
