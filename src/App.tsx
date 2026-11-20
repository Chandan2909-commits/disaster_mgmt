import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { PresetsBar } from './components/PresetsBar';
import { MetricCard } from './components/MetricCard';
import { WaterLevelGraph } from './components/WaterLevelGraph';
import { NotificationConsole } from './components/NotificationConsole';
import { WaterLevelSimulatorModal } from './components/WaterLevelSimulatorModal';
import { AlertModal } from './components/AlertModal';
import { ExtensionPromptModal } from './components/ExtensionPromptModal';
import { ThreatScoreBreakdown } from './components/ThreatScoreBreakdown';
import { SettingsModal } from './components/SettingsModal';
import { EventLogModal } from './components/EventLogModal';
import { useSimulation } from './context/SimulationContext';
import {
  Waves,
  TrendingUp,
  AlertTriangle,
  Clock,
  CloudRain,
  Radio,
  Users,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export default function App() {
  const { telemetry, setShowThreatScoreModal } = useSimulation();

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#f8f9fa] font-montserrat">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollable-content pb-24">
          {/* Presets and Scenario Bar */}
          <div className="flex items-center justify-between gap-4">
            <PresetsBar />
          </div>

          {/* Transparent Threat Evaluation Banner */}
          <div
            className={`p-4 rounded-3xl border transition-all ${
              telemetry.threatStatus === 'CRITICAL'
                ? 'bg-rose-50/80 border-rose-200'
                : telemetry.threatStatus === 'WARNING'
                ? 'bg-amber-50/80 border-amber-200'
                : telemetry.threatStatus === 'WATCH'
                ? 'bg-blue-50/80 border-blue-200'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Transparent Threat Assessment Evaluation:
                  </span>
                  <span
                    className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                      telemetry.threatStatus === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : telemetry.threatStatus === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : telemetry.threatStatus === 'WATCH'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {telemetry.threatStatus}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {telemetry.threatReasons.map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-white/80 border border-gray-200/60 text-gray-800 shadow-sm"
                    >
                      • {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Water Level */}
            <MetricCard
              title="Water Level"
              subtitle={`Warn: ${telemetry.warningThreshold.toFixed(1)}m | Dang: ${telemetry.dangerThreshold.toFixed(1)}m`}
              value={telemetry.waterLevel.toFixed(2)}
              unit="m"
              icon={Waves}
              badge={{
                text:
                  telemetry.waterLevel >= telemetry.dangerThreshold
                    ? 'Danger'
                    : telemetry.waterLevel >= telemetry.warningThreshold
                    ? 'Warning'
                    : 'Nominal',
                variant:
                  telemetry.waterLevel >= telemetry.dangerThreshold
                    ? 'rose'
                    : telemetry.waterLevel >= telemetry.warningThreshold
                    ? 'amber'
                    : 'emerald',
              }}
            />

            {/* Rate of Change */}
            <MetricCard
              title="Rate of Change"
              subtitle="Hydrological velocity"
              value={`${telemetry.rateOfChange >= 0 ? '+' : ''}${telemetry.rateOfChange.toFixed(2)}`}
              unit="m / h"
              icon={TrendingUp}
              badge={{
                text: telemetry.rateOfChange > 0.8 ? 'Rapid Surge' : telemetry.rateOfChange < -0.5 ? 'Rapid Fall' : 'Stable',
                variant: telemetry.rateOfChange > 0.8 ? 'rose' : telemetry.rateOfChange < -0.5 ? 'blue' : 'neutral',
              }}
            />

            {/* Flood Threat Score */}
            <MetricCard
              title="Flood Threat Score"
              subtitle="Compound formula (Click to inspect)"
              value={telemetry.floodThreatScore.toFixed(1)}
              unit="/ 100"
              icon={Layers}
              onClick={() => setShowThreatScoreModal(true)}
              badge={{
                text: telemetry.floodThreatScore >= 80 ? 'Critical' : telemetry.floodThreatScore >= 60 ? 'Warning' : telemetry.floodThreatScore >= 35 ? 'Watch' : 'Safe',
                variant: telemetry.floodThreatScore >= 80 ? 'rose' : telemetry.floodThreatScore >= 60 ? 'amber' : 'emerald',
              }}
            />

            {/* Time to Danger */}
            <MetricCard
              title="Time to Inundation (TTD)"
              subtitle="Estimated window to danger"
              value={telemetry.timeToDangerLabel}
              icon={Clock}
              badge={{
                text: telemetry.timeToDanger !== null && telemetry.timeToDanger < 30 ? 'Urgent' : 'Standard',
                variant: telemetry.timeToDanger !== null && telemetry.timeToDanger < 30 ? 'rose' : 'neutral',
              }}
            />
          </div>

          {/* Secondary Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Catchment Rainfall */}
            <MetricCard
              title="Catchment Rainfall"
              subtitle={`Total Acc: ${telemetry.accumulatedRainfall.toFixed(1)} mm`}
              value={telemetry.rainfallRate.toFixed(1)}
              unit="mm / h"
              icon={CloudRain}
              badge={{
                text: telemetry.rainfallRate > 25 ? 'Torrential' : 'Light',
                variant: telemetry.rainfallRate > 25 ? 'amber' : 'neutral',
              }}
            />

            {/* Turbidity */}
            <MetricCard
              title="Turbidity"
              subtitle="Sediment suspension"
              value={telemetry.turbidity.toFixed(1)}
              unit="NTU"
              icon={Activity}
            />

            {/* Acoustic Anomaly */}
            <MetricCard
              title="Acoustic Hydrophone"
              subtitle="Debris / Blockage signature"
              value={(telemetry.acousticAnomaly * 100).toFixed(0)}
              unit="%"
              icon={Radio}
              badge={{
                text: telemetry.acousticAnomaly > 0.6 ? 'Anomaly' : 'Clear',
                variant: telemetry.acousticAnomaly > 0.6 ? 'rose' : 'emerald',
              }}
            />

            {/* Population & Sensor Health */}
            <MetricCard
              title="Affected Population"
              subtitle={`Rig Health: ${telemetry.sensorHealth}`}
              value={telemetry.populationAffected.toLocaleString()}
              unit="est."
              icon={Users}
              badge={{
                text: telemetry.sensorHealth,
                variant: telemetry.sensorHealth === 'HEALTHY' ? 'emerald' : telemetry.sensorHealth === 'NOISY' ? 'amber' : 'rose',
              }}
            />
          </div>

          {/* Main Visualizations Row: Graph and Notification Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WaterLevelGraph />
            <NotificationConsole />
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      <WaterLevelSimulatorModal />
      <AlertModal />
      <ExtensionPromptModal />
      <ThreatScoreBreakdown />
      <SettingsModal />
      <EventLogModal />
    </div>
  );
}
