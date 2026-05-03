/**
 * solarPosition.ts
 * ----------------
 * Accurate solar position utilities using the `suncalc` library.
 *
 * Coordinate conventions
 * ----------------------
 * suncalc returns:
 *   altitude  – angle above horizon in radians
 *   azimuth   – angle measured *clockwise from south* in radians
 *               (south = 0, west = π/2, north = π, east = -π/2 or 3π/2)
 *
 * We convert to a Three.js direction vector where:
 *   +X = East
 *   +Y = Up
 *   +Z = South (into scene, away from camera in default top-down view)
 *
 * The north-rotation offset is subtracted so that the user's north
 * calibration is respected.
 *
 * Shadow direction is always opposite to the light direction:
 *   shadowDir = -lightDir
 */

import SunCalc from 'suncalc';
import type { SunPosition, SunVector } from './types';

/**
 * Get sunrise and sunset times for a given date and location.
 * Returns { sunrise, sunset } as Date objects (or null if polar night/day).
 */
export function getSunriseSunset(
  date: Date,
  lat: number,
  lon: number,
): { sunrise: Date; sunset: Date } | null {
  const times = SunCalc.getTimes(date, lat, lon);
  if (
    isNaN(times.sunrise.getTime()) ||
    isNaN(times.sunset.getTime()) ||
    times.sunrise >= times.sunset
  ) {
    return null;
  }
  return { sunrise: times.sunrise, sunset: times.sunset };
}

/**
 * Interpolate a time between sunrise and sunset.
 * @param fraction 0 = sunrise, 1 = sunset
 */
export function interpolateTime(
  fraction: number,
  sunrise: Date,
  sunset: Date,
): Date {
  const f = Math.max(0, Math.min(1, fraction));
  return new Date(
    sunrise.getTime() + f * (sunset.getTime() - sunrise.getTime()),
  );
}

/**
 * Calculate sun position for a given time and location.
 */
export function getSunPosition(
  time: Date,
  lat: number,
  lon: number,
): SunPosition {
  const pos = SunCalc.getPosition(time, lat, lon);
  return {
    altitude: pos.altitude,
    azimuth: pos.azimuth,
  };
}

/**
 * Convert sun position (altitude + azimuth) to a Three.js direction vector
 * pointing FROM the scene TOWARD the sun.
 *
 * @param altitude radians above horizon
 * @param azimuth  suncalc azimuth (clockwise from south, radians)
 * @param northAngleDeg user's north calibration in degrees (clockwise from up in image)
 */
export function sunPositionToVector(
  altitude: number,
  azimuth: number,
  northAngleDeg: number,
): SunVector {
  // Clamp altitude so sun is always above horizon during daylight
  const alt = Math.max(0, altitude);

  // suncalc azimuth: 0 = south, increasing CW
  // We want angle from North, measured CW: add π
  const azFromNorth = azimuth + Math.PI;

  // Apply north rotation offset (convert to radians)
  const northRad = (northAngleDeg * Math.PI) / 180;
  const finalAz = azFromNorth - northRad;

  // Horizontal projection length
  const cosAlt = Math.cos(alt);

  // In our coordinate system:
  //   x = East = sin(azimuth_from_north)
  //   z = South = cos(azimuth_from_north)
  //   y = Up = sin(altitude)
  const x = cosAlt * Math.sin(finalAz);
  const y = Math.sin(alt);
  const z = cosAlt * Math.cos(finalAz);

  return { x, y, z };
}

/**
 * Compute light intensity based on sun altitude.
 * At horizon: 0.2 (ambient glow)
 * At zenith:  2.5 (full sunlight)
 */
export function sunIntensity(altitude: number): number {
  const clampedAlt = Math.max(0, altitude);
  // Smooth ramp from horizon (0) to zenith (π/2)
  const normalized = clampedAlt / (Math.PI / 2);
  return 0.2 + 2.3 * Math.pow(normalized, 0.6);
}

/**
 * Warm sunlight color based on altitude (atmospheric scattering approximation).
 * Near horizon: warm orange (#FFA040)
 * High sun: warm white (#FFF5E0)
 */
export function sunColor(altitude: number): string {
  const clampedAlt = Math.max(0, altitude);
  const t = Math.min(1, clampedAlt / (Math.PI / 6)); // full warm at 30°

  // Lerp from warm orange to warm white
  const r = Math.round(255);
  const g = Math.round(160 + 69 * t); // 160 → 229
  const b = Math.round(64 + 160 * t); // 64 → 224

  return `rgb(${r},${g},${b})`;
}

/**
 * Generate sample times throughout the day for heatmap computation.
 * Returns array of Date objects at `steps` evenly spaced intervals.
 */
export function generateDaySamples(
  sunrise: Date,
  sunset: Date,
  steps: number,
): Date[] {
  const times: Date[] = [];
  for (let i = 0; i <= steps; i++) {
    times.push(interpolateTime(i / steps, sunrise, sunset));
  }
  return times;
}

/**
 * Format a Date as HH:MM in the given timezone.
 */
export function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
}

/**
 * Get all sun azimuth/altitude samples for drawing a sun-path arc.
 * Returns array of { azimuth, altitude } over the full day.
 */
export function getSunPath(
  date: Date,
  lat: number,
  lon: number,
  steps: number = 48,
): SunPosition[] {
  const times = SunCalc.getTimes(date, lat, lon);
  if (isNaN(times.sunrise.getTime()) || isNaN(times.sunset.getTime())) {
    return [];
  }
  const result: SunPosition[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = interpolateTime(i / steps, times.sunrise, times.sunset);
    result.push(getSunPosition(t, lat, lon));
  }
  return result;
}
