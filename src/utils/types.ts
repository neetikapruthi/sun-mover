/** Shared type definitions for the Solar Exposure Simulator */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface SunPosition {
  /** Altitude above horizon in radians (-π/2 to π/2) */
  altitude: number;
  /** Azimuth in radians, measured clockwise from south (suncalc convention) */
  azimuth: number;
}

/**
 * Sun direction vector in Three.js world-space.
 * +X = East, +Y = Up, +Z = North (before north-rotation).
 */
export interface SunVector {
  x: number;
  y: number;
  z: number;
}

export type ObstacleKind = 'box' | 'cylinder';

export interface Obstacle {
  id: string;
  kind: ObstacleKind;
  /** Position on the XZ ground plane */
  x: number;
  z: number;
  /** Height in scene units */
  height: number;
  /** Width (box) or radius (cylinder) */
  size: number;
  /** Y-axis rotation in radians (box only) */
  rotation: number;
  /** Display label */
  label: string;
  color: string;
}

export interface SimulatorState {
  /** Latitude degrees */
  lat: number;
  /** Longitude degrees */
  lon: number;
  /** Selected date as ISO string (YYYY-MM-DD) */
  date: string;
  /** Timezone string e.g. "Australia/Sydney" */
  timezone: string;
  /** Fraction of the day from sunrise (0) to sunset (1) */
  timeFraction: number;
  /** Actual simulated time (Date object) */
  simulatedTime: Date;
  /** Image uploaded by user, as data-URL */
  uploadedImage: string | null;
  /** North orientation in degrees, clockwise from up */
  northAngle: number;
  /** Shadow opacity 0–1 */
  shadowOpacity: number;
  /** Playback speed multiplier */
  speed: number;
  /** Is animation playing */
  isPlaying: boolean;
  /** Show sun-hours heatmap */
  showHeatmap: boolean;
  /** Shadow softness 0–1 */
  shadowSoftness: number;
  obstacles: Obstacle[];
}
