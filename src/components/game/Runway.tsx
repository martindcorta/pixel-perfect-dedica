import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DESPAWN_Z, LANE_X, LOOP_LENGTH } from "@/game/constants";
import { runtime } from "@/game/runtime";
import { useGameStore } from "@/game/store";

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

const BUILDINGS = 26;
const DASHES = 40;
const PILLARS = 18;

const BUILDING_COLORS = ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"];

type Slot = { x: number; z: number; h: number; w: number; c: number };

/** Ground, lane markings, side structures and decorative pillars — all recycled. */
export function Runway() {
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const dashesRef = useRef<THREE.InstancedMesh>(null);
  const pillarsRef = useRef<THREE.InstancedMesh>(null);

  const buildings = useMemo<Slot[]>(
    () =>
      Array.from({ length: BUILDINGS }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * (7.5 + Math.random() * 9),
        z: DESPAWN_Z - (i / BUILDINGS) * LOOP_LENGTH - Math.random() * 6,
        h: 6 + Math.random() * 24,
        w: 3 + Math.random() * 4,
        c: Math.floor(Math.random() * BUILDING_COLORS.length),
      })),
    [],
  );

  const dashes = useMemo(
    () =>
      Array.from({ length: DASHES }, (_, i) => ({
        lane: i % 2,
        z: DESPAWN_Z - (i / DASHES) * LOOP_LENGTH,
      })),
    [],
  );

  const pillars = useMemo(
    () =>
      Array.from({ length: PILLARS }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * 5.2,
        z: DESPAWN_Z - (i / PILLARS) * LOOP_LENGTH,
      })),
    [],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const state = useGameStore.getState().state;
    const move = state === "playing" || state === "finale" ? runtime.speed * delta : 0;

    const bm = buildingsRef.current;
    if (bm) {
      buildings.forEach((b, i) => {
        b.z += move;
        if (b.z > DESPAWN_Z + 10) {
          b.z -= LOOP_LENGTH;
          b.h = 6 + Math.random() * 24;
          b.w = 3 + Math.random() * 4;
          b.x = (i % 2 === 0 ? -1 : 1) * (7.5 + Math.random() * 9);
          b.c = Math.floor(Math.random() * BUILDING_COLORS.length);
        }
        dummy.position.set(b.x, b.h / 2, b.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(b.w, b.h, b.w);
        dummy.updateMatrix();
        bm.setMatrixAt(i, dummy.matrix);
        bm.setColorAt(i, tmpColor.set(BUILDING_COLORS[b.c]!));
      });
      bm.instanceMatrix.needsUpdate = true;
      if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    }

    const dm = dashesRef.current;
    if (dm) {
      dashes.forEach((d, i) => {
        d.z += move;
        if (d.z > DESPAWN_Z + 6) d.z -= LOOP_LENGTH;
        const x = d.lane === 0 ? (LANE_X[0] + LANE_X[1]) / 2 : (LANE_X[1] + LANE_X[2]) / 2;
        dummy.position.set(x, 0.012, d.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(0.12, 2.4, 1);
        dummy.updateMatrix();
        dm.setMatrixAt(i, dummy.matrix);
      });
      dm.instanceMatrix.needsUpdate = true;
    }

    const pm = pillarsRef.current;
    if (pm) {
      pillars.forEach((p, i) => {
        p.z += move;
        if (p.z > DESPAWN_Z + 6) p.z -= LOOP_LENGTH;
        dummy.position.set(p.x, 1.1, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pm.setMatrixAt(i, dummy.matrix);
      });
      pm.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -60]} receiveShadow>
        <planeGeometry args={[220, 320]} />
        <meshStandardMaterial color="#0a1020" roughness={0.95} />
      </mesh>
      {/* road surface */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -60]} receiveShadow>
        <planeGeometry args={[8.2, 320]} />
        <meshStandardMaterial color="#1a2236" roughness={0.75} />
      </mesh>
      {/* road edges */}
      {[-4.1, 4.1].map((x) => (
        <mesh key={x} position={[x, 0.09, -60]}>
          <cylinderGeometry args={[0.18, 0.18, 320, 16]} />
          <meshStandardMaterial
            color="#4de2ff"
            emissive="#4de2ff"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
      <instancedMesh ref={dashesRef} args={[undefined, undefined, DASHES]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#6d88ad" transparent opacity={0.5} />
      </instancedMesh>
      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, BUILDINGS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial roughness={0.7} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, PILLARS]} frustumCulled={false}>
        <capsuleGeometry args={[0.35, 2.2, 4, 8]} />
        <meshStandardMaterial
          color="#2b6fb8"
          emissive="#1d5fa8"
          emissiveIntensity={0.9}
          roughness={0.4}
        />
      </instancedMesh>
    </group>
  );
}
