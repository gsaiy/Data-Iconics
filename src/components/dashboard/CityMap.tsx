import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Environment Variables
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_KEY || 'Cf2GFlBhr2Mm3tze2t8e5yMtxJJH1Saj';

// Delhi city configuration
const DELHI_CONFIG = {
  center: [28.6139, 77.2090] as [number, number],
  zoom: 11,
};

// Monitoring locations across Delhi
const MONITORING_POINTS = [
  { name: 'Central Delhi', lat: 28.6139, lon: 77.2090, type: 'commercial' },
  { name: 'North Industrial', lat: 28.7041, lon: 77.1025, type: 'industrial' },
  { name: 'South Residential', lat: 28.5244, lon: 77.1855, type: 'residential' },
  { name: 'East Commercial', lat: 28.6304, lon: 77.2177, type: 'commercial' },
  { name: 'West Urban', lat: 28.6517, lon: 77.1381, type: 'urban' },
  { name: 'Dwarka', lat: 28.5921, lon: 77.0460, type: 'residential' },
  { name: 'Noida Border', lat: 28.5355, lon: 77.3910, type: 'industrial' },
  { name: 'Gurgaon Border', lat: 28.4595, lon: 77.0266, type: 'commercial' },
];

interface CityMapProps {
  lat: number;
  lon: number;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
  airQuality?: { aqi: number; pm25: number };
  trafficCongestion?: number;
  savedLocations?: { lat: number; lon: number; name: string }[];
  className?: string;
}

const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return '#22c55e'; // Green - Good
  if (aqi <= 100) return '#eab308'; // Yellow - Moderate
  if (aqi <= 150) return '#f97316'; // Orange - Unhealthy for sensitive
  if (aqi <= 200) return '#ef4444'; // Red - Unhealthy
  if (aqi <= 300) return '#a855f7'; // Purple - Very Unhealthy
  return '#7f1d1d'; // Maroon - Hazardous
};

const CityMapComponent = ({ lat, lon, onLocationChange, airQuality, trafficCongestion, savedLocations = [], className }: CityMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create map centered on provided lat/lon
    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 12,
      zoomControl: true,
    });

    // Dark theme base layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    // TomTom Traffic Flow Layer
    L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}&tileSize=256`,
      {
        attribution: '&copy; TomTom',
        opacity: 0.7,
        maxZoom: 19,
      }
    ).addTo(map);

    // Handle map click to set global location
    map.on('click', (e: L.LeafletMouseEvent) => {
      onLocationChange(e.latlng.lat, e.latlng.lng, 'Selected Location');
    });

    // Create markers layer group
    markersRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers based on saved locations and current location
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;

    markersRef.current.clearLayers();

    // 1. Render all saved locations
    savedLocations.forEach((loc) => {
      const isActive = Math.abs(loc.lat - lat) < 0.0001 && Math.abs(loc.lon - lon) < 0.0001;
      const color = isActive ? getAQIColor(airQuality?.aqi || 100) : '#3b82f6';

      const icon = L.divIcon({
        className: 'custom-city-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px;">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: 32px;
              height: 32px;
              background: ${color};
              border-radius: 50%;
              border: 3px solid rgba(255,255,255,0.9);
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              ${isActive ? 'animation: pulse 2s infinite;' : ''}
              cursor: pointer;
            ">
              <span style="color: white; font-size: 9px; font-weight: bold;">${isActive ? (airQuality?.aqi || '--') : ''}</span>
            </div>
            ${!isActive ? `<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.8); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; pointer-events: none;">${loc.name}</div>` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([loc.lat, loc.lon], { icon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onLocationChange(loc.lat, loc.lon, loc.name);
      });

      marker.bindPopup(`
        <div style="min-width: 150px; padding: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">${loc.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">${isActive ? 'Currently Monitoring' : 'Click to view details'}</p>
        </div>
      `);

      markersRef.current?.addLayer(marker);
    });

    // 2. If current location is not in saved locations, add a temporary marker
    const isSaved = savedLocations.some(loc => Math.abs(loc.lat - lat) < 0.0001 && Math.abs(loc.lon - lon) < 0.0001);

    if (!isSaved) {
      const color = getAQIColor(airQuality?.aqi || 100);
      const icon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px;">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: 40px;
              height: 40px;
              background: ${color};
              border-radius: 50%;
              border: 4px solid rgba(255,255,255,0.9);
              box-shadow: 0 4px 15px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">
              <span style="color: white; font-size: 11px; font-weight: bold;">${airQuality?.aqi || '--'}</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lon], { icon });
      marker.bindPopup(`
        <div style="min-width: 180px; padding: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">Directly Selected</h3>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280;">AQI:</span>
              <span style="font-weight: 600; color: ${color};">${airQuality?.aqi || 'Loading...'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Traffic:</span>
              <span style="font-weight: 600;">${trafficCongestion || 0}%</span>
            </div>
          </div>
        </div>
      `);

      const circle = L.circle([lat, lon], {
        radius: 4000,
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 1,
      });

      markersRef.current.addLayer(marker);
      markersRef.current.addLayer(circle);
    } else {
      // Add circle for saved active location too
      const color = getAQIColor(airQuality?.aqi || 100);
      const circle = L.circle([lat, lon], {
        radius: 4000,
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 1,
      });
      markersRef.current.addLayer(circle);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lon]);
    }
  }, [lat, lon, airQuality, trafficCongestion, savedLocations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className={`glass-card overflow-hidden ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Global Map
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time traffic, incidents & air quality monitoring
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 inline-block" />
                Good (0-50)
              </Badge>
              <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5 inline-block" />
                Moderate (51-100)
              </Badge>
              <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5 inline-block" />
                Unhealthy (101-150)
              </Badge>
              <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 inline-block" />
                Very Unhealthy (151+)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={mapContainerRef}
            className="h-[450px] w-full"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            }}
          />
        </CardContent>
      </Card>

      {/* Add CSS for marker animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .leaflet-popup-tip {
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </motion.div>
  );
};

export const CityMap = memo(CityMapComponent);
export default CityMap;

