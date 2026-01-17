import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, Zap, Thermometer, CloudRain, Users, Wheat, Factory } from 'lucide-react';
import type { ScenarioParams } from '@/lib/dataSimulation';
import { cn } from '@/lib/utils';

interface ScenarioPanelProps {
  scenario: ScenarioParams;
  onUpdate: (params: Partial<ScenarioParams>) => void;
  onReset: () => void;
}

interface ScenarioSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  icon: React.ReactNode;
  color: string;
  unit?: string;
  onChange: (value: number) => void;
}

const ScenarioSlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  icon,
  color,
  unit = '%',
  onChange,
}: ScenarioSliderProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg', color)}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={cn(
        'text-sm font-mono font-medium px-2 py-0.5 rounded',
        value > 0 ? 'text-destructive bg-destructive/10' : 
        value < 0 ? 'text-success bg-success/10' : 
        'text-muted-foreground bg-muted'
      )}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      className="cursor-pointer"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

export const ScenarioPanel = ({ scenario, onUpdate, onReset }: ScenarioPanelProps) => {
  const isModified = Object.values(scenario).some(v => v !== 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Scenario Planning</h2>
            <p className="text-xs text-muted-foreground">What-if analysis</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!isModified}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        <ScenarioSlider
          label="Rainfall Change"
          value={scenario.rainfall}
          min={-50}
          max={100}
          icon={<CloudRain className="w-4 h-4 text-info" />}
          color="bg-info/20"
          onChange={(v) => onUpdate({ rainfall: v })}
        />

        <ScenarioSlider
          label="Temperature Change"
          value={scenario.temperature}
          min={-10}
          max={15}
          unit="°C"
          icon={<Thermometer className="w-4 h-4 text-warning" />}
          color="bg-warning/20"
          onChange={(v) => onUpdate({ temperature: v })}
        />

        <ScenarioSlider
          label="Population Density"
          value={scenario.populationDensity}
          min={-20}
          max={50}
          icon={<Users className="w-4 h-4 text-chart-traffic" />}
          color="bg-chart-traffic/20"
          onChange={(v) => onUpdate({ populationDensity: v })}
        />

        <ScenarioSlider
          label="Food Supply Shock"
          value={scenario.foodSupplyShock}
          min={-50}
          max={0}
          icon={<Wheat className="w-4 h-4 text-chart-agriculture" />}
          color="bg-chart-agriculture/20"
          onChange={(v) => onUpdate({ foodSupplyShock: v })}
        />

        <ScenarioSlider
          label="Energy Demand"
          value={scenario.energyDemand}
          min={-30}
          max={50}
          icon={<Factory className="w-4 h-4 text-chart-energy" />}
          color="bg-chart-energy/20"
          onChange={(v) => onUpdate({ energyDemand: v })}
        />
      </div>

      {isModified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/30"
        >
          <p className="text-sm text-warning font-medium">
            ⚡ Scenario active — viewing projected impacts
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
