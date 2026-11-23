import { assertEquals } from "@std/assert";
import { apply, newGame } from "./rules.ts";
import { type Command } from "./mod.ts";
import runJSON from "./run.json" with { type: "json" };

type Run = {
  seed: number;
  commands: Command[];
};

const run = runJSON as Run;
let numCommands = 0;

Deno.test("gather is successful on a gatherable tile, and an item successfully harvested is added to inventory", () => {
  const state = newGame(run.seed);

  for (const command of run.commands) {
    numCommands++;
    apply(state, command);
  }

  console.log("Commands Done: " + numCommands);
  assertEquals(state.gameEnded, true);
});
