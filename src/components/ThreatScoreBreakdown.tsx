import React from 'react';
import { X, Layers, Info } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const ThreatScoreBreakdown: React.FC = () => {
  const { showThreatScoreModal, setShowThreatScoreModal, telemetry, updateThresholds } = useSimulation();

  if (!showThreatScoreModal) return null;

  const { components } = telemetry.threatScoreComponents
    ? { components: telemetry.threatScoreComponents }
    : {
        components: {
          levelRisk: 0.5,
          riseRisk: 0.2,
          populationRisk: 0.1,
          alpha: 0.5,
          beta: 0.35,
          gamma: 0.15,
        },
      };

  const handleAlphaChange = (val: number) => {
    const remaining = Math.max(0, 1 - val);
    const beta = Math.round(remaining * 0.7 * 100) / 100;
    const gamma = Math.round((remaining - beta) * 100) / 100;
    updateThresholds(telemetry.warningThreshold, telemetry.dangerThreshold, val, beta, gamma);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 shadow-2xl max-w-lg w-full animate-slide-up border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#1e1e1e] text-white">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Threat Score Formulation
              </h2>
              <p className="text-xs font-semibold text-gray-400">
                Paper: A Localized Hierarchical Agent Harness
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowThreatScoreModal(false)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formula Representation */}
        <div className="mt-4 p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
            Normalized Threat Equation
          </span>
          <div className="font-mono text-xs font-bold text-gray-800 bg-white p-3 rounded-xl border border-gray-200">
            ThreatScore = α · LevelRisk + β · RiseRisk + γ · PopulationRisk
          </div>
          <span className="text-[11px] font-semibold text-gray-500 mt-2 block">
            α + β + γ = 1.0 (Simulation Weight Constraint)
          </span>
        </div>

        {/* Breakdown of Current Values */}
        <div className="mt-4 space-y-3">
          <div className="p-3 rounded-2xl bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-700 block">Level Risk (α = {components.alpha})</span>
              <span className="text-[11px] text-gray-400">Ratio against Danger Threshold</span>
            </div>
            <span className="font-black text-gray-900 text-sm">
              {(components.levelRisk * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-700 block">Rise Rate Risk (β = {components.beta})</span>
              <span className="text-[11px] text-gray-400">Normalized surge momentum</span>
            </div>
            <span className="font-black text-gray-900 text-sm">
              {(components.riseRisk * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-700 block">Population Exposure (γ = {components.gamma})</span>
              <span className="text-[11px] text-gray-400">Simulated downstream vulnerability</span>
            </div>
            <span className="font-black text-gray-900 text-sm">
              {(components.populationRisk * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Total Score Output */}
        <div className="mt-4 p-4 rounded-2xl bg-[#1e1e1e] text-white flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Compound Score
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {telemetry.floodThreatScore.toFixed(1)} / 100
          </span>
        </div>

        <button
          onClick={() => setShowThreatScoreModal(false)}
          className="mt-5 w-full bg-[#1e1e1e] text-white font-bold py-3.5 rounded-2xl transition-transform active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
};
