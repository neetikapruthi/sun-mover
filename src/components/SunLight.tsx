/**
 * SunLight.tsx – directional light that tracks the computed sun position.
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { SunVector } from '../utils/types';
import { getSunPosition, sunIntensity, sunColor } from '../utils/solarPosition';

interface SunLightProps {
  sunVector: SunVector;
  simulatedTime: Date;
  lat: number;
  lon: number;
  shadowOpacity?: number;
  shadowSoftness?: number;
}

const LIGHT_DISTANCE = 20;

export function SunLight({
  sunVector,
  simulatedTime,
  lat,
  lon,
  shadowOpacity = 0.65,
  shadowSoftness = 0.5,
}: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useEffect(() => {
    if (!lightRef.current) return;
    const light = lightRef.current;

    // Position the light
    light.position.set(
      sunVector.x * LIGHT_DISTANCE,
      Math.max(sunVector.y * LIGHT_DISTANCE, 0.5), // keep above plane
      sunVector.z * LIGHT_DISTANCE,
    );

    // Compute altitude for intensity and color
    const pos = getSunPosition(simulatedTime, lat, lon);
    const intensity = sunIntensity(pos.altitude);
    light.intensity = intensity;

    // Warm color based on altitude
    const colorStr = sunColor(pos.altitude);
    light.color.setStyle(colorStr);

    // Shadow map radius for softness
    light.shadow.radius = 1 + shadowSoftness * 8;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    // Shadow darkness
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = LIGHT_DISTANCE * 3;
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    light.shadow.camera.top = 12;
    light.shadow.camera.bottom = -12;
    light.shadow.camera.updateProjectionMatrix();
  }, [sunVector, simulatedTime, lat, lon, shadowOpacity, shadowSoftness]);

  return (
    <>
      {/* Ambient light for fill */}
      <ambientLight intensity={0.3} color="#c8d8ff" />
      {/* Sky hemisphere light */}
      <hemisphereLight args={['#87ceeb', '#556b2f', 0.4]} />
      {/* Main sun directional light */}
      <directionalLight
        ref={lightRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-radius={4}
        shadow-bias={-0.001}
        position={[10, 10, 10]}
        intensity={2}
      />
    </>
  );
}
