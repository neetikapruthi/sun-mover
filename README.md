# ☀️ Solar Exposure Simulator

A fully interactive, production-ready web-based solar exposure simulator built with **React + TypeScript + Three.js (React Three Fiber) + Tailwind CSS**.

Upload a top-down site image, set your north orientation, place buildings and trees, then drag the time slider to watch accurate sun shadows move across your land throughout the day.

![Solar Exposure Simulator](src/assets/hero.png)

---

## ✨ Features

| Feature | Status |
|---|---|
| Upload top-down site image as ground texture | ✅ |
| North orientation via compass drag OR rotation slider | ✅ |
| Accurate solar position (suncalc – azimuth, altitude) | ✅ |
| Date picker + customisable lat/lon/timezone | ✅ |
| Sunrise→sunset time slider | ✅ |
| Play/Pause animation with 0.25×–10× speed | ✅ |
| Realistic PCF soft shadows with warm sun tones | ✅ |
| Shadow opacity + softness controls | ✅ |
| Sun path arc overlay in 3D | ✅ |
| Pan/zoom top-down orthographic camera | ✅ |
| Place buildings (box) and trees (cylinder) | ✅ |
| Drag objects to position; adjust height/size/rotation | ✅ |
| Sun-hours heatmap overlay (CPU accumulation) | ✅ |
| Export screenshot (PNG) | ✅ |
| Tests for solar position utilities | ✅ |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
git clone https://github.com/neetikapruthi/sun-mover.git
cd sun-mover
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
npm test
```

All 16 solar-position unit tests should pass.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## 📖 Usage Guide

### 1. Upload a Site Image

- Click the **Site Image** area in the ⚙️ Settings panel or drag-and-drop a top-down photo/plan.
- The image becomes the ground texture in the 3D scene.

### 2. Set North Orientation

There are **two ways** to set north:

**a) Compass drag** — In the ⚙️ Settings panel, drag the **N** handle on the compass rose to align it with the true north direction in your image.

**b) Rotation slider** — Use the "Rotate image" slider or type an angle in degrees.

The scene ground plane rotates accordingly so the solar simulation aligns correctly with geographic north.

### 3. Set Location & Date

Switch to the **📍 Location** tab:

- **Date** — pick any date; sunrise/sunset are recalculated automatically.
- **Latitude / Longitude** — defaults to the Penrith area, NSW, Australia (−33.636, 150.888). Enter any coordinates.
- **Timezone** — defaults to your browser's timezone. Override if needed (e.g. `Australia/Sydney`).

### 4. Place Objects

Switch to the **🏗️ Objects** tab:

- Click **+ 🏢 Building** or **+ 🌲 Tree** to add an obstacle.
- **Drag** the object in the 3D viewport to position it.
- Adjust **height**, **size/radius**, and **rotation** via the sliders in the Objects list.
- Click the **✕** button to delete an object.

### 5. Simulate Sunlight

Use the **time slider** at the bottom of the screen:

- Drag it between sunrise (🌅) and sunset (🌆) to jump to any time.
- Press **▶ Play** to animate automatically.
- Adjust the **speed** buttons (0.25× – 10×) to control animation rate.

The 3D sun sphere and path arc update continuously.

### 6. Sun-Hours Heatmap

In the ⚙️ Settings panel, toggle **Sun-Hours Heatmap** on to see a blue→yellow overlay on the ground showing accumulated daily solar exposure. Areas blocked by objects appear blue; full-sun areas appear yellow.

### 7. Export Screenshot

Click **📸 Export Screenshot** in the ⚙️ Settings panel to download the current viewport as a PNG.

---

## 🏗️ Architecture

```
sun-mover/
├── src/
│   ├── components/
│   │   ├── Scene.tsx            # R3F Canvas + camera + controls
│   │   ├── Ground.tsx           # Ground plane with image texture
│   │   ├── SunLight.tsx         # Directional light tracking sun vector
│   │   ├── Obstacle.tsx         # Box/cylinder mesh with drag support
│   │   ├── HeatmapOverlay.tsx   # CPU sun-hours heatmap → CanvasTexture
│   │   ├── SunPathOverlay.tsx   # 3D sun path arc + sphere
│   │   ├── TimeSlider.tsx       # Sunrise→sunset slider + playback controls
│   │   ├── CompassOverlay.tsx   # Canvas compass with draggable N handle
│   │   ├── ObstacleList.tsx     # Sidebar object list + edit/delete
│   │   ├── LocationPanel.tsx    # Lat/lon/date/timezone inputs
│   │   └── ControlPanel.tsx     # Image upload, shadows, heatmap, screenshot
│   ├── hooks/
│   │   └── useSimulator.ts      # Central state + animation loop
│   ├── utils/
│   │   ├── solarPosition.ts     # Solar math utilities
│   │   ├── solarPosition.test.ts# Unit tests (Vitest)
│   │   └── types.ts             # Shared TypeScript types
│   ├── App.tsx                  # Root layout
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + custom styles
├── docs/
│   └── solar-math.md            # Solar calculation documentation
├── public/                      # Static assets
└── ...config files
```

### Key Design Decisions

- **Central state in `useSimulator`** — all simulation state is managed in a single hook and passed down as a `SimulatorHook` object. This avoids prop-drilling while keeping the component tree shallow and the state co-located with its update logic.
- **Efficient rendering** — the Three.js `DirectionalLight.position` is updated imperatively in `useEffect`, bypassing React re-renders for each animation frame. Only the time-fraction state change triggers updates.
- **CPU heatmap with `useMemo`** — the heatmap is recalculated only when location/date/obstacles/northAngle change, not every frame. It renders to a `CanvasTexture` uploaded to the GPU once computed.
- **Terrain heightmap stub** — the `Ground` component accepts a `size` prop and applies the image as a `MeshStandardMaterial` map on a `PlaneGeometry`. To add terrain elevation, replace `PlaneGeometry` with a custom heightmap-displaced geometry (the texture sampling and normal-recalculation logic would go in `Ground.tsx`).

---

## 🛰️ Solar Calculation

See [`docs/solar-math.md`](docs/solar-math.md) for a full explanation of:

- Altitude & azimuth conventions
- Coordinate conversion to Three.js vectors
- Light intensity model
- Colour temperature by altitude
- Heatmap accumulation algorithm
- Reference values for Sydney, 2026-05-03

---

## 🚢 Deployment

### GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Build with the repo name as base path
VITE_BASE=/sun-mover/ npm run build

# Deploy (add to package.json scripts first):
# "deploy": "gh-pages -d dist"
npm run deploy
```

> The `VITE_BASE` env variable sets the Vite `base` path for GitHub Pages.  
> Without it, the default is `/` (correct for Vercel/Netlify).

### Vercel

```bash
npm install -g vercel
vercel --prod
```

No base path override needed — Vercel serves from `/`.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Or connect the GitHub repo directly in the [Netlify dashboard](https://app.netlify.com) — it auto-detects Vite and sets `dist` as the publish directory.

---

## �� Tests

```bash
npm test           # Run once
npm run test:watch # Watch mode
```

Tests cover:
- Sunrise/sunset times for Sydney, May 2026
- Solar altitude at noon
- Sun-position-to-vector conversion
- Light intensity model
- Day sample generation

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| [Vite](https://vitejs.dev) | Build tool |
| [React 19](https://react.dev) | UI framework |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Three.js](https://threejs.org) | 3D rendering |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://docs.pmnd.rs/drei) | Helpers (OrbitControls, Camera) |
| [suncalc](https://github.com/mourner/suncalc) | Astronomical sun position |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [Vitest](https://vitest.dev) | Unit testing |

---

## 📄 License

MIT
