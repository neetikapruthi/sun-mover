/**
 * SunPathOverlay.tsx
 * ------------------
 * Renders a 3D arc representing the sun's path through the sky for the day.
 * Also renders a small glowing sphere at the current sun position.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SunVector } from '../utils/types';
import { getSunPath, sunPositionToVector } from '../utils/solarPosition';

interface SunPathOverlayProps {
  lat: number;
  lon: number;
  date: string;
  northAngle: number;
  currentSunVector: SunVector;
}

const PATH_RADIUS = 12;
const SUN_SPHERE_RADIUS = 0.25;

export function SunPathOverlay({
  lat,
  lon,
  date,
  northAngle,
  currentSunVector,
}: SunPathOverlayProps) {
  // Build path points
  const pathPoints = useMemo(() => {
    const d = new Date(date + 'T12:00:00Z');
    const samples = getSunPath(d, lat, lon, 64);
    return samples.map((sp) => {
      const v = sunPositionToVector(sp.altitude, sp.azimuth, northAngle);
      return new THREE.Vector3(
        v.x * PATH_RADIUS,
        Math.max(v.y * PATH_RADIUS, 0.2),
        v.z * PATH_RADIUS,
      );
    });
  }, [lat, lon, date, northAngle]);

  // Build curve geometry
  const pathGeometry = useMemo(() => {
    if (pathPoints.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    const pts = curve.getPoints(128);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, [pathPoints]);

  // Current sun position in 3D
  const sunPos: [number, number, number] = [
    currentSunVector.x * PATH_RADIUS,
    Math.max(currentSunVector.y * PATH_RADIUS, 0.3),
    currentSunVector.z * PATH_RADIUS,
  ];

  return (
    <group>
      {/* Sun path arc */}
      {pathGeometry && (
        <line>
          <bufferGeometry attach="geometry" {...pathGeometry} />
          <lineBasicMaterial
            attach="material"
            color="#fbbf24"
            transparent
            opacity={0.5}
          />
        </line>
      )}

      {/* Current sun sphere */}
      <mesh position={sunPos}>
        <sphereGeometry args={[SUN_SPHERE_RADIUS, 16, 16]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>

      {/* Sun glow sprite (billboard) */}
      <pointLight
        position={sunPos}
        color="#fde68a"
        intensity={0.5}
        distance={3}
      />
    </group>
  );
}
