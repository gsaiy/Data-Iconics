import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { meteostatClient, owmClient } from './apiClient';
import { isServiceDisabled, disableService, getServiceError } from './serviceControl';

export interface WeatherHistoryPoint {
    dt: number;
    temp: number;
    humidity: number;
    wind_speed: number;
    description: string;
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
        const response = await owmClient.get('/forecast', {
            params: {
                lat: lat.toString(),
                lon: lon.toString()
            }
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
        const response = await meteostatClient.get('/point/daily', {
            params: {
                lat: lat.toString(),
                lon: lon.toString(),
                start,
                end
            }
        });

        if (response.data && response.data.data) {
            const historyPoints = response.data.data.map((day: any) => {
                const dt = Math.floor(new Date(day.date).getTime() / 1000);
                const point: WeatherHistoryPoint = {
                    dt,
                    temp: day.tavg,
                    humidity: day.rhum || 50,
                    wind_speed: day.wspd || 0,
                    description: 'Observed'
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
 * Flood Risk Model remains as a logical calculation based on RECENT metrics
 */
export const calculateFloodRisk = (history: WeatherHistoryPoint[], currentRainfallPercentage: number) => {
    if (history.length === 0) return { probability: 0, level: 'low', message: 'No historical data for risk calculation' };

    // Meteostat provides 'prcp' (precipitation) in some endpoints. 
    // For now we use the general logic or check if temp/humidity indicate storms
    const heavyRainProbability = history.filter(p => p.temp > 25 && p.humidity > 80).length;

    const baseProbability = (heavyRainProbability / history.length) * 40;
    const probability = Math.min(100, Math.round(baseProbability + (currentRainfallPercentage * 0.6)));

    return {
        probability,
        level: probability > 80 ? 'critical' : probability > 50 ? 'high' : probability > 20 ? 'moderate' : 'low',
        message: probability > 50 ? 'Extreme rainfall pattern detected in model' : 'Climate trajectory within normal bounds'
    };
};
