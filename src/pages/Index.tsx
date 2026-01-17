import { useState } from 'react';
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
  WifiOff
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CityHealthGauge } from '@/components/dashboard/CityHealthGauge';
import { ScenarioPanel } from '@/components/dashboard/ScenarioPanel';
import { DataChart } from '@/components/dashboard/DataChart';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { CityMap } from '@/components/dashboard/CityMap';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { data, scenario, updateScenario, resetScenario, refreshData } = useRealTimeData(30000);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="pl-64 transition-all duration-300">
        <Header 
          lastUpdated={data.lastUpdated} 
          onRefresh={refreshData} 
          isLoading={data.isLoading}
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
                {activeSection === 'urban' && 'Urban Infrastructure'}
                {activeSection === 'health' && 'Public Health Indicators'}
                {activeSection === 'agriculture' && 'Agricultural Supply'}
                {activeSection === 'analytics' && 'Analytics & Predictions'}
                {activeSection === 'scenarios' && 'Scenario Planning'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {activeSection === 'overview' && 'Comprehensive view of city performance metrics'}
                {activeSection === 'urban' && 'Traffic, energy, air quality and infrastructure data'}
                {activeSection === 'health' && 'Disease incidence, hospital capacity, and emergency metrics'}
                {activeSection === 'agriculture' && 'Crop yield, food supply, and price trends'}
                {activeSection === 'analytics' && 'Predictive analytics and trend analysis'}
                {activeSection === 'scenarios' && 'What-if analysis and impact projections'}
              </p>
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
              <>
                {/* Top Row: City Health + Scenario */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CityHealthGauge data={data.cityHealth} />
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
                    value={data.agriculture.foodSupplyLevel.toFixed(0)}
                    unit="%"
                    trend={data.agriculture.foodSupplyLevel < 90 ? 'down' : 'stable'}
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
                  airQuality={data.airQuality}
                  trafficCongestion={data.urban.trafficCongestion}
                />

                {/* Heatmap */}
                <RiskHeatmap
                  data={data.heatmap}
                  title="Risk Distribution Heatmap"
                  subtitle="District-wise risk levels over time"
                />
              </>
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
              </>
            )}

            {/* Health Section */}
            {activeSection === 'health' && (
              <>
                <div className="data-grid">
                  <MetricCard
                    title="Disease Incidence"
                    value={data.health.diseaseIncidence.toFixed(0)}
                    unit="/100k"
                    trend={data.health.diseaseIncidence > 150 ? 'up' : 'down'}
                    icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                    variant={data.health.diseaseIncidence > 150 ? 'warning' : 'health'}
                    delay={0.1}
                  />
                  <MetricCard
                    title="Hospital Capacity"
                    value={data.health.hospitalCapacity.toFixed(0)}
                    unit="%"
                    trend={data.health.hospitalCapacity > 80 ? 'up' : 'stable'}
                    icon={<Building2 className="w-4 h-4 text-chart-health" />}
                    variant={data.health.hospitalCapacity > 90 ? 'critical' : 'health'}
                    delay={0.15}
                  />
                  <MetricCard
                    title="Emergency Load"
                    value={data.health.emergencyLoad.toFixed(0)}
                    unit="%"
                    icon={<HeartPulse className="w-4 h-4 text-destructive" />}
                    variant={data.health.emergencyLoad > 80 ? 'critical' : 'health'}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Vaccination Rate"
                    value={data.health.vaccinationRate.toFixed(0)}
                    unit="%"
                    icon={<Syringe className="w-4 h-4 text-success" />}
                    variant="default"
                    delay={0.25}
                  />
                  <MetricCard
                    title="Avg Response Time"
                    value={data.health.avgResponseTime.toFixed(1)}
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
              </>
            )}

            {/* Agriculture Section */}
            {activeSection === 'agriculture' && (
              <>
                <div className="data-grid">
                  <MetricCard
                    title="Crop Yield Index"
                    value={data.agriculture.cropYieldIndex.toFixed(0)}
                    unit="/100"
                    trend={data.agriculture.cropYieldIndex > 70 ? 'up' : 'down'}
                    icon={<Wheat className="w-4 h-4 text-chart-agriculture" />}
                    variant="agriculture"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Food Supply Level"
                    value={data.agriculture.foodSupplyLevel.toFixed(0)}
                    unit="%"
                    trend={data.agriculture.foodSupplyLevel < 90 ? 'down' : 'stable'}
                    icon={<TrendingUp className="w-4 h-4 text-success" />}
                    variant="agriculture"
                    delay={0.15}
                  />
                  <MetricCard
                    title="Price Index"
                    value={data.agriculture.priceIndex.toFixed(0)}
                    trend={data.agriculture.priceIndex > 110 ? 'up' : 'down'}
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
                <CityHealthGauge data={data.cityHealth} />
                <DataChart
                  data={data.timeSeries}
                  title="Projected Urban Impact"
                  type="urban"
                  className="lg:col-span-2"
                />
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
