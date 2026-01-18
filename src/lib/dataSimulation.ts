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

// Generate deterministic value based on hourly index AND location seed
const deterministicValue = (min: number, max: number, lat: number = 0, lon: number = 0, seedSuffix: number = 0): number => {
  const now = new Date();
  const currentHour = now.getHours();
  // Minute-level variation for "life"
  const currentMinute = now.getMinutes();

  // Create a high-precision stable seed from location (approx 1 meter precision)
  const locSeed = Math.abs(Math.floor(lat * 100000) + Math.floor(lon * 100000));
  const index = (currentHour + seedSuffix + (locSeed % 48)) % 48;

  // Hash the location for a unique offset
  const locOffset = (locSeed % 1000) / 1000;

  // Main time-of-day wave
  const wave = (Math.sin(index * Math.PI / 12) + 1) / 2;

  // Subtle "micro-noise" wave for minute-level movement (0.95 to 1.05 multiplier)
  const microNoise = 1.0 + (Math.sin(currentMinute * 0.5 + locSeed) * 0.05);

  // Blend waves with location offset
  const finalFactor = (wave * 0.7 + locOffset * 0.3) * microNoise;

  return Math.max(min, Math.min(max, min + (max - min) * finalFactor));
};

// Generate urban metrics
export const generateUrbanMetrics = (lat: number = 0, lon: number = 0, scenario?: ScenarioParams): UrbanMetrics => {
  const baseTraffic = deterministicValue(30, 80, lat, lon, 1);
  const baseAQI = deterministicValue(50, 150, lat, lon, 2);
  const baseEnergy = deterministicValue(800, 1500, lat, lon, 3);

  const trafficMod = scenario ? (scenario.populationDensity * 0.5 + scenario.rainfall * -0.1) : 0;
  const aqiMod = scenario ? (scenario.temperature * 3 + scenario.energyDemand * 0.8) : 0;
  const energyMod = scenario ? (scenario.temperature * 20 + scenario.populationDensity * 10) : 0;

  return {
    trafficCongestion: Math.max(0, Math.min(100, baseTraffic + trafficMod)),
    airQualityIndex: Math.max(0, Math.min(500, baseAQI + aqiMod)),
    energyUsage: Math.max(500, baseEnergy + energyMod),
    noiseLevel: deterministicValue(45, 85, lat, lon, 4),
    publicTransportUsage: deterministicValue(20, 60, lat, lon, 5),
  };
};

// Generate health metrics
export const generateHealthMetrics = (lat: number = 0, lon: number = 0, scenario?: ScenarioParams): HealthMetrics => {
  const baseHospitalCapacity = deterministicValue(60, 85, lat, lon, 6);
  const baseEmergency = deterministicValue(40, 70, lat, lon, 7);
  const baseDiseaseIncidence = deterministicValue(50, 200, lat, lon, 8);

  const hospitalMod = scenario ? (scenario.temperature * 1.5 + scenario.populationDensity * 0.5) : 0;
  const emergencyMod = scenario ? (scenario.rainfall * 0.3 + scenario.temperature * 0.8) : 0;
  const diseaseMod = scenario ? (scenario.temperature * 5 + scenario.populationDensity * 2) : 0;

  return {
    diseaseIncidence: Math.max(10, baseDiseaseIncidence + diseaseMod),
    hospitalCapacity: Math.max(30, Math.min(100, baseHospitalCapacity + hospitalMod)),
    emergencyLoad: Math.max(20, Math.min(100, baseEmergency + emergencyMod)),
    vaccinationRate: deterministicValue(65, 92, lat, lon, 9),
    avgResponseTime: deterministicValue(5, 15, lat, lon, 10),
  };
};

// Generate agriculture metrics
export const generateAgricultureMetrics = (lat: number = 0, lon: number = 0, scenario?: ScenarioParams): AgricultureMetrics => {
  const baseYield = deterministicValue(60, 90, lat, lon, 11);
  const baseSupply = deterministicValue(85, 98, lat, lon, 12);
  const basePrice = deterministicValue(95, 115, lat, lon, 13);

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
    waterUsage: deterministicValue(100, 300, lat, lon, 14),
    soilHealth: deterministicValue(55, 90, lat, lon, 15),
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
    trend: agriculture.cropYieldIndex > 70 ? 'up' : 'stable',
    riskLevel,
  };
};

// Generate time series data for charts
export const generateTimeSeriesData = (lat: number = 0, lon: number = 0, points: number = 24): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp,
      urban: generateUrbanMetrics(lat, lon),
      health: generateHealthMetrics(lat, lon),
      agriculture: generateAgricultureMetrics(lat, lon),
    });
  }

  return data;
};

// Generate heatmap data for risk visualization
export const generateHeatmapData = (lat: number = 0, lon: number = 0, rows: number = 8, cols: number = 12): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];
  const districts = ['North', 'South', 'East', 'West', 'Central', 'Industrial', 'Residential', 'Commercial'];
  const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x,
        y,
        value: deterministicValue(0, 100, lat, lon, y * cols + x),
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
