import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Plus, Trash2, CheckCircle2, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchLocations, LocationSearchResult } from '@/services/locationService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ManageAreasProps {
    currentLocation: { lat: number; lon: number; name: string };
    onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
    savedAreas: { lat: number; lon: number; name: string }[];
    onSavedAreasChange: (areas: { lat: number; lon: number; name: string }[]) => void;
}

const ManageAreas = ({ currentLocation, onLocationSelect, savedAreas, onSavedAreasChange }: ManageAreasProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<LocationSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const searchResults = await searchLocations(searchQuery);
        setResults(searchResults);
        setIsSearching(false);
    };

    const addArea = (area: LocationSearchResult) => {
        const newArea = { name: area.name, lat: area.lat, lon: area.lon };
        if (savedAreas.some(a => a.lat === area.lat && a.lon === area.lon)) {
            toast.error('Area already added');
            return;
        }
        const updated = [...savedAreas, newArea];
        onSavedAreasChange(updated);
        setSearchQuery('');
        setResults([]);
        toast.success(`Added ${area.name}`);
    };

    const removeArea = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const updated = savedAreas.filter((_, i) => i !== index);
        onSavedAreasChange(updated);
        toast.info('Area removed');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Column */}
                <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle>Add New Area</CardTitle>
                        <CardDescription>Search for a city or region to monitor</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search city (e.g. Ahmedabad)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-800/50 border-slate-700/50"
                                />
                            </div>
                            <Button type="submit" disabled={isSearching}>
                                {isSearching ? '...' : 'Search'}
                            </Button>
                        </form>

                        <div className="space-y-2">
                            <AnimatePresence>
                                {results.map((result, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-slate-700/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{result.name}</p>
                                                <p className="text-xs text-muted-foreground">{result.address}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => addArea(result)}
                                            className="hover:bg-primary/20 hover:text-primary"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {!isSearching && searchQuery && results.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-4">No results found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Saved Areas Column */}
                <Card className="glass-card border-none bg-slate-900/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle>My Monitored Areas</CardTitle>
                        <CardDescription>Quickly switch between saved locations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {savedAreas.map((area, i) => {
                                const isActive = currentLocation.lat === area.lat && currentLocation.lon === area.lon;
                                return (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => onLocationSelect(area)}
                                        className={`
                      flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                      ${isActive
                                                ? 'bg-primary/20 border-primary/50 border shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                : 'bg-slate-800/30 border-transparent border hover:border-slate-700/50'}
                    `}
                                    >
                                        <div className="flex items-center gap-4">
                                            {isActive ? (
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Navigation className="w-5 h-5 text-slate-500" />
                                            )}
                                            <div>
                                                <p className={`font-semibold ${isActive ? 'text-primary' : 'text-slate-200'}`}>
                                                    {area.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {area.lat.toFixed(4)}, {area.lon.toFixed(4)}
                                                </p>
                                            </div>
                                        </div>

                                        {!isActive && savedAreas.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={(e) => removeArea(e, i)}
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {isActive && (
                                            <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                                                Active
                                            </Badge>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ManageAreas;
