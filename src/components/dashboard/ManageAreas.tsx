import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Plus, Trash2, CheckCircle2, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchLocations, LocationSearchResult } from '@/services/locationService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { backendClient } from '@/services/apiClient';
import { getDeterministicAnalysis } from "@/services/aqiHistoryService";
// Firebase
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function getGeminiKey() {
    return import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyD-XqB7Xq8XqXqXqXqXqXqXqXqXqXqXqXq"; // Dummy placeholder, should be in .env
}

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

    // ----------------------------------------------------------------------
    // DeepSeek AI Analytics Logic
    // ----------------------------------------------------------------------
    const fetchAIAnalytics = async (city: string) => {
        try {
            // STEP 1: Fetch REAL Data Baseline (No more static data!)
            console.log(`[ManageAreas] Extracting real data for ${city}...`);
            const results = await searchLocations(city);
            if (results.length === 0) throw new Error("Could not find coordinates.");
            const geo = results[0];

            const realHistory = await getDeterministicAnalysis(geo.lat, geo.lon, city);
            const aqiContext = JSON.stringify(realHistory.data);

            const prompt = `
You are an expert Urban Environmental Data Scientist. ANALYZE historical AQI context for ${city}: ${aqiContext}.
TASK:
1. Use these EXACT AQI values for the 'data' array (2021-2025).
2. Calculate realistic Traffic Congestion % correlating with these specific AQI drops/spikes.
3. Perform a 5-year time-series regression mentally to predict 2026 values.
4. Provide a scientific 2-sentence analysis.

OUTPUT ONLY RAW JSON:
{
  "data": [ { "year": 2021, "aqi": number, "traffic": number }, ... ],
  "prediction": { "year": 2026, "aqi": number, "traffic": number },
  "analysis": "string"
}
`;

            let aiText = "";

            // Layer 0: OpenRouter (Primary)
            try {
                const response = await backendClient.post('/ai/openrouter', { prompt });
                aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (err) {
                console.warn("[AI] OpenRouter failed, trying Gemini Proxy...");
                // Layer 1: Gemini Proxy
                try {
                    const response = await backendClient.post('/ai-analyze', { prompt });
                    aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
                } catch (err2) {
                    console.error("[AI] All AI providers failed.");
                }
            }

            if (!aiText) {
                // Return Deterministic Fallback if AI fails completely
                return {
                    ...realHistory,
                    data: realHistory.data.map(p => ({ ...p, traffic: Math.round(p.aqi * 0.85) })),
                    prediction: { ...realHistory.prediction, traffic: Math.round(realHistory.prediction.aqi * 0.85) }
                };
            }

            const start = aiText.indexOf("{");
            const end = aiText.lastIndexOf("}");
            if (start === -1 || end === -1) throw new Error("Invalid format received from AI");
            return JSON.parse(aiText.slice(start, end + 1));

        } catch (err: any) {
            console.error("AI Analysis Error:", err);
            toast.error("AI Analysis skipped (Using mathematical fallback)");
            return null;
        }
    };

    // ----------------------------------------------------------------------
    // Database Handlers (Persistence)
    // ----------------------------------------------------------------------
    const performAddSequence = async (location: { name: string; lat: number; lon: number }) => {
        const docName = location.name.trim();
        const docRef = doc(db, "savedLocations", docName);

        try {
            // 1. FIRST INSERT THE LOCATION (Use setDoc)
            // We use { merge: true } so we don't wipe out existing analytics if they are there
            await setDoc(docRef, {
                ...location,
                createdAt: serverTimestamp()
            }, { merge: true });

            toast.success(`Saved ${docName} to Database`);

            // 🔹 CHECK IF ANALYTICS ALREADY EXIST (to save API quota)
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().analysis) {
                console.log(`[Analytics] Analytics for ${docName} already exist. Skipping AI fetch.`);
                toast.info(`Using existing analytics for ${docName}`);
                return;
            }

            // 2. FETCH THE DATA (ONLY IF MISSING)
            toast.info("Fetching AI Analytics...");
            const analyticsData = await fetchAIAnalytics(docName);

            if (analyticsData) {
                // 3. THEN UPDATE THE INSERTED DATA
                await updateDoc(docRef, {
                    ...analyticsData,
                    updatedAt: serverTimestamp()
                });
                toast.success("Analytics fetched & updated in Database");
            }

        } catch (error) {
            console.error("Error in add sequence:", error);
            toast.error("Failed to complete save sequence");
        }
    };

    const deleteLocation = async (locationName: string) => {
        try {
            await deleteDoc(doc(db, "savedLocations", locationName.trim()));
            toast.info(`Removed ${locationName} from Database`);
        } catch (error) {
            console.error("Error removing location:", error);
            toast.error("Failed to remove from database");
        }
    };

    // ----------------------------------------------------------------------
    // UI Handlers
    // ----------------------------------------------------------------------

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

        // Update Local State (Optimistic)
        const updated = [...savedAreas, newArea];
        onSavedAreasChange(updated);

        // EXECUTE STRICT SEQUENCE
        performAddSequence(newArea);

        // UI Reset
        setSearchQuery('');
        setResults([]);

        onLocationSelect(newArea);
    };

    const removeArea = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const areaToRemove = savedAreas[index];

        // Update Local State
        const updated = savedAreas.filter((_, i) => i !== index);
        onSavedAreasChange(updated);

        // Remove from Firebase
        deleteLocation(areaToRemove.name);
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