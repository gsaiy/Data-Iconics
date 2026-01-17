import { useState, useEffect, useCallback } from 'react';
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

export interface SmartCityData {
  urban: UrbanMetrics;
  health: HealthMetrics;
  agriculture: AgricultureMetrics;
  cityHealth: CityHealthIndex;
  timeSeries: TimeSeriesData[];
  heatmap: HeatmapCell[];
  lastUpdated: Date;
  isLoading: boolean;
}

export const useSmartCityData = (refreshInterval: number = 5000) => {
  const [scenario, setScenario] = useState<ScenarioParams>(defaultScenario);
  const [data, setData] = useState<SmartCityData>({
    urban: generateUrbanMetrics(),
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
    isLoading: false,
  });

  const refreshData = useCallback(() => {
    setData(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API latency
    setTimeout(() => {
      const urban = generateUrbanMetrics(scenario);
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
      });
    }, 300);
  }, [scenario]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const updateScenario = useCallback((newScenario: Partial<ScenarioParams>) => {
    setScenario(prev => ({ ...prev, ...newScenario }));
  }, []);

  const resetScenario = useCallback(() => {
    setScenario(defaultScenario);
  }, []);

  return {
    data,
    scenario,
    updateScenario,
    resetScenario,
    refreshData,
  };
};
