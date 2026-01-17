import React from 'react';
import { motion } from 'framer-motion';
import {
    Cloud,
    CloudRain,
    Sun,
    Wind,
    Droplets,
    Thermometer,
    Sunrise,
    Sunset,
    Navigation,
    CloudLightning,
    CloudSnow,
    Umbrella,
    Eye,
    Gauge,
    Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartCityData } from '@/hooks/useRealTimeData';

interface WeatherViewProps {
    data: SmartCityData;
    locationName: string;
}

const WeatherIcon = ({ description, size = 24 }: { description: string; size?: number }) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return <Sun className={`text-yellow-400`} size={size} />;
    if (desc.includes('cloud')) return <Cloud className={`text-blue-300`} size={size} />;
    if (desc.includes('rain')) return <CloudRain className={`text-blue-500`} size={size} />;
    if (desc.includes('thunder')) return <CloudLightning className={`text-purple-500`} size={size} />;
    if (desc.includes('snow')) return <CloudSnow className={`text-white`} size={size} />;
    return <Cloud className={`text-gray-400`} size={size} />;
};

const WeatherView = ({ data, locationName }: WeatherViewProps) => {
    const weather = data.weather;

    if (!weather) return null;

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '--:--';
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {/* Current Weather Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-600/20 via-blue-900/40 to-slate-900/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                        <WeatherIcon description={weather.description || ''} size={150} />
                    </div>

                    <CardContent className="pt-8 pb-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold tracking-tight">{locationName}</h2>
                                    <p className="text-blue-200/70 font-medium capitalize">
                                        {weather.description} • Feels like {Math.round(weather.feelsLike || 0)}°C
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-7xl font-bold tracking-tighter">
                                        {Math.round(weather.temp || 0)}°C
                                    </span>
                                    <div className="h-12 w-px bg-white/10 mx-2 hidden md:block" />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-blue-100/60">
                                            <Wind size={16} />
                                            <span>{weather.windSpeed} km/h Wind</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-blue-100/60">
                                            <Droplets size={16} />
                                            <span>{weather.humidity}% Humidity</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:w-1/3">
                                <div className="glass-card-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Sunrise size={20} className="text-orange-400 mb-2" />
                                    <span className="text-xs text-white/50">Sunrise</span>
                                    <span className="font-semibold">{formatTime(weather.sunrise)}</span>
                                </div>
                                <div className="glass-card-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Sunset size={20} className="text-blue-400 mb-2" />
                                    <span className="text-xs text-white/50">Sunset</span>
                                    <span className="font-semibold">{formatTime(weather.sunset)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Atmospheric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pressure', value: `${weather.pressure || '--'} hPa`, icon: Gauge, color: 'text-purple-400' },
                    { label: 'Wind Direction', value: 'NE', icon: Navigation, color: 'text-green-400' },
                    { label: 'UV Index', value: 'Low', icon: Sun, color: 'text-yellow-400' },
                    { label: 'Visibility', value: '10 km', icon: Eye, color: 'text-blue-400' },
                ].map((metric, i) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                    >
                        <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-slate-800/50 ${metric.color}`}>
                                        <metric.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-wider">{metric.label}</p>
                                        <p className="text-lg font-bold">{metric.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Forecast Row */}
            <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Timer className="w-5 h-5 text-blue-400" />
                        Hourly Forecast (Next 24 Hours)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide">
                        {weather.forecast?.map((item, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[80px] space-y-3">
                                <span className="text-sm text-white/60">
                                    {new Date(item.dt * 1000).getHours()}:00
                                </span>
                                <div className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <WeatherIcon description={item.description} size={32} />
                                </div>
                                <span className="font-bold">{Math.round(item.temp)}°</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WeatherView;
