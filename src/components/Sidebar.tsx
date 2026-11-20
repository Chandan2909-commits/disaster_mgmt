import React from 'react';
import {
  Activity,
  Sliders,
  Layers,
  Settings,
  FileText,
  AlertTriangle,
  Radio,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const Sidebar: React.FC = () => {
  const {
    setShowGraphModal,
    setShowThreatScoreModal,
    setShowSettingsModal,
    setShowLogModal,
    setShowExtensionModal,
    extensionStatus,
    telemetry,
  } = useSimulation();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-4 select-none shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#1e1e1e] flex items-center justify-center text-white shadow-md">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">
              DisasterMgmt
            </h1>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Research Harness
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="space-y-1.5">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1e1e1e] text-white font-bold text-sm shadow-sm transition-transform active:scale-95 text-left"
          >
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setShowGraphModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-gray-700 font-bold text-sm hover:bg-[#f4f5f7] transition-all active:scale-95 text-left"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-gray-500" />
              <span>Water Level Simulator</span>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              Interactive
            </span>
          </button>

          <button
            onClick={() => setShowThreatScoreModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-gray-700 font-bold text-sm hover:bg-[#f4f5f7] transition-all active:scale-95 text-left"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-gray-500" />
              <span>Threat Score Logic</span>
            </div>
            <span className="text-[11px] font-bold text-gray-400">
              {telemetry.floodThreatScore.toFixed(0)}/100
            </span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 font-bold text-sm hover:bg-[#f4f5f7] transition-all active:scale-95 text-left"
          >
            <FileText className="w-5 h-5 text-gray-500" />
            <span>Simulation Audit Log</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 font-bold text-sm hover:bg-[#f4f5f7] transition-all active:scale-95 text-left"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <span>Thresholds & Config</span>
          </button>
        </div>
      </div>

      {/* Footer / Companion status */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div
          onClick={() => setShowExtensionModal(true)}
          className="bg-[#f4f5f7] rounded-2xl p-3 cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-700">Companion Bridge</span>
            {extensionStatus.isInstalled ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Standby
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
            {extensionStatus.isInstalled
              ? `Connected via ${extensionStatus.source === 'chrome-extension' ? 'Chrome Extension' : 'Local Agent'}`
              : 'Using high-fidelity in-browser mock automation.'}
          </p>
        </div>

        <div className="flex items-center justify-between px-2 text-[10px] text-gray-400 font-semibold">
          <span>v1.0.0 Research Demo</span>
          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            SIMULATION
          </span>
        </div>
      </div>
    </aside>
  );
};
