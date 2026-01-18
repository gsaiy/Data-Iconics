import { backendClient } from './apiClient';
import axios from 'axios';
import { calculateAQI } from './airQualityService';
import { isServiceDisabled, disableService } from './serviceControl';

export interface WeatherAQIData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    temp?: number;
    feelsLike?: number;
    humidity?: number;
    pressure?: number;
    windSpeed?: number;
    clouds?: number;
    description?: string;
    icon?: string;
    sunrise?: number;
    sunset?: number;
}

export interface ForecastData {
    dt: number;
    temp: number;
    description: string;
    icon: string;
    pop?: number;
}

// Layer 1: High-speed proxy
// Layer 2: Direct API fetch (ERR_CONNECTION_REFUSED fallback)
// Layer 3: Deterministic Fallback
export const fetchWeatherAndAQI = async (lat: number, lon: number): Promise<WeatherAQIData> => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;

    try {
        const [aqRes, wRes] = await Promise.all([
            backendClient.get('/weather/pollution', { params: { lat, lon } }),
            backendClient.get('/weather/current', { params: { lat, lon } })
        ]);

        const aqItem = aqRes.data?.list?.[0];
        const components = aqItem?.components || {};
        const weather = wRes.data;

        return {
            aqi: calculateAQI(components.pm2_5 || 0, components.pm10 || 0, components.no2 || 0),
            pm25: components.pm2_5 || 0,
            pm10: components.pm10 || 0,
            no2: components.no2 || 0,
            temp: weather?.main?.temp,
            feelsLike: weather?.main?.feels_like,
            humidity: weather?.main?.humidity,
            pressure: weather?.main?.pressure,
            windSpeed: weather?.wind?.speed,
            clouds: weather?.clouds?.all,
            description: weather?.weather?.[0]?.description || 'Clear',
            icon: weather?.weather?.[0]?.icon || '01d',
            sunrise: weather?.sys?.sunrise,
            sunset: weather?.sys?.sunset,
        };
    } catch (proxyError: any) {
        try {
            const [aqRes, wRes] = await Promise.all([
                axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`),
                axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
            ]);

            const aqItem = aqRes.data?.list?.[0];
            const components = aqItem?.components || {};
            const weather = wRes.data;

            return {
                aqi: calculateAQI(components.pm2_5 || 0, components.pm10 || 0, components.no2 || 0),
                pm25: components.pm2_5 || 0,
                pm10: components.pm10 || 0,
                no2: components.no2 || 0,
                temp: weather?.main?.temp,
                feelsLike: weather?.main?.feels_like,
                humidity: weather?.main?.humidity,
                pressure: weather?.main?.pressure,
                windSpeed: weather?.wind?.speed,
                clouds: weather?.clouds?.all,
                description: weather?.weather?.[0]?.description,
                icon: weather?.weather?.[0]?.icon,
                sunrise: weather?.sys?.sunrise,
                sunset: weather?.sys?.sunset,
            };
        } catch (directError: any) {
            return getDeterministicFallback(lat, lon);
        }
    }
};

const getDeterministicFallback = (lat: number, lon: number): WeatherAQIData => {
    const hash = Math.abs(Math.floor(lat * 100) + Math.floor(lon * 100));
    const baseAqi = 40 + (hash % 120);

    return {
        aqi: baseAqi,
        pm25: baseAqi * 0.4,
        pm10: baseAqi * 0.6,
        no2: baseAqi * 0.2,
        temp: 22 + (hash % 10),
        feelsLike: 23 + (hash % 10),
        humidity: 45 + (hash % 30),
        pressure: 1010 + (hash % 10),
        windSpeed: hash % 10,
        clouds: hash % 100,
        description: 'Atmospheric Data Offline',
        icon: '03d',
        sunrise: Math.floor(Date.now() / 1000) - 14400,
        sunset: Math.floor(Date.now() / 1000) + 14400
    };
};

export const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;

    try {
        const response = await backendClient.get('/weather/forecast', {
            params: { lat, lon }
        });

        return response.data.list.slice(0, 16).map((item: any) => ({
            dt: item.dt,
            temp: item.main.temp,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            pop: item.pop || 0
        }));
    } catch (error: any) {
        try {
            const resp = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
            return resp.data.list.slice(0, 16).map((item: any) => ({
                dt: item.dt,
                temp: item.main.temp,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                pop: item.pop || 0
            }));
        } catch (e) {
            return [];
        }
    }
};

export const fetchAirPollutionHistory = async (lat: number, lon: number): Promise<any[]> => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
    const end = Math.floor(Date.now() / 1000);
    const start = end - (24 * 60 * 60);

    try {
        const response = await backendClient.get('/weather/pollution/history', {
            params: { lat, lon, start, end }
        });
        return response.data.list || [];
    } catch (error: any) {
        try {
            const resp = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${apiKey}`);
            return resp.data.list || [];
        } catch (e) {
            return [];
        }
    }
};
