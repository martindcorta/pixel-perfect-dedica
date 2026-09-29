import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BRAND } from "@/config/brand";
import { sfx } from "@/game/audio";
import { BASE_SPEED, DESPAWN_Z, LANE_X, MAX_SPEED, SPAWN_Z } from "@/game/constants";
import { runtime } from "@/game/runtime";
import { useGameStore } from "@/game/store";
import { BrandCube } from "./BrandCube";
import { Particles } from "./Particles";
import { Player } from "./Player";
import { Runway } from "./Runway";
import { SideLogos } from "./SideLogos";

const dummy = new THREE.Object3D();

type Ent = { active: boolean; lane: number; z: number; colorIdx: number; colorDirty: boolean };
type Logo = { active: boolean; x: number; y: number; z: number; t: number };

const make = (n: number): Ent[] =>
  Array.from({ length: n }, () => ({
    active: false,
    lane: 1,
    z: 0,
    colorIdx: 0,
    colorDirty: false,
  }));

// Every obstacle takes one of the three brand colors (green / red / blue) per instance.
const OBSTACLE_HEX = [BRAND.colors.primary, BRAND.colors.secondary, BRAND.colors.tertiary];
const OBSTACLE_COLORS = OBSTACLE_HEX.map((h) =>
  new THREE.Color(h).lerp(new THREE.Color("#ffffff"), 0.22),
);

const OBSTACLE_SPECS = [
  { key: "crate", size: [1.3, 1.3, 1.3] as const, y: 0.65 },
  { key: "barrier", size: [1.9, 1.0, 0.3] as const, y: 0.5 },
  { key: "block", size: [1.7, 1.15, 1.1] as const, y: 0.58 },
];

export function Scene() {
  const playerRef = useRef<THREE.Group>(null);

  // pooled entities
  const obstacles = useMemo(() => [make(6), make(5), make(5)], []);
  const coins = useMemo(() => make(48), []);
  const boxes = useMemo(() => make(4), []);
  const gems = useMemo(() => make(2), []);
  const logos = useMemo<Logo[]>(
    () => Array.from({ length: 3 }, () => ({ active: false, x: 0, y: 0, z: 0, t: 0 })),
    [],
  );

  const obstacleMeshes = useRef<(THREE.InstancedMesh | null)[]>([null, null, null]);
  const coinMesh = useRef<THREE.InstancedMesh>(null);
  const boxRefs = useRef<(THREE.Group | null)[]>([]);
  const gemRefs = useRef<(THREE.Group | null)[]>([]);
  const logoRefs = useRef<(THREE.Group | null)[]>([]);
  const finaleLogo = useRef<THREE.Group>(null);

  const timeRef = useRef(BRAND.runSeconds);
  const rowTimer = useRef(1.2);
  const eventTimer = useRef(11);
  const shakeOffset = useRef({ x: 0, y: 0 });

  // reset pools and timers at the start of every run
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.state === "playing" && prev.state !== "playing") {
          runtime.reset();
          timeRef.current = BRAND.runSeconds;
          rowTimer.current = 1.2;
          eventTimer.current = 11;
          [...obstacles.flat(), ...coins, ...boxes, ...gems].forEach((e) => (e.active = false));
          logos.forEach((l) => (l.active = false));
        }
      }),
    [obstacles, coins, boxes, gems, logos],
  );

  const spawn = (pool: Ent[], lane: number, z: number) => {
    const e = pool.find((p) => !p.active);
    if (!e) return undefined;
    e.active = true;
    e.lane = lane;
    e.z = z;
    e.colorDirty = true;
    return e;
  };

  const spawnCoinRun = (lane: number, z: number, count = 5) => {
    for (let i = 0; i < count; i++) spawn(coins, lane, z - i * 2.6);
  };

  const spawnRow = () => {
    const lanes = [0, 1, 2];
    const blocked = new Set<number>();
    const heavy = Math.random();
    const count = heavy > 0.72 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const lane = lanes[Math.floor(Math.random() * 3)]!;
      if (blocked.has(lane)) continue;
      blocked.add(lane);
      const kind = Math.floor(Math.random() * 3);
      const e = spawn(obstacles[kind]!, lane, SPAWN_Z);
      if (e) e.colorIdx = Math.floor(Math.random() * OBSTACLE_HEX.length);
    }
    const free = lanes.filter((l) => !blocked.has(l));
    const coinLane = free[Math.floor(Math.random() * free.length)];
    if (coinLane !== undefined && Math.random() > 0.25)
      spawnCoinRun(coinLane, SPAWN_Z - 4, 3 + Math.floor(Math.random() * 3));
  };

  const triggerEvent = () => {
    const roll = Math.random();
    const lane = Math.floor(Math.random() * 3);
    if (roll < 0.45) {
      spawn(boxes, lane, SPAWN_Z - 2);
      spawnCoinRun(lane, SPAWN_Z - 12, 4);
    } else if (roll < 0.7) {
      spawn(gems, lane, SPAWN_Z - 2);
    } else if (roll < 0.88) {
      runtime.boost = 3.2;
      useGameStore.setState({ boostActive: true });
      sfx.boost();
      spawnCoinRun(lane, SPAWN_Z - 2, 8);
    } else {
      [0, 1, 2].forEach((l) => spawnCoinRun(l, SPAWN_Z - 2 - l * 3, 4));
      spawn(boxes, 1, SPAWN_Z - 20);
    }
  };

  const collect = (points: number, tone: "coin" | "brand" | "gem") => {
    const s = useGameStore.getState();
    const combo = s.combo + 1;
    const multiplier = Math.min(5, 1 + Math.floor(combo / 8));
    const gained = points * multiplier;
    useGameStore.setState({ combo, multiplier, score: s.score + gained });
    s.pushPopup(`+${gained}`, tone);
  };

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = useGameStore.getState();
    const { state } = store;
    const active = state === "playing" || state === "finale";

    // ---- timing, speed, phases ----
    if (state === "playing") {
      timeRef.current -= delta;
      const shown = Math.max(0, Math.ceil(timeRef.current));
      if (shown !== store.timeLeft) useGameStore.setState({ timeLeft: shown });

      const progress = 1 - timeRef.current / BRAND.runSeconds;
      const target = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * Math.min(1, progress * 1.15);
      const boosted = runtime.boost > 0 ? target * 1.32 : target;
      runtime.speed += (boosted - runtime.speed) * (1 - Math.exp(-2.2 * delta));

      if (runtime.boost > 0) {
        runtime.boost -= delta;
        if (runtime.boost <= 0) useGameStore.setState({ boostActive: false });
      }

      eventTimer.current -= delta;
      if (eventTimer.current <= 0) {
        triggerEvent();
        eventTimer.current = 11 + Math.random() * 4;
      }

      rowTimer.current -= delta;
      if (rowTimer.current <= 0) {
        spawnRow();
        rowTimer.current = Math.max(0.55, 26 / runtime.speed);
      }

      if (timeRef.current <= 4.2) {
        useGameStore.setState({ state: "finale", boostActive: false });
        runtime.finaleT = 0;
        sfx.finale();
      }
    } else if (state === "finale") {
      runtime.finaleT += delta;
      runtime.speed += (2.5 - runtime.speed) * (1 - Math.exp(-1.6 * delta));
      if (runtime.finaleT > 4.6) useGameStore.getState().finish();
    }

    const move = active ? runtime.speed * delta : 0;

    // ---- obstacles ----
    obstacles.forEach((pool, kind) => {
      const mesh = obstacleMeshes.current[kind];
      const spec = OBSTACLE_SPECS[kind]!;
      if (!mesh) return;
      pool.forEach((e, i) => {
        if (e.colorDirty) {
          mesh.setColorAt(i, OBSTACLE_COLORS[e.colorIdx]!);
          e.colorDirty = false;
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        if (e.active) {
          e.z += move;
          if (e.z > DESPAWN_Z) e.active = false;
          if (
            e.active &&
            state === "playing" &&
            runtime.invuln <= 0 &&
            Math.abs(e.z) < 1.0 &&
            e.lane === runtime.lane &&
            runtime.playerY < spec.size[1] * 0.85
          ) {
            e.active = false;
            runtime.invuln = 1.3;
            runtime.shake = 1;
            runtime.burst(LANE_X[e.lane]!, spec.y, 0, OBSTACLE_HEX[e.colorIdx]!, 18);
            sfx.crash();
            const lives = store.lives - 1;
            useGameStore.setState({ lives, combo: 0, multiplier: 1 });
            store.pushPopup("¡GOLPE!", "bad");
            if (lives <= 0) useGameStore.getState().finish();
          }
        }
        dummy.position.set(LANE_X[e.lane]!, e.active ? spec.y : -50, e.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(e.active ? 1 : 0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });

    // ---- coins ----
    const cm = coinMesh.current;
    if (cm) {
      const spin = performance.now() * 0.004;
      coins.forEach((e, i) => {
        if (e.active) {
          e.z += move;
          if (e.z > DESPAWN_Z) e.active = false;
          if (
            e.active &&
            active &&
            Math.abs(e.z) < 1.0 &&
            e.lane === runtime.lane &&
            runtime.playerY < 2.1
          ) {
            e.active = false;
            collect(BRAND.points.coin, "coin");
            runtime.burst(LANE_X[e.lane]!, 1.1, 0, BRAND.colors.coin, 5);
            sfx.coin();
          }
        }
        dummy.position.set(LANE_X[e.lane]!, e.active ? 1.1 : -50, e.z);
        dummy.rotation.set(Math.PI / 2, 0, spin + i);
        dummy.scale.setScalar(e.active ? 1 : 0.0001);
        dummy.updateMatrix();
        cm.setMatrixAt(i, dummy.matrix);
      });
      cm.instanceMatrix.needsUpdate = true;
    }

    // ---- branded boxes ----
    boxes.forEach((e, i) => {
      const group = boxRefs.current[i];
      if (!group) return;
      if (e.active) {
        e.z += move;
        if (e.z > DESPAWN_Z) e.active = false;
        if (
          e.active &&
          active &&
          Math.abs(e.z) < 1.1 &&
          e.lane === runtime.lane &&
          runtime.playerY < 1.7
        ) {
          e.active = false;
          collect(BRAND.points.brandedBox, "brand");
          runtime.burst(LANE_X[e.lane]!, 1.0, 0, BRAND.colors.primary, 10);
          runtime.burst(LANE_X[e.lane]!, 1.0, 0, BRAND.colors.secondary, 8);
          runtime.burst(LANE_X[e.lane]!, 1.0, 0, BRAND.colors.tertiary, 8);
          runtime.shake = 0.5;
          sfx.brand();
          const free = logos.find((l) => !l.active);
          if (free) {
            free.active = true;
            free.x = LANE_X[e.lane]!;
            free.y = 1.1;
            free.z = 0;
            free.t = 0;
          }
        }
      }
      group.visible = e.active;
      group.position.set(LANE_X[e.lane]!, 0.9, e.z);
      group.rotation.y += delta * 1.1;
    });

    // ---- rare gems ----
    gems.forEach((e, i) => {
      const group = gemRefs.current[i];
      if (!group) return;
      if (e.active) {
        e.z += move;
        if (e.z > DESPAWN_Z) e.active = false;
        if (
          e.active &&
          active &&
          Math.abs(e.z) < 1.1 &&
          e.lane === runtime.lane &&
          runtime.playerY < 2.4
        ) {
          e.active = false;
          collect(BRAND.points.rareGem, "gem");
          runtime.burst(LANE_X[e.lane]!, 1.4, 0, BRAND.colors.gem, 20);
          runtime.shake = 0.4;
          sfx.gem();
        }
      }
      group.visible = e.active;
      group.position.set(
        LANE_X[e.lane]!,
        1.45 + Math.sin(performance.now() * 0.003 + i) * 0.15,
        e.z,
      );
      group.rotation.y += delta * 1.8;
    });

    // ---- revealed logos flying to the score counter ----
    logos.forEach((l, i) => {
      const group = logoRefs.current[i];
      if (!group) return;
      if (l.active) {
        l.t += delta;
        const k = Math.min(1, l.t / 0.9);
        l.y = 1.1 + k * 3.6;
        l.z = THREE.MathUtils.lerp(0, 7.5, k * k);
        l.x = THREE.MathUtils.lerp(l.x, -3.2, 1 - Math.exp(-3 * delta));
        if (l.t > 1.0) l.active = false;
      }
      group.visible = l.active;
      group.position.set(l.x, l.y, l.z);
      group.rotation.y += delta * 4;
      group.rotation.x += delta * 2;
      group.scale.setScalar(l.active ? 0.55 + Math.min(l.t, 0.4) : 0.0001);
    });

    // ---- finale hero logo ----
    const hero = finaleLogo.current;
    if (hero) {
      const show = state === "finale" || state === "results";
      hero.visible = show;
      if (show) {
        const k = Math.min(1, runtime.finaleT / 1.6);
        hero.position.set(0, 2.2 + k * 2.6, -16 + k * 2);
        hero.rotation.y += delta * 0.6;
        hero.scale.setScalar(0.4 + k * 3.2);
      }
    }

    // ---- camera ----
    const camTargetX = runtime.playerX * 0.42;
    const camTargetY = 4.3 + runtime.playerY * 0.28 + (state === "finale" ? 0.8 : 0);
    const camTargetZ = 8.4 + (runtime.boost > 0 ? -0.6 : 0);
    camera.position.x -= shakeOffset.current.x;
    camera.position.y -= shakeOffset.current.y;
    shakeOffset.current = { x: 0, y: 0 };
    const t = 1 - Math.exp(-6 * delta);
    camera.position.x += (camTargetX - camera.position.x) * t;
    camera.position.y += (camTargetY - camera.position.y) * t;
    camera.position.z += (camTargetZ - camera.position.z) * t;
    camera.lookAt(runtime.playerX * 0.35, 1.7 + runtime.playerY * 0.25, -11);

    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = 62 + (runtime.speed - BASE_SPEED) * 0.55 + (runtime.boost > 0 ? 6 : 0);
    cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-3 * delta));
    cam.updateProjectionMatrix();

    if (runtime.shake > 0.01) {
      shakeOffset.current.x = (Math.random() - 0.5) * runtime.shake * 0.45;
      shakeOffset.current.y = (Math.random() - 0.5) * runtime.shake * 0.32;
      camera.position.x += shakeOffset.current.x;
      camera.position.y += shakeOffset.current.y;
      runtime.shake *= Math.exp(-7 * delta);
    }
  });

  return (
    <group>
      <Runway />
      <SideLogos />
      <Player groupRef={playerRef} />
      <Particles />

      {OBSTACLE_SPECS.map((spec, kind) => (
        <instancedMesh
          key={spec.key}
          ref={(m) => {
            obstacleMeshes.current[kind] = m;
          }}
          args={[undefined, undefined, obstacles[kind]!.length]}
          castShadow
          frustumCulled={false}
        >
          <capsuleGeometry args={[spec.size[0] * 0.45, spec.size[1] * 0.5, 4, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#101828"
            emissiveIntensity={0.35}
            roughness={0.6}
          />
        </instancedMesh>
      ))}

      <instancedMesh
        ref={coinMesh}
        args={[undefined, undefined, coins.length]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.34, 0.34, 0.1, 16]} />
        <meshStandardMaterial
          color={BRAND.colors.coin}
          emissive={BRAND.colors.coin}
          emissiveIntensity={0.55}
          metalness={0.5}
          roughness={0.25}
          toneMapped={false}
        />
      </instancedMesh>

      {boxes.map((_, i) => (
        <group
          key={`box-${i}`}
          ref={(g) => {
            boxRefs.current[i] = g;
          }}
          visible={false}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshStandardMaterial
              color="#0d1424"
              emissive={BRAND.colors.primary}
              emissiveIntensity={0.28}
              roughness={0.45}
            />
          </mesh>
          <group scale={0.82}>
            <BrandCube size={0.9} emissive={0.9} />
          </group>
        </group>
      ))}

      {gems.map((_, i) => (
        <group
          key={`gem-${i}`}
          ref={(g) => {
            gemRefs.current[i] = g;
          }}
          visible={false}
        >
          <mesh castShadow>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial
              color={BRAND.colors.gem}
              emissive={BRAND.colors.gem}
              emissiveIntensity={1.1}
              roughness={0.1}
              metalness={0.35}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {logos.map((_, i) => (
        <group
          key={`logo-${i}`}
          ref={(g) => {
            logoRefs.current[i] = g;
          }}
          visible={false}
        >
          <BrandCube size={1} emissive={1} />
        </group>
      ))}

      <group ref={finaleLogo} visible={false}>
        <BrandCube size={1} emissive={0.8} />
      </group>
    </group>
  );
}
