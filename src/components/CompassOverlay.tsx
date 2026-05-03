/**
 * CompassOverlay.tsx
 * ------------------
 * Canvas-based compass with a draggable north handle.
 * The user rotates the "N" marker to align with their image's north direction.
 * Also shows a rotation input for precise control.
 */

import { useRef, useEffect, useCallback } from 'react';
import type { SimulatorHook } from '../hooks/useSimulator';

interface CompassOverlayProps {
  sim: SimulatorHook;
}

const SIZE = 120;
const CENTER = SIZE / 2;
const RADIUS = 48;
const HANDLE_R = 10;

export function CompassOverlay({ sim }: CompassOverlayProps) {
  const { state, setNorthAngle } = sim;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Draw compass
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const angle = (state.northAngle * Math.PI) / 180;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background circle
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cardinal labels
    const cardinals = [
      { label: 'N', a: 0 },
      { label: 'E', a: Math.PI / 2 },
      { label: 'S', a: Math.PI },
      { label: 'W', a: -Math.PI / 2 },
    ];
    cardinals.forEach(({ label, a }) => {
      const ax = CENTER + (RADIUS - 14) * Math.sin(a);
      const ay = CENTER - (RADIUS - 14) * Math.cos(a);
      ctx.fillStyle = label === 'N' ? '#94a3b8' : '#475569';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, ax, ay);
    });

    // Tick marks
    for (let i = 0; i < 8; i++) {
      const ta = (i * Math.PI) / 4;
      const inner = RADIUS - 5;
      const outer = RADIUS - 1;
      ctx.beginPath();
      ctx.moveTo(
        CENTER + inner * Math.sin(ta),
        CENTER - inner * Math.cos(ta),
      );
      ctx.lineTo(
        CENTER + outer * Math.sin(ta),
        CENTER - outer * Math.cos(ta),
      );
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // North needle (red side)
    const nx = CENTER + RADIUS * 0.6 * Math.sin(angle);
    const ny = CENTER - RADIUS * 0.6 * Math.cos(angle);
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // South needle (white)
    const southX = CENTER - RADIUS * 0.4 * Math.sin(angle);
    const southY = CENTER + RADIUS * 0.4 * Math.cos(angle);
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.lineTo(southX, southY);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();

    // Draggable N handle
    ctx.beginPath();
    ctx.arc(nx, ny, HANDLE_R, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
  }, [state.northAngle]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getAngleFromEvent = (
    e: React.MouseEvent | React.TouchEvent,
  ): number => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clientX - rect.left - CENTER;
    const y = clientY - rect.top - CENTER;
    let angle = (Math.atan2(x, -y) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    setNorthAngle(getAngleFromEvent(e));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setNorthAngle(getAngleFromEvent(e));
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          North Orientation
        </span>
        <span className="text-slate-300 text-xs font-mono">
          {state.northAngle.toFixed(0)}°
        </span>
      </div>
      <div className="flex items-center gap-3">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="cursor-grab active:cursor-grabbing rounded-full border border-slate-700"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          title="Drag the N handle to set north direction"
        />
        <div className="flex-1 space-y-1">
          <label className="text-slate-500 text-xs">Rotate image (°)</label>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={state.northAngle}
            onChange={(e) => setNorthAngle(parseInt(e.target.value))}
            className="w-full"
            aria-label="North angle"
          />
          <input
            type="number"
            min={0}
            max={359}
            value={state.northAngle.toFixed(0)}
            onChange={(e) => setNorthAngle(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-700 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
