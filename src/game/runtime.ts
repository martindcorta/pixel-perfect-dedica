import { BASE_SPEED, PLAYER_START_LANE } from "./constants";

/**
 * Mutable per-frame game state shared between scene components.
 * Never read from React render paths — only inside useFrame.
 */
export const runtime = {
  speed: BASE_SPEED,
  lane: PLAYER_START_LANE,
  playerX: 0,
  playerY: 0,
  grounded: true,
  invuln: 0,
  shake: 0,
  boost: 0,
  finaleT: 0,
  // one-shot input flags
  moveLeft: false,
  moveRight: false,
  jump: false,
  // effect hooks registered by scene components
  burst: (_x: number, _y: number, _z: number, _color: string, _count: number) => {},
  revealLogo: (_x: number, _y: number, _z: number) => {},
  reset() {
    this.speed = BASE_SPEED;
    this.lane = PLAYER_START_LANE;
    this.playerX = 0;
    this.playerY = 0;
    this.grounded = true;
    this.invuln = 0;
    this.shake = 0;
    this.boost = 0;
    this.finaleT = 0;
    this.moveLeft = this.moveRight = this.jump = false;
  },
};
