// The only folder allowed to import Phaser, and for one job: drawing the grid.
// Input, the HUD, sound, and the order of events all live outside it.
import Phaser from "phaser";
import type {
  Cell,
  ChangedCell,
  Direction,
  GameEvent,
  GameState,
} from "../../core/mod.ts";
import { terrainAt } from "../../core/mod.ts";

export const CELL_SIZE = 40;
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 750;
const WALK_MS = 120;
const BUMP_MS = 60;
const SPIN_MS = 350;
const SHAKE_MS = 120;
const SHAKE_ANGLE = 20;
const PLAYER_BODY_COLOR = 0xE8B672;
const PLAYER_EYE_COLOR = 0x383838;
const PLAYER_EYE_DISTANCE_FROM_CENTER = -11;
const PLAYER_EYE_SEPARATION_DISTANCE = 7.5;
const PLAYER_EYE_SIZE = 0.1;
const BUMP_COLOR = 0xe0533d;

const DIRECTION_ANGLES: Record<Direction, number> = {
  north: 0,
  south: -180,
  east: 90,
  west: -90,
};

const TERRAIN_COLORS: Record<string, number> = {
  gravel: 0x929C95,
  sandstone: 0xB07251,
  rocky: 0x202422,
  water: 0x339E99,
  sand: 0xEBDF9D,
  gatheredSand: 0xB5A882,
  gatheredRocky: 0x38403E,
  gatheredGravel: 0x6B7A73,
  shale: 0x4A4A4A,
  sulfuricRock: 0xF2C966,
  mud: 0x664008,
  gatheredShale: 0x707070,
  gatheredMud: 0x665119,
  gatheredSulfuricRock: 0xC7AC5D,
};

// Enough cells to cover the view, plus a margin so that the camera can lag behind
// the player without showing an unpainted edge.
const CELLS_ACROSS = 16;
const CELLS_DOWN = 13;

function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

// One output of the presenter. It shows events; it decides nothing.
// Humble Object: http://xunitpatterns.com/Humble%20Object.html
export class GridView extends Phaser.Scene {
  private readonly seed: number;
  private readonly start: Cell;
  private readonly changedCells: ChangedCell[];
  private ground!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Arc;
  private playerLeftEye!: Phaser.GameObjects.Arc;
  private playerRightEye!: Phaser.GameObjects.Arc;

  constructor(state: GameState) {
    super("grid");
    this.seed = state.seed;
    this.start = { ...state.player };
    this.changedCells = [...state.changedCells];
  }

  create() {
    this.ground = this.add.graphics();
    const { x, y } = cellCenter(this.start);
    this.playerBody = this.add.circle(
      0,
      0,
      CELL_SIZE * 0.35,
      PLAYER_BODY_COLOR,
    );
    this.playerLeftEye = this.add.circle(
      -1 * PLAYER_EYE_SEPARATION_DISTANCE,
      PLAYER_EYE_DISTANCE_FROM_CENTER,
      CELL_SIZE * PLAYER_EYE_SIZE,
      PLAYER_EYE_COLOR,
    );
    this.playerRightEye = this.add.circle(
      PLAYER_EYE_SEPARATION_DISTANCE,
      PLAYER_EYE_DISTANCE_FROM_CENTER,
      CELL_SIZE * PLAYER_EYE_SIZE,
      PLAYER_EYE_COLOR,
    );
    this.player = this.add.container(x, y, [
      this.playerBody,
      this.playerLeftEye,
      this.playerRightEye,
    ]);

    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
    this.drawCellsAround(this.start);
    this.fitToDisplay();
  }

  // Phaser has no device-pixel setting of its own. So the canvas backing store is
  // CSS size times devicePixelRatio, the CSS size stays put, and a camera zoom lets
  // all drawing stay in logical pixels. The media query fires when the ratio changes:
  // a move to another monitor, or browser zoom. The view's CSS size is fixed, so plain
  // window resizes need nothing here.
  private fitToDisplay() {
    const ratio = globalThis.devicePixelRatio || 1;
    this.scale.resize(
      Math.round(VIEW_WIDTH * ratio),
      Math.round(VIEW_HEIGHT * ratio),
    );
    this.scale.canvas.style.width = `${VIEW_WIDTH}px`;
    this.scale.canvas.style.height = `${VIEW_HEIGHT}px`;
    this.cameras.main.setZoom(ratio);
    matchMedia(`(resolution: ${ratio}dppx)`).addEventListener(
      "change",
      () => this.fitToDisplay(),
      { once: true },
    );
  }

  show(event: GameEvent): Promise<void> {
    switch (event.type) {
      case "moved":
        this.drawCellsAround(event.to);
        return this.walk(event.to, event.direction);
      case "blocked":
        return this.bump(event.at, event.toward);
      case "gathered":
        this.changedCells.push(event.changedCell);
        this.drawCellsAround(event.at);
        return this.spin();
      case "failedGather":
        return this.shake();
      case "crafted":
        return Promise.resolve();
      case "failedCraft":
        return Promise.resolve();
      case "gameEnded":
        return Promise.resolve();
      default:
        // A new event type fails to type-check here until it has a presentation.
        event satisfies never;
        return Promise.resolve();
    }
  }

  private walk(to: Cell, direction: Direction): Promise<void> {
    let angleDifference = this.player.angle - DIRECTION_ANGLES[direction];
    if (angleDifference > 180) {
      angleDifference -= 360;
    } else if (angleDifference < -180) {
      angleDifference += 360;
    }

    return new Promise((done) => {
      this.tweens.add({
        targets: this.player,
        ...cellCenter(to),
        angle: this.player.angle - angleDifference,
        duration: WALK_MS,
        onComplete: () => {
          this.player.angle = DIRECTION_ANGLES[direction];
          done();
        },
      });
    });
  }

  // Lurch part of the way toward the blocked cell, flash, and come back.
  private bump(at: Cell, toward: Cell): Promise<void> {
    const start = cellCenter(at);
    const target = cellCenter(toward);
    this.playerBody.setFillStyle(BUMP_COLOR);
    return new Promise((done) => {
      this.tweens.add({
        targets: this.player,
        x: start.x + (target.x - start.x) * 0.3,
        y: start.y + (target.y - start.y) * 0.3,
        duration: BUMP_MS,
        yoyo: true,
        onComplete: () => {
          this.playerBody.setFillStyle(PLAYER_BODY_COLOR);
          done();
        },
      });
    });
  }

  private spin(): Promise<void> {
    return new Promise((done) => {
      this.tweens.add({
        targets: this.player,
        angle: this.player.angle + 360,
        duration: SPIN_MS,
        onComplete: () => done(),
      });
    });
  }

  private shake(): Promise<void> {
    return new Promise((done) => {
      this.tweens.add({
        targets: this.player,
        angle: this.player.angle + SHAKE_ANGLE,
        duration: SHAKE_MS / 4,
        onComplete: () => {
          this.tweens.add({
            targets: this.player,
            angle: this.player.angle - SHAKE_ANGLE * 2,
            duration: SHAKE_MS / 2,
            onComplete: () => {
              this.tweens.add({
                targets: this.player,
                angle: this.player.angle + SHAKE_ANGLE,
                duration: SHAKE_MS / 4,
                onComplete: () => done(),
              });
            },
          });
        },
      });
    });
  }

  // Paint only what is near the camera. Asking the core again costs little, and
  // the world itself is never stored.
  private drawCellsAround(
    { x: centerX, y: centerY }: Cell,
  ) {
    this.ground.clear();
    for (let y = centerY - CELLS_DOWN; y <= centerY + CELLS_DOWN; y++) {
      for (let x = centerX - CELLS_ACROSS; x <= centerX + CELLS_ACROSS; x++) {
        const terrain = terrainAt(this.changedCells, this.seed, x, y);

        this.ground.fillStyle(
          TERRAIN_COLORS[terrain.id],
        );
        this.ground.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
      }
    }
  }
}

// Resolves once Phaser has booted and the scene exists. Phaser's input and audio
// are off: this project only asks it to draw.
export function startGridView(
  parent: HTMLElement,
  state: GameState,
): Promise<GridView> {
  return new Promise((ready) => {
    const view = new GridView(state);
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      backgroundColor: "#14161a",
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scene: view,
      callbacks: {
        postBoot: () => ready(view),
      },
    });
  });
}
