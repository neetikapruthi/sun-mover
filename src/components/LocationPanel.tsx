/**
 * LocationPanel.tsx – lat/lon, date, and timezone inputs.
 */

import { useState } from 'react';
import type { SimulatorHook } from '../hooks/useSimulator';

interface LocationPanelProps {
  sim: SimulatorHook;
}

export function LocationPanel({ sim }: LocationPanelProps) {
  const { state, setDate, setLatLon, setTimezone } = sim;

  const [latInput, setLatInput] = useState(state.lat.toString());
  const [lonInput, setLonInput] = useState(state.lon.toString());

  const applyLatLon = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (!isNaN(lat) && !isNaN(lon)) {
      setLatLon(lat, lon);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">
        Location &amp; Date
      </span>

      {/* Date picker */}
      <label className="flex flex-col gap-1">
        <span className="text-slate-500 text-xs">Date</span>
        <input
          type="date"
          value={state.date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 w-full"
        />
      </label>

      {/* Lat / Lon */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs">Latitude</span>
          <input
            type="text"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={applyLatLon}
            onKeyDown={(e) => e.key === 'Enter' && applyLatLon()}
            className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 w-full font-mono"
            placeholder="-33.636"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs">Longitude</span>
          <input
            type="text"
            value={lonInput}
            onChange={(e) => setLonInput(e.target.value)}
            onBlur={applyLatLon}
            onKeyDown={(e) => e.key === 'Enter' && applyLatLon()}
            className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 w-full font-mono"
            placeholder="150.888"
          />
        </label>
      </div>

      {/* Timezone */}
      <label className="flex flex-col gap-1">
        <span className="text-slate-500 text-xs">Timezone</span>
        <input
          type="text"
          value={state.timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 w-full"
          placeholder="Australia/Sydney"
        />
      </label>
    </div>
  );
}
