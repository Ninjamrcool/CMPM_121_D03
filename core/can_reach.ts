import { Recipe } from "./recipes.ts";
import { terrainTypesList } from "./terrain.ts";
import { ItemType } from "./items.ts";

export function testReachability(
  recipes: Recipe[],
): Recipe[] {
  const reachable: Set<ItemType> = new Set();
  const made: Set<Recipe> = new Set();

  for (const terrain of terrainTypesList) {
    if (!terrain.gatherInfo || !terrain.passable) {
      continue;
    }

    for (const item of terrain.gatherInfo.itemYields) {
      reachable.add(item);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (made.has(recipe)) {
        continue;
      }

      let canMake = true;
      for (const item of recipe.items) {
        if (!reachable.has(item.type)) {
          canMake = false;
          break;
        }
      }

      if (canMake) {
        const result = recipe.result.type;
        made.add(recipe);
        reachable.add(result);
        changed = true;

        for (const terrain of terrainTypesList) {
          if (
            terrain.itemToPass === result && terrain.gatherInfo !== undefined
          ) {
            for (const item of terrain.gatherInfo.itemYields) {
              reachable.add(item);
            }
          }
        }
      }
    }
  }

  const unmadeRecipes: Recipe[] = [];
  for (const recipe of recipes) {
    if (!made.has(recipe)) {
      unmadeRecipes.push(recipe);
    }
  }
  return unmadeRecipes;
}
