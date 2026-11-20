import React from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const TopHeader: React.FC = () => {
  const { telemetry, isRunning, setIsRunning, resetSimulation } = useSimulation();

  const getStatusBadge = () => {
    switch (telemetry.threatStatus) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-extrabold text-xs tracking-wider uppercase">CRITICAL THREAT</span>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-extrabold text-xs tracking-wider uppercase">WARNING LEVEL</span>
          </div>
        );
      case 'WATCH':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs tracking-wider uppercase">FLOOD WATCH</span>
          </div>
        );
      case 'NORMAL':
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-xs tracking-wider uppercase">NORMAL STATUS</span>
          </div>
        );
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-6 flex items-center justify-between select-none shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              Flood Telemetry & Agent Dispatch Harness
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              PAPER PROTOTYPE
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500">
            Simulated Sensor Rig #FL-402 • Station Alpha (Deterministic Research Seed)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getStatusBadge()}

        {/* Telemetry Clock */}
        <div className="bg-[#f4f5f7] px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{telemetry.lastUpdated}</span>
        </div>

        {/* Simulation Control Buttons */}
        <div className="flex items-center gap-1.5 bg-[#f4f5f7] p-1 rounded-2xl">
          <button
            onClick={() => setIsRunning(!isRunning)}
            title={isRunning ? 'Pause Telemetry Stream' : 'Resume Telemetry Stream'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-white text-gray-800 shadow-sm transition-transform active:scale-95"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            title="Reset Simulation to Initial Seed"
            className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
