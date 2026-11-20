import React, { useState } from 'react';
import { Download, CheckCircle2, RefreshCw, X, ShieldAlert, Laptop, Puzzle, PlayCircle } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { generateExtensionZip, downloadBlob } from '../utils/zipGenerator';

export const ExtensionPromptModal: React.FC = () => {
  const {
    showExtensionModal,
    setShowExtensionModal,
    extensionStatus,
    checkExtensionAgain,
    dismissExtensionModal,
  } = useSimulation();

  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  if (!showExtensionModal) return null;

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const blob = await generateExtensionZip();
      downloadBlob(blob, 'DisasterMgmt-Chrome-Extension.zip');
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleRecheck = async () => {
    setIsChecking(true);
    await checkExtensionAgain();
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-7 shadow-2xl max-w-xl w-full animate-slide-up border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] flex items-center justify-center text-white shadow-md">
              <Puzzle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Companion Extension
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  OPTIONAL HARNESS
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                For live Selenium WhatsApp Web automation, install the companion package.
              </p>
            </div>
          </div>
          <button
            onClick={dismissExtensionModal}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanatory Body */}
        <div className="mt-5 space-y-4">
          <p className="text-xs font-medium text-gray-600 leading-relaxed">
            The frontend is deployable on <strong>Vercel</strong>. To allow Selenium browser automation on your local workstation without exposing security vulnerabilities, the architecture uses a companion extension and loopback agent (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">127.0.0.1:8765</code>).
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: Chrome Extension */}
            <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Puzzle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-gray-900">Chrome Extension</span>
                </div>
                <p className="text-[11px] font-medium text-gray-500 leading-normal">
                  Pre-packaged manifest v3 extension. Load unpacked in <code className="text-gray-700">chrome://extensions</code>.
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isGeneratingZip}
                className="mt-3 w-full bg-[#1e1e1e] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isGeneratingZip ? 'Packaging...' : 'Download .ZIP'}</span>
              </button>
            </div>

            {/* Option 2: Python Selenium Agent */}
            <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-extrabold text-gray-900">Python Companion</span>
                </div>
                <p className="text-[11px] font-medium text-gray-500 leading-normal">
                  Local Selenium script (<code className="text-gray-700">companion/agent.py</code>) on port 8765.
                </p>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-mono font-semibold bg-gray-200 text-gray-800 px-2 py-1.5 rounded-lg block text-center truncate">
                  python companion/agent.py
                </span>
              </div>
            </div>
          </div>

          {/* Quick Steps */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs">
            <span className="font-extrabold text-emerald-900 block mb-1">
              Installation in 10 seconds:
            </span>
            <ol className="list-decimal list-inside text-emerald-800 font-medium space-y-1 text-[11px]">
              <li>Click <strong>Download .ZIP</strong> above and unzip the contents.</li>
              <li>Open <code>chrome://extensions</code> in Google Chrome & enable Developer Mode.</li>
              <li>Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
              <li>Click <strong>Re-check Connection</strong> below!</li>
            </ol>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={handleRecheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-700 bg-[#f4f5f7] hover:bg-gray-200 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Re-check Connection</span>
          </button>

          <button
            onClick={dismissExtensionModal}
            className="bg-[#1e1e1e] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4 text-emerald-400" />
            <span>Continue with In-Browser Simulator</span>
          </button>
        </div>
      </div>
    </div>
  );
};

