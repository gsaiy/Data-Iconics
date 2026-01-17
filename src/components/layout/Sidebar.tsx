import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  HeartPulse,
  Wheat,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Cloudy,
  Map
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'weather', label: 'Live Weather', icon: Cloudy },
  { id: 'areas', label: 'Manage Areas', icon: Map },
  { id: 'urban', label: 'Urban Metrics', icon: Building2 },
  { id: 'health', label: 'Public Health', icon: HeartPulse },
  { id: 'agriculture', label: 'Agriculture', icon: Wheat },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'scenarios', label: 'Scenarios', icon: Zap },
];

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'fixed left-0 top-0 h-screen z-50 transition-all duration-300',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">UrbanExus</span>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>
    </motion.aside>
  );
};
