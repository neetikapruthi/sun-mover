/**
 * useSimulator – central state hook for the Solar Exposure Simulator.
 * All simulation state lives here so components can subscribe without prop-drilling.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SimulatorState, Obstacle, ObstacleKind } from '../utils/types';
import {
  getSunriseSunset,
  interpolateTime,
  getSunPosition,
  sunPositionToVector,
} from '../utils/solarPosition';
import type { SunVector } from '../utils/types';

const DEFAULT_LAT = -33.63616225301599;
const DEFAULT_LON = 150.88795248315762;

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Australia/Sydney';
  }
}

let idCounter = 0;
function newId() {
  return `obj-${++idCounter}`;
}

export function useSimulator() {
  const [state, setState] = useState<SimulatorState>({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
    date: getTodayISO(),
    timezone: getBrowserTimezone(),
    timeFraction: 0.5,
    simulatedTime: new Date(),
    uploadedImage: null,
    northAngle: 0,
    shadowOpacity: 0.65,
    speed: 1,
    isPlaying: false,
    showHeatmap: false,
    shadowSoftness: 0.5,
    obstacles: [],
  });

  // Derived sunrise/sunset for current date+location
  const [sunriseSunset, setSunriseSunset] = useState<{
    sunrise: Date;
    sunset: Date;
  } | null>(null);

  // Recompute sunrise/sunset when date or location changes
  useEffect(() => {
    const d = new Date(state.date + 'T12:00:00Z');
    const ss = getSunriseSunset(d, state.lat, state.lon);
    setSunriseSunset(ss);
    if (ss) {
      const t = interpolateTime(state.timeFraction, ss.sunrise, ss.sunset);
      setState((prev) => ({ ...prev, simulatedTime: t }));
    }
  }, [state.date, state.lat, state.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current sun vector (derived from state)
  const sunVector: SunVector = (() => {
    if (!sunriseSunset) return { x: 0.3, y: 1, z: 0.3 };
    const pos = getSunPosition(state.simulatedTime, state.lat, state.lon);
    return sunPositionToVector(pos.altitude, pos.azimuth, state.northAngle);
  })();

  // Animation loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.isPlaying || !sunriseSunset) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const duration =
      sunriseSunset.sunset.getTime() - sunriseSunset.sunrise.getTime();

    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const elapsed = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      setState((prev) => {
        // Advance time by elapsed * speed (1 real second = speed * 1 sim-second at 1x)
        // We want 1 sim-hour per ~10 real-seconds at speed=1
        // Full day ~10 hours → 100 real seconds at speed=1
        const simSecondsPerRealSecond = 360 * prev.speed; // 1min = 6 sim-hrs at 1x
        const simMs = elapsed * simSecondsPerRealSecond * 1000;
        const newFrac = prev.timeFraction + simMs / duration;

        if (newFrac >= 1) {
          return { ...prev, timeFraction: 0, isPlaying: false };
        }
        const t = interpolateTime(newFrac, sunriseSunset.sunrise, sunriseSunset.sunset);
        return { ...prev, timeFraction: newFrac, simulatedTime: t };
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.isPlaying, state.speed, sunriseSunset]);

  // Updaters
  const setTimeFraction = useCallback(
    (frac: number) => {
      if (!sunriseSunset) return;
      const t = interpolateTime(frac, sunriseSunset.sunrise, sunriseSunset.sunset);
      setState((prev) => ({ ...prev, timeFraction: frac, simulatedTime: t }));
    },
    [sunriseSunset],
  );

  const setUploadedImage = useCallback((img: string | null) => {
    setState((prev) => ({ ...prev, uploadedImage: img }));
  }, []);

  const setNorthAngle = useCallback((angle: number) => {
    setState((prev) => ({ ...prev, northAngle: angle }));
  }, []);

  const setDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, date }));
  }, []);

  const setLatLon = useCallback((lat: number, lon: number) => {
    setState((prev) => ({ ...prev, lat, lon }));
  }, []);

  const setTimezone = useCallback((tz: string) => {
    setState((prev) => ({ ...prev, timezone: tz }));
  }, []);

  const setShadowOpacity = useCallback((v: number) => {
    setState((prev) => ({ ...prev, shadowOpacity: v }));
  }, []);

  const setShadowSoftness = useCallback((v: number) => {
    setState((prev) => ({ ...prev, shadowSoftness: v }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const toggleHeatmap = useCallback(() => {
    setState((prev) => ({ ...prev, showHeatmap: !prev.showHeatmap }));
  }, []);

  const addObstacle = useCallback((kind: ObstacleKind) => {
    const newObs: Obstacle = {
      id: newId(),
      kind,
      x: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
      height: kind === 'box' ? 1 : 1.5,
      size: kind === 'box' ? 0.8 : 0.3,
      rotation: 0,
      label: kind === 'box' ? 'Building' : 'Tree',
      color: kind === 'box' ? '#94a3b8' : '#4ade80',
    };
    setState((prev) => ({ ...prev, obstacles: [...prev.obstacles, newObs] }));
  }, []);

  const updateObstacle = useCallback((id: string, updates: Partial<Obstacle>) => {
    setState((prev) => ({
      ...prev,
      obstacles: prev.obstacles.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  }, []);

  const deleteObstacle = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      obstacles: prev.obstacles.filter((o) => o.id !== id),
    }));
  }, []);

  return {
    state,
    sunriseSunset,
    sunVector,
    setTimeFraction,
    setUploadedImage,
    setNorthAngle,
    setDate,
    setLatLon,
    setTimezone,
    setShadowOpacity,
    setShadowSoftness,
    setSpeed,
    togglePlay,
    toggleHeatmap,
    addObstacle,
    updateObstacle,
    deleteObstacle,
  };
}

export type SimulatorHook = ReturnType<typeof useSimulator>;
