/**
 * ControlPanel.tsx – shadow, heatmap, and image upload controls.
 */

import { useRef, useCallback } from 'react';
import type { SimulatorHook } from '../hooks/useSimulator';
import demoImage from '../assets/hero.png';

interface ControlPanelProps {
  sim: SimulatorHook;
  onScreenshot: () => void;
}

export function ControlPanel({ sim, onScreenshot }: ControlPanelProps) {
  const { state, setShadowOpacity, setShadowSoftness, setUploadedImage, toggleHeatmap } = sim;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage],
  );

  const isDemo = state.uploadedImage === demoImage;

  return (
    <div className="space-y-4">
      {/* Image upload */}
      <div className="space-y-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">
          Site Image
        </span>
        <div
          className="border-2 border-dashed border-slate-600 hover:border-amber-500 rounded-lg p-3 text-center cursor-pointer transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          {state.uploadedImage ? (
            <div className="flex flex-col items-center gap-1">
              <img
                src={state.uploadedImage}
                alt="Site"
                className="w-16 h-16 object-cover rounded"
              />
              <span className="text-slate-400 text-xs">
                {isDemo ? 'Demo image — click to replace' : 'Click to replace'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <span className="text-2xl">🗺️</span>
              <span className="text-slate-400 text-xs">
                Drop image or click to upload
              </span>
              <span className="text-slate-600 text-xs">
                Top-down site photo or plan
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          {!isDemo && (
            <button
              onClick={() => setUploadedImage(demoImage)}
              className="flex-1 text-slate-500 hover:text-amber-400 text-xs transition-colors text-center"
            >
              Load demo image
            </button>
          )}
          {state.uploadedImage && !isDemo && (
            <button
              onClick={() => setUploadedImage(null)}
              className="flex-1 text-slate-500 hover:text-red-400 text-xs transition-colors text-center"
            >
              Remove image
            </button>
          )}
        </div>
      </div>

      {/* Shadow opacity */}
      <div className="space-y-1">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">
          Shadow Controls
        </span>
        <label className="flex items-center justify-between text-xs text-slate-500">
          Opacity: {Math.round(state.shadowOpacity * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.shadowOpacity}
          onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
          className="w-full"
          aria-label="Shadow opacity"
        />
        <label className="flex items-center justify-between text-xs text-slate-500 mt-1">
          Softness: {Math.round(state.shadowSoftness * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.shadowSoftness}
          onChange={(e) => setShadowSoftness(parseFloat(e.target.value))}
          className="w-full"
          aria-label="Shadow softness"
        />
      </div>

      {/* Heatmap toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-slate-400 text-xs font-medium block">
            Sun-Hours Heatmap
          </span>
          <span className="text-slate-600 text-xs">
            {state.showHeatmap ? 'Showing daily exposure' : 'Shows daily exposure'}
          </span>
        </div>
        <button
          onClick={toggleHeatmap}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.showHeatmap ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.showHeatmap ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Screenshot */}
      <button
        onClick={onScreenshot}
        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        📸 Export Screenshot
      </button>
    </div>
  );
}
