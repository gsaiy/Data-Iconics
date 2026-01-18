import { useState, useEffect } from 'react';
import {
    syncWeatherHistory,
    getHistoryFromFirebase,
    calculateFloodRisk,
    fetchFutureWeather,
    WeatherHistoryPoint,
    WeatherPrediction
} from '@/services/weatherHistoryService';

export const useWeatherHistory = (lat: number, lon: number, cityName: string, currentRainfall: number = 0, currentWeather?: any) => {
    const [history, setHistory] = useState<WeatherHistoryPoint[]>([]);
    const [predictions, setPredictions] = useState<WeatherPrediction[]>([]);
    const [floodRisk, setFloodRisk] = useState({ probability: 0, level: 'low' as any, message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistoryAndPredict = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                // Parallel fetch for speed
                const [futureData, firebaseHistory] = await Promise.all([
                    fetchFutureWeather(lat, lon, cityName),
                    getHistoryFromFirebase(cityName)
                ]);

                setPredictions(futureData);

                let localHistory = firebaseHistory;
                if (localHistory.length < 3) {
                    // Try to sync if missing, but don't block predictions
                    localHistory = await syncWeatherHistory(lat, lon, cityName);
                }
                setHistory(localHistory || []);

                // Calculate Risk (Always works now with currentMetrics fallback)
                const flood = calculateFloodRisk(localHistory || [], currentRainfall, currentWeather);
                setFloodRisk(flood);

            } catch (error: any) {
                console.error("Error in useWeatherHistory hook:", error);
                setErrorMessage(error.message || "Weather analytics delayed");

                // Still try to calculate risk even if background fetch fails
                const flood = calculateFloodRisk([], currentRainfall, currentWeather);
                setFloodRisk(flood);
            } finally {
                setIsLoading(false);
            }
        };

        if (lat && lon && cityName) {
            fetchHistoryAndPredict();
        }
    }, [lat, lon, cityName, currentRainfall, currentWeather]);

    return { history, predictions, floodRisk, isLoading, errorMessage };
};
