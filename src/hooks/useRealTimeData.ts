import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateUrbanMetrics,
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

import { calculateAQI } from '@/services/airQualityService';

import { fetchTrafficData } from '@/services/trafficService';
import { fetchWeatherAndAQI, fetchForecast, fetchAirPollutionHistory, type ForecastData } from '@/services/weatherService';
import { fetchFAOAgricultureData } from '@/services/agricultureService';
import { fetchWHOHealthData } from '@/services/healthService';

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
    health: {
      diseaseIncidence: 0,
      hospitalCapacity: 0,
      emergencyLoad: 0,
      vaccinationRate: 0,
      avgResponseTime: 0,
    },
    agriculture: {
      cropYieldIndex: 0,
      foodSupplyLevel: 0,
      priceIndex: 0,
      waterUsage: 0,
      soilHealth: 0,
    },
    cityHealth: {
      overall: 65,
      urban: 60,
      health: 0,
      agriculture: 0,
      trend: 'stable',
      riskLevel: 'medium',
    },
    timeSeries: [], // Start empty
    heatmap: generateHeatmapData(lat, lon),
    lastUpdated: new Date(),
    isLoading: true,
    dataSource: 'simulated',
    airQuality: { pm25: 0, pm10: 0, no2: 0, aqi: 0 },
    traffic: { congestion: 0, speed: 0 },
  });

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchAllData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      // Fetch real data from services including FAO Agriculture
      // Fetch real data from services with individual resilience
      const results = await Promise.allSettled([
        fetchWeatherAndAQI(lat, lon),
        fetchTrafficData(lat, lon),
        fetchForecast(lat, lon),
        fetchFAOAgricultureData(lat, lon),
        fetchWHOHealthData(lat, lon),
        isFirstLoad ? fetchAirPollutionHistory(lat, lon) : Promise.resolve([])
      ]);

      const weatherAQI = results[0].status === 'fulfilled' ? results[0].value : ({} as any);
      const traffic = results[1].status === 'fulfilled' ? results[1].value : { congestion: 45, speed: 40 };
      const forecast = results[2].status === 'fulfilled' ? results[2].value : [];
      const agriFAO = results[3].status === 'fulfilled' ? results[3].value : {};
      const healthWHO = results[4].status === 'fulfilled' ? results[4].value : {};
      const aqiHistory = results[5].status === 'fulfilled' ? results[5].value : [];

      if (results.some(r => r.status === 'rejected')) {
        console.warn('Some real-time services failed to load, using fallbacks.');
      }

      // Apply scenario modifiers
      const scenarioAQIMod = scenario.temperature * 3 + scenario.energyDemand * 0.8;
      const scenarioTrafficMod = scenario.populationDensity * 0.5 + scenario.rainfall * -0.1;

      // Deterministic models for secondary metrics based on Time of Day
      const currentHour = new Date().getHours();
      const timeFactor = (Math.sin((currentHour - 6) * Math.PI / 12) + 1) / 2; // Peak at 12:00-18:00

      const urban: UrbanMetrics = {
        trafficCongestion: Math.max(0, Math.min(100, traffic.congestion + scenarioTrafficMod)),
        airQualityIndex: Math.max(0, Math.min(500, weatherAQI.aqi + scenarioAQIMod)),
        energyUsage: generateUrbanMetrics(lat, lon, scenario).energyUsage,
        noiseLevel: generateUrbanMetrics(lat, lon, scenario).noiseLevel,
        publicTransportUsage: generateUrbanMetrics(lat, lon, scenario).publicTransportUsage,
      };

      const health = {
        ...generateHealthMetrics(lat, lon, scenario),
        ...(healthWHO as HealthMetrics)
      };
      const agriculture = {
        ...generateAgricultureMetrics(lat, lon, scenario),
        ...(agriFAO as AgricultureMetrics)
      };
      const cityHealth = calculateCityHealthIndex(urban, health, agriculture);

      // Create a point for the current time
      const currentPoint: TimeSeriesData = {
        timestamp: new Date(),
        urban,
        health,
        agriculture
      };

      setData(prev => {
        let newTimeSeries = [...prev.timeSeries];

        if (isFirstLoad && aqiHistory.length > 0) {
          // If first load, populate history from API
          // Map aqi history to time series data (simulating other metrics for the past)
          newTimeSeries = aqiHistory
            .filter((_, i) => i % 4 === 0) // Reduce points for performance (every 4 hours)
            .map(item => {
              const histAQI = calculateAQI(item.components.pm2_5);
              return {
                timestamp: new Date(item.dt * 1000),
                urban: {
                  ...generateUrbanMetrics(lat, lon, scenario),
                  airQualityIndex: histAQI,
                  trafficCongestion: Math.max(0, Math.min(100, traffic.congestion + (Math.sin(item.dt) * 10)))
                },
                health: generateHealthMetrics(lat, lon, scenario),
                agriculture: generateAgricultureMetrics(lat, lon, scenario)
              };
            });

          setIsFirstLoad(false);
        }

        // Add current point and keep last 24 points
        newTimeSeries = [...newTimeSeries, currentPoint].slice(-24);

        return {
          urban,
          health,
          agriculture,
          cityHealth,
          timeSeries: newTimeSeries,
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
        };
      });
    } catch (error) {
      console.error('Error in useRealTimeData:', error);

      // Fallback to simulated data
      const currentHour = new Date().getHours();
      const timeFactor = (Math.sin((currentHour - 6) * Math.PI / 12) + 1) / 2;

      const urban: UrbanMetrics = {
        trafficCongestion: 40 + (timeFactor * 40),
        airQualityIndex: 80 + (timeFactor * 60),
        energyUsage: 900 + (timeFactor * 500),
        noiseLevel: 55 + (timeFactor * 25),
        publicTransportUsage: 35 + (timeFactor * 35),
      };
      const health = generateHealthMetrics(lat, lon, scenario);
      const agriculture = generateAgricultureMetrics(lat, lon, scenario);
      const cityHealth = calculateCityHealthIndex(urban, health, agriculture);

      setData((prev) => ({
        ...prev,
        urban,
        health,
        agriculture,
        cityHealth,
        timeSeries: generateTimeSeriesData(lat, lon),
        heatmap: generateHeatmapData(lat, lon),
        lastUpdated: new Date(),
        isLoading: false,
        dataSource: 'simulated',
      }));
    }
  }, [scenario, lat, lon]);

  useEffect(() => {
    setIsFirstLoad(true);
    setData(prev => ({ ...prev, timeSeries: [] }));
    fetchAllData();
  }, [fetchAllData, lat, lon]);

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
