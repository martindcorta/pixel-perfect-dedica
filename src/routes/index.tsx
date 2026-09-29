import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const GameCanvas = lazy(() => import("@/components/game/GameCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DEDICA Runner — Showcase 3D Interactivo" },
      { name: "description", content: "Corre, esquiva y recolecta en un corredor 3D de DEDICA, directo en tu navegador." },
      { property: "og:title", content: "DEDICA Runner — Showcase 3D Interactivo" },
      { property: "og:description", content: "Corre, esquiva y recolecta en un corredor 3D de DEDICA, directo en tu navegador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background font-display text-sm tracking-[0.3em] text-muted-foreground">
      CARGANDO…
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <GameCanvas />
      </Suspense>
    </ClientOnly>
  );
}
