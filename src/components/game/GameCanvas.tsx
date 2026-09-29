import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { useGameInput } from "@/hooks/useGameInput";
import { hydrateHighScore, useGameStore } from "@/game/store";
import { Scene } from "./Scene";
import { HUD } from "./HUD";
import { ResultsScreen, StartScreen } from "./Screens";

export default function GameCanvas() {
  useGameInput();
  const state = useGameStore((s) => s.state);
  useEffect(() => hydrateHighScore(), []);
  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 4.3, 8.4], fov: 62, near: 0.1, far: 220 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0b1222"]} />
        <fog attach="fog" args={["#0b1222", 40, 130]} />
        <hemisphereLight args={["#9fc4ff", "#1a1420", 0.7]} />
        <directionalLight
          position={[6, 14, 6]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
      {state === "menu" && <StartScreen />}
      {state === "results" && <ResultsScreen />}
    </div>
  );
}
