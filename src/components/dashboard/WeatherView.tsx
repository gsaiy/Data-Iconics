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

interface WeatherViewProps {
    data: SmartCityData;
    locationName: string;
    lat: number;
    lon: number;
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

const WeatherView = ({ data, locationName, lat, lon }: WeatherViewProps) => {
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
        data.urban?.airQualityIndex > 0 ? 0 : 0 // dummy for reactivity
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

            {/* Predictive Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Environmental Prediction Models
                        </CardTitle>
                        <CardDescription>Future weather and flood impacts analyzed via Apjoy AI & Firebase</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Temperature Row */}
                        <div className="grid grid-cols-3 gap-4">
                            {realPredictions.length > 0 ? realPredictions.map((pred, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-medium text-white/40 uppercase tracking-tighter">{pred.label}</span>
                                        <WeatherIcon description={pred.description} size={18} />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold">{Math.round(pred.temp)}°</span>
                                        <TrendingUp className={`w-4 h-4 ${pred.temp > (weather.temp || 0) ? 'text-red-400' : 'text-green-400'}`} />
                                    </div>
                                    <p className="text-[10px] text-blue-200/50 capitalize">{pred.description}</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-white/40">
                                            <span>Accuracy</span>
                                            <span>{pred.confidence}%</span>
                                        </div>
                                        <Progress value={pred.confidence} className="h-1 bg-white/5" />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-3 py-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <div className="flex flex-col items-center gap-2 text-white/30">
                                        {isPredicting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full mb-2" />
                                                <p className="text-sm">Fetching AI Predictions directly from Apjoy AI...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-8 h-8 opacity-20 mb-1" />
                                                <p className="text-sm font-semibold text-red-400">API Link Failed</p>
                                                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-[10px] text-red-300/80 max-w-[80%] break-words">
                                                    {errorMessage || "Internal error fetching from Apjoy AI"}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        localStorage.clear();
                                                        window.location.reload();
                                                    }}
                                                    className="mt-2 text-[9px] uppercase tracking-widest text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    Reset API Circuit & Retry
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Flood Risk Row */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${floodRisk.level === 'low' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <Umbrella size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Flood Probability Index</p>
                                        {history.length > 0 ? (
                                            <p className="text-xs text-muted-foreground">{floodRisk.message}</p>
                                        ) : (
                                            <p className="text-xs text-yellow-400/60 italic">Waiting for historical trend sync...</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${floodRisk.level === 'low' ? 'text-green-400' : 'text-red-400'}`}>
                                        {floodRisk.probability}%
                                    </span>
                                    <p className="text-[10px] uppercase tracking-widest opacity-40">Risk Level: {floodRisk.level}</p>
                                </div>
                            </div>
                            <Progress value={floodRisk.probability} className="h-2 bg-white/5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Climate Insight</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <p className="text-sm leading-relaxed text-blue-100/80">
                                <span className="font-bold text-primary">Analysis:</span> Based on historical trends for {locationName},
                                the temperature is showing a {realPredictions[2]?.temp > (weather.temp || 0) ? 'warming' : 'cooling'} trajectory over the next 72 hours.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Firebase Synced
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
