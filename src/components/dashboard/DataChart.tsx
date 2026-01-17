import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesData } from '@/lib/dataSimulation';
import { cn } from '@/lib/utils';

interface DataChartProps {
  data: TimeSeriesData[];
  title: string;
  subtitle?: string;
  type: 'urban' | 'health' | 'agriculture';
  className?: string;
}

const chartConfigs = {
  urban: {
    dataKeys: [
      { key: 'trafficCongestion', name: 'Traffic', color: 'hsl(262, 83%, 58%)' },
      { key: 'airQualityIndex', name: 'AQI', color: 'hsl(187, 85%, 53%)' },
      { key: 'publicTransportUsage', name: 'Public Transit', color: 'hsl(217, 91%, 60%)' },
    ],
    accessor: (d: TimeSeriesData) => d.urban,
  },
  health: {
    dataKeys: [
      { key: 'hospitalCapacity', name: 'Hospital Capacity', color: 'hsl(340, 82%, 52%)' },
      { key: 'emergencyLoad', name: 'Emergency Load', color: 'hsl(0, 72%, 51%)' },
      { key: 'vaccinationRate', name: 'Vaccination', color: 'hsl(142, 71%, 45%)' },
    ],
    accessor: (d: TimeSeriesData) => d.health,
  },
  agriculture: {
    dataKeys: [
      { key: 'cropYieldIndex', name: 'Crop Yield', color: 'hsl(142, 71%, 45%)' },
      { key: 'foodSupplyLevel', name: 'Food Supply', color: 'hsl(48, 96%, 53%)' },
      { key: 'priceIndex', name: 'Price Index', color: 'hsl(38, 92%, 50%)' },
    ],
    accessor: (d: TimeSeriesData) => d.agriculture,
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.name}:</span>
            <span className="font-mono font-medium">{entry.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DataChart = ({ data, title, subtitle, type, className }: DataChartProps) => {
  const config = chartConfigs[type];
  
  const chartData = data.map((d) => {
    const metrics = config.accessor(d);
    return {
      time: d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...metrics,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('glass-card p-5', className)}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {config.dataKeys.map(({ key, color }) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <YAxis
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
            />
            {config.dataKeys.map(({ key, name, color }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
