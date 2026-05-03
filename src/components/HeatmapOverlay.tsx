/**
 * HeatmapOverlay.tsx
 * ------------------
 * CPU-based sun-hours heatmap overlay.
 * Samples the sun's shadow footprint at multiple times during the day,
 * accumulates irradiance contribution per cell, then renders as a canvas texture
 * overlay on the ground plane.
 *
 * Extension point: replace CPU accumulation with a GPU shader pass
 * using WebGLRenderTarget + accumulation buffer.
 */

import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getSunPosition, sunPositionToVector, getSunriseSunset, interpolateTime } from '../utils/solarPosition';
import type { Obstacle } from '../utils/types';

interface HeatmapOverlayProps {
  lat: number;
  lon: number;
  date: string;
  northAngle: number;
  obstacles: Obstacle[];
  resolution?: number; // grid cells per axis
  steps?: number; // time samples per day
  groundSize?: number;
  visible: boolean;
}

/** Simple ray-box intersection test on XZ plane */
function isBlockedByBox(
  sunX: number,
  sunZ: number,
  sunY: number,
  ptX: number,
  ptZ: number,
  obs: Obstacle,
): boolean {
  if (sunY <= 0) return false;
  // Ray from (ptX, 0, ptZ) toward sun (sunX*D, sunY*D, sunZ*D)
  // Check if the ray intersects the obstacle's vertical column
  const dx = sunX;
  const dz = sunZ;
  const dy = sunY;
  const ox = ptX - obs.x;
  const oz = ptZ - obs.z;

  // Parametric t at top of obstacle (height)
  const t = obs.height / dy;
  if (t <= 0) return false;

  const hitX = ox + t * dx;
  const hitZ = oz + t * dz;

  const half = obs.size / 2;
  if (obs.kind === 'box') {
    return Math.abs(hitX) < half && Math.abs(hitZ) < half;
  } else {
    return Math.sqrt(hitX * hitX + hitZ * hitZ) < obs.size;
  }
}

export function HeatmapOverlay({
  lat,
  lon,
  date,
  northAngle,
  obstacles,
  resolution = 64,
  steps = 24,
  groundSize = 10,
  visible,
}: HeatmapOverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Recompute heatmap whenever inputs change
  const heatmapData = useMemo(() => {
    const d = new Date(date + 'T12:00:00Z');
    const ss = getSunriseSunset(d, lat, lon);
    if (!ss) return null;

    const grid = new Float32Array(resolution * resolution); // accumulated irradiance

    for (let ti = 0; ti <= steps; ti++) {
      const t = interpolateTime(ti / steps, ss.sunrise, ss.sunset);
      const pos = getSunPosition(t, lat, lon);
      if (pos.altitude <= 0) continue;
      const sv = sunPositionToVector(pos.altitude, pos.azimuth, northAngle);
      const weight = Math.sin(pos.altitude); // irradiance weighting

      for (let row = 0; row < resolution; row++) {
        for (let col = 0; col < resolution; col++) {
          // Map grid cell to world XZ coords
          const wx = ((col / (resolution - 1)) - 0.5) * groundSize;
          const wz = ((row / (resolution - 1)) - 0.5) * groundSize;

          // Check if any obstacle blocks this point
          const blocked = obstacles.some((obs) =>
            isBlockedByBox(sv.x, sv.z, sv.y, wx, wz, obs),
          );

          if (!blocked) {
            grid[row * resolution + col] += weight;
          }
        }
      }
    }

    // Normalize
    let max = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] > max) max = grid[i];
    }
    if (max > 0) {
      for (let i = 0; i < grid.length; i++) grid[i] /= max;
    }

    return grid;
  }, [lat, lon, date, northAngle, obstacles, resolution, steps, groundSize]);

  // Render heatmap to canvas texture
  useEffect(() => {
    if (!heatmapData || !meshRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(resolution, resolution);

    for (let i = 0; i < heatmapData.length; i++) {
      const v = heatmapData[i];
      // Color: blue (0 hours) → yellow (full sun)
      const r = Math.round(v * 255);
      const g = Math.round(v * 200);
      const b = Math.round((1 - v) * 200);
      imgData.data[i * 4 + 0] = r;
      imgData.data[i * 4 + 1] = g;
      imgData.data[i * 4 + 2] = b;
      imgData.data[i * 4 + 3] = Math.round(180); // semi-transparent
    }

    ctx.putImageData(imgData, 0, 0);

    if (textureRef.current) {
      textureRef.current.dispose();
    }
    textureRef.current = new THREE.CanvasTexture(canvas);
    textureRef.current.colorSpace = THREE.SRGBColorSpace;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = textureRef.current;
    mat.needsUpdate = true;
  }, [heatmapData, resolution]);

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]} // slightly above ground
      receiveShadow={false}
    >
      <planeGeometry args={[groundSize, groundSize]} />
      <meshBasicMaterial
        transparent
        opacity={0.7}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
