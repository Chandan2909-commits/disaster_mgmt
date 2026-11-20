export type ThreatStatus = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type SensorHealth = 'HEALTHY' | 'NOISY' | 'DEGRADED';
export type ScenarioPreset = 'stable' | 'gradual_rise' | 'rapid_surge' | 'sudden_drop' | 'sensor_noise';

export interface TelemetryData {
  waterLevel: number; // in meters (m)
  warningThreshold: number; // in meters
  dangerThreshold: number; // in meters
  rateOfChange: number; // m/hour
  rainfallRate: number; // mm/hour
  accumulatedRainfall: number; // mm
  turbidity: number; // NTU
  acousticAnomaly: number; // 0.0 - 1.0 score
  floodThreatScore: number; // 0 - 100
  threatScoreComponents: {
    levelRisk: number; // 0 - 1
    riseRisk: number; // 0 - 1
    populationRisk: number; // 0 - 1
    alpha: number; // weight for level
    beta: number; // weight for rise
    gamma: number; // weight for population
  };
  threatStatus: ThreatStatus;
  threatReasons: string[];
  timeToDanger: number | null; // minutes, null if not rising towards danger
  timeToDangerLabel: string;
  populationAffected: number; // simulated count
  sensorHealth: SensorHealth;
  lastUpdated: string; // ISO string
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  type:
    | 'SIMULATION_STARTED'
    | 'TELEMETRY_UPDATED'
    | 'WATER_LEVEL_PROFILE_SET'
    | 'THREAT_STATUS_CHANGED'
    | 'SIMULATION_ALERT_CREATED'
    | 'ALERT_CANCELLED_BY_OPERATOR'
    | 'HUMAN_REVIEW_TIMEOUT'
    | 'MOCK_NOTIFICATION_STARTED'
    | 'LOCAL_AGENT_CONNECTED'
    | 'BROWSER_OPENED'
    | 'CHAT_LOCATED'
    | 'TEST_MESSAGE_PREPARED'
    | 'SIMULATION_MESSAGE_NOT_SENT'
    | 'LOCAL_AGENT_FAILED'
    | 'SIMULATION_RESET';
  severity: 'info' | 'watch' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface AlertState {
  active: boolean;
  incidentId: string;
  detectedAt: string;
  status: ThreatStatus;
  waterLevel: number;
  threatScore: number;
  reasons: string[];
  countdownRemaining: number; // 30 seconds
  decision?: 'CANCELLED' | 'TIMED_OUT';
  cancellationReason?: string;
}

export type NotificationStage =
  | 'IDLE'
  | 'QUEUED'
  | 'LOCAL_AGENT_CONNECTED'
  | 'BROWSER_OPENED'
  | 'CHAT_LOCATED'
  | 'TEST_MESSAGE_PREPARED'
  | 'NOT_SENT_SIMULATION_COMPLETE'
  | 'FAILED_FALLBACK_MOCK';

export interface NotificationWorkflowState {
  stage: NotificationStage;
  active: boolean;
  targetChat: string;
  testMessage: string;
  isLocalAgentUsed: boolean;
  progressLog: { time: string; stage: string; note: string }[];
}

export interface GraphControlPoint {
  timeOffsetMin: number; // 0 to 60 or 120 mins
  waterLevel: number; // meters
}
