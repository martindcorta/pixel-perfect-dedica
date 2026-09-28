import { useMemo } from "react";
import * as THREE from "three";
import { BRAND } from "@/config/brand";

/**
 * The brand mark as a 3D object: a rounded-feel cube whose visible faces
 * carry the brand's three colors (green top, red left, blue right).
 */
export function BrandCube({ size = 1, emissive = 0.35 }: { size?: number; emissive?: number }) {
  const materials = useMemo(() => {
    const { primary, secondary, tertiary } = BRAND.colors;
    const order = [tertiary, secondary, primary, primary, tertiary, secondary]; // +x,-x,+y,-y,+z,-z
    return order.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          emissive: new THREE.Color(c),
          emissiveIntensity: emissive,
          roughness: 0.35,
          metalness: 0.1,
        }),
    );
  }, [emissive]);

  return (
    <mesh castShadow material={materials}>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  );
}
