import { items, ItemStack } from "./items.ts";

export interface Recipe {
  items: ItemStack[];
  result: ItemStack;
  finishesGame?: boolean;
}

export const dinosaurRecipe: Recipe = {
  items: [
    { type: items.head, stackSize: 1 },
    { type: items.neck, stackSize: 1 },
    { type: items.ribcage, stackSize: 1 },
    { type: items.leg, stackSize: 4 },
    { type: items.tail, stackSize: 1 },
  ],
  result: { type: items.dinosaur, stackSize: 1 },
  finishesGame: true,
};

export const headRecipe: Recipe = {
  items: [{ type: items.mandible, stackSize: 1 }, {
    type: items.cranium,
    stackSize: 1,
  }],
  result: { type: items.head, stackSize: 1 },
};

export const neckRecipe: Recipe = {
  items: [
    { type: items.ligament, stackSize: 8 },
  ],
  result: { type: items.neck, stackSize: 1 },
};

export const ribcageRecipe: Recipe = {
  items: [
    { type: items.rib, stackSize: 6 },
    { type: items.spinalCord, stackSize: 1 },
  ],
  result: { type: items.ribcage, stackSize: 1 },
};

export const legRecipe: Recipe = {
  items: [
    { type: items.femur, stackSize: 1 },
    { type: items.tibia, stackSize: 1 },
    { type: items.toe, stackSize: 3 },
  ],
  result: { type: items.leg, stackSize: 1 },
};

export const tailRecipe: Recipe = {
  items: [
    { type: items.vertebrae, stackSize: 8 },
  ],
  result: { type: items.tail, stackSize: 1 },
};

export const boneLadderRecipe: Recipe = {
  items: [
    { type: items.leg, stackSize: 2 },
  ],
  result: { type: items.boneLadder, stackSize: 1 },
};

export const recipes = {
  dinosaur: dinosaurRecipe,
  head: headRecipe,
  neck: neckRecipe,
  ribcage: ribcageRecipe,
  leg: legRecipe,
  tail: tailRecipe,
  boneLadder: boneLadderRecipe,
};

export const recipesList = Object.values(recipes);
