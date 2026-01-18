import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, Zap, Info } from 'lucide-react';
import type { CityHealthIndex } from '@/lib/dataSimulation';
import { cn } from '@/lib/utils';

interface CityHealthGaugeProps {
  data: CityHealthIndex;
  isScenarioActive?: boolean;
}

const riskColors = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-chart-health',
  critical: 'text-destructive',
};

const riskBgColors = {
  low: 'bg-success/20',
  medium: 'bg-warning/20',
  high: 'bg-chart-health/20',
  critical: 'bg-destructive/20',
};

export const CityHealthGauge = ({ data, isScenarioActive }: CityHealthGaugeProps) => {
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  // Calculate gauge rotation (-90 to 90 degrees)
  const rotation = (data.overall / 100) * 180 - 90;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-card-elevated p-6 relative transition-all duration-500",
        isScenarioActive ? "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-none"
      )}
    >
      {isScenarioActive && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-10">
          <div className="bg-primary px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
            <Zap className="w-3 h-3 text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Live Scenario Active</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">City Health Index</h2>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          riskBgColors[data.riskLevel],
          riskColors[data.riskLevel]
        )}>
          {data.riskLevel === 'critical' || data.riskLevel === 'high' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : null}
          {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)} Risk
        </div>
      </div>

      {/* Gauge Visualization */}
      <div className="relative flex flex-col items-center mb-6">
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 border-[12px] border-secondary rounded-t-full" />

          {/* Colored arc segments */}
          <svg className="absolute inset-0 w-48 h-24" viewBox="0 0 192 96">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(0 72% 51%)" />
                <stop offset="25%" stopColor="hsl(38 92% 50%)" />
                <stop offset="50%" stopColor="hsl(48 96% 53%)" />
                <stop offset="75%" stopColor="hsl(142 71% 45%)" />
                <stop offset="100%" stopColor="hsl(187 85% 53%)" />
              </linearGradient>
            </defs>
            <path
              d="M 12 96 A 84 84 0 0 1 180 96"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset={264 - (data.overall / 100) * 264}
              className="transition-all duration-1000"
            />
          </svg>

          {/* Needle */}
          <motion.div
            className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ duration: 1, type: 'spring', stiffness: 50 }}
            style={{ transformOrigin: 'bottom center', marginLeft: '-2px' }}
          >
            <div className="w-1 h-full bg-foreground rounded-full shadow-lg" />
            <div className="absolute bottom-0 left-1/2 w-4 h-4 -ml-2 bg-foreground rounded-full border-2 border-background" />
          </motion.div>
        </div>

        {/* Score Display */}
        <div className="mt-4 text-center">
          <motion.span
            key={data.overall}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold font-mono gradient-text"
          >
            {data.overall}
          </motion.span>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TrendIcon className={cn('w-4 h-4', data.trend === 'up' ? 'text-success' : data.trend === 'down' ? 'text-destructive' : 'text-muted-foreground')} />
            <span className="text-sm text-muted-foreground">
              {data.trend === 'up' ? 'Improving' : data.trend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-indices */}
      <div className="grid grid-cols-3 gap-4">
        <SubIndex label="Urban" value={data.urban} color="chart-urban" />
        <SubIndex label="Health" value={data.health} color="chart-health" />
        <SubIndex label="Agriculture" value={data.agriculture} color="chart-agriculture" />
      </div>

      <AnimatePresence>
        {isScenarioActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-4 border-t border-primary/20 flex items-start gap-3 bg-primary/5 rounded-xl p-3"
          >
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
              <span className="font-bold">Scenario Notice:</span> This City Health Index is currently dependent on the active simulation parameters.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface SubIndexProps {
  label: string;
  value: number;
  color: string;
}

const SubIndex = ({ label, value, color }: SubIndexProps) => (
  <div className="text-center">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
      {value > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={cn('absolute inset-y-0 left-0 rounded-full', `bg-${color}`)}
        />
      )}
    </div>
    <div className={cn('text-lg font-semibold font-mono mt-1', `text-${color}`)}>
      {value === 0 ? <span className="opacity-30">—</span> : value}
    </div>
  </div>
);
