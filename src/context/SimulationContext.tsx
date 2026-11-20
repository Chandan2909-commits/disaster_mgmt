import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  TelemetryData,
  SimulationEvent,
  AlertState,
  NotificationWorkflowState,
  ScenarioPreset,
  DeliveryInfo,
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
  sendLiveMessages: boolean;
  setSendLiveMessages: (enabled: boolean) => void;
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
  triggerManualDispatch: (target?: string, liveSend?: boolean) => Promise<void>;
  checkDeliveryStatus: () => Promise<DeliveryInfo | null>;
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
  const [sendLiveMessages, setSendLiveMessages] = useState<boolean>(true);

  // Extension status & modal
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    hasLocalAgent: false,
    source: 'none',
  });
  const [showExtensionModal, setShowExtensionModal] = useState<boolean>(false);

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
    sendActionEnabled: true,
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

  // Check extension silently on mount
  const checkExtensionSilently = useCallback(async () => {
    try {
      const status = await extensionBridge.detectExtension();
      setExtensionStatus(status);

      if (!status.isInstalled) {
        const dismissed = localStorage.getItem('disaster_mgmt_ext_dismissed');
        if (!dismissed) {
          setShowExtensionModal(true);
        }
      } else {
        setShowExtensionModal(false);
      }
    } catch {
      setShowExtensionModal(true);
    }
  }, []);

  useEffect(() => {
    checkExtensionSilently();
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
      return updated.slice(-25);
    });
  }, [telemetry.lastUpdated, telemetry.waterLevel, telemetry.rateOfChange, telemetry.floodThreatScore]);

  // Threshold crossing evaluation -> Trigger 30s Alert
  useEffect(() => {
    const currentStatus = telemetry.threatStatus;
    const isDangerous = currentStatus === 'WARNING' || currentStatus === 'CRITICAL';

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

  // Trigger dispatch (shared between 30s timeout and manual send button)
  const executeDispatch = useCallback(async (target: string, shouldSend: boolean, customText?: string) => {
    const testMsg = customText || `[SIMULATION ALERT] Flood monitoring demo: simulated river level is ${telemetry.waterLevel.toFixed(
      2
    )} m; threat status is ${telemetry.threatStatus}; threat score is ${telemetry.floodThreatScore.toFixed(
      1
    )}; trend is ${telemetry.rateOfChange >= 0 ? '+' : ''}${telemetry.rateOfChange.toFixed(
      2
    )} m/h. Target: ${target}.`;

    setNotificationWorkflow({
      stage: 'QUEUED',
      active: true,
      targetChat: target,
      testMessage: testMsg,
      isLocalAgentUsed: false,
      sendActionEnabled: shouldSend,
      progressLog: [
        { time: new Date().toLocaleTimeString(), stage: 'QUEUED', note: `Dispatch queued for '${target}' (SendAction=${shouldSend})` },
      ],
    });

    const agentHealth = await localAgentService.checkHealth();

    if (agentHealth && agentHealth.status === 'online') {
      setNotificationWorkflow((prev) => ({
        ...prev,
        stage: 'LOCAL_AGENT_CONNECTED',
        isLocalAgentUsed: true,
        progressLog: [
          ...prev.progressLog,
          { time: new Date().toLocaleTimeString(), stage: 'LOCAL_AGENT_CONNECTED', note: 'Connected to local companion on 127.0.0.1:8765' },
        ],
      }));

      // Opening browser
      setNotificationWorkflow((prev) => ({
        ...prev,
        stage: 'BROWSER_OPENED',
        progressLog: [
          ...prev.progressLog,
          { time: new Date().toLocaleTimeString(), stage: 'BROWSER_OPENED', note: `Navigating to WhatsApp Web (Target: ${target})...` },
        ],
      }));

      const res = await localAgentService.prepareTestMessage({
        level: telemetry.waterLevel,
        status: telemetry.threatStatus,
        score: telemetry.floodThreatScore,
        trend: `${telemetry.rateOfChange >= 0 ? '+' : ''}${telemetry.rateOfChange.toFixed(2)} m/h`,
        chat_target: target,
        send_action: shouldSend,
        message: testMsg,
      });

      if (res.success) {
        if (res.is_sent) {
          setNotificationWorkflow((prev) => ({
            ...prev,
            stage: 'MESSAGE_SENT_SUCCESS',
            deliveryInfo: {
              isSent: true,
              status: 'SENT',
              label: 'Message Transmitted to WhatsApp Server',
              lastTarget: target,
              checkedAt: new Date().toLocaleTimeString(),
              preview: testMsg,
            },
            progressLog: [
              ...prev.progressLog,
              { time: new Date().toLocaleTimeString(), stage: 'CHAT_LOCATED', note: `Located chat '${target}'` },
              { time: new Date().toLocaleTimeString(), stage: 'MESSAGE_SENT_SUCCESS', note: `Message transmitted via WhatsApp Web to '${target}'!` },
            ],
          }));
          addEvent('TEST_MESSAGE_PREPARED', 'WhatsApp Message Transmitted', `Message successfully sent to '${target}' via Selenium.`, 'success');
        } else {
          setNotificationWorkflow((prev) => ({
            ...prev,
            stage: 'TEST_MESSAGE_PREPARED',
            deliveryInfo: {
              isSent: false,
              status: 'DRAFT_IN_COMPOSE',
              label: 'Draft Prepared in Compose Box',
              lastTarget: target,
              checkedAt: new Date().toLocaleTimeString(),
              preview: testMsg,
            },
            progressLog: [
              ...prev.progressLog,
              { time: new Date().toLocaleTimeString(), stage: 'CHAT_LOCATED', note: `Located chat '${target}'` },
              { time: new Date().toLocaleTimeString(), stage: 'TEST_MESSAGE_PREPARED', note: 'Draft typed into WhatsApp compose box. (Send toggle was disabled)' },
            ],
          }));
        }
      } else {
        setNotificationWorkflow((prev) => ({
          ...prev,
          stage: 'FAILED_FALLBACK_MOCK',
          deliveryInfo: {
            isSent: false,
            status: 'CHECK_ERROR',
            label: res.message || 'WhatsApp Web login or navigation required',
            lastTarget: target,
            checkedAt: new Date().toLocaleTimeString(),
          },
          progressLog: [
            ...prev.progressLog,
            { time: new Date().toLocaleTimeString(), stage: 'COMPANION_NOTICE', note: res.message || 'Action pending login or contact verification.' },
          ],
        }));
      }
    } else {
      // In-browser mock workflow
      const steps = [
        { stage: 'LOCAL_AGENT_CONNECTED' as const, note: 'Mock mode active (companion offline). Simulating dispatcher...' },
        { stage: 'BROWSER_OPENED' as const, note: 'Opening simulated sandboxed browser tab...' },
        { stage: 'CHAT_LOCATED' as const, note: `Target chat [${target}] located in registry.` },
        { stage: shouldSend ? 'MESSAGE_SENT_SUCCESS' as const : 'TEST_MESSAGE_PREPARED' as const, note: shouldSend ? `[MOCK] Message delivered to ${target} (Mock Mode).` : '[MOCK] Message drafted in mock buffer.' },
      ];

      let currentStep = 0;
      const stepInterval = setInterval(() => {
        if (currentStep < steps.length) {
          const s = steps[currentStep];
          setNotificationWorkflow((prev) => ({
            ...prev,
            stage: s.stage,
            deliveryInfo: {
              isSent: shouldSend,
              status: shouldSend ? 'MOCK_SENT' : 'DRAFT_IN_COMPOSE',
              label: shouldSend ? 'Simulated Delivery (Mock Mode)' : 'Drafted in Mock Buffer',
              lastTarget: target,
              checkedAt: new Date().toLocaleTimeString(),
            },
            progressLog: [
              ...prev.progressLog,
              { time: new Date().toLocaleTimeString(), stage: s.stage, note: s.note },
            ],
          }));
          currentStep++;
        } else {
          clearInterval(stepInterval);
          addEvent('TEST_MESSAGE_PREPARED', 'Mock Notification Finished', `Dispatched to ${target} in mock simulation mode.`, 'success');
        }
      }, 600);
    }
  }, [telemetry, addEvent]);

  // Trigger on timeout
  const triggerTimeoutWorkflow = useCallback(async (alert: AlertState) => {
    addEvent(
      'HUMAN_REVIEW_TIMEOUT',
      'Operator Review Window Expired (30s Timeout)',
      'No human cancellation input received within 30s. Triggering notification pipeline.',
      'warning',
      { incidentId: alert.incidentId }
    );
    await executeDispatch(customChatTarget, sendLiveMessages);
  }, [customChatTarget, sendLiveMessages, executeDispatch, addEvent]);

  // Manual trigger button
  const triggerManualDispatch = useCallback(async (target?: string, liveSend?: boolean) => {
    const chatTarget = target || customChatTarget;
    const send = liveSend !== undefined ? liveSend : sendLiveMessages;
    await executeDispatch(chatTarget, send);
  }, [customChatTarget, sendLiveMessages, executeDispatch]);

  // Check delivery status
  const checkDeliveryStatus = useCallback(async (): Promise<DeliveryInfo | null> => {
    const res = await localAgentService.checkDeliveryStatus();
    if (!res) {
      const fallback: DeliveryInfo = {
        isSent: false,
        status: 'DISCONNECTED',
        label: 'Local Companion Agent is offline (Run python companion/agent.py)',
        checkedAt: new Date().toLocaleTimeString(),
      };
      setNotificationWorkflow((prev) => ({ ...prev, deliveryInfo: fallback }));
      return fallback;
    }

    const info: DeliveryInfo = {
      isSent: res.is_sent,
      status: res.delivery_status as any,
      label: res.status_label,
      checkedAt: res.sent_at || new Date().toLocaleTimeString(),
      lastTarget: res.last_target,
      preview: res.last_message_preview,
    };

    setNotificationWorkflow((prev) => ({
      ...prev,
      deliveryInfo: info,
      progressLog: [
        ...prev.progressLog,
        {
          time: new Date().toLocaleTimeString(),
          stage: 'STATUS_CHECKED',
          note: `Delivery verification: ${res.status_label}`,
        },
      ],
    }));

    return info;
  }, []);

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

    setTimeout(() => {
      setAlertState(null);
    }, 1500);
  }, [alertState, addEvent]);

  const dismissAlert = useCallback(() => {
    setAlertState(null);
  }, []);

  // Apply scenario preset
  const applyPreset = useCallback((preset: ScenarioPreset) => {
    setActivePreset(preset);
    setTelemetry((prev) => applyScenarioPreset(preset, prev));
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
      `Operator committed new simulated profile: Water Level = ${newLevel.toFixed(2)}m, Rate = ${newRate >= 0 ? '+' : ''}${newRate.toFixed(2)} m/h.`,
      'info',
      { newLevel, newRate }
    );
  }, [addEvent]);

  const resetSimulation = useCallback(() => {
    setAlertState(null);
    setNotificationWorkflow({
      stage: 'IDLE',
      active: false,
      targetChat: customChatTarget,
      testMessage: '',
      isLocalAgentUsed: false,
      sendActionEnabled: sendLiveMessages,
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
  }, [customChatTarget, sendLiveMessages, addEvent]);

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
        sendLiveMessages,
        setSendLiveMessages,
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
        triggerManualDispatch,
        checkDeliveryStatus,
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
