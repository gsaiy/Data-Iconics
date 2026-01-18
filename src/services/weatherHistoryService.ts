import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { backendClient } from './apiClient';
import { isServiceDisabled, disableService, getServiceError } from './serviceControl';

export interface WeatherHistoryPoint {
    dt: number;
    temp: number;
    humidity: number;
    wind_speed: number;
    description: string;
    prcp?: number;
}

export interface WeatherPrediction {
    temp: number;
    label: string;
    description: string;
    confidence: number;
}

// Reverting to OpenWeatherMap for reliability as Apjoy is returning 404
export const fetchFutureWeather = async (lat: number, lon: number, locationName: string = ''): Promise<WeatherPrediction[]> => {
    if (isServiceDisabled('openWeather')) {
        const lastErr = getServiceError('openWeather');
        throw new Error(lastErr || "OpenWeather service is currently disabled.");
    }

    try {
        const response = await backendClient.get('/weather/forecast', {
            params: { lat, lon }
        });

        const list = response.data?.list || [];

        // Group by day to get daily predictions (OpenWeather 5-day returns every 3 hours)
        const dailyPredictions: WeatherPrediction[] = [];
        const seenDays = new Set<string>();
        const today = new Date().toISOString().split('T')[0];

        for (const item of list) {
            const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];

            // Skip today and pick one representative sample for each future day
            if (dateStr !== today && !seenDays.has(dateStr)) {
                seenDays.add(dateStr);
                dailyPredictions.push({
                    temp: item.main?.temp || 0,
                    label: `D+${dailyPredictions.length + 1} Predicted`,
                    description: item.weather?.[0]?.description || 'Forecast',
                    confidence: 85 - (dailyPredictions.length * 5) // Confidence decreases further in future
                });

                if (dailyPredictions.length >= 3) break;
            }
        }

        return dailyPredictions;
    } catch (error: any) {
        const msg = error.response?.data?.message || error.message || "Failed to connect to weather service";
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('openWeather', msg);
        }
        console.error("Future Weather Forecast Error:", msg);
        throw new Error(msg);
    }
};

/**
 * Fetch historical data for city record keeping
 */
export const getHistoryFromFirebase = async (cityName: string): Promise<WeatherHistoryPoint[]> => {
    try {
        const q = query(
            collection(db, "weather_history"),
            where("cityName", "==", cityName),
            orderBy("dt", "desc"),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as WeatherHistoryPoint);
    } catch (error) {
        console.error("Firebase History Retrieval Error:", error);
        return [];
    }
};

/**
 * Sync logic using Meteostat for historical observations
 */
export const syncWeatherHistory = async (lat: number, lon: number, cityName: string) => {
    if (isServiceDisabled('meteostat')) return [];

    const now = new Date();
    const end = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const start = new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0];

    try {
        const response = await backendClient.get('/history/daily', {
            params: { lat, lon, start, end }
        });

        if (response.data && response.data.data) {
            const historyPoints = response.data.data.map((day: any) => {
                const dt = Math.floor(new Date(day.date).getTime() / 1000);
                const point: WeatherHistoryPoint = {
                    dt,
                    temp: day.tavg,
                    humidity: day.rhum || 50,
                    wind_speed: day.wspd || 0,
                    description: 'Observed',
                    prcp: day.prcp || 0
                };

                // Store in Firebase
                const docId = `${cityName.replace(/\s+/g, '_').toLowerCase()}_${dt}`;
                setDoc(doc(db, "weather_history", docId), {
                    ...point,
                    cityName, lat, lon,
                    timestamp: day.date
                }, { merge: true }).catch(() => { });

                return point;
            });
            return historyPoints;
        }
    } catch (error: any) {
        console.error("Meteostat History Sync Error:", error.response?.status);
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('meteostat');
        }
    }
    return [];
};

/**
 * Enhanced Flood Risk Model: Uses Forecast API 'pop' (Probability of Precipitation)
 * and Meteostat-based Ground Saturation Factor (GSF).
 */
export const calculateFloodRisk = (history: WeatherHistoryPoint[], currentRainfallPercentage: number, currentMetrics?: any) => {
    // 1. Calculate Ground Saturation Factor (GSF) from Meteostat History
    // A high accumulation of rain in the last 5 days lowers the ground's absorption capacity.
    const historicalRainfall = history.reduce((sum, point) => sum + (point.prcp || 0), 0);
    const saturationMultiplier = historicalRainfall > 50 ? 1.5 : (historicalRainfall > 20 ? 1.2 : 1.0);
    const hasHighSaturation = historicalRainfall > 30;

    // Advanced Reactive Logic
    const humidity = currentMetrics?.humidity || 50;
    const pressure = currentMetrics?.pressure || 1013;
    const clouds = currentMetrics?.clouds || 0;
    const description = (currentMetrics?.description || '').toLowerCase();

    // API Forecast Link (Priority)
    const apiPop = currentMetrics?.forecast?.[0]?.pop || 0; // 0.0 to 1.0
    const apiRiskBase = apiPop * 100;

    // Atmospheric Overrides
    const isRaining = description.includes('rain') || description.includes('drizzle');
    const isStormy = description.includes('storm') || description.includes('thunder');

    // Risk Calculation blending API forecast, Local Atmospheric conditions, and Meteostat History
    let combinedRisk = apiRiskBase * saturationMultiplier;

    // Elevated baseline if ground is already seeing rain
    if (isRaining) combinedRisk = Math.max(combinedRisk, 40 * saturationMultiplier);
    if (isStormy) combinedRisk = Math.max(combinedRisk, 75 * saturationMultiplier);

    // Pressure Delta adjustment
    if (pressure < 1005) combinedRisk += 15;

    // Saturation Penalty (Meteostat specific)
    if (hasHighSaturation) combinedRisk += 20;

    // Simulation/Scenario influence
    combinedRisk += (currentRainfallPercentage * 0.4);

    // Final probability clamping
    const finalProb = Math.min(100, Math.round(combinedRisk));

    // Intelligence Messaging based on combined factors
    let msg = 'Regional drainage systems operating within nominal capacity.';
    if (hasHighSaturation) msg = `Meteostat alert: Ground saturated (${historicalRainfall.toFixed(1)}mm last 5 days). Absorption limited.`;
    if (isStormy) msg = 'Meteorological alert: Severe convection patterns detected.';
    else if (isRaining) msg = 'API Forecast: High precipitation density confirmed.';
    else if (apiPop > 0.6) msg = 'Official API Forecast predicts incoming heavy rain.';
    else if (pressure < 1008) msg = 'Low pressure trough detected via satellite data.';

    // Risk Leveling
    const level = finalProb > 80 ? 'critical' : finalProb > 50 ? 'high' : finalProb > 25 ? 'moderate' : 'low';

    return {
        probability: finalProb,
        level,
        message: msg
    };
};
