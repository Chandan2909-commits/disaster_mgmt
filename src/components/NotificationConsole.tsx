import React from 'react';
import { Send, CheckCircle2, ShieldCheck, Terminal, Bot, ExternalLink } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const NotificationConsole: React.FC = () => {
  const { notificationWorkflow, customChatTarget, extensionStatus } = useSimulation();

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#1e1e1e] text-white">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                Notification Harness Console
              </h3>
              <span className="text-[11px] font-semibold text-gray-400">
                Target: {customChatTarget}
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              notificationWorkflow.stage === 'NOT_SENT_SIMULATION_COMPLETE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : notificationWorkflow.stage === 'IDLE'
                ? 'bg-gray-100 text-gray-500'
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}
          >
            {notificationWorkflow.stage.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Message Preview Box */}
        <div className="mt-3 bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Prepared Test Payload
            </span>
            <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              SIMULATION ONLY
            </span>
          </div>

          <p className="text-xs font-medium text-gray-700 leading-relaxed font-mono select-all">
            {notificationWorkflow.testMessage ||
              '[SIMULATION — NOT SENT] Flood monitoring demo: awaiting triggered alert or timeout...'}
          </p>
        </div>

        {/* Stage Timeline */}
        <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto scrollable-content">
          {notificationWorkflow.progressLog.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">
              Workflow standby. Will activate if an alert exceeds the 30s human cancellation window.
            </p>
          ) : (
            notificationWorkflow.progressLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mt-0.5">
                  {log.time}
                </span>
                <span className="text-[10px] font-bold bg-[#f4f5f7] text-gray-700 px-1.5 py-0.5 rounded-md uppercase">
                  {log.stage}
                </span>
                <span className="text-[11px] text-gray-600 font-medium">{log.note}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Safety Guardrail Enforced: Send button strictly omitted.</span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold">
          {extensionStatus.isInstalled ? 'Selenium Ready' : 'In-Browser Simulator'}
        </span>
      </div>
    </div>
  );
};
