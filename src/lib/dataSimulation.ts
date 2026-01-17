// Simulated smart city data types and generators
export interface UrbanMetrics {
  trafficCongestion: number; // 0-100
  airQualityIndex: number; // 0-500
  energyUsage: number; // MW
  noiseLevel: number; // dB
  publicTransportUsage: number; // percentage
}

export interface HealthMetrics {
  diseaseIncidence: number; // cases per 100k
  hospitalCapacity: number; // percentage occupied
  emergencyLoad: number; // percentage
  vaccinationRate: number; // percentage
  avgResponseTime: number; // minutes
}

export interface AgricultureMetrics {
  cropYieldIndex: number; // 0-100
  foodSupplyLevel: number; // percentage of demand met
  priceIndex: number; // baseline = 100
  waterUsage: number; // million liters
  soilHealth: number; // 0-100
}

export interface CityHealthIndex {
  overall: number;
  urban: number;
  health: number;
  agriculture: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TimeSeriesData {
  timestamp: Date;
  urban: UrbanMetrics;
  health: HealthMetrics;
  agriculture: AgricultureMetrics;
}

export interface ScenarioParams {
  rainfall: number; // -50 to +100 (percentage change)
  temperature: number; // -10 to +15 (degrees change)
  populationDensity: number; // -20 to +50 (percentage change)
  foodSupplyShock: number; // -50 to 0 (percentage change)
  energyDemand: number; // -30 to +50 (percentage change)
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  label: string;
}

// Generate random value within range with optional trend
const randomValue = (min: number, max: number, trend: number = 0): number => {
  const base = Math.random() * (max - min) + min;
  return Math.max(min, Math.min(max, base + trend));
};

// Generate urban metrics
export const generateUrbanMetrics = (scenario?: ScenarioParams): UrbanMetrics => {
  const baseTraffic = randomValue(30, 80);
  const baseAQI = randomValue(50, 150);
  const baseEnergy = randomValue(800, 1500);
  
  const trafficMod = scenario ? (scenario.populationDensity * 0.5 + scenario.rainfall * -0.1) : 0;
  const aqiMod = scenario ? (scenario.temperature * 3 + scenario.energyDemand * 0.8) : 0;
  const energyMod = scenario ? (scenario.temperature * 20 + scenario.populationDensity * 10) : 0;
  
  return {
    trafficCongestion: Math.max(0, Math.min(100, baseTraffic + trafficMod)),
    airQualityIndex: Math.max(0, Math.min(500, baseAQI + aqiMod)),
    energyUsage: Math.max(500, baseEnergy + energyMod),
    noiseLevel: randomValue(45, 85),
    publicTransportUsage: randomValue(20, 60),
  };
};

// Generate health metrics
export const generateHealthMetrics = (scenario?: ScenarioParams): HealthMetrics => {
  const baseHospitalCapacity = randomValue(60, 85);
  const baseEmergency = randomValue(40, 70);
  const baseDiseaseIncidence = randomValue(50, 200);
  
  const hospitalMod = scenario ? (scenario.temperature * 1.5 + scenario.populationDensity * 0.5) : 0;
  const emergencyMod = scenario ? (scenario.rainfall * 0.3 + scenario.temperature * 0.8) : 0;
  const diseaseMod = scenario ? (scenario.temperature * 5 + scenario.populationDensity * 2) : 0;
  
  return {
    diseaseIncidence: Math.max(10, baseDiseaseIncidence + diseaseMod),
    hospitalCapacity: Math.max(30, Math.min(100, baseHospitalCapacity + hospitalMod)),
    emergencyLoad: Math.max(20, Math.min(100, baseEmergency + emergencyMod)),
    vaccinationRate: randomValue(65, 92),
    avgResponseTime: randomValue(5, 15),
  };
};

// Generate agriculture metrics
export const generateAgricultureMetrics = (scenario?: ScenarioParams): AgricultureMetrics => {
  const baseYield = randomValue(60, 90);
  const baseSupply = randomValue(85, 98);
  const basePrice = randomValue(95, 115);
  
  const yieldMod = scenario ? (
    scenario.rainfall * 0.3 - 
    Math.abs(scenario.temperature - 2) * 2 + 
    scenario.foodSupplyShock * 0.5
  ) : 0;
  const supplyMod = scenario ? (scenario.foodSupplyShock + scenario.temperature * -0.5) : 0;
  const priceMod = scenario ? (-scenario.foodSupplyShock * 0.8 + scenario.temperature * 1.2) : 0;
  
  return {
    cropYieldIndex: Math.max(20, Math.min(100, baseYield + yieldMod)),
    foodSupplyLevel: Math.max(50, Math.min(100, baseSupply + supplyMod)),
    priceIndex: Math.max(80, Math.min(200, basePrice + priceMod)),
    waterUsage: randomValue(100, 300),
    soilHealth: randomValue(55, 90),
  };
};

// Calculate City Health Index
export const calculateCityHealthIndex = (
  urban: UrbanMetrics,
  health: HealthMetrics,
  agriculture: AgricultureMetrics
): CityHealthIndex => {
  // Urban score (inverse of negative metrics)
  const urbanScore = (
    (100 - urban.trafficCongestion) * 0.3 +
    (100 - Math.min(100, urban.airQualityIndex / 3)) * 0.4 +
    urban.publicTransportUsage * 0.3
  );
  
  // Health score
  const healthScore = (
    (100 - health.hospitalCapacity) * 0.3 +
    (100 - health.emergencyLoad) * 0.3 +
    health.vaccinationRate * 0.2 +
    (100 - Math.min(100, health.diseaseIncidence / 3)) * 0.2
  );
  
  // Agriculture score
  const agricultureScore = (
    agriculture.cropYieldIndex * 0.35 +
    agriculture.foodSupplyLevel * 0.35 +
    (200 - agriculture.priceIndex) * 0.3
  );
  
  const overall = (urbanScore * 0.35 + healthScore * 0.35 + agricultureScore * 0.3);
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overall >= 70) riskLevel = 'low';
  else if (overall >= 55) riskLevel = 'medium';
  else if (overall >= 40) riskLevel = 'high';
  else riskLevel = 'critical';
  
  return {
    overall: Math.round(overall),
    urban: Math.round(urbanScore),
    health: Math.round(healthScore),
    agriculture: Math.round(agricultureScore),
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
    riskLevel,
  };
};

// Generate time series data for charts
export const generateTimeSeriesData = (points: number = 24): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp,
      urban: generateUrbanMetrics(),
      health: generateHealthMetrics(),
      agriculture: generateAgricultureMetrics(),
    });
  }
  
  return data;
};

// Generate heatmap data for risk visualization
export const generateHeatmapData = (rows: number = 8, cols: number = 12): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];
  const districts = ['North', 'South', 'East', 'West', 'Central', 'Industrial', 'Residential', 'Commercial'];
  const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x,
        y,
        value: randomValue(0, 100),
        label: `${districts[y % districts.length]} - ${hours[x % hours.length]}`,
      });
    }
  }
  
  return cells;
};

// Default scenario parameters
export const defaultScenario: ScenarioParams = {
  rainfall: 0,
  temperature: 0,
  populationDensity: 0,
  foodSupplyShock: 0,
  energyDemand: 0,
};
