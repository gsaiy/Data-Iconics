
import React, { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Map as MapIcon, BarChart3 } from 'lucide-react';
import {
    fetchRealTrafficIncidents,
    getColorForCongestion,
    predictTrafficModel,
    type TrafficHotspot
} from '@/services/trafficPredictionService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { fetchTrafficData } from '@/services/trafficService';

interface TrafficPredictorMapProps {
    lat: number;
    lon: number;
    onLocationChange?: (lat: number, lon: number, name?: string) => void;
    className?: string;
}

const TrafficPredictorMapComponent = ({ lat, lon, onLocationChange, className }: TrafficPredictorMapProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const [hotspots, setHotspots] = useState<TrafficHotspot[]>([]);
    const [selectedHotspot, setSelectedHotspot] = useState<TrafficHotspot | null>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [simulatedHour, setSimulatedHour] = useState<number>(new Date().getHours());
    const [probeMarker, setProbeMarker] = useState<L.Marker | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchRealTrafficIncidents(lat, lon);
            setHotspots(data);
        };
        loadData();

        // Update prediction whenever hour or selection changes
        const currentCongestion = selectedHotspot ? selectedHotspot.currentCongestion : 50;
        setPrediction(predictTrafficModel(currentCongestion, simulatedHour, selectedHotspot?.peakHours));
    }, [lat, lon, simulatedHour, selectedHotspot]);

    // Map Initialization
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [lat, lon],
            zoom: 13,
            zoomControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
        }).addTo(map);

        // Handle Map Click for Probe
        map.on('click', async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            // Sync with global location
            if (onLocationChange) onLocationChange(lat, lng, 'Selected Point');

            try {
                // Fetch real speed/flow for this point
                const flow = await fetchTrafficData(lat, lng);

                // Create a temporary hotspot from flow data
                const probeData: TrafficHotspot = {
                    id: 'probe-' + Date.now(),
                    name: 'Live Road Analysis',
                    lat,
                    lon: lng,
                    currentCongestion: flow.congestion,
                    peakHours: Array.from({ length: 24 }, (_, h) => {
                        let multiplier = 0.5;
                        if (h >= 8 && h <= 10) multiplier = 1.3;
                        if (h >= 17 && h <= 19) multiplier = 1.6;
                        return { hour: h, level: Math.min(100, Math.round(flow.congestion * multiplier)) };
                    }),
                    predictedStatus: flow.congestion > 60 ? 'worsening' : 'stable',
                    incidentType: 'Live Flow Analysis',
                    delay: flow.congestion > 40 ? Math.round(flow.congestion / 5) : 0
                };

                setSelectedHotspot(probeData);
                setPrediction(predictTrafficModel(probeData.currentCongestion, simulatedHour, probeData.peakHours));

                // Add a visual 'Probe' marker
                if (markersRef.current) {
                    // Logic to clear old probes if preferred, or just let them stay
                    const probeIcon = L.divIcon({
                        className: 'probe-marker',
                        html: `<div style="width: 20px; height: 20px; border: 3px solid #3b82f6; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s infinite;"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    L.marker([lat, lng], { icon: probeIcon }).addTo(markersRef.current);
                }
            } catch (err) {
                console.error("Probe fetch failed", err);
            }
        });

        markersRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (!markersRef.current || !mapInstanceRef.current) return;
        markersRef.current.clearLayers();

        hotspots.forEach((hotspot) => {
            const color = getColorForCongestion(hotspot.currentCongestion);

            const icon = L.divIcon({
                className: 'traffic-hotspot-marker',
                html: `
          <div style="position: relative;">
            <div style="
              width: 24px; 
              height: 24px; 
              background: ${color}; 
              border-radius: 50%; 
              border: 2px solid white;
              box-shadow: 0 0 15px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              animation: breathe 2s infinite ease-in-out;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; opacity: 0.5;"></div>
            </div>
          </div>
        `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            const marker = L.marker([hotspot.lat, hotspot.lon], { icon });

            marker.on('click', (e) => {
                setSelectedHotspot(hotspot);
                setPrediction(predictTrafficModel(hotspot.currentCongestion, simulatedHour, hotspot.peakHours));
                mapInstanceRef.current?.panTo([hotspot.lat, hotspot.lon]);
                L.DomEvent.stopPropagation(e);
            });

            marker.bindPopup(`
                <div class="p-2 min-w-[120px]">
                    <h5 class="font-bold text-sm">${hotspot.name}</h5>
                    <div class="text-[10px] text-slate-500 uppercase">${hotspot.incidentType || 'Incident'}</div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-xs">Congestion</span>
                        <span class="font-bold" style="color: ${color}">${hotspot.currentCongestion}%</span>
                    </div>
                    ${hotspot.delay ? `<div class="text-[10px] text-red-400 mt-1">+${hotspot.delay}m delay</div>` : ''}
                </div>
            `, { className: 'glass-popup' });

            markersRef.current?.addLayer(marker);
        });

        // Re-add selected probe if it's not in the incidents list
        if (selectedHotspot && selectedHotspot.id.startsWith('probe-')) {
            const probeIcon = L.divIcon({
                className: 'probe-marker',
                html: `<div style="width: 20px; height: 20px; border: 3px solid #3b82f6; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s infinite;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            const pMarker = L.marker([selectedHotspot.lat, selectedHotspot.lon], { icon: probeIcon });
            pMarker.bindPopup(`<div class="p-2 font-bold text-xs text-blue-400">Live Probe Active</div>`);
            pMarker.addTo(markersRef.current);
        }

        if (mapInstanceRef.current && hotspots.length > 0) {
            mapInstanceRef.current.setView([lat, lon], 13);
        }
    }, [hotspots, lat, lon, selectedHotspot, simulatedHour]);

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
            {/* Map Content */}
            <Card className="lg:col-span-2 glass-card overflow-hidden h-[500px] flex flex-col">
                <CardHeader className="p-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-red-500/20">
                                <MapIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base uppercase tracking-wider font-bold">Traffic Congestion Insights</CardTitle>
                                <CardDescription className="text-xs">Hotspot detection & predictive analytics</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                            Live TomTom Data
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 grow relative">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Legend</p>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    <span className="text-xs text-slate-300">Fluid Flow</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                    <span className="text-xs text-slate-300">Moderate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                    <span className="text-xs text-slate-300">Heavy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <span className="text-xs text-slate-300">Stalled</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {!selectedHotspot && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-x-0 bottom-10 flex justify-center pointer-events-none z-[1001]"
                            >
                                <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs text-white animate-bounce">
                                    Select a hotspot to view peak hours
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Analysis Side Panel */}
            <div className="flex flex-col gap-6">
                <Card className="glass-card overflow-hidden">
                    <CardHeader className="p-4 border-b border-white/10 bg-white/5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-400" />
                            PEAK HOUR ANALYSIS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {selectedHotspot ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h4 className="text-xl font-bold">{selectedHotspot.name}</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Badge variant="secondary" className={`text-[10px] py-0 h-4 ${selectedHotspot.id.startsWith('probe-') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                                {selectedHotspot.id.startsWith('probe-') ? 'Probe Analysis' : (selectedHotspot.incidentType || 'General')}
                                            </Badge>
                                            {selectedHotspot.delay !== undefined && (
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 border-red-500/30 text-red-400">
                                                    +{selectedHotspot.delay}m delay
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-emerald-400">
                                            {selectedHotspot.currentCongestion}%
                                        </div>
                                        <div className="text-[10px] uppercase text-muted-foreground">Load</div>
                                    </div>
                                </div>

                                <div className="h-[180px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={selectedHotspot.peakHours}>
                                            <defs>
                                                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="hour"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(h) => h % 4 === 0 ? `${h}h` : ''}
                                            />
                                            <YAxis hide domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                labelFormatter={(h) => `${h}:00`}
                                            />
                                            <Area type="monotone" dataKey="level" stroke="#10b981" fillOpacity={1} fill="url(#colorLevel)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[238px] flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <Clock className="w-10 h-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Tap any hotspot on the map to unlock congestion data & peak hour patterns</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden relative border-blue-500/30">
                    <div className="absolute top-0 right-0 p-3">
                        <div className="p-1 rounded bg-blue-500/20 animate-pulse">
                            <TrendingUp className="w-3 h-3 text-blue-400" />
                        </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest text-blue-400 font-bold">ML Predictive Engine</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-black text-white">
                                        {prediction?.predictedValue || 45}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                        Predicted for {simulatedHour}:00 {prediction?.trend === 'up' ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingDown className="w-3 h-3 text-green-400" />}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-white tracking-tighter">{prediction?.confidence.toFixed(1)}%</div>
                                    <div className="text-[9px] text-muted-foreground uppercase font-medium">Confidence Score</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                    <span>Simulate Time</span>
                                    <span className="text-blue-400">{simulatedHour}:00</span>
                                </div>
                                <Slider
                                    value={[simulatedHour]}
                                    max={23}
                                    step={1}
                                    onValueChange={(vals) => setSimulatedHour(vals[0])}
                                    className="py-2"
                                />
                            </div>

                            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex gap-3 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                <p className="text-[10px] text-blue-100/70 leading-relaxed italic">
                                    Model predicts a <strong>{prediction?.trend === 'up' ? 'surge' : 'reduction'}</strong> based on {selectedHotspot ? selectedHotspot.name : 'regional'} time-series cycles.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .traffic-hotspot-marker {
          transition: transform 0.2s ease;
        }
        .traffic-hotspot-marker:hover {
          transform: scale(1.3);
          z-index: 1000 !important;
        }
      `}</style>
        </div>
    );
};

export const TrafficPredictorMap = memo(TrafficPredictorMapComponent);
export default TrafficPredictorMap;
