import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { runtime } from "@/game/runtime";

const MAX = 180;
const dummy = new THREE.Object3D();
const color = new THREE.Color();

type P = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; c: string };

const pool: P[] = Array.from({ length: MAX }, () => ({
  x: 0,
  y: 0,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  life: 0,
  c: "#ffffff",
}));

export function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    runtime.burst = (x, y, z, c, count) => {
      let spawned = 0;
      for (const p of pool) {
        if (spawned >= count) break;
        if (p.life > 0) continue;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = (Math.random() - 0.5) * 9;
        p.vy = Math.random() * 7 + 1.5;
        p.vz = (Math.random() - 0.5) * 9;
        p.life = 0.8 + Math.random() * 0.4;
        p.c = c;
        spawned++;
      }
    };
    return () => {
      runtime.burst = () => {};
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < MAX; i++) {
      const p = pool[i]!;
      if (p.life > 0) {
        p.life -= delta * 1.4;
        p.vy -= 20 * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += (p.vz + runtime.speed * 0.35) * delta;
        dummy.position.set(p.x, Math.max(p.y, 0.05), p.z);
        dummy.rotation.set(p.life * 6, p.life * 4, 0);
        dummy.scale.setScalar(Math.max(p.life, 0) * 0.34);
        mesh.setColorAt(i, color.set(p.c));
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial toneMapped={false} roughness={0.4} />
    </instancedMesh>
  );
}
