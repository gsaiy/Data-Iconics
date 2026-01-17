import { motion } from 'framer-motion';
import { RefreshCw, Bell, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header = ({ lastUpdated, onRefresh, isLoading }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.05);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-semibold">Smart City Intelligence</h1>
          <p className="text-xs text-muted-foreground">Real-time urban analytics platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
          isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Live</span>
              <span className="status-indicator bg-success" />
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <motion.div
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          Refresh
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  );
};
