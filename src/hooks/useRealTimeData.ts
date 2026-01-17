import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAirQuality, type AirQualityData } from '@/lib/api/openaq';
import { fetchTrafficFlow, fetchTrafficIncidents, type TrafficFlowData, type TrafficIncident } from '@/lib/api/tomtom';
import { CITY_BOUNDS, DEFAULT_CITY } from '@/lib/api/config';
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

export interface RealTimeData {
  // Real API data
  airQuality: AirQualityData;
  traffic: TrafficFlowData;
  incidents: TrafficIncident[];
  
  // Combined metrics
  urban: UrbanMetrics;
  health: HealthMetrics;
  agriculture: AgricultureMetrics;
  cityHealth: CityHealthIndex;
  
  // Time series and heatmap
  timeSeries: TimeSeriesData[];
  heatmap: HeatmapCell[];
  
  // Status
  lastUpdated: Date;
  isLoading: boolean;
  dataSource: 'live' | 'simulated' | 'mixed';
}

export const useRealTimeData = (refreshInterval: number = 30000) => {
  const [scenario, setScenario] = useState<ScenarioParams>(defaultScenario);
  const [data, setData] = useState<RealTimeData>({
    airQuality: {
      pm25: 0,
      pm10: 0,
      no2: 0,
      aqi: 0,
      location: DEFAULT_CITY.name,
      timestamp: new Date(),
    },
    traffic: {
      currentSpeed: 0,
      freeFlowSpeed: 0,
      congestionLevel: 0,
      roadClosure: false,
      confidence: 0,
      timestamp: new Date(),
    },
    incidents: [],
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
  });

  const isInitialMount = useRef(true);

  // Fetch all real-time data
  const fetchAllData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      // Parallel API calls for real data
      const [airQuality, traffic, incidents] = await Promise.all([
        fetchAirQuality(DEFAULT_CITY.lat, DEFAULT_CITY.lon),
        fetchTrafficFlow(DEFAULT_CITY.lat, DEFAULT_CITY.lon),
        fetchTrafficIncidents(
          CITY_BOUNDS.minLat,
          CITY_BOUNDS.minLon,
          CITY_BOUNDS.maxLat,
          CITY_BOUNDS.maxLon
        ),
      ]);

      // Apply scenario modifiers to real data
      const scenarioAQIMod = scenario.temperature * 3 + scenario.energyDemand * 0.8;
      const scenarioTrafficMod = scenario.populationDensity * 0.5 + scenario.rainfall * -0.1;

      // Create urban metrics from real data
      const urban: UrbanMetrics = {
        trafficCongestion: Math.max(0, Math.min(100, traffic.congestionLevel + scenarioTrafficMod)),
        airQualityIndex: Math.max(0, Math.min(500, airQuality.aqi + scenarioAQIMod)),
        energyUsage: 800 + Math.random() * 700 + scenario.energyDemand * 10,
        noiseLevel: 45 + Math.random() * 40,
        publicTransportUsage: 20 + Math.random() * 40,
      };

      // Generate health and agriculture with scenario
      const health = generateHealthMetrics(scenario);
      const agriculture = generateAgricultureMetrics(scenario);

      // Calculate city health
      const cityHealth = calculateCityHealthIndex(urban, health, agriculture);

      // Store in Firebase for persistence
      try {
        const { writeData } = await import('@/lib/firebase');
        await writeData(`metrics/${Date.now()}`, {
          timestamp: Date.now(),
          airQuality: {
            pm25: airQuality.pm25,
            pm10: airQuality.pm10,
            no2: airQuality.no2,
            aqi: airQuality.aqi,
          },
          traffic: {
            congestion: traffic.congestionLevel,
            speed: traffic.currentSpeed,
          },
          cityHealth: cityHealth.overall,
        });
      } catch (firebaseError) {
        console.warn('Firebase write failed:', firebaseError);
      }

      setData({
        airQuality,
        traffic,
        incidents,
        urban,
        health,
        agriculture,
        cityHealth,
        timeSeries: generateTimeSeriesData(),
        heatmap: generateHeatmapData(),
        lastUpdated: new Date(),
        isLoading: false,
        dataSource: 'live',
      });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      
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
  }, [scenario]);

  // Initial fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchAllData();
    }
  }, [fetchAllData]);

  // Periodic refresh
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
