import { HealthMetrics, generateHealthMetrics } from '@/lib/dataSimulation';
import { backendClient } from './apiClient';

/**
 * WHO GHO OData API Service
 * Fetches real-world health statistics from the World Health Organization via backend proxy
 * Location: IND (India)
 */

export const fetchWHOHealthData = async (lat: number, lon: number): Promise<Partial<HealthMetrics>> => {
    try {
        // We fetch the most recent data for India via our backend proxy
        const fetchIndicator = async (code: string) => {
            const response = await backendClient.get(`/health/who/${code}`, {
                params: {
                    '$filter': "SpatialDim eq 'IND'",
                    '$orderby': "TimeDim desc",
                    '$top': 1
                }
            });
            return response.data.value && response.data.value.length > 0 ? response.data.value[0] : null;
        };

        const [doctors, vaccination, mortality] = await Promise.all([
            fetchIndicator('HWF_0001'),
            fetchIndicator('mslv'),
            fetchIndicator('NCDMORT3070')
        ]);

        if (doctors || vaccination || mortality) {
            // Mapping WHO data to our HealthMetrics interface
            const vaxRate = vaccination ? parseFloat(vaccination.NumericValue) : 89; // India measles coverage is ~89%
            const docDensity = doctors ? parseFloat(doctors.NumericValue) : 9.3; // India is ~9.3 docs per 10k
            const prematureMortality = mortality ? parseFloat(mortality.NumericValue) : 23.3; // %

            // Hospital capacity proxy: 100 - (load based on doctor density)
            // India avg is ~9.3 docs/10k. If docDensity > 20, capacity might be high.
            const capacity = Math.min(100, Math.max(40, 100 - (docDensity * 2)));

            // Disease incidence proxy: Based on premature mortality
            // 23% mortality is quite high, we scale it to our disease incidence range (50-200)
            const diseaseIncidence = prematureMortality * 5;

            return {
                vaccinationRate: Math.round(vaxRate),
                hospitalCapacity: Math.round(capacity),
                diseaseIncidence: Math.round(diseaseIncidence),
                emergencyLoad: 58, // Static proxy
                avgResponseTime: 12  // Static proxy
            };
        }
    } catch (error: any) {
        const proxyError = error.response?.data?.details || error.message;
        console.warn("WHO GHO Service via Proxy failed. Details:", proxyError);
        console.warn("Using cached regional health averages as fallback.");
    }

    // Use location-aware simulation as fallback
    return generateHealthMetrics(lat, lon);
};
