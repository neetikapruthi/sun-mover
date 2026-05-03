/**
 * Obstacle.tsx – renders a Box (building) or Cylinder (tree) that casts shadows.
 * Supports drag-to-move on the XZ plane.
 */

import { useRef, useState, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Obstacle as ObstacleType } from '../utils/types';

interface ObstacleProps {
  obstacle: ObstacleType;
  onUpdate: (id: string, updates: Partial<ObstacleType>) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ObstacleMesh({
  obstacle,
  onUpdate,
  isSelected,
  onSelect,
}: ObstacleProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelect(obstacle.id);
      setIsDragging(true);
      // Capture pointer
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragOffset.current = {
        x: e.point.x - obstacle.x,
        z: e.point.z - obstacle.z,
      };
    },
    [obstacle.id, obstacle.x, obstacle.z, onSelect],
  );

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      e.stopPropagation();
      onUpdate(obstacle.id, {
        x: e.point.x - dragOffset.current.x,
        z: e.point.z - dragOffset.current.z,
      });
    },
    [isDragging, obstacle.id, onUpdate],
  );

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [],
  );

  const halfH = obstacle.height / 2;
  const color = isSelected ? '#f59e0b' : obstacle.color;

  return (
    <mesh
      ref={meshRef}
      position={[obstacle.x, halfH, obstacle.z]}
      rotation={[0, obstacle.rotation, 0]}
      castShadow
      receiveShadow
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {obstacle.kind === 'box' ? (
        <boxGeometry args={[obstacle.size, obstacle.height, obstacle.size]} />
      ) : (
        <cylinderGeometry
          args={[obstacle.size, obstacle.size * 0.8, obstacle.height, 12]}
        />
      )}
      <meshStandardMaterial
        color={color}
        roughness={obstacle.kind === 'cylinder' ? 0.9 : 0.7}
        metalness={obstacle.kind === 'box' ? 0.1 : 0}
      />
    </mesh>
  );
}
