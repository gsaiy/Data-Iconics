import { useState, useEffect } from 'react';
import {
    syncWeatherHistory,
    getHistoryFromFirebase,
    calculateFloodRisk,
    fetchFutureWeather,
    WeatherHistoryPoint,
    WeatherPrediction
} from '@/services/weatherHistoryService';

export const useWeatherHistory = (lat: number, lon: number, cityName: string, currentRainfall: number = 0) => {
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
                // 1. Fetch future weather directly from API (as per user request)
                const futureData = await fetchFutureWeather(lat, lon, cityName);
                setPredictions(futureData);

                // 2. Get history for flood risk logic
                let localHistory = await getHistoryFromFirebase(cityName);
                if (localHistory.length < 3) {
                    localHistory = await syncWeatherHistory(lat, lon, cityName);
                }
                setHistory(localHistory);

                // 3. Run flood model
                if (localHistory.length >= 3) {
                    const flood = calculateFloodRisk(localHistory, currentRainfall);
                    setFloodRisk(flood);
                }
            } catch (error: any) {
                console.error("Error in useWeatherHistory hook:", error);
                const msg = error.response?.data?.message || error.message || "Failed to fetch weather data";
                setErrorMessage(msg);
            } finally {
                setIsLoading(false);
            }
        };

        if (lat && lon && cityName) {
            fetchHistoryAndPredict();
        }
    }, [lat, lon, cityName, currentRainfall]);

    return { history, predictions, floodRisk, isLoading, errorMessage };
};
