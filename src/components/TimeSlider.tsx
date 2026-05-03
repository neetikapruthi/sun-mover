/**
 * TimeSlider.tsx – horizontal time slider from sunrise to sunset.
 */

import type { SimulatorHook } from '../hooks/useSimulator';
import { formatTime } from '../utils/solarPosition';

interface TimeSliderProps {
  sim: SimulatorHook;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5, 10];

export function TimeSlider({ sim }: TimeSliderProps) {
  const { state, sunriseSunset, setTimeFraction, togglePlay, setSpeed } = sim;

  const srLabel = sunriseSunset
    ? formatTime(sunriseSunset.sunrise, state.timezone)
    : '--:--';
  const ssLabel = sunriseSunset
    ? formatTime(sunriseSunset.sunset, state.timezone)
    : '--:--';
  const currentLabel = formatTime(state.simulatedTime, state.timezone);

  // Sunrise-to-sunset sun direction arrow (computed from fraction)
  const sunAngle = state.timeFraction * 180; // 0° (east) to 180° (west)

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          Time of Day
        </span>
        <div className="flex items-center gap-2">
          {/* Sun direction indicator */}
          <div
            className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center"
            title={`Sun angle: ${sunAngle.toFixed(0)}°`}
          >
            <div
              className="w-3 h-0.5 bg-yellow-400"
              style={{
                transform: `rotate(${sunAngle}deg)`,
                transformOrigin: 'left center',
              }}
            />
          </div>
          <span className="text-yellow-300 font-mono font-bold text-sm">
            {currentLabel}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={state.timeFraction}
          onChange={(e) => setTimeFraction(parseFloat(e.target.value))}
          className="time-slider w-full h-1 rounded-full"
          aria-label="Time of day"
        />
        <div className="flex justify-between text-slate-500 text-xs">
          <span>🌅 {srLabel}</span>
          <span>{ssLabel} 🌆</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors"
        >
          {state.isPlaying ? (
            <>
              <span>⏸</span> Pause
            </>
          ) : (
            <>
              <span>▶</span> Play
            </>
          )}
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-500 text-xs">Speed:</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                state.speed === s
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
