import { create } from "zustand";
import { BRAND } from "@/config/brand";
import { MAX_LIVES } from "./constants";

export type GameState = "menu" | "playing" | "finale" | "results";

export type Popup = { id: number; text: string; tone: "coin" | "brand" | "gem" | "bad" };

interface GameStore {
  state: GameState;
  score: number;
  lives: number;
  timeLeft: number;
  multiplier: number;
  combo: number;
  boostActive: boolean;
  popups: Popup[];
  highScore: number;
  start: () => void;
  toFinale: () => void;
  finish: () => void;
  reset: () => void;
  addScore: (points: number) => void;
  pushPopup: (text: string, tone: Popup["tone"]) => void;
}

const HIGH_SCORE_KEY = "dacorta-runner-high";

function loadHighScore() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
}

let popupId = 0;

export const useGameStore = create<GameStore>((set) => ({
  state: "menu",
  score: 0,
  lives: MAX_LIVES,
  timeLeft: BRAND.runSeconds,
  multiplier: 1,
  combo: 0,
  boostActive: false,
  popups: [],
  highScore: 0,
  start: () =>
    set({
      state: "playing",
      score: 0,
      lives: MAX_LIVES,
      timeLeft: BRAND.runSeconds,
      multiplier: 1,
      combo: 0,
      boostActive: false,
      popups: [],
    }),
  toFinale: () => set({ state: "finale" }),
  finish: () =>
    set((s) => {
      const highScore = Math.max(s.highScore, Math.floor(s.score));
      if (typeof window !== "undefined") localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      return { state: "results", highScore, boostActive: false };
    }),
  reset: () => set({ state: "menu", popups: [] }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  pushPopup: (text, tone) =>
    set((s) => {
      const id = ++popupId;
      const popups = [...s.popups, { id, text, tone }].slice(-5);
      window.setTimeout(
        () => useGameStore.setState((cur) => ({ popups: cur.popups.filter((p) => p.id !== id) })),
        900,
      );
      return { popups };
    }),
}));

/** Hydrate the stored best score after mount (SSR-safe). */
export function hydrateHighScore() {
  useGameStore.setState({ highScore: loadHighScore() });
}
