import { motion } from 'framer-motion';
import type { HeatmapCell } from '@/lib/dataSimulation';
import { cn } from '@/lib/utils';

interface RiskHeatmapProps {
  data: HeatmapCell[];
  title: string;
  subtitle?: string;
  className?: string;
}

const getHeatmapColor = (value: number): string => {
  if (value < 25) return 'bg-success/60';
  if (value < 50) return 'bg-warning/40';
  if (value < 75) return 'bg-warning/70';
  return 'bg-destructive/70';
};

export const RiskHeatmap = ({ data, title, subtitle, className }: RiskHeatmapProps) => {
  const rows = Math.max(...data.map(d => d.y)) + 1;
  const cols = Math.max(...data.map(d => d.x)) + 1;
  
  const districts = ['North', 'South', 'East', 'West', 'Central', 'Industrial', 'Residential', 'Commercial'];
  const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

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

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hours header */}
          <div className="flex gap-1 mb-1 pl-24">
            {hours.slice(0, cols).map((hour, i) => (
              <div key={i} className="w-8 text-[10px] text-muted-foreground text-center">
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-1 items-center">
                <div className="w-24 text-xs text-muted-foreground truncate">
                  {districts[rowIdx % districts.length]}
                </div>
                {Array.from({ length: cols }).map((_, colIdx) => {
                  const cell = data.find(d => d.x === colIdx && d.y === rowIdx);
                  const value = cell?.value ?? 0;
                  return (
                    <motion.div
                      key={colIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (rowIdx * cols + colIdx) * 0.005 }}
                      className={cn(
                        'heatmap-cell w-8 h-6 cursor-pointer',
                        getHeatmapColor(value)
                      )}
                      title={`${cell?.label}: ${value.toFixed(0)}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-success/60" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-warning/40" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-warning/70" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-destructive/70" />
          <span className="text-xs text-muted-foreground">Critical</span>
        </div>
      </div>
    </motion.div>
  );
};
