import { ItemStack } from "../core/items.ts";
import {
  type ChangedCell,
  type GameEvent,
  type GameState,
  terrainAt,
} from "../core/mod.ts";

export function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `Moved to ${event.to.x}, ${event.to.y}`;
    case "blocked":
      return `Blocked by ${event.terrain.name} at ${event.toward.x}, ${event.toward.y}`;
    case "gathered":
      if (event.item === undefined) {
        return `Gathered nothing at ${event.at.x}, ${event.at.y}`;
      }
      return `Gathered ${event.item.type.name} at ${event.at.x}, ${event.at.y}`;
    case "failedGather":
      return `Failed to gather at ${event.at.x}, ${event.at.y}`;
    case "crafted":
      return `Crafted ${event.result.type.name} x${event.result.stackSize}`;
    case `failedCraft`:
      return `Failed to craft ${event.result.type.name}, missing some items`;
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;
  private readonly changedCells: ChangedCell[];

  constructor(state: GameState) {
    this.seed = state.seed;
    this.changedCells = [...state.changedCells];
    this.showPosition(state.player.x, state.player.y);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") {
      this.showPosition(event.to.x, event.to.y);
    } else if (event.type === "gathered") {
      this.changedCells.push(event.changedCell);
      this.showPosition(event.at.x, event.at.y);
      this.updateInventory(event.inventory);
    } else if (event.type === "crafted") {
      this.updateInventory(event.inventory);
    }
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;

    const terrain = terrainAt(this.changedCells, this.seed, x, y);
    element("terrain").textContent = terrain.name;
  }

  private updateInventory(inventory: ItemStack[]) {
    let text = "";
    for (const itemStack of inventory) {
      text += `${itemStack.type.name} x${itemStack.stackSize}, `;
    }
    text = text.substring(0, text.length - 2);
    element("inventory").textContent = text;
  }
}
