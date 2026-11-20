import { TelemetryData, ThreatStatus, SensorHealth, ScenarioPreset } from '../types';

export const DEFAULT_THRESHOLDS = {
  warningThreshold: 4.5, // meters
  dangerThreshold: 6.0,  // meters
  alpha: 0.50, // level weight
  beta: 0.35,  // rise weight
  gamma: 0.15, // population exposure weight
};

export function calculateThreatScore(
  waterLevel: number,
  warningThreshold: number,
  dangerThreshold: number,
  rateOfChange: number,
  alpha = DEFAULT_THRESHOLDS.alpha,
  beta = DEFAULT_THRESHOLDS.beta,
  gamma = DEFAULT_THRESHOLDS.gamma
) {
  const levelRatio = waterLevel / dangerThreshold;
  const levelRisk = Math.max(0, Math.min(1.5, levelRatio));
  const riseRisk = Math.max(0, Math.min(1.5, (rateOfChange > 0 ? rateOfChange : 0) / 1.2));
  const popRatio = Math.max(0, (waterLevel - warningThreshold * 0.7) / (dangerThreshold - warningThreshold * 0.7));
  const populationRisk = Math.max(0, Math.min(1.0, popRatio * 0.9));

  const rawScore = (alpha * (levelRisk / 1.5) + beta * (riseRisk / 1.5) + gamma * populationRisk) * 100;
  const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  return {
    score: normalizedScore,
    components: {
      levelRisk: Math.round(levelRisk * 100) / 100,
      riseRisk: Math.round(riseRisk * 100) / 100,
      populationRisk: Math.round(populationRisk * 100) / 100,
      alpha,
      beta,
      gamma,
    },
  };
}

export function evaluateThreatStatus(
  waterLevel: number,
  warningThreshold: number,
  dangerThreshold: number,
  rateOfChange: number,
  rainfallRate: number,
  acousticAnomaly: number,
  score: number
): { status: ThreatStatus; reasons: string[] } {
  const reasons: string[] = [];

  // Critical conditions
  if (waterLevel >= dangerThreshold) {
    reasons.push(`Water level (${waterLevel.toFixed(2)}m) exceeds Danger Threshold (${dangerThreshold.toFixed(2)}m)`);
  }
  if (score >= 80) {
    reasons.push(`Flood Threat Score (${score.toFixed(1)}) reached critical threshold (≥ 80.0)`);
  }
  if (waterLevel >= warningThreshold && rateOfChange >= 1.2) {
    reasons.push(`Water level above warning threshold with severe surge rate (+${rateOfChange.toFixed(2)} m/h)`);
  }

  if (reasons.length > 0) {
    return { status: 'CRITICAL', reasons };
  }

  // Warning conditions
  if (waterLevel >= warningThreshold) {
    reasons.push(`Water level (${waterLevel.toFixed(2)}m) reached Warning Threshold (${warningThreshold.toFixed(2)}m)`);
  }
  if (score >= 60) {
    reasons.push(`Flood Threat Score (${score.toFixed(1)}) crossed warning threshold (≥ 60.0)`);
  }
  if (rateOfChange >= 0.8) {
    reasons.push(`High rate of water level rise (+${rateOfChange.toFixed(2)} m/h)`);
  }

  if (reasons.length > 0) {
    return { status: 'WARNING', reasons };
  }

  // Watch conditions
  if (waterLevel >= warningThreshold * 0.82) {
    reasons.push(`Water level approaching warning zone (${waterLevel.toFixed(2)}m / ${warningThreshold.toFixed(2)}m)`);
  }
  if (rainfallRate >= 22) {
    reasons.push(`Heavy local catchment rainfall detected (${rainfallRate.toFixed(1)} mm/h)`);
  }
  if (acousticAnomaly >= 0.65) {
    reasons.push(`Acoustic hydrophone anomaly detected (${(acousticAnomaly * 100).toFixed(0)}% deviation)`);
  }
  if (score >= 35) {
    reasons.push(`Elevated compound risk score (${score.toFixed(1)})`);
  }

  if (reasons.length > 0) {
    return { status: 'WATCH', reasons };
  }

  return {
    status: 'NORMAL',
    reasons: ['All hydrological parameters within nominal safety operating boundaries.'],
  };
}

export function calculateTimeToDanger(
  waterLevel: number,
  dangerThreshold: number,
  rateOfChange: number
): { timeToDanger: number | null; label: string } {
  if (waterLevel >= dangerThreshold) {
    return { timeToDanger: 0, label: 'Already at Danger Level' };
  }
  if (rateOfChange <= 0.04) {
    if (rateOfChange < -0.1) {
      return { timeToDanger: null, label: 'N/A (Receding)' };
    }
    return { timeToDanger: null, label: 'N/A (Stable / No surge)' };
  }

  const minutes = ((dangerThreshold - waterLevel) / rateOfChange) * 60;
  const clamped = Math.max(1, Math.round(minutes * 10) / 10);
  return {
    timeToDanger: clamped,
    label: `${clamped} min`,
  };
}

export function getInitialTelemetry(): TelemetryData {
  const waterLevel = 2.45;
  const warningThreshold = 4.5;
  const dangerThreshold = 6.0;
  const rateOfChange = 0.05;
  const rainfallRate = 4.2;
  const accumulatedRainfall = 18.5;
  const turbidity = 12.4;
  const acousticAnomaly = 0.08;

  const { score, components } = calculateThreatScore(
    waterLevel,
    warningThreshold,
    dangerThreshold,
    rateOfChange
  );
  const { status, reasons } = evaluateThreatStatus(
    waterLevel,
    warningThreshold,
    dangerThreshold,
    rateOfChange,
    rainfallRate,
    acousticAnomaly,
    score
  );
  const { timeToDanger, label } = calculateTimeToDanger(waterLevel, dangerThreshold, rateOfChange);

  return {
    waterLevel,
    warningThreshold,
    dangerThreshold,
    rateOfChange,
    rainfallRate,
    accumulatedRainfall,
    turbidity,
    acousticAnomaly,
    floodThreatScore: score,
    threatScoreComponents: components,
    threatStatus: status,
    threatReasons: reasons,
    timeToDanger,
    timeToDangerLabel: label,
    populationAffected: 4200,
    sensorHealth: 'HEALTHY',
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

export function applyScenarioPreset(preset: ScenarioPreset, prev: TelemetryData): TelemetryData {
  let waterLevel = prev.waterLevel;
  let rateOfChange = 0.02;
  let rainfallRate = 5.0;
  let turbidity = 15;
  let acousticAnomaly = 0.05;
  let sensorHealth: SensorHealth = 'HEALTHY';

  switch (preset) {
    case 'stable':
      waterLevel = 2.4;
      rateOfChange = 0.01;
      rainfallRate = 2.0;
      turbidity = 8.5;
      acousticAnomaly = 0.04;
      sensorHealth = 'HEALTHY';
      break;
    case 'gradual_rise':
      waterLevel = 4.65;
      rateOfChange = 0.85;
      rainfallRate = 28.0;
      turbidity = 34.0;
      acousticAnomaly = 0.42;
      sensorHealth = 'HEALTHY';
      break;
    case 'rapid_surge':
      waterLevel = 6.25;
      rateOfChange = 1.95;
      rainfallRate = 75.0;
      turbidity = 92.0;
      acousticAnomaly = 0.88;
      sensorHealth = 'HEALTHY';
      break;
    case 'sudden_drop':
      waterLevel = 1.6;
      rateOfChange = -1.8;
      rainfallRate = 12.0;
      turbidity = 48.0;
      acousticAnomaly = 0.72;
      sensorHealth = 'NOISY';
      break;
    case 'sensor_noise':
      waterLevel = prev.waterLevel + (Math.random() * 0.6 - 0.3);
      rateOfChange = 0.35;
      rainfallRate = 18.0;
      turbidity = 75.0;
      acousticAnomaly = 0.65;
      sensorHealth = 'DEGRADED';
      break;
  }

  const { score, components } = calculateThreatScore(
    waterLevel,
    prev.warningThreshold,
    prev.dangerThreshold,
    rateOfChange
  );
  const { status, reasons } = evaluateThreatStatus(
    waterLevel,
    prev.warningThreshold,
    prev.dangerThreshold,
    rateOfChange,
    rainfallRate,
    acousticAnomaly,
    score
  );
  const { timeToDanger, label } = calculateTimeToDanger(waterLevel, prev.dangerThreshold, rateOfChange);
  const population = Math.round(Math.max(1000, Math.min(48000, 2000 + Math.pow(waterLevel / 1.5, 3) * 600)));

  return {
    ...prev,
    waterLevel: Math.round(waterLevel * 100) / 100,
    rateOfChange: Math.round(rateOfChange * 100) / 100,
    rainfallRate: Math.round(rainfallRate * 10) / 10,
    turbidity: Math.round(turbidity * 10) / 10,
    acousticAnomaly: Math.round(acousticAnomaly * 100) / 100,
    floodThreatScore: score,
    threatScoreComponents: components,
    threatStatus: status,
    threatReasons: reasons,
    timeToDanger,
    timeToDangerLabel: label,
    populationAffected: population,
    sensorHealth,
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
