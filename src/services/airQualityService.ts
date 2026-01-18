export interface AirQualityData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    status: string;
}

// Comprehensive AQI calculation based on multiple pollutants
// Supports US-EPA and Indian standards (approximated)
export const calculateAQI = (pm25: number, pm10: number = 0, no2: number = 0): number => {
    // Basic US-EPA PM2.5 mapping as baseline
    let aqi = 0;

    // PM2.5 is the primary driver in most urban areas
    if (pm25 <= 12) aqi = (50 / 12) * pm25;
    else if (pm25 <= 35.4) aqi = ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51;
    else if (pm25 <= 55.4) aqi = ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101;
    else if (pm25 <= 150.4) aqi = ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151;
    else if (pm25 <= 250.4) aqi = ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201;
    else if (pm25 <= 350.4) aqi = ((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301;
    else aqi = ((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401;

    // PM10 factor (if high)
    if (pm10 > 50) {
        const pm10Aqi = pm10 > 425 ? 300 : (pm10 / 425) * 300;
        aqi = Math.max(aqi, pm10Aqi);
    }

    // NO2 factor
    if (no2 > 50) {
        const no2Aqi = (no2 / 200) * 100;
        aqi = Math.max(aqi, no2Aqi);
    }

    return Math.round(Math.min(500, aqi));
};

export const getAQIStatus = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy (Sensitive)';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
};
