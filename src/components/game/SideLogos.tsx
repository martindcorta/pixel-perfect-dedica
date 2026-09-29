import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DESPAWN_Z, LOOP_LENGTH } from "@/game/constants";
import { runtime } from "@/game/runtime";
import { useGameStore } from "@/game/store";

const LOGOS = [
  "odoo", "wordpress", "n8n", "java", "csharp", "supabase", "python", "openai", "google", "anthropic"
];

export function SideLogos() {
  const groupsRef = useRef<(THREE.Group | null)[]>([]);

  const items = useMemo(() => {
    return LOGOS.map((logo, i) => ({
      logo,
      x: (i % 2 === 0 ? -1 : 1) * 7.5,
      y: 3 + Math.random() * 3,
      z: DESPAWN_Z - (i / LOGOS.length) * LOOP_LENGTH * 2 - Math.random() * 20,
    }));
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const state = useGameStore.getState().state;
    const move = state === "playing" || state === "finale" ? runtime.speed * delta : 0;
    
    items.forEach((item, i) => {
      item.z += move;
      if (item.z > DESPAWN_Z + 20) {
        item.z -= LOOP_LENGTH * 2;
        item.y = 2 + Math.random() * 4;
      }
      const group = groupsRef.current[i];
      if (group) {
        group.position.set(item.x, item.y, item.z);
        // Make them slightly face the center
        group.rotation.y = item.x > 0 ? -Math.PI / 6 : Math.PI / 6;
      }
    });
  });

  return (
    <group>
      {/* Giant DEDICA Logo at the horizon */}
      <group position={[0, 15, -120]}>
        <Text
          fontSize={12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.2}
          outlineColor="#01cdfe"
        >
          DEDICA
        </Text>
      </group>

      {/* Side Tech Logos */}
      {items.map((item, i) => (
        <group key={i} ref={(el) => (groupsRef.current[i] = el)}>
          <Html transform distanceFactor={20} center>
            <div className="flex items-center justify-center p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 shadow-[0_0_20px_rgba(1,205,254,0.4)]">
              <img 
                src={`https://cdn.simpleicons.org/${item.logo}/white`} 
                alt={item.logo}
                className="w-12 h-12 opacity-90 drop-shadow-md"
              />
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
