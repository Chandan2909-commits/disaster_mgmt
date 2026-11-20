import React, { useState } from 'react';
import {
  Send,
  CheckCheck,
  Check,
  Clock,
  RefreshCw,
  Terminal,
  Bot,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const NotificationConsole: React.FC = () => {
  const {
    notificationWorkflow,
    customChatTarget,
    setCustomChatTarget,
    sendLiveMessages,
    setSendLiveMessages,
    triggerManualDispatch,
    checkDeliveryStatus,
    extensionStatus,
  } = useSimulation();

  const [isSending, setIsSending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [targetInput, setTargetInput] = useState(customChatTarget);

  const handleTargetChange = (val: string) => {
    setTargetInput(val);
    setCustomChatTarget(val);
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      await triggerManualDispatch(targetInput, sendLiveMessages);
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      await checkDeliveryStatus();
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const delivery = notificationWorkflow.deliveryInfo;

  const renderStatusBadge = () => {
    if (!delivery) {
      return (
        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Not Checked Yet
        </span>
      );
    }

    switch (delivery.status) {
      case 'DELIVERED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered (Double Tick)</span>
          </span>
        );
      case 'SENT':
      case 'SENT_SINGLE_TICK':
      case 'MOCK_SENT':
        return (
          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sent to Server (Single Tick)</span>
          </span>
        );
      case 'PENDING_CLOCK':
        return (
          <span className="flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Sending... (Clock icon)</span>
          </span>
        );
      case 'WAITING_FOR_QR':
        return (
          <span className="flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
            <QrCode className="w-3.5 h-3.5 text-amber-700" />
            <span>Scan QR Code to Log In</span>
          </span>
        );
      case 'DRAFT_IN_COMPOSE':
        return (
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            Draft Prepared (Unsent)
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Local Agent Offline
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            {delivery.label}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#1e1e1e] text-white">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                WhatsApp Dispatch & Verification
              </h3>
              <span className="text-[11px] font-semibold text-gray-400">
                Selenium Companion Harness (Port 8765)
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              notificationWorkflow.stage === 'MESSAGE_SENT_SUCCESS'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : notificationWorkflow.stage === 'IDLE'
                ? 'bg-gray-100 text-gray-500'
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}
          >
            {notificationWorkflow.stage.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Target & Mode Controls */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Target Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              WhatsApp Recipient (Phone Number or Contact Name):
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={targetInput}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder="e.g. +919876543210 or Contact Name"
                className="w-full pl-9 pr-3 py-2 bg-[#f4f5f7] rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all border border-transparent"
              />
            </div>
          </div>

          {/* Mode Switch: Live Send vs Draft Only */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Transmission Mode:
            </label>
            <div className="flex items-center gap-1 bg-[#f4f5f7] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSendLiveMessages(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sendLiveMessages
                    ? 'bg-[#1e1e1e] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Send Live (Press Enter)
              </button>
              <button
                type="button"
                onClick={() => setSendLiveMessages(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !sendLiveMessages
                    ? 'bg-[#1e1e1e] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Draft Preview Only
              </button>
            </div>
          </div>
        </div>

        {/* Message Delivery Status Card */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500">Delivery Status:</span>
            {renderStatusBadge()}
          </div>

          <button
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            title="Check if message is sent on WhatsApp Web"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        {/* Message Text Preview */}
        <div className="mt-3 bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Simulation Payload Preview
            </span>
            <span className="text-[10px] font-bold text-gray-400 font-mono">
              Target: {targetInput}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-700 leading-relaxed font-mono select-all">
            {notificationWorkflow.testMessage ||
              `[SIMULATION ALERT] Flood monitoring demo: simulated river level is active. Target: ${targetInput}.`}
          </p>
        </div>

        {/* Stage Timeline */}
        <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto scrollable-content">
          {notificationWorkflow.progressLog.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">
              Ready to transmit. Click "Send via WhatsApp Selenium" below or wait for 30s alert timeout.
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

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="text-[11px] text-gray-500 font-medium">
          {extensionStatus.isInstalled ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Local Agent Ready (127.0.0.1:8765)
            </span>
          ) : (
            <span className="text-gray-400">Run python companion/agent.py to enable Selenium</span>
          )}
        </div>

        <button
          onClick={handleSendNow}
          disabled={isSending}
          className="bg-[#1e1e1e] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {isSending ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isSending ? 'Sending via WhatsApp...' : 'Send via WhatsApp Selenium'}</span>
        </button>
      </div>
    </div>
  );
};
