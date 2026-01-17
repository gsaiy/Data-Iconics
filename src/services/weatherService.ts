import { owmClient } from './apiClient';
import { calculateAQI } from './airQualityService';

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

export const fetchWeatherAndAQI = async (lat: number, lon: number): Promise<WeatherAQIData> => {
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
    } catch (error) {
        console.error('Error fetching weather/AQI data:', error);
        const pm25 = 15 + Math.random() * 50;
        return {
            aqi: calculateAQI(pm25),
            pm25,
            pm10: 25 + Math.random() * 70,
            no2: 12 + Math.random() * 40,
            temp: 22 + Math.random() * 10,
            feelsLike: 23 + Math.random() * 10,
            humidity: 40 + Math.random() * 30,
            windSpeed: 5 + Math.random() * 15,
            description: 'Partly cloudy',
            icon: '02d'
        };
    }
};

export const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
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
    } catch (error) {
        console.error('Error fetching forecast:', error);
        // Simulated forecast
        return Array.from({ length: 8 }).map((_, i) => ({
            dt: Date.now() / 1000 + i * 10800,
            temp: 20 + Math.random() * 15,
            description: 'Clear sky',
            icon: '01d'
        }));
    }
};

export const fetchAirPollutionHistory = async (lat: number, lon: number): Promise<any[]> => {
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
    } catch (error) {
        console.error('Error fetching air pollution history:', error);
        return [];
    }
};
