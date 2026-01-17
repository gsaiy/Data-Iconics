// TomTom API for traffic data
const TOMTOM_API_KEY = 'Cf2GFlBhr2Mm3tze2t8e5yMtxJJH1Saj';
const TOMTOM_BASE_URL = 'https://api.tomtom.com';

export interface TrafficFlowData {
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionLevel: number; // 0-100
  roadClosure: boolean;
  confidence: number;
  timestamp: Date;
}

export interface TrafficIncident {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'undefined';
  description: string;
  from: string;
  to: string;
  delay: number; // seconds
  coordinates: [number, number];
}

// Fetch traffic flow data for a location
export const fetchTrafficFlow = async (
  lat: number = 28.6139,
  lon: number = 77.2090
): Promise<TrafficFlowData> => {
  try {
    const response = await fetch(
      `${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lon}&key=${TOMTOM_API_KEY}&unit=KMPH`
    );

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status}`);
    }

    const data = await response.json();
    const flowData = data.flowSegmentData;

    const currentSpeed = flowData?.currentSpeed || 30;
    const freeFlowSpeed = flowData?.freeFlowSpeed || 60;
    const congestionLevel = Math.round(
      ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100
    );

    return {
      currentSpeed,
      freeFlowSpeed,
      congestionLevel: Math.max(0, Math.min(100, congestionLevel)),
      roadClosure: flowData?.roadClosure || false,
      confidence: flowData?.confidence || 0.8,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching traffic flow:', error);
    // Return simulated data on error
    const freeFlow = 60 + Math.random() * 20;
    const current = 20 + Math.random() * 40;
    return {
      currentSpeed: Math.round(current),
      freeFlowSpeed: Math.round(freeFlow),
      congestionLevel: Math.round(((freeFlow - current) / freeFlow) * 100),
      roadClosure: false,
      confidence: 0.7,
      timestamp: new Date(),
    };
  }
};

// Fetch traffic incidents in a bounding box
export const fetchTrafficIncidents = async (
  minLat: number = 28.4,
  minLon: number = 77.0,
  maxLat: number = 28.8,
  maxLon: number = 77.4
): Promise<TrafficIncident[]> => {
  try {
    const response = await fetch(
      `${TOMTOM_BASE_URL}/traffic/services/5/incidentDetails?key=${TOMTOM_API_KEY}&bbox=${minLon},${minLat},${maxLon},${maxLat}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,delay,roadNumbers}}}&language=en-US`
    );

    if (!response.ok) {
      throw new Error(`TomTom Incidents API error: ${response.status}`);
    }

    const data = await response.json();
    const incidents: TrafficIncident[] = [];

    if (data.incidents) {
      for (const incident of data.incidents) {
        const props = incident.properties;
        const coords = incident.geometry?.coordinates;
        
        const severityMap: Record<number, 'minor' | 'moderate' | 'major' | 'undefined'> = {
          0: 'undefined',
          1: 'minor',
          2: 'moderate',
          3: 'major',
          4: 'major',
        };

        incidents.push({
          id: props.id,
          type: props.iconCategory || 'unknown',
          severity: severityMap[props.magnitudeOfDelay] || 'undefined',
          description: props.events?.[0]?.description || 'Traffic incident',
          from: props.from || '',
          to: props.to || '',
          delay: props.delay || 0,
          coordinates: coords ? [coords[0], coords[1]] : [lon, lat],
        });
      }
    }

    return incidents;
  } catch (error) {
    console.error('Error fetching traffic incidents:', error);
    return [];
  }
};

// Calculate average congestion for multiple points
export const fetchAverageTraffic = async (
  points: Array<{ lat: number; lon: number }>
): Promise<{ avgCongestion: number; avgSpeed: number; incidents: number }> => {
  const results = await Promise.all(points.map((p) => fetchTrafficFlow(p.lat, p.lon)));
  
  const avgCongestion = results.reduce((sum, r) => sum + r.congestionLevel, 0) / results.length;
  const avgSpeed = results.reduce((sum, r) => sum + r.currentSpeed, 0) / results.length;

  return {
    avgCongestion: Math.round(avgCongestion),
    avgSpeed: Math.round(avgSpeed),
    incidents: 0, // Will be populated from incidents API
  };
};
