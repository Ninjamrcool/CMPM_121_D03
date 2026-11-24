# Dino Digger

A short archaelogy game where you dig up the surrounding terrain, gathering bones from beneath the sands to put together a full dinosaur skeleton.

Use arrow keys to move, press E to gather, and click on the buttons in the HUD to craft items. Craft the dinosaur to win!

Game Link: https://ninjamrcool.github.io/CMPM_121_D03/

To run the game locally, clone the repository, open the cloned folder in a terminal, run `deno task setup`, then run `deno task dev`.

## Adding Content

To add an item, create a `ItemType` object in `items.ts`, then add the object to the `items` array.

To add a recipe, create a `Recipe` object in `recipes.ts`, and add the object to the `recipes` array. Recipe objects reference `ItemType` objects, so you need to make any new items beforehand.

To add a new terrain type, create a `TerrainType` object in `terrain.ts`, and add the object to the `terrainTypes` array. Terrain types can optionally be gatherable, in which case you will need to reference an `ItemType`.

## Testing entry points

These are supported, for people and for agents driving a browser: `?seed=7` selects a world, `game.state` in the browser console reads logical state (the `game` handle is set in `game/main.ts`), and the `#live` element holds the most recent played event as text, since a canvas is opaque to accessibility-tree tools. [TESTING.md](TESTING.md) is a manual test script. No browser step runs in `deno task ci`.

## Tests

`deno task test` runs every `*_test.ts` file in `core/`, with no browser involved. The samples show the shape: a move, a blocked move that changes nothing, an event that keeps its cells while state moves on, terrain determinism, a check that no seed starts walled in, and a replay that plays the same seed and commands twice and compares the results. Add your own beside them.

## Tasks

| Task                 | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `deno task setup`    | Install dependencies and turn on the commit hook (once per clone)     |
| `deno task dev`      | Run the game locally                                                  |
| `deno task test`     | Run the core's tests                                                  |
| `deno task check`    | Type-check `core/` and `game/`, each under its own `deno.json`        |
| `deno task boundary` | Check what `core/` imports, and that only `game/grid/` imports Phaser |
| `deno task fmt`      | Fix formatting                                                        |
| `deno task lint`     | Lint                                                                  |
| `deno task build`    | Build the site into `dist/`                                           |
| `deno task preview`  | Serve the built `dist/` locally                                       |
| `deno task ci`       | Run every gate below, in order                                        |

## The gates

The commit hook and the GitHub Pages workflow both run `deno task ci`. See each gate fail on purpose, then undo the change:

| Gate        | Try this                                                                                                                                          | What you should see                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Formatting  | Add extra spaces inside a line in `core/rules.ts`                                                                                                 | `deno fmt --check` reports the difference                                                      |
| Lint        | Add `const unused = 1;` to `core/rules.ts`                                                                                                        | `deno lint` reports `no-unused-vars`                                                           |
| Types       | Add `document.title = "core";` to `core/rules.ts`                                                                                                 | `deno check core` cannot find `document`                                                       |
| Tests       | In `move` in `core/rules.ts`, add `state.player = to;` to the start of the blocked branch                                                         | The blocked-move test fails and shows the difference                                           |
| Determinism | Use `Math.random()` in `terrainAt` in `core/terrain.ts`, or add `movedAt?: number` to `GameState` and set `state.movedAt = Date.now();` in `move` | The terrain test fails, or the replay test does                                                |
| Boundary    | Add `import type _Phaser from "npm:phaser@4.2.1";` to `core/rules.ts`                                                                             | `deno task boundary` names the file and the import. Only this gate catches it.                 |
| Boundary 2  | Add `import Phaser from "phaser"; console.log(Phaser);` to `game/hud.ts`                                                                          | `deno task boundary` says Phaser is mentioned outside `game/grid/`. Only this gate catches it. |
| Build       | Change `/game/main.ts` in `index.html` to a missing file                                                                                          | `deno task build` cannot resolve it                                                            |

## Credits

### Made by: Tyler Roth and Jack Seales

Tooling adapted from the [CMPM 121 Fall 2026 D2 starter](https://github.com/ucsc-cmpm-121-f26/d2-starter), with the Phaser setup following the instructor's E4 starter. Those repositories have no explicit repository license; no new license is assigned to that material. The D3 scaffold was instructor-directed and authored with Anthropic Claude agent assistance. Dependencies retain their respective licenses.
