import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  TelemetryData,
  SimulationEvent,
  AlertState,
  NotificationWorkflowState,
  ScenarioPreset,
  GraphControlPoint,
} from '../types';
import {
  getInitialTelemetry,
  calculateThreatScore,
  evaluateThreatStatus,
  calculateTimeToDanger,
  applyScenarioPreset,
} from '../services/simulationEngine';
import { extensionBridge, ExtensionStatus } from '../services/extensionBridge';
import { localAgentService } from '../services/localAgentService';

interface SimulationContextType {
  telemetry: TelemetryData;
  telemetryHistory: { time: string; level: number; rate: number; score: number }[];
  isRunning: boolean;
  activePreset: ScenarioPreset | null;
  alertState: AlertState | null;
  notificationWorkflow: NotificationWorkflowState;
  eventLog: SimulationEvent[];
  extensionStatus: ExtensionStatus;
  showExtensionModal: boolean;
  showGraphModal: boolean;
  showThreatScoreModal: boolean;
  showSettingsModal: boolean;
  showLogModal: boolean;
  customChatTarget: string;
  setCustomChatTarget: (target: string) => void;
  setIsRunning: (running: boolean) => void;
  setShowExtensionModal: (show: boolean) => void;
  setShowGraphModal: (show: boolean) => void;
  setShowThreatScoreModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowLogModal: (show: boolean) => void;
  applyPreset: (preset: ScenarioPreset) => void;
  applyWaterLevelProfile: (newLevel: number, newRate: number) => void;
  cancelAlert: (reason?: string) => void;
  dismissAlert: () => void;
  resetSimulation: () => void;
  updateThresholds: (warning: number, danger: number, alpha: number, beta: number, gamma: number) => void;
  checkExtensionAgain: () => Promise<void>;
  dismissExtensionModal: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(getInitialTelemetry());
  const [telemetryHistory, setTelemetryHistory] = useState<{ time: string; level: number; rate: number; score: number }[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<ScenarioPreset | null>('stable');
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [eventLog, setEventLog] = useState<SimulationEvent[]>([]);
  const [customChatTarget, setCustomChatTarget] = useState<string>('disaster_mgmt_research_paper');

  // Extension status & modal
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    hasLocalAgent: false,
    source: 'none',
  });
  const [showExtensionModal, setShowExtensionModal] = useState<boolean>(false);
  const [extensionChecked, setExtensionChecked] = useState<boolean>(false);

  // UI Modals
  const [showGraphModal, setShowGraphModal] = useState<boolean>(false);
  const [showThreatScoreModal, setShowThreatScoreModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Notification workflow
  const [notificationWorkflow, setNotificationWorkflow] = useState<NotificationWorkflowState>({
    stage: 'IDLE',
    active: false,
    targetChat: 'disaster_mgmt_research_paper',
    testMessage: '',
    isLocalAgentUsed: false,
    progressLog: [],
  });

  const lastAlertStatusRef = useRef<string>('NORMAL');

  const addEvent = useCallback((
    type: SimulationEvent['type'],
    title: string,
    description: string,
    severity: SimulationEvent['severity'] = 'info',
    metadata?: Record<string, any>
  ) => {
    const newEvent: SimulationEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      title,
      description,
      severity,
      metadata,
    };
    setEventLog((prev) => [newEvent, ...prev.slice(0, 99)]);
  }, []);

  // Check extension on mount in the backend/background
  const checkExtensionSilently = useCallback(async () => {
    try {
      const status = await extensionBridge.detectExtension();
      setExtensionStatus(status);
      setExtensionChecked(true);

      // If NOT installed, show modal unless user has opted out in localStorage
      if (!status.isInstalled) {
        const dismissed = localStorage.getItem('disaster_mgmt_ext_dismissed');
        if (!dismissed) {
          setShowExtensionModal(true);
        }
      } else {
        // If extension is loaded, DO NOT show modal in the frontend
        setShowExtensionModal(false);
      }
    } catch {
      setExtensionChecked(true);
      setShowExtensionModal(true);
    }
  }, []);

  useEffect(() => {
    // Initial silent detection
    checkExtensionSilently();

    // Log initialization
    addEvent(
      'SIMULATION_STARTED',
      'Hydrological Simulation Harness Active',
      'Deterministic telemetry engine started. Mode: RESEARCH_SIMULATION_ONLY.',
      'info'
    );
  }, [checkExtensionSilently, addEvent]);

  // Telemetry loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        // Bounded slight natural fluctuations
        const noise = (Math.random() - 0.5) * 0.02;
        const newLevel = Math.max(0.5, Math.min(10.0, prev.waterLevel + (prev.rateOfChange / 3600) * 1.5 + noise));
        const newRainfall = Math.max(0, prev.rainfallRate + (Math.random() - 0.5) * 0.5);
        const newAccumulated = prev.accumulatedRainfall + (newRainfall / 3600) * 1.5;
        const newTurbidity = Math.max(5, prev.turbidity + (Math.random() - 0.5) * 0.8);
        const newAcoustic = Math.max(0, Math.min(1, prev.acousticAnomaly + (Math.random() - 0.5) * 0.02));

        const { score, components } = calculateThreatScore(
          newLevel,
          prev.warningThreshold,
          prev.dangerThreshold,
          prev.rateOfChange,
          prev.threatScoreComponents.alpha,
          prev.threatScoreComponents.beta,
          prev.threatScoreComponents.gamma
        );

        const { status, reasons } = evaluateThreatStatus(
          newLevel,
          prev.warningThreshold,
          prev.dangerThreshold,
          prev.rateOfChange,
          newRainfall,
          newAcoustic,
          score
        );

        const { timeToDanger, label } = calculateTimeToDanger(newLevel, prev.dangerThreshold, prev.rateOfChange);

        return {
          ...prev,
          waterLevel: Math.round(newLevel * 100) / 100,
          rainfallRate: Math.round(newRainfall * 10) / 10,
          accumulatedRainfall: Math.round(newAccumulated * 100) / 100,
          turbidity: Math.round(newTurbidity * 10) / 10,
          acousticAnomaly: Math.round(newAcoustic * 100) / 100,
          floodThreatScore: score,
          threatScoreComponents: components,
          threatStatus: status,
          threatReasons: reasons,
          timeToDanger,
          timeToDangerLabel: label,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Keep telemetry history
  useEffect(() => {
    setTelemetryHistory((prev) => {
      const entry = {
        time: telemetry.lastUpdated,
        level: telemetry.waterLevel,
        rate: telemetry.rateOfChange,
        score: telemetry.floodThreatScore,
      };
      const updated = [...prev, entry];
      return updated.slice(-25); // keep last 25 readings
    });
  }, [telemetry.lastUpdated, telemetry.waterLevel, telemetry.rateOfChange, telemetry.floodThreatScore]);

  // Threshold crossing evaluation -> Trigger 30s Alert
  useEffect(() => {
    const currentStatus = telemetry.threatStatus;
    const isDangerous = currentStatus === 'WARNING' || currentStatus === 'CRITICAL';

    // If crossing into WARNING or CRITICAL and no alert currently active
    if (isDangerous && !alertState?.active && lastAlertStatusRef.current !== currentStatus) {
      const incidentId = 'INC-' + Math.floor(1000 + Math.random() * 9000);
      setAlertState({
        active: true,
        incidentId,
        detectedAt: new Date().toLocaleTimeString(),
        status: currentStatus,
        waterLevel: telemetry.waterLevel,
        threatScore: telemetry.floodThreatScore,
        reasons: telemetry.threatReasons,
        countdownRemaining: 30,
      });

      addEvent(
        'SIMULATION_ALERT_CREATED',
        `Simulation Alert Triggered [${currentStatus}]`,
        `Threshold crossed: ${telemetry.threatReasons.join('; ')}. Initiating 30s operator review gate.`,
        currentStatus === 'CRITICAL' ? 'critical' : 'warning',
        { incidentId, level: telemetry.waterLevel, score: telemetry.floodThreatScore }
      );
    }

    lastAlertStatusRef.current = currentStatus;
  }, [telemetry.threatStatus, telemetry.waterLevel, telemetry.floodThreatScore, telemetry.threatReasons, alertState?.active, addEvent]);

  // Alert 30-Second Countdown Gate
  useEffect(() => {
    if (!alertState || !alertState.active || alertState.decision) return;

    const timer = setInterval(() => {
      setAlertState((prev) => {
        if (!prev || !prev.active || prev.decision) return prev;

        if (prev.countdownRemaining <= 1) {
          // Timeout reached!
          clearInterval(timer);
          triggerTimeoutWorkflow(prev);
          return {
            ...prev,
            countdownRemaining: 0,
            decision: 'TIMED_OUT',
          };
        }

        return {
          ...prev,
          countdownRemaining: prev.countdownRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alertState?.active, alertState?.decision]);

  // Trigger Mock Notification Workflow on Human Review Timeout
  const triggerTimeoutWorkflow = useCallback(async (alert: AlertState) => {
    addEvent(
      'HUMAN_REVIEW_TIMEOUT',
      'Operator Review Window Expired (30s Timeout)',
      'No human cancellation input received within 30s. Triggering mock notification pipeline.',
      'warning',
      { incidentId: alert.incidentId }
    );

    const testMsg = `[SIMULATION — NOT SENT] Flood monitoring demo: simulated river level is ${telemetry.waterLevel.toFixed(
      2
    )} m; threat status is ${telemetry.threatStatus}; threat score is ${telemetry.floodThreatScore.toFixed(
      1
    )}; trend is ${telemetry.rateOfChange >= 0 ? '+' : ''}${telemetry.rateOfChange.toFixed(
      2
    )} m/h. This is a research prototype and not a real emergency warning.`;

    setNotificationWorkflow({
      stage: 'QUEUED',
      active: true,
      targetChat: customChatTarget,
      testMessage: testMsg,
      isLocalAgentUsed: false,
      progressLog: [
        { time: new Date().toLocaleTimeString(), stage: 'QUEUED', note: 'Simulation dispatch request queued' },
      ],
    });

    // Check if local Selenium companion is alive
    const agentHealth = await localAgentService.checkHealth();

    if (agentHealth && agentHealth.status === 'online') {
      // Local agent connected
      setNotificationWorkflow((prev) => ({
        ...prev,
        stage: 'LOCAL_AGENT_CONNECTED',
        isLocalAgentUsed: true,
        progressLog: [
          ...prev.progressLog,
          { time: new Date().toLocaleTimeString(), stage: 'LOCAL_AGENT_CONNECTED', note: 'Connected to local companion on 127.0.0.1:8765' },
        ],
      }));

      addEvent('LOCAL_AGENT_CONNECTED', 'Local Companion Agent Connected', 'Restricted loopback bridge active (127.0.0.1:8765).', 'info');

      // Call prepare message
      setNotificationWorkflow((prev) => ({
        ...prev,
        stage: 'BROWSER_OPENED',
        progressLog: [
          ...prev.progressLog,
          { time: new Date().toLocaleTimeString(), stage: 'BROWSER_OPENED', note: 'Browser opened. Navigating to WhatsApp Web...' },
        ],
      }));

      const res = await localAgentService.prepareTestMessage({
        level: telemetry.waterLevel,
        status: telemetry.threatStatus,
        score: telemetry.floodThreatScore,
        trend: `${telemetry.rateOfChange >= 0 ? '+' : ''}${telemetry.rateOfChange.toFixed(2)} m/h`,
        chat_target: customChatTarget,
      });

      if (res.success && res.workflow_stage === 'TEST_MESSAGE_PREPARED') {
        setNotificationWorkflow((prev) => ({
          ...prev,
          stage: 'NOT_SENT_SIMULATION_COMPLETE',
          progressLog: [
            ...prev.progressLog,
            { time: new Date().toLocaleTimeString(), stage: 'CHAT_LOCATED', note: `Located test chat [${customChatTarget}]` },
            { time: new Date().toLocaleTimeString(), stage: 'TEST_MESSAGE_PREPARED', note: 'Message drafted into compose box' },
            { time: new Date().toLocaleTimeString(), stage: 'NOT_SENT_SIMULATION_COMPLETE', note: 'Execution halted. SEND action strictly blocked by research safety policy.' },
          ],
        }));
        addEvent('TEST_MESSAGE_PREPARED', 'Test Message Drafted (Selenium)', 'Browser automation drafted test message. Send button omitted.', 'success');
        addEvent('SIMULATION_MESSAGE_NOT_SENT', 'Safety Guardrail Enforced', 'No message sent or transmitted. Research demonstration complete.', 'info');
      } else {
        // Fallback info
        setNotificationWorkflow((prev) => ({
          ...prev,
          stage: 'NOT_SENT_SIMULATION_COMPLETE',
          progressLog: [
            ...prev.progressLog,
            { time: new Date().toLocaleTimeString(), stage: 'MOCK_FALLBACK', note: res.message || 'WhatsApp login pending. Completed in mock preview.' },
            { time: new Date().toLocaleTimeString(), stage: 'NOT_SENT_SIMULATION_COMPLETE', note: 'Mock notification completed. Safety guardrails preserved.' },
          ],
        }));
      }
    } else {
      // In-browser mock workflow progression with realistic step intervals
      const steps = [
        { stage: 'LOCAL_AGENT_CONNECTED' as const, note: 'Mock mode active (companion offline). Simulating dispatcher...' },
        { stage: 'BROWSER_OPENED' as const, note: 'Opening simulated sandboxed browser tab...' },
        { stage: 'CHAT_LOCATED' as const, note: `Target chat [${customChatTarget}] located in research registry.` },
        { stage: 'TEST_MESSAGE_PREPARED' as const, note: 'Test message drafted into mock message buffer.' },
        { stage: 'NOT_SENT_SIMULATION_COMPLETE' as const, note: 'Simulation complete. Message NOT sent per paper safety protocol.' },
      ];

      let currentStep = 0;
      const stepInterval = setInterval(() => {
        if (currentStep < steps.length) {
          const s = steps[currentStep];
          setNotificationWorkflow((prev) => ({
            ...prev,
            stage: s.stage,
            progressLog: [
              ...prev.progressLog,
              { time: new Date().toLocaleTimeString(), stage: s.stage, note: s.note },
            ],
          }));
          currentStep++;
        } else {
          clearInterval(stepInterval);
          addEvent('TEST_MESSAGE_PREPARED', 'Mock Notification Prepared', 'In-browser simulation completed. Message drafted but not sent.', 'success');
          addEvent('SIMULATION_MESSAGE_NOT_SENT', 'Safety Guardrail Enforced', 'Emergency transmission strictly blocked in simulation.', 'info');
        }
      }, 700);
    }
  }, [telemetry, customChatTarget, addEvent]);

  // Operator cancels alert
  const cancelAlert = useCallback((reason?: string) => {
    if (!alertState || !alertState.active) return;

    setAlertState((prev) => (prev ? { ...prev, decision: 'CANCELLED', cancellationReason: reason } : null));

    addEvent(
      'ALERT_CANCELLED_BY_OPERATOR',
      'Alert Cancelled by Operator',
      `Simulation alert dismissed by human operator. Reason: ${reason || 'Operator intervention / normal drill'}. Action sequence halted.`,
      'info',
      { incidentId: alertState.incidentId, reason }
    );

    // Close alert modal after 1.5s
    setTimeout(() => {
      setAlertState(null);
    }, 1500);
  }, [alertState, addEvent]);

  // Operator dismisses alert modal directly
  const dismissAlert = useCallback(() => {
    setAlertState(null);
  }, []);

  // Apply scenario preset
  const applyPreset = useCallback((preset: ScenarioPreset) => {
    setActivePreset(preset);
    setTelemetry((prev) => {
      const updated = applyScenarioPreset(preset, prev);
      return updated;
    });

    addEvent(
      'TELEMETRY_UPDATED',
      `Scenario Preset Applied: ${preset.toUpperCase().replace('_', ' ')}`,
      `Telemetry updated to simulated scenario preset.`,
      'info',
      { preset }
    );
  }, [addEvent]);

  // Apply water level from graph modal
  const applyWaterLevelProfile = useCallback((newLevel: number, newRate: number) => {
    setTelemetry((prev) => {
      const { score, components } = calculateThreatScore(
        newLevel,
        prev.warningThreshold,
        prev.dangerThreshold,
        newRate,
        prev.threatScoreComponents.alpha,
        prev.threatScoreComponents.beta,
        prev.threatScoreComponents.gamma
      );
      const { status, reasons } = evaluateThreatStatus(
        newLevel,
        prev.warningThreshold,
        prev.dangerThreshold,
        newRate,
        prev.rainfallRate,
        prev.acousticAnomaly,
        score
      );
      const { timeToDanger, label } = calculateTimeToDanger(newLevel, prev.dangerThreshold, newRate);
      const population = Math.round(Math.max(1000, Math.min(48000, 2000 + Math.pow(newLevel / 1.5, 3) * 600)));

      return {
        ...prev,
        waterLevel: Math.round(newLevel * 100) / 100,
        rateOfChange: Math.round(newRate * 100) / 100,
        floodThreatScore: score,
        threatScoreComponents: components,
        threatStatus: status,
        threatReasons: reasons,
        timeToDanger,
        timeToDangerLabel: label,
        populationAffected: population,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    });

    addEvent(
      'WATER_LEVEL_PROFILE_SET',
      'Water Level Curve Applied',
      `Operator committed new simulated profile: Water Level = ${newLevel.toFixed(2)}m, Calculated Rise Rate = ${newRate >= 0 ? '+' : ''}${newRate.toFixed(2)} m/h.`,
      'info',
      { newLevel, newRate }
    );
  }, [addEvent]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setAlertState(null);
    setNotificationWorkflow({
      stage: 'IDLE',
      active: false,
      targetChat: customChatTarget,
      testMessage: '',
      isLocalAgentUsed: false,
      progressLog: [],
    });
    setTelemetry(getInitialTelemetry());
    setActivePreset('stable');
    lastAlertStatusRef.current = 'NORMAL';

    addEvent(
      'SIMULATION_RESET',
      'Simulation Environment Reset',
      'All active alerts, countdown timers, and telemetry reset to initial nominal state.',
      'info'
    );
  }, [customChatTarget, addEvent]);

  // Update thresholds & weights
  const updateThresholds = useCallback((
    warning: number,
    danger: number,
    alpha: number,
    beta: number,
    gamma: number
  ) => {
    setTelemetry((prev) => {
      const { score, components } = calculateThreatScore(
        prev.waterLevel,
        warning,
        danger,
        prev.rateOfChange,
        alpha,
        beta,
        gamma
      );
      const { status, reasons } = evaluateThreatStatus(
        prev.waterLevel,
        warning,
        danger,
        prev.rateOfChange,
        prev.rainfallRate,
        prev.acousticAnomaly,
        score
      );
      const { timeToDanger, label } = calculateTimeToDanger(prev.waterLevel, danger, prev.rateOfChange);

      return {
        ...prev,
        warningThreshold: warning,
        dangerThreshold: danger,
        floodThreatScore: score,
        threatScoreComponents: components,
        threatStatus: status,
        threatReasons: reasons,
        timeToDanger,
        timeToDangerLabel: label,
      };
    });

    addEvent(
      'TELEMETRY_UPDATED',
      'Simulation Configuration Updated',
      `Thresholds: Warning=${warning}m, Danger=${danger}m. Threat weights: α=${alpha}, β=${beta}, γ=${gamma}.`,
      'info'
    );
  }, [addEvent]);

  const dismissExtensionModal = useCallback(() => {
    setShowExtensionModal(false);
    localStorage.setItem('disaster_mgmt_ext_dismissed', 'true');
  }, []);

  const checkExtensionAgain = useCallback(async () => {
    await checkExtensionSilently();
  }, [checkExtensionSilently]);

  return (
    <SimulationContext.Provider
      value={{
        telemetry,
        telemetryHistory,
        isRunning,
        activePreset,
        alertState,
        notificationWorkflow,
        eventLog,
        extensionStatus,
        showExtensionModal,
        showGraphModal,
        showThreatScoreModal,
        showSettingsModal,
        showLogModal,
        customChatTarget,
        setCustomChatTarget,
        setIsRunning,
        setShowExtensionModal,
        setShowGraphModal,
        setShowThreatScoreModal,
        setShowSettingsModal,
        setShowLogModal,
        applyPreset,
        applyWaterLevelProfile,
        cancelAlert,
        dismissAlert,
        resetSimulation,
        updateThresholds,
        checkExtensionAgain,
        dismissExtensionModal,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
