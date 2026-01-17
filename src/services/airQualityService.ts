export interface AirQualityData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    status: string;
}

// OpenAQ US EPA AQI mapping for PM2.5
export const calculateAQI = (pm25: number): number => {
    if (pm25 <= 12) return Math.round((50 / 12) * pm25);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
    return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
};
