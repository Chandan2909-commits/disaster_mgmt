import React from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { SimulationEvent } from '../types';

export const EventLogModal: React.FC = () => {
  const { showLogModal, setShowLogModal, eventLog } = useSimulation();

  if (!showLogModal) return null;

  const getSeverityIcon = (severity: SimulationEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slide-up border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#1e1e1e] text-white">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Simulation Audit Log
              </h2>
              <p className="text-xs font-semibold text-gray-400">
                Chronological event stream & human cancellation tracking
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLogModal(false)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1 scrollable-content">
          {eventLog.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-8">
              No simulation events logged yet.
            </p>
          ) : (
            eventLog.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex items-start gap-3 text-xs"
              >
                {getSeverityIcon(ev.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-gray-900">{ev.title}</span>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {ev.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 mt-1 leading-relaxed">
                    {ev.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                      {ev.type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={() => setShowLogModal(false)}
            className="bg-[#1e1e1e] text-white font-bold px-6 py-2.5 rounded-2xl text-xs active:scale-95 transition-transform"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};
