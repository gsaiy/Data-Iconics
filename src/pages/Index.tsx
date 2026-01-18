import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Wind,
  Zap as ZapIcon,
  Volume2,
  Train,
  HeartPulse,
  Building2,
  AlertTriangle,
  Syringe,
  Timer,
  Wheat,
  TrendingUp,
  DollarSign,
  Droplets,
  Leaf,
  Wifi,
  WifiOff,
  Map as MapIcon
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CityHealthGauge } from '@/components/dashboard/CityHealthGauge';
import { ScenarioPanel } from '@/components/dashboard/ScenarioPanel';
import { DataChart } from '@/components/dashboard/DataChart';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { CityMap } from '@/components/dashboard/CityMap';
import { TrafficPredictorMap } from '@/components/dashboard/TrafficPredictorMap';
import WeatherView from '@/components/dashboard/WeatherView';
import ManageAreas from '@/components/dashboard/ManageAreas';
import UrbanImpactAnalysis from '@/components/dashboard/UrbanImpactAnalysis';
import HealthAQICorrelation from '@/components/dashboard/HealthAQICorrelation';
import AQIPredictor from '@/components/dashboard/AQIPredictor';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Index = () => {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('urbanexus_active_section') || 'overview';
  });

  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('urbanexus_current_location');
    return saved ? JSON.parse(saved) : {
      lat: 28.6139,
      lon: 77.2090,
      name: 'Delhi NCR'
    };
  });

  const handleLocationChange = (lat: number, lon: number, name?: string) => {
    setLocation({ lat, lon, name: name || 'Selected Location' });
  };

  useEffect(() => {
    localStorage.setItem('urbanexus_active_section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('urbanexus_current_location', JSON.stringify(location));
  }, [location]);

  const [savedAreas, setSavedAreas] = useState<{ lat: number; lon: number; name: string }[]>(() => {
    const saved = localStorage.getItem('urbanexus_saved_areas');
    return saved ? JSON.parse(saved) : [
      { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
      { name: 'Gandhinagar', lat: 23.2156, lon: 72.6369 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('urbanexus_saved_areas', JSON.stringify(savedAreas));
  }, [savedAreas]);

  const { data, scenario, updateScenario, resetScenario, refreshData } = useRealTimeData(location.lat, location.lon, 10000);

  useEffect(() => {
    // Only attempt geolocation if no location is saved
    const saved = localStorage.getItem('urbanexus_current_location');
    if (!saved && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: 'Current Location'
        });
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="pl-64 transition-all duration-300">
        <Header
          lastUpdated={data.lastUpdated}
          onRefresh={refreshData}
          isLoading={data.isLoading}
          locationName={location.name}
        />

        <div className="p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Page Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold gradient-text inline-block">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'weather' && 'Live Weather Dashboard'}
                {activeSection === 'areas' && 'Manage Monitoring Areas'}
                {activeSection === 'urban' && 'Urban Infrastructure'}
                {activeSection === 'health' && 'Public Health Indicators'}
                {activeSection === 'agriculture' && 'Agricultural Supply'}
                {activeSection === 'analytics' && 'Analytics & Predictions'}
                {activeSection === 'scenarios' && 'Scenario Planning'}
                {activeSection === 'ml-predictor' && 'AQI Machine Learning Predictor'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {activeSection === 'overview' && 'Comprehensive view of city performance metrics'}
                {activeSection === 'weather' && 'Detailed meteorological data and forecasts'}
                {activeSection === 'areas' && 'Add and switch between different cities or regions'}
                {activeSection === 'urban' && 'Traffic, energy, air quality and infrastructure data'}
                {activeSection === 'health' && 'Disease incidence, hospital capacity, and emergency metrics'}
                {activeSection === 'agriculture' && 'Crop yield, food supply, and price trends'}
                {activeSection === 'analytics' && 'Predictive analytics and trend analysis'}
                {activeSection === 'scenarios' && 'What-if analysis and impact projections'}
                {activeSection === 'ml-predictor' && 'Upload CSV data to train and run AQI prediction models'}
              </p>
            </div>

            {/* Manage Areas Section */}
            {activeSection === 'areas' && (
              <ManageAreas
                currentLocation={location}
                onLocationSelect={(loc) => {
                  setLocation(loc);
                  toast.success(`Switched to ${loc.name}`);
                }}
                savedAreas={savedAreas}
                onSavedAreasChange={setSavedAreas}
              />
            )}

            {/* Overview Section */}
            {activeSection === 'overview' && (
              <>
                {/* Top Row: City Health + Scenario */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CityHealthGauge
                      data={data.cityHealth}
                      isScenarioActive={scenario.rainfall !== 0 || scenario.temperature !== 0 || scenario.populationDensity !== 0 || scenario.energyDemand !== 0}
                    />
                  </div>
                  <div>
                    <ScenarioPanel
                      scenario={scenario}
                      onUpdate={updateScenario}
                      onReset={resetScenario}
                    />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <MetricCard
                    title="Traffic Congestion"
                    value={data.urban.trafficCongestion.toFixed(0)}
                    unit="%"
                    trend={data.urban.trafficCongestion > 60 ? 'up' : 'down'}
                    trendValue={`${Math.abs(data.urban.trafficCongestion - 55).toFixed(0)}%`}
                    icon={<Car className="w-4 h-4 text-chart-traffic" />}
                    variant="urban"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Air Quality Index"
                    value={data.urban.airQualityIndex.toFixed(0)}
                    trend={data.urban.airQualityIndex > 100 ? 'down' : 'up'}
                    icon={<Wind className="w-4 h-4 text-chart-urban" />}
                    variant={data.urban.airQualityIndex > 150 ? 'critical' : data.urban.airQualityIndex > 100 ? 'warning' : 'urban'}
                    delay={0.15}
                  />
                  <MetricCard
                    title="Hospital Capacity"
                    value={data.health.hospitalCapacity.toFixed(0)}
                    unit="%"
                    trend={data.health.hospitalCapacity > 80 ? 'up' : 'stable'}
                    icon={<HeartPulse className="w-4 h-4 text-chart-health" />}
                    variant={data.health.hospitalCapacity > 90 ? 'critical' : 'health'}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Food Supply"
                    value={data.agriculture.foodSupplyLevel || 0}
                    unit="%"
                    trend={data.agriculture.foodSupplyLevel === 0 ? undefined : (data.agriculture.foodSupplyLevel < 90 ? 'down' : 'stable')}
                    icon={<Wheat className="w-4 h-4 text-chart-agriculture" />}
                    variant="agriculture"
                    delay={0.25}
                  />
                  <MetricCard
                    title="Energy Usage"
                    value={data.urban.energyUsage.toFixed(0)}
                    unit="MW"
                    trend="stable"
                    icon={<ZapIcon className="w-4 h-4 text-chart-energy" />}
                    variant="default"
                    delay={0.3}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DataChart
                    data={data.timeSeries}
                    title="Urban Metrics Trends"
                    subtitle="24-hour overview"
                    type="urban"
                  />
                  <DataChart
                    data={data.timeSeries}
                    title="Health Indicators"
                    subtitle="Real-time monitoring"
                    type="health"
                  />
                </div>

                {/* Interactive City Map */}
                <CityMap
                  lat={location.lat}
                  lon={location.lon}
                  onLocationChange={(lat, lon, name) => setLocation({ lat, lon, name: name || 'Selected Location' })}
                  airQuality={data.airQuality}
                  trafficCongestion={data.urban.trafficCongestion}
                  savedLocations={savedAreas}
                />

                {/* Heatmap */}
                <RiskHeatmap
                  data={data.heatmap}
                  title="Risk Distribution Heatmap"
                  subtitle="District-wise risk levels over time"
                />
              </>
            )}

            {/* Weather Section */}
            {activeSection === 'weather' && (
              <WeatherView
                data={data}
                locationName={location.name}
                lat={location.lat}
                lon={location.lon}
                scenarioRainfall={scenario.rainfall}
              />
            )}

            {/* Urban Section */}
            {activeSection === 'urban' && (
              <>
                <div className="data-grid">
                  <MetricCard
                    title="Traffic Congestion"
                    value={data.urban.trafficCongestion.toFixed(0)}
                    unit="%"
                    trend={data.urban.trafficCongestion > 60 ? 'up' : 'down'}
                    icon={<Car className="w-4 h-4 text-chart-traffic" />}
                    variant="urban"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Air Quality Index"
                    value={data.urban.airQualityIndex.toFixed(0)}
                    trend={data.urban.airQualityIndex > 100 ? 'down' : 'up'}
                    icon={<Wind className="w-4 h-4 text-chart-urban" />}
                    variant={data.urban.airQualityIndex > 150 ? 'critical' : 'urban'}
                    delay={0.15}
                  />
                  <MetricCard
                    title="Energy Usage"
                    value={data.urban.energyUsage.toFixed(0)}
                    unit="MW"
                    icon={<ZapIcon className="w-4 h-4 text-chart-energy" />}
                    variant="default"
                    delay={0.2}
                  />
                  <MetricCard
                    title="Noise Level"
                    value={data.urban.noiseLevel.toFixed(0)}
                    unit="dB"
                    icon={<Volume2 className="w-4 h-4 text-muted-foreground" />}
                    variant="default"
                    delay={0.25}
                  />
                  <MetricCard
                    title="Public Transit Usage"
                    value={data.urban.publicTransportUsage.toFixed(0)}
                    unit="%"
                    icon={<Train className="w-4 h-4 text-accent" />}
                    variant="default"
                    delay={0.3}
                  />
                </div>
                <DataChart
                  data={data.timeSeries}
                  title="Urban Infrastructure Trends"
                  subtitle="24-hour real-time monitoring"
                  type="urban"
                />

                <TrafficPredictorMap
                  lat={location.lat}
                  lon={location.lon}
                  weather={data.weather}
                  onLocationChange={handleLocationChange}
                />

                <UrbanImpactAnalysis defaultCity={location.name} />
              </>
            )}

            {/* Health Section */}
            {activeSection === 'health' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-900/40 border border-blue-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <HeartPulse className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">WHO Global Health Monitoring</h3>
                      <p className="text-sm text-blue-100/60">International health indicators synced via World Health Organization (WHO) GHO API</p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold px-2 py-1 rounded bg-blue-500/10">Connected to ghoapi.azureedge.net</span>
                  </div>
                </motion.div>

                <div className="data-grid">
                  <MetricCard
                    title="Disease Mortality (WHO)"
                    value={data.health.diseaseIncidence ? Math.round(data.health.diseaseIncidence) : 0}
                    unit="/100k"
                    trend={data.health.diseaseIncidence === 0 ? undefined : (data.health.diseaseIncidence > 150 ? 'up' : 'down')}
                    icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                    variant={data.health.diseaseIncidence > 150 ? 'warning' : 'health'}
                    delay={0.1}
                  />
                  <MetricCard
                    title="Hospital Capacity (WHO Proxy)"
                    value={data.health.hospitalCapacity ? Math.round(data.health.hospitalCapacity) : 0}
                    unit="%"
                    trend={data.health.hospitalCapacity === 0 ? undefined : (data.health.hospitalCapacity > 80 ? 'up' : 'stable')}
                    icon={<Building2 className="w-4 h-4 text-chart-health" />}
                    variant={data.health.hospitalCapacity > 90 ? 'critical' : 'health'}
                    delay={0.15}
                  />
                  <MetricCard
                    title="Emergency Load"
                    value={data.health.emergencyLoad ? Math.round(data.health.emergencyLoad) : 0}
                    unit="%"
                    icon={<HeartPulse className="w-4 h-4 text-destructive" />}
                    variant={data.health.emergencyLoad > 80 ? 'critical' : 'health'}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Vaccination Rate (WHO)"
                    value={data.health.vaccinationRate ? Math.round(data.health.vaccinationRate) : 0}
                    unit="%"
                    icon={<Syringe className="w-4 h-4 text-success" />}
                    variant="default"
                    delay={0.25}
                  />
                  <MetricCard
                    title="Avg Response Time"
                    value={data.health.avgResponseTime ? Number(data.health.avgResponseTime).toFixed(1) : 0}
                    unit="min"
                    icon={<Timer className="w-4 h-4 text-info" />}
                    variant="default"
                    delay={0.3}
                  />
                </div>
                <DataChart
                  data={data.timeSeries}
                  title="Public Health Trends"
                  subtitle="Real-time health metrics monitoring"
                  type="health"
                />
                <HealthAQICorrelation
                  lat={location.lat}
                  lon={location.lon}
                  cityName={location.name}
                  currentAQI={data.urban.airQualityIndex}
                />
              </>
            )}

            {/* Agriculture Section */}
            {activeSection === 'agriculture' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-900/40 border border-emerald-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Wheat className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">FAOSTAT Integrated Monitoring</h3>
                      <p className="text-sm text-emerald-100/60">Live agricultural indices synced via Food and Agriculture Organization (FAO) Web Services</p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10">Connected to faostat.fao.org</span>
                  </div>
                </motion.div>

                <div className="data-grid">
                  <MetricCard
                    title="Crop Yield (FAO Index)"
                    value={data.agriculture.cropYieldIndex ? Math.round(data.agriculture.cropYieldIndex) : 0}
                    unit="/100"
                    trend={data.agriculture.cropYieldIndex === 0 ? undefined : (data.agriculture.cropYieldIndex > 70 ? 'up' : 'down')}
                    icon={<Wheat className="w-4 h-4 text-chart-agriculture" />}
                    variant="agriculture"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Food Supply Level"
                    value={data.agriculture.foodSupplyLevel ? Math.round(data.agriculture.foodSupplyLevel) : 0}
                    unit="%"
                    trend={data.agriculture.foodSupplyLevel === 0 ? undefined : (data.agriculture.foodSupplyLevel < 90 ? 'down' : 'stable')}
                    icon={<TrendingUp className="w-4 h-4 text-success" />}
                    variant="agriculture"
                    delay={0.15}
                  />
                  <MetricCard
                    title="Price Index"
                    value={data.agriculture.priceIndex ? Math.round(data.agriculture.priceIndex) : 0}
                    trend={data.agriculture.priceIndex === 0 ? undefined : (data.agriculture.priceIndex > 110 ? 'up' : 'down')}
                    icon={<DollarSign className="w-4 h-4 text-chart-energy" />}
                    variant={data.agriculture.priceIndex > 130 ? 'warning' : 'default'}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Water Usage"
                    value={data.agriculture.waterUsage.toFixed(0)}
                    unit="ML"
                    icon={<Droplets className="w-4 h-4 text-info" />}
                    variant="default"
                    delay={0.25}
                  />
                  <MetricCard
                    title="Soil Health"
                    value={data.agriculture.soilHealth.toFixed(0)}
                    unit="/100"
                    icon={<Leaf className="w-4 h-4 text-chart-agriculture" />}
                    variant="agriculture"
                    delay={0.3}
                  />
                </div>
                <DataChart
                  data={data.timeSeries}
                  title="Agricultural Supply Trends"
                  subtitle="Food system sustainability indicators"
                  type="agriculture"
                />
              </>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <DataChart
                    data={data.timeSeries}
                    title="Urban Analytics"
                    subtitle="Traffic & infrastructure"
                    type="urban"
                  />
                  <DataChart
                    data={data.timeSeries}
                    title="Health Analytics"
                    subtitle="Healthcare capacity"
                    type="health"
                  />
                  <DataChart
                    data={data.timeSeries}
                    title="Agriculture Analytics"
                    subtitle="Supply chain metrics"
                    type="agriculture"
                  />
                </div>
                <RiskHeatmap
                  data={data.heatmap}
                  title="Predictive Risk Analysis"
                  subtitle="ML-based risk prediction across districts"
                />
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-red-400" />
                    Predictive Traffic Intelligence
                  </h3>
                  <TrafficPredictorMap
                    lat={location.lat}
                    lon={location.lon}
                    weather={data.weather}
                    onLocationChange={handleLocationChange}
                  />
                </div>
              </>
            )}

            {/* Scenarios Section */}
            {activeSection === 'scenarios' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScenarioPanel
                  scenario={scenario}
                  onUpdate={updateScenario}
                  onReset={resetScenario}
                />
                <CityHealthGauge
                  data={data.cityHealth}
                  isScenarioActive={scenario.rainfall !== 0 || scenario.temperature !== 0 || scenario.populationDensity !== 0 || scenario.energyDemand !== 0}
                />
                <DataChart
                  data={data.timeSeries}
                  title="Projected Urban Impact"
                  type="urban"
                  className="lg:col-span-2"
                />
              </div>
            )}

            {/* ML Predictor Section */}
            {activeSection === 'ml-predictor' && (
              <AQIPredictor />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
