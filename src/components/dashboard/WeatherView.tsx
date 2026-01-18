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
    Timer,
    Brain,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SmartCityData } from '@/hooks/useRealTimeData';
import { useWeatherHistory } from '@/hooks/useWeatherHistory';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface WeatherViewProps {
    data: SmartCityData;
    locationName: string;
    lat: number;
    lon: number;
    scenarioRainfall?: number;
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

const WeatherView = ({ data, locationName, lat, lon, scenarioRainfall = 0 }: WeatherViewProps) => {
    const weather = data.weather;

    // Fetch history and run models
    const {
        predictions: realPredictions,
        floodRisk,
        isLoading: isPredicting,
        errorMessage
    } = useWeatherHistory(
        lat,
        lon,
        locationName,
        scenarioRainfall,
        weather
    );

    if (!weather) return null;

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '--:--';
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {/* ... hero section remains same ... */}
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
                                            <span>{Math.round((weather.windSpeed || 0) * 3.6)} km/h Wind</span>
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

            {/* Air Quality Detail Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Wind className="w-5 h-5 text-chart-urban" />
                            Air Quality Distribution
                        </CardTitle>
                        <CardDescription>Live concentration of primary pollutants (μg/m³)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'PM2.5', value: data.airQuality?.pm25, max: 250, color: 'bg-red-500' },
                                { label: 'PM10', value: data.airQuality?.pm10, max: 400, color: 'bg-orange-500' },
                                { label: 'Nitrogen Dioxide', value: data.airQuality?.no2, max: 200, color: 'bg-blue-500' }
                            ].map((p, i) => (
                                <div key={i} className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{p.label}</span>
                                        <span className="text-sm font-bold">{Math.round(p.value || 0)}</span>
                                    </div>
                                    <Progress value={Math.min(100, (p.value || 0) / p.max * 100)} className={`h-1.5 ${p.color}/20`} />
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center text-lg font-bold">
                                    {data.airQuality?.aqi}
                                </div>
                                <div className="space-y-px">
                                    <p className="text-sm font-bold">Computed AQI Index</p>
                                    <p className="text-[10px] text-white/40">US-EPA Standardized Metric</p>
                                </div>
                            </div>
                            <Badge className={`${data.airQuality?.aqi > 150 ? 'bg-red-500' : 'bg-green-500'} text-xs px-4 py-1`}>
                                {data.airQuality?.aqi > 150 ? 'Action Recommended' : 'Nominal Levels'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Environmental Prediction
                        </CardTitle>
                        <CardDescription>Future climate impacts analyzed via predictive models</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 3-Day Prediction Tiles */}
                        <div className="grid grid-cols-3 gap-3">
                            {realPredictions.map((pred, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-bold text-white/30 uppercase">{pred.label}</span>
                                        <WeatherIcon description={pred.description} size={14} />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold">{Math.round(pred.temp)}°</span>
                                        <TrendingUp className={`w-3 h-3 ${pred.temp > (weather.temp || 0) ? 'text-red-400' : 'text-green-400'}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] text-white/20">
                                            <span>Acc.</span>
                                            <span>{pred.confidence}%</span>
                                        </div>
                                        <Progress value={pred.confidence} className="h-0.5 bg-white/5" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <p className="text-sm leading-relaxed text-blue-100/80">
                                <span className="font-bold text-primary">Status:</span> Based on historical trends for {locationName},
                                current AQI is {data.airQuality?.aqi > 100 ? 'elevated' : 'stable'}.
                                Temperature is showing a {realPredictions[2]?.temp > (weather.temp || 0) ? 'warming' : 'cooling'} trajectory over the next 72 hours.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${floodRisk.level === 'low' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <Umbrella size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Flood Probability</p>
                                        <p className="text-xs text-muted-foreground">{floodRisk.message}</p>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <span className={`text-2xl font-bold ${floodRisk.level === 'low' ? 'text-green-400' : 'text-red-400'}`}>
                                        {floodRisk.probability}%
                                    </span>
                                </div>
                            </div>
                            <Progress value={floodRisk.probability} className="h-2 bg-white/5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

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
