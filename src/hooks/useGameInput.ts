import { useEffect } from "react";
import { runtime } from "@/game/runtime";
import { useGameStore } from "@/game/store";

/**
 * Keyboard (A/D, arrows, space) plus touch (swipe to change lane, tap to jump).
 * Writes one-shot flags on the runtime object, consumed inside useFrame.
 */
export function useGameInput() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
      if (e.code === "KeyA" || e.code === "ArrowLeft") runtime.moveLeft = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") runtime.moveRight = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") runtime.jump = true;
    };

    let sx = 0;
    let sy = 0;
    let st = 0;
    let handled = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      st = performance.now();
      handled = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (handled) return;
      const t = e.touches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) runtime.moveRight = true;
        else runtime.moveLeft = true;
        handled = true;
      } else if (dy < -38) {
        runtime.jump = true;
        handled = true;
      }
    };
    const onTouchEnd = () => {
      if (!handled && performance.now() - st < 300) runtime.jump = true;
    };
    const onMouseDown = () => {
      if (useGameStore.getState().state === "playing") runtime.jump = true;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);
}
