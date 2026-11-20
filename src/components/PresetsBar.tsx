import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { ScenarioPreset } from '../types';
import { Sparkles, Waves, AlertTriangle, ArrowDownRight, Activity } from 'lucide-react';

export const PresetsBar: React.FC = () => {
  const { activePreset, applyPreset } = useSimulation();

  const presets: { id: ScenarioPreset; label: string; icon: any; desc: string }[] = [
    { id: 'stable', label: 'Stable Flow', icon: Activity, desc: 'Nominal water depth (2.4m)' },
    { id: 'gradual_rise', label: 'Gradual Rise', icon: Waves, desc: 'Approaching Warning (4.6m)' },
    { id: 'rapid_surge', label: 'Rapid Surge', icon: AlertTriangle, desc: 'Flash flood danger (6.2m)' },
    { id: 'sudden_drop', label: 'Sudden Drop', icon: ArrowDownRight, desc: 'Blockage anomaly (1.6m)' },
    { id: 'sensor_noise', label: 'Sensor Noise', icon: Sparkles, desc: 'Fluctuations & degraded health' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollable-content select-none">
      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
        Scenarios:
      </span>
      {presets.map((p) => {
        const Icon = p.icon;
        const isActive = activePreset === p.id;
        return (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            title={p.desc}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 whitespace-nowrap ${
              isActive
                ? 'bg-[#1e1e1e] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-[#f4f5f7]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
};
