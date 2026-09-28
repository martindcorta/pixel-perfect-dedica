import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { audio } from "@/game/audio";
import { MAX_LIVES } from "@/game/constants";
import { useGameStore } from "@/game/store";

const POPUP_TONE: Record<string, string> = {
  coin: "text-[color:var(--coin)]",
  brand: "text-[color:var(--brand-green)]",
  gem: "text-[color:var(--gem)]",
  bad: "text-[color:var(--brand-red)]",
};

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 4 58 18 32 32 6 18Z" fill="var(--brand-green)" />
      <path d="M6 18 32 32v28L6 46Z" fill="var(--brand-red)" />
      <path d="M58 18 32 32v28l26-14Z" fill="var(--brand-blue)" />
    </svg>
  );
}

export function HUD() {
  const state = useGameStore((s) => s.state);
  const score = useGameStore((s) => s.score);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const lives = useGameStore((s) => s.lives);
  const multiplier = useGameStore((s) => s.multiplier);
  const boostActive = useGameStore((s) => s.boostActive);
  const popups = useGameStore((s) => s.popups);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(audio.isMuted);
  }, []);

  if (state === "menu" || state === "results") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      <div className="flex items-start justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <BrandMark className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]" />
          <div>
            <div className="font-display text-sm font-bold tracking-[0.22em] text-foreground sm:text-base">
              {BRAND.companyName}
            </div>
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{BRAND.tagline}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] tracking-[0.35em] text-muted-foreground">SCORE</div>
          <div className="font-display text-3xl font-bold leading-none tabular-nums text-foreground sm:text-4xl">
            {Math.floor(score).toLocaleString("en-US")}
          </div>
          {multiplier > 1 && (
            <div className="mt-1 inline-block rounded-full bg-[color:var(--brand-green)]/20 px-2 py-0.5 text-xs font-bold text-[color:var(--brand-green)]">
              x{multiplier} COMBO
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-7 rounded-full transition-colors ${
                i < lives ? "bg-[color:var(--brand-green)]" : "bg-white/15"
              }`}
            />
          ))}
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.35em] text-muted-foreground">TIME</div>
          <div
            className={`font-display text-xl font-bold tabular-nums ${
              timeLeft <= 10 ? "text-[color:var(--brand-red)]" : "text-foreground"
            }`}
          >
            {timeLeft}s
          </div>
        </div>
      </div>

      {boostActive && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 animate-pulse font-display text-sm font-bold tracking-[0.3em] text-[color:var(--gem)]">
          SPEED BOOST
        </div>
      )}

      <div className="absolute left-1/2 top-1/3 flex -translate-x-1/2 flex-col items-center gap-1">
        {popups.map((p) => (
          <span
            key={p.id}
            className={`animate-float-up font-display text-2xl font-bold drop-shadow-lg ${POPUP_TONE[p.tone]}`}
          >
            {p.text}
          </span>
        ))}
      </div>

      <button
        className="pointer-events-auto absolute bottom-4 right-4 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        onClick={() => setMuted(audio.toggleMute())}
      >
        {muted ? "SOUND OFF" : "SOUND ON"}
      </button>

      <div className="absolute bottom-4 left-4 text-[10px] leading-relaxed tracking-[0.2em] text-muted-foreground">
        <span className="hidden sm:inline">A / D MOVE · SPACE JUMP</span>
        <span className="sm:hidden">SWIPE TO MOVE · TAP TO JUMP</span>
      </div>
    </div>
  );
}

export { BrandMark };
