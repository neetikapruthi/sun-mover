/**
 * App.tsx – root component of the Solar Exposure Simulator.
 */

import { useCallback, useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { TimeSlider } from './components/TimeSlider';
import { CompassOverlay } from './components/CompassOverlay';
import { ObstacleList } from './components/ObstacleList';
import { LocationPanel } from './components/LocationPanel';
import { ControlPanel } from './components/ControlPanel';
import { useSimulator } from './hooks/useSimulator';

export default function App() {
  const sim = useSimulator();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarTab, setSidebarTab] = useState<'controls' | 'objects' | 'location'>('controls');

  // Screenshot: capture the WebGL canvas
  const handleScreenshot = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-sim-${sim.state.date}-${sim.state.timeFraction.toFixed(2)}.png`;
    a.click();
  }, [sim.state.date, sim.state.timeFraction]);

  const TABS = [
    { key: 'controls' as const, label: '⚙️ Settings' },
    { key: 'objects' as const, label: '🏗️ Objects' },
    { key: 'location' as const, label: '📍 Location' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <div>
            <h1 className="text-slate-100 font-bold text-sm leading-tight">
              Solar Exposure Simulator
            </h1>
            <p className="text-slate-500 text-xs">
              {sim.state.lat.toFixed(4)}, {sim.state.lon.toFixed(4)} · {sim.state.date}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span>Pan: drag · Zoom: scroll · Move objects: drag on scene</span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Canvas */}
        <div ref={canvasContainerRef} className="flex-1 relative">
          <Scene sim={sim} />

          {/* Overlay: current time badge */}
          <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-sm text-yellow-300 font-mono text-sm px-3 py-1.5 rounded-lg border border-slate-700">
            {sim.state.simulatedTime.toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: sim.state.timezone,
            })}
          </div>

          {/* Sun direction indicator overlay */}
          <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-sm rounded-lg border border-slate-700 p-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>☀️</span>
              <span>
                Az:{' '}
                {(
                  (Math.atan2(sim.sunVector.x, sim.sunVector.z) * 180) /
                  Math.PI
                ).toFixed(0)}
                ° · El:{' '}
                {(
                  (Math.asin(
                    Math.max(0, Math.min(1, sim.sunVector.y)),
                  ) *
                    180) /
                  Math.PI
                ).toFixed(0)}
                °
              </span>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="flex-none w-72 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">
          {/* Tab nav */}
          <div className="flex border-b border-slate-700">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                className={`flex-1 py-2 px-1 text-xs font-medium transition-colors ${
                  sidebarTab === tab.key
                    ? 'bg-slate-700 text-slate-100 border-b-2 border-amber-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-750'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {sidebarTab === 'controls' && (
              <>
                <ControlPanel sim={sim} onScreenshot={handleScreenshot} />
                <div className="border-t border-slate-700 pt-3">
                  <CompassOverlay sim={sim} />
                </div>
              </>
            )}
            {sidebarTab === 'objects' && <ObstacleList sim={sim} />}
            {sidebarTab === 'location' && <LocationPanel sim={sim} />}
          </div>
        </aside>
      </div>

      {/* Bottom: time slider */}
      <div className="flex-none p-3 bg-slate-800 border-t border-slate-700">
        <TimeSlider sim={sim} />
      </div>
    </div>
  );
}
