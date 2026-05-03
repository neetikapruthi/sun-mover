/**
 * Scene.tsx – main React Three Fiber scene.
 * Assembles the ground, lighting, obstacles, and overlays.
 */

import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Ground } from './Ground';
import { SunLight } from './SunLight';
import { ObstacleMesh } from './Obstacle';
import { HeatmapOverlay } from './HeatmapOverlay';
import { SunPathOverlay } from './SunPathOverlay';
import type { SimulatorHook } from '../hooks/useSimulator';

interface SceneProps {
  sim: SimulatorHook;
}

const GROUND_SIZE = 10;

export function Scene({ sim }: SceneProps) {
  const { state, sunVector, updateObstacle } = sim;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{
        antialias: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Orthographic top-down camera */}
      <OrthographicCamera
        makeDefault
        position={[0, 20, 0]}
        zoom={60}
        near={0.01}
        far={1000}
      />

      {/* Pan/zoom controls – no rotation in top-down mode */}
      <OrbitControls
        enableRotate={false}
        enableDamping
        dampingFactor={0.1}
        panSpeed={0.8}
        zoomSpeed={0.8}
        minZoom={10}
        maxZoom={300}
      />

      {/* Lighting */}
      <SunLight
        sunVector={sunVector}
        simulatedTime={state.simulatedTime}
        lat={state.lat}
        lon={state.lon}
        shadowOpacity={state.shadowOpacity}
        shadowSoftness={state.shadowSoftness}
      />

      {/* Ground plane */}
      <Ground
        imageUrl={state.uploadedImage}
        northAngle={state.northAngle}
        size={GROUND_SIZE}
      />

      {/* Heatmap overlay */}
      <HeatmapOverlay
        lat={state.lat}
        lon={state.lon}
        date={state.date}
        northAngle={state.northAngle}
        obstacles={state.obstacles}
        groundSize={GROUND_SIZE}
        visible={state.showHeatmap}
      />

      {/* Sun path arc */}
      <SunPathOverlay
        lat={state.lat}
        lon={state.lon}
        date={state.date}
        northAngle={state.northAngle}
        currentSunVector={sunVector}
      />

      {/* Obstacles */}
      {state.obstacles.map((obs) => (
        <ObstacleMesh
          key={obs.id}
          obstacle={obs}
          onUpdate={updateObstacle}
          isSelected={selectedId === obs.id}
          onSelect={handleSelect}
        />
      ))}

      {/* Grid helper */}
      <gridHelper args={[GROUND_SIZE, 20, '#334155', '#1e293b']} />
    </Canvas>
  );
}
