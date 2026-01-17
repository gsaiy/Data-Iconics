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

import { fetchTrafficData } from '@/services/trafficService';
import { fetchWeatherAndAQI, fetchForecast, type ForecastData } from '@/services/weatherService';

// Default Coordinates
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;

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
  weather?: {
    temp?: number;
    feelsLike?: number;
    humidity?: number;
    pressure?: number;
    windSpeed?: number;
    description?: string;
    icon?: string;
    sunrise?: number;
    sunset?: number;
    forecast?: ForecastData[];
  };
}

export const useRealTimeData = (lat: number = 28.6139, lon: number = 77.2090, refreshInterval: number = 30000) => {
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
      // Fetch real data from services
      const [weatherAQI, traffic, forecast] = await Promise.all([
        fetchWeatherAndAQI(lat, lon),
        fetchTrafficData(lat, lon),
        fetchForecast(lat, lon),
      ]);

      // Apply scenario modifiers
      const scenarioAQIMod = scenario.temperature * 3 + scenario.energyDemand * 0.8;
      const scenarioTrafficMod = scenario.populationDensity * 0.5 + scenario.rainfall * -0.1;

      // Create urban metrics from real data
      const urban: UrbanMetrics = {
        trafficCongestion: Math.max(0, Math.min(100, traffic.congestion + scenarioTrafficMod)),
        airQualityIndex: Math.max(0, Math.min(500, weatherAQI.aqi + scenarioAQIMod)),
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
        airQuality: {
          aqi: weatherAQI.aqi,
          pm25: weatherAQI.pm25,
          pm10: weatherAQI.pm10,
          no2: weatherAQI.no2
        },
        traffic: {
          congestion: traffic.congestion,
          speed: traffic.speed
        },
        weather: {
          temp: weatherAQI.temp,
          feelsLike: weatherAQI.feelsLike,
          humidity: weatherAQI.humidity,
          pressure: weatherAQI.pressure,
          windSpeed: weatherAQI.windSpeed,
          description: weatherAQI.description,
          icon: weatherAQI.icon,
          sunrise: weatherAQI.sunrise,
          sunset: weatherAQI.sunset,
          forecast: forecast
        }
      });
    } catch (error) {
      console.error('Error in useRealTimeData:', error);

      // Fallback to simulated data
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
  }, [scenario, lat, lon]);

  useEffect(() => {
    fetchAllData();
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
