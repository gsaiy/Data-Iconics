import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'urban' | 'health' | 'agriculture' | 'warning' | 'critical';
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: 'border-border/50',
  urban: 'border-chart-urban/30 hover:border-chart-urban/50',
  health: 'border-chart-health/30 hover:border-chart-health/50',
  agriculture: 'border-chart-agriculture/30 hover:border-chart-agriculture/50',
  warning: 'border-warning/30 hover:border-warning/50',
  critical: 'border-destructive/30 hover:border-destructive/50',
};

const trendColors = {
  up: 'text-success',
  down: 'text-destructive',
  stable: 'text-muted-foreground',
};

export const MetricCard = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  variant = 'default',
  className,
  delay = 0,
}: MetricCardProps) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'glass-card p-5 transition-all duration-300 hover:scale-[1.02]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-secondary/50">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="metric-value">
            {value === 0 || value === '0' || !value ? (
              <span className="opacity-30">—</span>
            ) : (
              value
            )}
          </span>
          {unit && value !== 0 && value !== '0' && value && (
            <span className="text-muted-foreground text-sm">{unit}</span>
          )}
        </div>

        {trend && (
          <div className={cn('flex items-center gap-1 text-sm', trendColors[trend])}>
            <TrendIcon className="w-4 h-4" />
            {trendValue && <span className="font-medium">{trendValue}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};
