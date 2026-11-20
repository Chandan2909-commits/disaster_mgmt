import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Save } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const SettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    telemetry,
    updateThresholds,
    customChatTarget,
    setCustomChatTarget,
  } = useSimulation();

  const [warning, setWarning] = useState<number>(telemetry.warningThreshold);
  const [danger, setDanger] = useState<number>(telemetry.dangerThreshold);
  const [chatTarget, setChatTarget] = useState<string>(customChatTarget);

  if (!showSettingsModal) return null;

  const handleSave = () => {
    updateThresholds(
      warning,
      danger,
      telemetry.threatScoreComponents.alpha,
      telemetry.threatScoreComponents.beta,
      telemetry.threatScoreComponents.gamma
    );
    setCustomChatTarget(chatTarget);
    setShowSettingsModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 shadow-2xl max-w-md w-full animate-slide-up border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#1e1e1e] text-white">
              <SettingsIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Simulation Configuration
              </h2>
              <p className="text-xs font-semibold text-gray-400">
                Adjust hydrological trigger thresholds
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Warning Threshold (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={warning}
              onChange={(e) => setWarning(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#f4f5f7] border-transparent rounded-2xl px-4 py-3 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Danger Threshold (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={danger}
              onChange={(e) => setDanger(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#f4f5f7] border-transparent rounded-2xl px-4 py-3 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Destination Chat / Group Name (Selenium Target)
            </label>
            <input
              type="text"
              value={chatTarget}
              onChange={(e) => setChatTarget(e.target.value)}
              className="w-full bg-[#f4f5f7] border-transparent rounded-2xl px-4 py-3 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#1e1e1e] text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
