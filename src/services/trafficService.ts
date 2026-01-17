import { backendClient } from './apiClient';
import { isServiceDisabled, disableService, getServiceError } from './serviceControl';

export interface TrafficData {
    congestion: number;
    speed: number;
    flowData?: any;
}

const getSimulatedTraffic = (): TrafficData => {
    const hour = new Date().getHours();
    const peakFactor = (Math.sin((hour - 6) * Math.PI / 12) + 1) / 2;
    return {
        congestion: Math.round(20 + (peakFactor * 60)),
        speed: Math.round(60 - (peakFactor * 40))
    };
};

export const fetchTrafficData = async (lat: number, lon: number): Promise<TrafficData> => {
    if (isServiceDisabled('tomtom')) {
        console.log("Using simulated traffic data (TomTom disabled)");
        return getSimulatedTraffic();
    }

    try {
        const response = await backendClient.get('/traffic/flow', {
            params: {
                point: `${lat},${lon}`,
                unit: 'KMPH'
            }
        });

        const flow = response.data.flowSegmentData;
        const currentSpeed = flow?.currentSpeed || 30;
        const freeFlowSpeed = flow?.freeFlowSpeed || 60;

        // Calculate congestion as percentage of speed reduction
        const congestion = Math.max(0, Math.min(100, Math.round(((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100)));

        return {
            congestion,
            speed: currentSpeed,
            flowData: flow
        };
    } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
            disableService('tomtom', "TomTom API Restricted (403)");
        } else {
            console.warn('Traffic API temporary failure:', error.message);
        }

        return getSimulatedTraffic();
    }
};
