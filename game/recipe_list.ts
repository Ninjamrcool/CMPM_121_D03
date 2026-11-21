import {
  type Command,
  GameEvent,
  GameState,
  itemsNeededToCraft,
  ItemStack,
  recipesList,
} from "../core/mod.ts";

export class RecipeList {
  private buttons: HTMLElement[] = [];

  constructor(
    craft: (command: Command) => void,
    buttonContainer: HTMLElement,
    gameState: GameState,
  ) {
    for (const recipe of recipesList) {
      const button = document.createElement("button");

      button.addEventListener("click", (event) => {
        craft({ type: "craft", recipe });

        if (event.detail > 0) button.blur();
      });

      this.buttons.push(button);
      buttonContainer.append(button);
      this.updateButtons(gameState.inventory);
    }
  }

  show(event: GameEvent) {
    if (event.type === "gathered" || event.type === "crafted") {
      this.updateButtons(event.inventory);
    }
  }

  updateButtons(inventory: ItemStack[]) {
    for (const [index, button] of this.buttons.entries()) {
      const itemsNeeded: ItemStack[] = itemsNeededToCraft(
        inventory,
        recipesList[index],
      );

      if (itemsNeeded.length === 0) {
        button.textContent = `Click to craft: ${
          recipesList[index].result.type.name
        } x ${recipesList[index].result.stackSize}`;
        continue;
      }

      let buttonText = "Req: ";
      for (const itemStack of itemsNeeded) {
        buttonText += `${itemStack.type.name} x${itemStack.stackSize}, `;
      }
      buttonText = buttonText.substring(0, buttonText.length - 2);
      buttonText += ` ⮕ ${recipesList[index].result.type.name} x${
        recipesList[index].result.stackSize
      }`;
      button.textContent = buttonText;
    }
  }
}
