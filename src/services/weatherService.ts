import { owmClient } from './apiClient';
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
}

const getSimulatedWeather = (): WeatherAQIData => {
    const hour = new Date().getHours();
    const factor = (Math.sin((hour - 6) * Math.PI / 12) + 1) / 2;
    const pm25 = 20 + (factor * 40);
    return {
        aqi: calculateAQI(pm25),
        pm25,
        pm10: 40 + (factor * 60),
        no2: 15 + (factor * 30),
        temp: 18 + (factor * 12),
        feelsLike: 19 + (factor * 12),
        humidity: 50 + (factor * 20),
        windSpeed: 4 + (factor * 10),
        description: 'Partly cloudy (Safe Baseline)',
        icon: '02d'
    };
};

export const fetchWeatherAndAQI = async (lat: number, lon: number): Promise<WeatherAQIData> => {
    if (isServiceDisabled('openWeather')) return getSimulatedWeather();

    try {
        const [aqResponse, weatherResponse] = await Promise.all([
            owmClient.get('/air_pollution', {
                params: {
                    lat: lat.toString(),
                    lon: lon.toString()
                }
            }),
            owmClient.get('/weather', {
                params: {
                    lat: lat.toString(),
                    lon: lon.toString()
                }
            })
        ]);

        const aqData = aqResponse.data.list?.[0];
        const pollutants = aqData?.components || {};

        const pm25 = pollutants.pm2_5 || 15;
        const pm10 = pollutants.pm10 || 25;
        const no2 = pollutants.no2 || 12;

        const weather = weatherResponse.data;

        return {
            aqi: calculateAQI(pm25),
            pm25,
            pm10,
            no2,
            temp: weather?.main?.temp,
            feelsLike: weather?.main?.feels_like,
            humidity: weather?.main?.humidity,
            pressure: weather?.main?.pressure,
            windSpeed: weather?.wind?.speed,
            description: weather?.weather?.[0]?.description,
            icon: weather?.weather?.[0]?.icon,
            sunrise: weather?.sys?.sunrise,
            sunset: weather?.sys?.sunset
        };
    } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('openWeather');
        }
        console.error('Error fetching weather/AQI data:', error);
        return getSimulatedWeather();
    }
};

export const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
    if (isServiceDisabled('openWeather')) {
        const currentHour = new Date().getHours();
        return Array.from({ length: 8 }).map((_, i) => ({
            dt: Date.now() / 1000 + i * 10800,
            temp: 20 + (Math.sin((i + currentHour) * Math.PI / 12) * 10),
            description: 'Clear sky (Safe Baseline)',
            icon: '01d'
        }));
    }

    try {
        const response = await owmClient.get('/forecast', {
            params: {
                lat: lat.toString(),
                lon: lon.toString()
            }
        });

        return response.data.list.slice(0, 8).map((item: any) => ({
            dt: item.dt,
            temp: item.main.temp,
            description: item.weather[0].description,
            icon: item.weather[0].icon
        }));
    } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('openWeather');
        }
        console.error('Error fetching forecast:', error);
        const currentHour = new Date().getHours();
        return Array.from({ length: 8 }).map((_, i) => ({
            dt: Date.now() / 1000 + i * 10800,
            temp: 20 + (Math.sin((i + currentHour) * Math.PI / 12) * 10),
            description: 'Clear sky (Safe Baseline)',
            icon: '01d'
        }));
    }
};

export const fetchAirPollutionHistory = async (lat: number, lon: number): Promise<any[]> => {
    if (isServiceDisabled('openWeather')) return [];

    try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - (24 * 60 * 60); // Last 24 hours

        const response = await owmClient.get('/air_pollution/history', {
            params: {
                lat: lat.toString(),
                lon: lon.toString(),
                start,
                end
            }
        });

        return response.data.list || [];
    } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('openWeather');
        }
        console.error('Error fetching air pollution history:', error);
        return [];
    }
};
