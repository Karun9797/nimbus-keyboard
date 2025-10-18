import * as THREE from "three";
import { Float, useGLTF, useTexture } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { texture } from "three/tsl";

type KeyCapProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  texture?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

type GLTFResult = GLTF & {
  nodes: {
    Keycap: THREE.Mesh;
  };
  materials: Record<string, unknown>;
};

export function Keycap({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  texture = 0,
}: KeyCapProps) {
  const { nodes } = useGLTF("/keycap.glb") as unknown as GLTFResult;

  const textures = [
    "/keycap_uv-1.png",
    "/keycap_uv-2.png",
    "/keycap_uv-3.png",
    "/keycap_uv-4.png",
    "/keycap_uv-5.png",
    "/keycap_uv-6.png",
    "/keycap_uv-7.png",
    "/keycap_uv-8.png",
    "/keycap_uv-9.png",
  ];

  const uvTexture = textures[texture];

  const keyCapTexture = useTexture(uvTexture);
  keyCapTexture.flipY = false;
  keyCapTexture.colorSpace = THREE.SRGBColorSpace;

  const placeholderMat = new THREE.MeshStandardMaterial({
    map: keyCapTexture,
    roughness: 0.7,
  });

  return (
    <Float speed={0.5}>
      <group dispose={null} position={position} rotation={rotation}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Keycap.geometry}
          material={placeholderMat}
          rotation={[Math.PI / 2, 0, 0]}
          scale={10}
        />
      </group>
    </Float>
  );
}
