import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GRAVITY, JUMP_VELOCITY, LANE_X } from "@/game/constants";
import { runtime } from "@/game/runtime";
import { useGameStore } from "@/game/store";
import { sfx } from "@/game/audio";

export function Player({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene, animations } = useGLTF("/models/runner.glb");
  const innerRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, innerRef);
  const vy = useRef(0);
  const tilt = useRef(0);

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = false;
      }
    });
  }, [scene]);

  useEffect(() => {
    const clip = names.includes("sprint") ? "sprint" : names.includes("walk") ? "walk" : names[0];
    const action = clip ? actions[clip] : undefined;
    action?.reset().fadeIn(0.2).play();
    return () => void action?.fadeOut(0.2);
  }, [actions, names]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const group = groupRef.current;
    if (!group) return;
    const state = useGameStore.getState().state;
    const active = state === "playing" || state === "finale";

    // consume lane input
    if (active) {
      if (runtime.moveLeft && runtime.lane > 0) runtime.lane -= 1;
      if (runtime.moveRight && runtime.lane < 2) runtime.lane += 1;
      if (runtime.jump && runtime.grounded) {
        vy.current = JUMP_VELOCITY;
        runtime.grounded = false;
        sfx.jump();
      }
    }
    runtime.moveLeft = runtime.moveRight = runtime.jump = false;

    // lateral easing toward target lane
    const targetX = LANE_X[runtime.lane];
    const prevX = runtime.playerX;
    runtime.playerX += (targetX - runtime.playerX) * (1 - Math.exp(-13 * delta));

    // vertical
    if (!runtime.grounded) {
      vy.current += GRAVITY * delta;
      runtime.playerY += vy.current * delta;
      if (runtime.playerY <= 0) {
        runtime.playerY = 0;
        vy.current = 0;
        runtime.grounded = true;
        sfx.land();
        runtime.burst(runtime.playerX, 0.1, 0, "#9fb4c7", 6);
      }
    }

    if (runtime.invuln > 0) runtime.invuln -= delta;

    group.position.set(runtime.playerX, runtime.playerY, 0);

    // lean into lane changes, subtle airborne pitch
    const lateralVel = (runtime.playerX - prevX) / Math.max(delta, 0.0001);
    tilt.current += (THREE.MathUtils.clamp(-lateralVel * 0.035, -0.4, 0.4) - tilt.current) * (1 - Math.exp(-10 * delta));
    group.rotation.z = tilt.current;
    group.rotation.x = runtime.grounded ? 0 : -0.12;

    // flicker while invulnerable after a crash
    const visible = runtime.invuln <= 0 || Math.floor(runtime.invuln * 12) % 2 === 0;
    group.visible = visible;

    // animation speed follows run speed
    const clip = names.includes("sprint") ? "sprint" : names[0];
    const action = clip ? actions[clip] : undefined;
    if (action) action.timeScale = active ? THREE.MathUtils.clamp(runtime.speed / 15, 0.4, 2.2) : 0.25;
  });

  return (
    <group ref={groupRef}>
      <group ref={innerRef} rotation-y={Math.PI} scale={1.05}>
        <primitive object={scene} />
      </group>
      {/* contact shadow blob so the character reads as grounded */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#04060f" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/runner.glb");
