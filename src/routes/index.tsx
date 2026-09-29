import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const GameCanvas = lazy(() => import("@/components/game/GameCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DA CORTA Runner — Interactive 3D Showcase" },
      { name: "description", content: "Run, dodge and collect in a browser 3D endless runner by DA CORTA." },
      { property: "og:title", content: "DA CORTA Runner — Interactive 3D Showcase" },
      { property: "og:description", content: "Run, dodge and collect in a browser 3D endless runner by DA CORTA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background font-display text-sm tracking-[0.3em] text-muted-foreground">
      LOADING…
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
