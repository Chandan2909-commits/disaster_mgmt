import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Sliders } from 'lucide-react';

export const WaterLevelGraph: React.FC = () => {
  const { telemetryHistory, telemetry, setShowGraphModal } = useSimulation();

  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const minLevel = 0;
  const maxLevel = 8.0;

  const points = telemetryHistory.length > 0 ? telemetryHistory : [{ time: 'Now', level: telemetry.waterLevel, rate: 0, score: 0 }];

  const timeToX = (index: number) => {
    if (points.length <= 1) return padding.left;
    return padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  };

  const levelToY = (lvl: number) => {
    const clamped = Math.max(minLevel, Math.min(maxLevel, lvl));
    return height - padding.bottom - ((clamped - minLevel) / (maxLevel - minLevel)) * (height - padding.top - padding.bottom);
  };

  const pathD = points.reduce((acc, p, idx) => {
    const x = timeToX(idx);
    const y = levelToY(p.level);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = points.length > 1
    ? `${pathD} L ${timeToX(points.length - 1)} ${height - padding.bottom} L ${timeToX(0)} ${height - padding.bottom} Z`
    : '';

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm select-none">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
            Live Water Level Telemetry (m)
          </h3>
          <span className="text-[11px] font-semibold text-gray-400">
            Current Gauge: {telemetry.waterLevel.toFixed(2)}m • Trend: {telemetry.rateOfChange >= 0 ? '+' : ''}{telemetry.rateOfChange.toFixed(2)} m/h
          </span>
        </div>

        <button
          onClick={() => setShowGraphModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f5f7] hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all active:scale-95"
        >
          <Sliders className="w-3.5 h-3.5 text-gray-600" />
          <span>Open Curve Simulator</span>
        </button>
      </div>

      <div className="mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Danger threshold reference line */}
          <line
            x1={padding.left}
            y1={levelToY(telemetry.dangerThreshold)}
            x2={width - padding.right}
            y2={levelToY(telemetry.dangerThreshold)}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right}
            y={levelToY(telemetry.dangerThreshold) - 4}
            fill="#f43f5e"
            fontSize="9"
            fontWeight="bold"
            textAnchor="end"
          >
            Danger {telemetry.dangerThreshold.toFixed(1)}m
          </text>

          {/* Warning threshold reference line */}
          <line
            x1={padding.left}
            y1={levelToY(telemetry.warningThreshold)}
            x2={width - padding.right}
            y2={levelToY(telemetry.warningThreshold)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right}
            y={levelToY(telemetry.warningThreshold) - 4}
            fill="#f59e0b"
            fontSize="9"
            fontWeight="bold"
            textAnchor="end"
          >
            Warning {telemetry.warningThreshold.toFixed(1)}m
          </text>

          {/* Area & line */}
          {areaD && <path d={areaD} fill="rgba(16, 185, 129, 0.10)" />}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Latest point circle */}
          {points.length > 0 && (
            <circle
              cx={timeToX(points.length - 1)}
              cy={levelToY(points[points.length - 1].level)}
              r="4.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}

          {/* Y Axis labels */}
          {[2, 4, 6].map((lvl) => (
            <text
              key={lvl}
              x={padding.left - 8}
              y={levelToY(lvl) + 3}
              fill="#9ca3af"
              fontSize="9"
              fontWeight="600"
              textAnchor="end"
            >
              {lvl}m
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
