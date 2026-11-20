import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, XCircle, Clock, CheckCircle2, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const AlertModal: React.FC = () => {
  const { alertState, cancelAlert, dismissAlert } = useSimulation();
  const [cancellationReason, setCancellationReason] = useState<string>('');

  if (!alertState || !alertState.active) return null;

  const isCritical = alertState.status === 'CRITICAL';
  const progressPercent = (alertState.countdownRemaining / 30) * 100;
  const isTimedOut = alertState.decision === 'TIMED_OUT';
  const isCancelled = alertState.decision === 'CANCELLED';

  return (
    <div
      onClick={dismissAlert}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] p-6 shadow-2xl max-w-lg w-full animate-slide-up border border-gray-100 relative"
      >
        {/* Banner with Close X Button */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isCritical ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  SIMULATION ALERT
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {alertState.incidentId}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                {isCritical ? 'Critical Flood Condition' : 'Warning Level Exceeded'}
              </h2>
            </div>
          </div>

          {/* Top-Right Close X Button */}
          <button
            onClick={dismissAlert}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 30-Second Countdown Meter */}
        <div className="mt-4 p-4 rounded-2xl bg-[#f4f5f7] border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Human Review Window
            </span>
            <span className="text-lg font-black text-rose-600">
              {alertState.countdownRemaining}s remaining
            </span>
          </div>

          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-medium text-gray-500 mt-2">
            Operator must verify conditions. If no intervention occurs within 30s, the harness proceeds to mock notification workflow.
          </p>
        </div>

        {/* Incident Metrics Summary */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50">
              <span className="font-semibold text-gray-400 uppercase text-[10px]">Water Level</span>
              <div className="text-base font-extrabold text-gray-900 mt-0.5">
                {alertState.waterLevel.toFixed(2)} m
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50">
              <span className="font-semibold text-gray-400 uppercase text-[10px]">Threat Score</span>
              <div className="text-base font-extrabold text-rose-600 mt-0.5">
                {alertState.threatScore.toFixed(1)} / 100
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
              Trigger Reason(s):
            </span>
            <ul className="mt-1 space-y-1">
              {alertState.reasons.map((r, i) => (
                <li key={i} className="text-xs font-semibold text-rose-900 flex items-start gap-1.5">
                  <span className="text-rose-500">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Operator Cancellation Input */}
        {!isTimedOut && !isCancelled && (
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Operator Cancellation Note (Optional):
            </label>
            <input
              type="text"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Scheduled sensor calibration drill / False positive"
              className="w-full bg-[#f4f5f7] border-transparent rounded-2xl px-4 py-3 font-semibold text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
            />
          </div>
        )}

        {/* Decision status if already decided */}
        {isCancelled && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Alert Cancelled by Operator. Action aborted.</span>
          </div>
        )}
        {isTimedOut && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Window timed out (30s). Commencing mock notification workflow.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          {isTimedOut ? (
            <button
              onClick={dismissAlert}
              className="w-full bg-[#1e1e1e] text-white font-bold py-4 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Acknowledge & Close Modal</span>
            </button>
          ) : isCancelled ? (
            <button
              onClick={dismissAlert}
              className="w-full bg-[#1e1e1e] text-white font-bold py-4 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Close</span>
            </button>
          ) : (
            <>
              <button
                onClick={dismissAlert}
                className="px-5 py-4 rounded-2xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Dismiss
              </button>
              <button
                onClick={() => cancelAlert(cancellationReason)}
                className="flex-1 bg-[#1e1e1e] text-white font-bold py-4 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cancel Alert (Dismiss Action)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
