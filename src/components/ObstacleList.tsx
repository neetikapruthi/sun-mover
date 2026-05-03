/**
 * ObstacleList.tsx – sidebar panel for managing placed obstacles.
 */

import type { SimulatorHook } from '../hooks/useSimulator';
import type { Obstacle } from '../utils/types';

interface ObstacleListProps {
  sim: SimulatorHook;
}

function ObstacleRow({
  obs,
  onUpdate,
  onDelete,
}: {
  obs: Obstacle;
  onUpdate: (id: string, updates: Partial<Obstacle>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-2 space-y-2 border border-slate-600/50">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ background: obs.color }}
        />
        <span className="text-slate-200 text-xs font-medium flex-1">
          {obs.kind === 'box' ? '🏢' : '🌲'}{' '}
          <input
            className="bg-transparent text-slate-200 text-xs outline-none w-20"
            value={obs.label}
            onChange={(e) => onUpdate(obs.id, { label: e.target.value })}
          />
        </span>
        <button
          onClick={() => onDelete(obs.id)}
          className="text-slate-500 hover:text-red-400 text-xs transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
        {/* Height */}
        <label className="flex flex-col gap-0.5">
          Height ({obs.height.toFixed(1)})
          <input
            type="range"
            min={0.2}
            max={5}
            step={0.1}
            value={obs.height}
            onChange={(e) =>
              onUpdate(obs.id, { height: parseFloat(e.target.value) })
            }
          />
        </label>

        {/* Size */}
        <label className="flex flex-col gap-0.5">
          {obs.kind === 'box' ? 'Width' : 'Radius'} ({obs.size.toFixed(1)})
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={obs.size}
            onChange={(e) =>
              onUpdate(obs.id, { size: parseFloat(e.target.value) })
            }
          />
        </label>

        {/* Rotation (box only) */}
        {obs.kind === 'box' && (
          <label className="flex flex-col gap-0.5 col-span-2">
            Rotation ({Math.round((obs.rotation * 180) / Math.PI)}°)
            <input
              type="range"
              min={0}
              max={Math.PI * 2}
              step={0.05}
              value={obs.rotation}
              onChange={(e) =>
                onUpdate(obs.id, { rotation: parseFloat(e.target.value) })
              }
            />
          </label>
        )}

        {/* Color */}
        <label className="flex items-center gap-1 col-span-2">
          Color:
          <input
            type="color"
            value={obs.color}
            onChange={(e) => onUpdate(obs.id, { color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-slate-600"
          />
        </label>
      </div>
    </div>
  );
}

export function ObstacleList({ sim }: ObstacleListProps) {
  const { state, addObstacle, updateObstacle, deleteObstacle } = sim;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          Objects ({state.obstacles.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => addObstacle('box')}
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded transition-colors"
            title="Add Building"
          >
            + 🏢 Building
          </button>
          <button
            onClick={() => addObstacle('cylinder')}
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded transition-colors"
            title="Add Tree"
          >
            + 🌲 Tree
          </button>
        </div>
      </div>

      {state.obstacles.length === 0 && (
        <p className="text-slate-600 text-xs italic text-center py-2">
          No objects placed. Add a building or tree above.
        </p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {state.obstacles.map((obs) => (
          <ObstacleRow
            key={obs.id}
            obs={obs}
            onUpdate={updateObstacle}
            onDelete={deleteObstacle}
          />
        ))}
      </div>
    </div>
  );
}
