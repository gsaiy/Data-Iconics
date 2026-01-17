// API Configuration and City Locations

export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
  type: 'urban' | 'industrial' | 'residential' | 'commercial' | 'agricultural';
}

// Default city: Delhi, India (can be changed)
export const DEFAULT_CITY = {
  name: 'Delhi',
  lat: 28.6139,
  lon: 77.2090,
  zoom: 11,
};

// Sample monitoring points within the city
export const MONITORING_LOCATIONS: CityLocation[] = [
  { name: 'Central District', lat: 28.6139, lon: 77.2090, type: 'commercial' },
  { name: 'North Industrial', lat: 28.7041, lon: 77.1025, type: 'industrial' },
  { name: 'South Residential', lat: 28.5244, lon: 77.1855, type: 'residential' },
  { name: 'East Commercial', lat: 28.6304, lon: 77.2177, type: 'commercial' },
  { name: 'West Urban', lat: 28.6517, lon: 77.1381, type: 'urban' },
  { name: 'Northwest Agriculture', lat: 28.7496, lon: 77.0591, type: 'agricultural' },
  { name: 'Southeast Mixed', lat: 28.5355, lon: 77.2410, type: 'residential' },
  { name: 'Airport Zone', lat: 28.5562, lon: 77.1000, type: 'urban' },
];

// Bounding box for the city (for traffic incidents)
export const CITY_BOUNDS = {
  minLat: 28.40,
  minLon: 77.00,
  maxLat: 28.85,
  maxLon: 77.45,
};

// Data refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  traffic: 30000, // 30 seconds
  airQuality: 60000, // 1 minute
  weather: 300000, // 5 minutes
  health: 60000, // 1 minute (simulated)
  agriculture: 300000, // 5 minutes (simulated)
};

// API Keys (these are client-side keys)
export const API_KEYS = {
  tomtom: 'Cf2GFlBhr2Mm3tze2t8e5yMtxJJH1Saj',
  openaq: 'c415a63db2mshf2b3af35a139cc6p16ec37jsnaab9021270ce',
};
