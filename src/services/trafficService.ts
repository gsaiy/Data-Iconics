import { tomtomClient } from './apiClient';

export interface TrafficData {
    congestion: number;
    speed: number;
    flowData?: any;
}

export const fetchTrafficData = async (lat: number, lon: number): Promise<TrafficData> => {
    try {
        const response = await tomtomClient.get(`/flowSegmentData/relative0/10/json`, {
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
    } catch (error) {
        console.error('Error fetching TomTom traffic data:', error);
        throw error;
    }
};
