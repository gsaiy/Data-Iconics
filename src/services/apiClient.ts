import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

export const openWeatherClient = axios.create({
    baseURL: 'https://open-weather13.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'open-weather13.p.rapidapi.com'
    }
});

export const openAQClient = axios.create({
    baseURL: 'https://openaq-air-quality.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'openaq-air-quality.p.rapidapi.com'
    }
});

export const tomtomClient = axios.create({
    baseURL: 'https://api.tomtom.com/traffic/services/4',
    params: {
        key: import.meta.env.VITE_TOMTOM_KEY
    }
});

export const owmClient = axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
    params: {
        appid: import.meta.env.VITE_OPENWEATHER_KEY,
        units: 'metric'
    }
});
export const tomtomSearchClient = axios.create({
    baseURL: 'https://api.tomtom.com/search/2',
    params: {
        key: import.meta.env.VITE_TOMTOM_KEY
    }
});
export const owmOneCallClient = axios.create({
    baseURL: 'https://api.openweathermap.org/data/3.0',
    params: {
        appid: import.meta.env.VITE_OPENWEATHER_KEY,
        units: 'metric'
    }
});

export const meteostatClient = axios.create({
    baseURL: 'https://meteostat.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'meteostat.p.rapidapi.com'
    }
});

export const backendClient = axios.create({
    baseURL: 'http://localhost:3001/api'
});
