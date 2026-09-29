import { BRAND } from "@/config/brand";
import { audio, sfx } from "@/game/audio";
import { useGameStore } from "@/game/store";
import { BrandMark } from "./HUD";

function startRun() {
  audio.init();
  sfx.start();
  useGameStore.getState().start();
}

export function StartScreen() {
  const state = useGameStore((s) => s.state);
  const highScore = useGameStore((s) => s.highScore);
  if (state !== "menu") return null;

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(14,159,79,0.18),transparent_60%)] bg-background/80 px-6 text-center backdrop-blur-sm">
      <BrandMark className="h-20 w-20 animate-float-slow sm:h-24 sm:w-24" />
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[0.18em] text-foreground sm:text-6xl">
        {BRAND.companyName}
      </h1>
      <p className="mt-2 text-xs tracking-[0.4em] text-muted-foreground sm:text-sm">CORREDOR 3D</p>
      <p className="mt-6 max-w-sm text-sm text-muted-foreground">
        Una carrera contrarreloj por la ciudad. Esquiva obstáculos, rompe las cajas Dedica y haz crecer tu
        multiplicador.
      </p>
      <button
        onClick={startRun}
        className="pointer-events-auto mt-8 rounded-full bg-[color:var(--brand-green)] px-10 py-4 font-display text-base font-bold tracking-[0.2em] text-background shadow-[0_0_40px_-8px_var(--brand-green)] transition-transform hover:scale-105 active:scale-95"
      >
        COMENZAR
      </button>
      <div className="mt-6 text-[10px] tracking-[0.25em] text-muted-foreground">
        <span className="hidden sm:inline">A / D O ← → PARA MOVER · ESPACIO O CLIC PARA SALTAR</span>
        <span className="sm:hidden">DESLIZA PARA MOVER · TOCA PARA SALTAR</span>
      </div>
      {highScore > 0 && (
        <div className="mt-3 text-xs tracking-[0.2em] text-muted-foreground">
          RÉCORD {highScore.toLocaleString("es-MX")}
        </div>
      )}
    </div>
  );
}

export function ResultsScreen() {
  const state = useGameStore((s) => s.state);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const lives = useGameStore((s) => s.lives);
  if (state !== "results") return null;

  const finished = lives > 0;
  const rounded = Math.floor(score);

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-background/70 px-6 text-center backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card/70 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <BrandMark className="mx-auto h-14 w-14" />
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[0.16em] text-foreground">
          {finished ? "¡CORRIDA COMPLETA!" : "CORRIDA TERMINADA"}
        </h2>
        <div className="mt-6 text-[10px] tracking-[0.35em] text-muted-foreground">PUNTAJE FINAL</div>
        <div className="font-display text-5xl font-extrabold tabular-nums text-foreground">
          {rounded.toLocaleString("es-MX")}
        </div>
        {rounded >= highScore && rounded > 0 && (
          <div className="mt-2 text-xs font-bold tracking-[0.25em] text-[color:var(--coin)]">¡NUEVO RÉCORD!</div>
        )}
        <div className="mt-6 rounded-2xl bg-[color:var(--brand-green)]/12 px-4 py-3 text-sm font-bold tracking-[0.18em] text-[color:var(--brand-green)]">
          {BRAND.achievement}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={startRun}
            className="rounded-full bg-[color:var(--brand-green)] px-8 py-3.5 font-display text-sm font-bold tracking-[0.22em] text-background transition-transform hover:scale-[1.03] active:scale-95"
          >
            JUGAR OTRA VEZ
          </button>
          <a
            href={BRAND.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-8 py-3.5 font-display text-sm font-bold tracking-[0.22em] text-foreground transition-colors hover:bg-white/5"
          >
            {BRAND.ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
