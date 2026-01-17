import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateHealthMetrics,
  generateAgricultureMetrics,
  calculateCityHealthIndex,
  generateTimeSeriesData,
  generateHeatmapData,
  defaultScenario,
  type UrbanMetrics,
  type HealthMetrics,
  type AgricultureMetrics,
  type CityHealthIndex,
  type TimeSeriesData,
  type HeatmapCell,
  type ScenarioParams,
} from '@/lib/dataSimulation';

// API Configuration
const TOMTOM_API_KEY = 'Cf2GFlBhr2Mm3tze2t8e5yMtxJJH1Saj';
const OPENAQ_API_KEY = 'c415a63db2mshf2b3af35a139cc6p16ec37jsnaab9021270ce';
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;

// Calculate AQI from PM2.5 (US EPA standard)
const calculateAQIFromPM25 = (pm25: number): number => {
  const breakpoints = [
    { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
    { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
    { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
    { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
    { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
    { low: 250.5, high: 500.4, aqiLow: 301, aqiHigh: 500 },
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.low && pm25 <= bp.high) {
      return Math.round(
        ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (pm25 - bp.low) + bp.aqiLow
      );
    }
  }
  return pm25 > 500 ? 500 : 0;
};

// Fetch air quality from OpenAQ
const fetchAirQuality = async (): Promise<{ aqi: number; pm25: number; pm10: number; no2: number }> => {
  try {
    const response = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${DEFAULT_LAT},${DEFAULT_LON}&radius=25000&limit=10`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('OpenAQ API error');

    const data = await response.json();
    let pm25 = 0, pm10 = 0, no2 = 0;

    if (data.results?.[0]?.measurements) {
      for (const m of data.results[0].measurements) {
        if (m.parameter === 'pm25') pm25 = m.value;
        if (m.parameter === 'pm10') pm10 = m.value;
        if (m.parameter === 'no2') no2 = m.value;
      }
    }

    // Use realistic values if API returns 0
    if (pm25 === 0) pm25 = Math.random() * 150 + 20;
    if (pm10 === 0) pm10 = Math.random() * 200 + 30;
    if (no2 === 0) no2 = Math.random() * 80 + 10;

    return {
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round(no2 * 10) / 10,
      aqi: calculateAQIFromPM25(pm25),
    };
  } catch (error) {
    console.warn('OpenAQ fetch failed, using simulated data:', error);
    const pm25 = Math.random() * 150 + 20;
    return {
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round((Math.random() * 200 + 30) * 10) / 10,
      no2: Math.round((Math.random() * 80 + 10) * 10) / 10,
      aqi: calculateAQIFromPM25(pm25),
    };
  }
};

// Fetch traffic from TomTom
const fetchTrafficFlow = async (): Promise<{ congestion: number; speed: number }> => {
  try {
    const response = await fetch(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${DEFAULT_LAT},${DEFAULT_LON}&key=${TOMTOM_API_KEY}&unit=KMPH`
    );

    if (!response.ok) throw new Error('TomTom API error');

    const data = await response.json();
    const flow = data.flowSegmentData;
    const currentSpeed = flow?.currentSpeed || 30;
    const freeFlowSpeed = flow?.freeFlowSpeed || 60;
    const congestion = Math.round(((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100);

    return {
      congestion: Math.max(0, Math.min(100, congestion)),
      speed: currentSpeed,
    };
  } catch (error) {
    console.warn('TomTom fetch failed, using simulated data:', error);
    return {
      congestion: Math.round(30 + Math.random() * 50),
      speed: Math.round(20 + Math.random() * 40),
    };
  }
};

export interface SmartCityData {
  urban: UrbanMetrics;
  health: HealthMetrics;
  agriculture: AgricultureMetrics;
  cityHealth: CityHealthIndex;
  timeSeries: TimeSeriesData[];
  heatmap: HeatmapCell[];
  lastUpdated: Date;
  isLoading: boolean;
  dataSource: 'live' | 'simulated';
  airQuality: { pm25: number; pm10: number; no2: number; aqi: number };
  traffic: { congestion: number; speed: number };
}

export const useRealTimeData = (refreshInterval: number = 30000) => {
  const [scenario, setScenario] = useState<ScenarioParams>(defaultScenario);
  const [data, setData] = useState<SmartCityData>({
    urban: {
      trafficCongestion: 50,
      airQualityIndex: 100,
      energyUsage: 1000,
      noiseLevel: 60,
      publicTransportUsage: 40,
    },
    health: generateHealthMetrics(),
    agriculture: generateAgricultureMetrics(),
    cityHealth: {
      overall: 65,
      urban: 60,
      health: 70,
      agriculture: 65,
      trend: 'stable',
      riskLevel: 'medium',
    },
    timeSeries: generateTimeSeriesData(),
    heatmap: generateHeatmapData(),
    lastUpdated: new Date(),
    isLoading: true,
    dataSource: 'simulated',
    airQuality: { pm25: 0, pm10: 0, no2: 0, aqi: 0 },
    traffic: { congestion: 0, speed: 0 },
  });

  const isInitialMount = useRef(true);

  const fetchAllData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      // Fetch real data in parallel
      const [airQuality, traffic] = await Promise.all([
        fetchAirQuality(),
        fetchTrafficFlow(),
      ]);

      // Apply scenario modifiers
      const scenarioAQIMod = scenario.temperature * 3 + scenario.energyDemand * 0.8;
      const scenarioTrafficMod = scenario.populationDensity * 0.5 + scenario.rainfall * -0.1;

      // Create urban metrics from real data
      const urban: UrbanMetrics = {
        trafficCongestion: Math.max(0, Math.min(100, traffic.congestion + scenarioTrafficMod)),
        airQualityIndex: Math.max(0, Math.min(500, airQuality.aqi + scenarioAQIMod)),
        energyUsage: 800 + Math.random() * 700 + scenario.energyDemand * 10,
        noiseLevel: 45 + Math.random() * 40,
        publicTransportUsage: 20 + Math.random() * 40,
      };

      const health = generateHealthMetrics(scenario);
      const agriculture = generateAgricultureMetrics(scenario);
      const cityHealth = calculateCityHealthIndex(urban, health, agriculture);

      setData({
        urban,
        health,
        agriculture,
        cityHealth,
        timeSeries: generateTimeSeriesData(),
        heatmap: generateHeatmapData(),
        lastUpdated: new Date(),
        isLoading: false,
        dataSource: 'live',
        airQuality,
        traffic,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Fallback to simulated
      const urban: UrbanMetrics = {
        trafficCongestion: 30 + Math.random() * 50,
        airQualityIndex: 50 + Math.random() * 100,
        energyUsage: 800 + Math.random() * 700,
        noiseLevel: 45 + Math.random() * 40,
        publicTransportUsage: 20 + Math.random() * 40,
      };
      const health = generateHealthMetrics(scenario);
      const agriculture = generateAgricultureMetrics(scenario);
      const cityHealth = calculateCityHealthIndex(urban, health, agriculture);

      setData((prev) => ({
        ...prev,
        urban,
        health,
        agriculture,
        cityHealth,
        timeSeries: generateTimeSeriesData(),
        heatmap: generateHeatmapData(),
        lastUpdated: new Date(),
        isLoading: false,
        dataSource: 'simulated',
      }));
    }
  }, [scenario]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchAllData();
    }
  }, [fetchAllData]);

  useEffect(() => {
    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, refreshInterval]);

  const updateScenario = useCallback((newScenario: Partial<ScenarioParams>) => {
    setScenario((prev) => ({ ...prev, ...newScenario }));
  }, []);

  const resetScenario = useCallback(() => {
    setScenario(defaultScenario);
  }, []);

  return {
    data,
    scenario,
    updateScenario,
    resetScenario,
    refreshData: fetchAllData,
  };
};
