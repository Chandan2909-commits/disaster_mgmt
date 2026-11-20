import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Check, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { GraphControlPoint } from '../types';

export const WaterLevelSimulatorModal: React.FC = () => {
  const {
    showGraphModal,
    setShowGraphModal,
    telemetry,
    applyWaterLevelProfile,
  } = useSimulation();

  // Control points: 6 time points across 60 minutes
  const [points, setPoints] = useState<GraphControlPoint[]>([
    { timeOffsetMin: 0, waterLevel: telemetry.waterLevel },
    { timeOffsetMin: 12, waterLevel: telemetry.waterLevel + 0.4 },
    { timeOffsetMin: 24, waterLevel: telemetry.waterLevel + 1.1 },
    { timeOffsetMin: 36, waterLevel: telemetry.waterLevel + 1.8 },
    { timeOffsetMin: 48, waterLevel: telemetry.waterLevel + 2.5 },
    { timeOffsetMin: 60, waterLevel: telemetry.waterLevel + 3.2 },
  ]);

  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync initial point with current telemetry on open
  useEffect(() => {
    if (showGraphModal) {
      setPoints([
        { timeOffsetMin: 0, waterLevel: telemetry.waterLevel },
        { timeOffsetMin: 12, waterLevel: Math.min(8.0, telemetry.waterLevel + 0.3) },
        { timeOffsetMin: 24, waterLevel: Math.min(8.0, telemetry.waterLevel + 0.8) },
        { timeOffsetMin: 36, waterLevel: Math.min(8.0, telemetry.waterLevel + 1.4) },
        { timeOffsetMin: 48, waterLevel: Math.min(8.0, telemetry.waterLevel + 1.9) },
        { timeOffsetMin: 60, waterLevel: Math.min(8.0, telemetry.waterLevel + 2.4) },
      ]);
    }
  }, [showGraphModal, telemetry.waterLevel]);

  if (!showGraphModal) return null;

  // Graph geometry
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const minLevel = 0.0;
  const maxLevel = 8.0; // 0m to 8m range

  const timeToX = (min: number) => {
    return padding.left + (min / 60) * (width - padding.left - padding.right);
  };

  const levelToY = (lvl: number) => {
    const clamped = Math.max(minLevel, Math.min(maxLevel, lvl));
    return height - padding.bottom - ((clamped - minLevel) / (maxLevel - minLevel)) * (height - padding.top - padding.bottom);
  };

  const yToLevel = (y: number) => {
    const rawRatio = (height - padding.bottom - y) / (height - padding.top - padding.bottom);
    const lvl = minLevel + rawRatio * (maxLevel - minLevel);
    return Math.max(0.2, Math.min(maxLevel, Math.round(lvl * 100) / 100));
  };

  // Drag handlers
  const handleMouseDown = (index: number) => {
    setActiveDragIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDragIndex === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const newLvl = yToLevel(mouseY);

    setPoints((prev) => {
      const updated = [...prev];
      updated[activeDragIndex] = {
        ...updated[activeDragIndex],
        waterLevel: newLvl,
      };
      return updated;
    });
  };

  const handleMouseUp = () => {
    setActiveDragIndex(null);
  };

  // Quick preset curves
  const setCurvePreset = (type: 'surge' | 'gradual' | 'drop' | 'stable') => {
    const base = telemetry.waterLevel;
    if (type === 'surge') {
      setPoints([
        { timeOffsetMin: 0, waterLevel: base },
        { timeOffsetMin: 12, waterLevel: Math.min(8.0, base + 0.6) },
        { timeOffsetMin: 24, waterLevel: Math.min(8.0, base + 1.8) },
        { timeOffsetMin: 36, waterLevel: Math.min(8.0, base + 3.2) },
        { timeOffsetMin: 48, waterLevel: Math.min(8.0, base + 4.1) },
        { timeOffsetMin: 60, waterLevel: Math.min(8.0, base + 4.6) },
      ]);
    } else if (type === 'gradual') {
      setPoints([
        { timeOffsetMin: 0, waterLevel: base },
        { timeOffsetMin: 12, waterLevel: Math.min(8.0, base + 0.3) },
        { timeOffsetMin: 24, waterLevel: Math.min(8.0, base + 0.7) },
        { timeOffsetMin: 36, waterLevel: Math.min(8.0, base + 1.1) },
        { timeOffsetMin: 48, waterLevel: Math.min(8.0, base + 1.6) },
        { timeOffsetMin: 60, waterLevel: Math.min(8.0, base + 2.0) },
      ]);
    } else if (type === 'drop') {
      setPoints([
        { timeOffsetMin: 0, waterLevel: base },
        { timeOffsetMin: 12, waterLevel: Math.max(0.5, base - 0.4) },
        { timeOffsetMin: 24, waterLevel: Math.max(0.5, base - 1.0) },
        { timeOffsetMin: 36, waterLevel: Math.max(0.5, base - 1.6) },
        { timeOffsetMin: 48, waterLevel: Math.max(0.5, base - 1.8) },
        { timeOffsetMin: 60, waterLevel: Math.max(0.5, base - 2.0) },
      ]);
    } else {
      setPoints([
        { timeOffsetMin: 0, waterLevel: 2.4 },
        { timeOffsetMin: 12, waterLevel: 2.42 },
        { timeOffsetMin: 24, waterLevel: 2.38 },
        { timeOffsetMin: 36, waterLevel: 2.45 },
        { timeOffsetMin: 48, waterLevel: 2.41 },
        { timeOffsetMin: 60, waterLevel: 2.4 },
      ]);
    }
  };

  // Calculated rate of change from curve
  // Delta over first 60 minutes in m/hour:
  const firstPoint = points[0].waterLevel;
  const lastPoint = points[points.length - 1].waterLevel;
  const calculatedRate = Math.round((lastPoint - firstPoint) * 100) / 100; // m/hour

  // Path generator
  const pathD = points.reduce((acc, p, idx) => {
    const x = timeToX(p.timeOffsetMin);
    const y = levelToY(p.waterLevel);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Fill area under curve
  const areaD = `${pathD} L ${timeToX(60)} ${height - padding.bottom} L ${timeToX(0)} ${height - padding.bottom} Z`;

  const handleApply = () => {
    // Apply immediate starting level (point 1 or projected point 2) and rate
    applyWaterLevelProfile(points[1].waterLevel, calculatedRate);
    setShowGraphModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 shadow-2xl max-w-2xl w-full animate-slide-up border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                Water Level Curve Simulator
              </h2>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                RESEARCH HARNESS
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              Drag points along the 60-minute window to simulate flood surges, crests, or sudden drops.
            </p>
          </div>
          <button
            onClick={() => setShowGraphModal(false)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Shape Presets */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Quick Curves:</span>
          <button
            onClick={() => setCurvePreset('surge')}
            className="px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all"
          >
            Surge Spike
          </button>
          <button
            onClick={() => setCurvePreset('gradual')}
            className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all"
          >
            Gradual Rise
          </button>
          <button
            onClick={() => setCurvePreset('drop')}
            className="px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
          >
            Sudden Fall
          </button>
          <button
            onClick={() => setCurvePreset('stable')}
            className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
          >
            Stable Nominal
          </button>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="mt-4 bg-[#f8f9fa] rounded-2xl p-2 border border-gray-100 relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Lines */}
            {[2, 4, 6, 8].map((lvl) => (
              <g key={lvl}>
                <line
                  x1={padding.left}
                  y1={levelToY(lvl)}
                  x2={width - padding.right}
                  y2={levelToY(lvl)}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={levelToY(lvl) + 4}
                  fill="#9ca3af"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {lvl}m
                </text>
              </g>
            ))}

            {/* Time labels on X Axis */}
            {[0, 15, 30, 45, 60].map((t) => (
              <g key={t}>
                <text
                  x={timeToX(t)}
                  y={height - padding.bottom + 20}
                  fill="#9ca3af"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  +{t}m
                </text>
              </g>
            ))}

            {/* Danger Threshold Line (6.0m) */}
            <line
              x1={padding.left}
              y1={levelToY(telemetry.dangerThreshold)}
              x2={width - padding.right}
              y2={levelToY(telemetry.dangerThreshold)}
              stroke="#f43f5e"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={width - padding.right}
              y={levelToY(telemetry.dangerThreshold) - 6}
              fill="#f43f5e"
              fontSize="10"
              fontWeight="bold"
              textAnchor="end"
            >
              Danger: {telemetry.dangerThreshold.toFixed(1)}m
            </text>

            {/* Warning Threshold Line (4.5m) */}
            <line
              x1={padding.left}
              y1={levelToY(telemetry.warningThreshold)}
              x2={width - padding.right}
              y2={levelToY(telemetry.warningThreshold)}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={width - padding.right}
              y={levelToY(telemetry.warningThreshold) - 6}
              fill="#f59e0b"
              fontSize="10"
              fontWeight="bold"
              textAnchor="end"
            >
              Warning: {telemetry.warningThreshold.toFixed(1)}m
            </text>

            {/* Shaded Area under water curve */}
            <path d={areaD} fill="rgba(16, 185, 129, 0.12)" />

            {/* Interactive Curve Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Draggable Point Nodes */}
            {points.map((p, idx) => {
              const cx = timeToX(p.timeOffsetMin);
              const cy = levelToY(p.waterLevel);
              const isDragging = activeDragIndex === idx;

              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isDragging ? 10 : 7}
                    fill={isDragging ? '#10b981' : '#ffffff'}
                    stroke="#1e1e1e"
                    strokeWidth={isDragging ? 3 : 2.5}
                    onMouseDown={() => handleMouseDown(idx)}
                    className="cursor-ns-resize transition-all"
                  />
                  <text
                    x={cx}
                    y={cy - 12}
                    fill="#1e1e1e"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {p.waterLevel.toFixed(2)}m
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-[#f4f5f7] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Projected Rate of Rise:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-extrabold ${calculatedRate > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {calculatedRate > 0 ? `+${calculatedRate}` : calculatedRate}
              </span>
              <span className="text-xs font-bold text-gray-500">m / hour</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Target 1h Peak:</span>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">
              {lastPoint.toFixed(2)} m
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 uppercase">Trigger State:</span>
            <div className="text-sm font-extrabold text-gray-900 mt-0.5">
              {lastPoint >= telemetry.dangerThreshold
                ? '🔴 CRITICAL ALERT'
                : lastPoint >= telemetry.warningThreshold
                ? '🟡 WARNING'
                : '🟢 NORMAL'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={() => setCurvePreset('stable')}
            className="px-5 py-3 rounded-2xl text-gray-700 font-bold text-sm hover:bg-gray-100 transition-transform active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span>Reset Curve</span>
          </button>

          <button
            onClick={handleApply}
            className="bg-[#1e1e1e] text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Set Water Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
