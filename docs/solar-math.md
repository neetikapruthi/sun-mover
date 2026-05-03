# Solar Math Utilities — Technical Documentation

## Overview

The solar exposure simulator uses the [`suncalc`](https://github.com/mourner/suncalc) library as the underlying astronomical engine, with a set of coordinate-conversion utilities that bridge between the library's spherical angle outputs and Three.js world-space vectors.

---

## 1. Sun Position: Altitude & Azimuth

The sun's position at any moment is described by two angles:

| Angle | Symbol | Definition |
|---|---|---|
| **Altitude** | α | Elevation above the horizon, in radians. 0 = horizon, π/2 = zenith. |
| **Azimuth** | θ | Direction around the compass, measured **clockwise from south** in `suncalc` convention. 0 = south, π/2 = west, π = north, −π/2 = east. |

`suncalc.getPosition(date, lat, lon)` returns both values. The calculation is based on the [USNO Solar Position Algorithm](https://aa.usno.navy.mil/faq/sun_approx), accurate to within ≈ 1 arc-minute.

### Sunrise & Sunset

```ts
const times = SunCalc.getTimes(date, lat, lon);
// times.sunrise  → Date (moment sun crosses horizon, ascending)
// times.sunset   → Date (moment sun crosses horizon, descending)
```

---

## 2. Converting to a Three.js Direction Vector

Three.js `DirectionalLight.position` represents where the light is **coming from**. We need a unit vector pointing **from origin toward the sun**.

### Coordinate System

Our scene uses:

```
  +Y  (up)
   |
   |_____ +X  (East)
  /
+Z (North)
```

> North = `+Z`, South = `−Z`, East = `+X`, West = `−X`.

### Conversion Formula

1. **Convert suncalc azimuth to "from-north" convention**:

   ```
   azFromNorth = azimuth_suncalc + π
   ```
   
   (suncalc measures from south; adding π rotates to north=0.)

2. **Apply user's north-calibration offset** (degrees, clockwise):

   ```
   finalAz = azFromNorth − northAngle_radians
   ```

3. **Project to XYZ**:

   ```
   x = cos(altitude) × sin(finalAz)   // East component
   y = sin(altitude)                   // Up component
   z = cos(altitude) × cos(finalAz)   // North component
   ```

4. **Clamp altitude** ≥ 0 (sun never goes below ground in daylight simulation).

### Code reference

```ts
// src/utils/solarPosition.ts → sunPositionToVector()
```

---

## 3. Light Intensity Model

Solar irradiance varies with altitude (atmospheric path length):

```
I(α) = 0.2 + 2.3 × (α / (π/2))^0.6
```

- At α = 0 (horizon): I = 0.2 (ambient glow only)
- At α = π/2 (zenith): I ≈ 2.5 (full noon intensity)
- The `0.6` exponent approximates Beer–Lambert atmospheric attenuation.

---

## 4. Sun Colour (Warm Tones)

Near the horizon, Rayleigh scattering removes blue light, giving warm orange tones:

```
t  = clamp(altitude / (π/6), 0, 1)   // full warm at 30° elevation
R  = 255
G  = 160 + 69t    (160 → 229)
B  = 64 + 160t    (64 → 224)
```

This produces a smooth transition from `rgb(255,160,64)` (sunrise/sunset orange) to `rgb(255,229,224)` (warm white midday).

---

## 5. Shadow Direction

The shadow of an obstacle extends **opposite** to the sun vector projected on the XZ plane:

```
shadowDir.x = −sunVector.x / |sunVector.xz|
shadowDir.z = −sunVector.z / |sunVector.xz|
shadowLength = obstacleHeight / tan(altitude)
```

In Three.js, PCF soft shadow mapping handles this automatically once `DirectionalLight.position` is set correctly.

---

## 6. Heatmap Accumulation

The sun-hours heatmap uses **CPU sampling** at configurable resolution and time steps:

1. Sample N evenly-spaced times between sunrise and sunset.
2. For each sample:
   - Compute sun vector.
   - For each grid cell on the ground plane, cast a simplified ray and check if any obstacle's column intersects.
   - If unblocked, accumulate `sin(altitude)` (irradiance weight) into the cell.
3. Normalize the accumulated grid to [0, 1].
4. Map to a blue→yellow colour scale and upload to a `CanvasTexture`.

**Extension point (GPU):** replace step 2–3 with a WebGL accumulation pass using `WebGLRenderTarget` and a GLSL accumulation shader for real-time GPU computation.

---

## 7. Time Interpolation

Simulated time is linearly interpolated between sunrise and sunset:

```
t(fraction) = sunrise + fraction × (sunset − sunrise)
```

where `fraction ∈ [0, 1]` is controlled by the time slider.

---

## 8. Animation Loop

The play/pause animation advances `timeFraction` at a configurable speed:

```
Δfraction = (elapsed_real_seconds × 360 × speed) / dayDuration_ms × 1000
```

At `speed = 1`, one real second represents 6 simulated minutes (1 sim-hour per ~10 real-seconds), so a full 10-hour day completes in ~100 real seconds.

---

## 9. Reference Values (Sydney, 2026-05-03)

| Metric | Value |
|---|---|
| Latitude | −33.636° |
| Longitude | 150.888° |
| Sunrise (AEST) | ~06:38 |
| Sunset (AEST) | ~17:23 |
| Solar noon altitude | ~37° |
| Azimuth at noon | ~350° (nearly north, typical Southern Hemisphere) |
| Day length | ~10h 45min |

These reference values are verified by the unit tests in `src/utils/solarPosition.test.ts`.
