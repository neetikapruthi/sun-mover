/**
 * Ground.tsx – renders the uploaded image (or default grid) as the ground plane.
 */

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface GroundProps {
  imageUrl: string | null;
  northAngle: number; // degrees
  size?: number;
}

export function Ground({ imageUrl, northAngle, size = 10 }: GroundProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { gl } = useThree();

  // Load texture when imageUrl changes
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl, (tex) => {
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
      });
    } else {
      mat.map = null;
      mat.needsUpdate = true;
    }
  }, [imageUrl, gl]);

  return (
    <mesh
      ref={meshRef}
      receiveShadow
      rotation={[-Math.PI / 2, 0, (northAngle * Math.PI) / 180]}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color={imageUrl ? '#ffffff' : '#2d5a1e'}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}
