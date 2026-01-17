import { tomtomSearchClient } from './apiClient';

export interface LocationSearchResult {
    name: string;
    lat: number;
    lon: number;
    address?: string;
}

export const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
    if (!query || query.length < 3) return [];

    try {
        const response = await tomtomSearchClient.get(`/geocode/${encodeURIComponent(query)}.json`, {
            params: {
                limit: 5,
                typeahead: true
            }
        });

        return response.data.results.map((result: any) => ({
            name: result.poi?.name || result.address.freeformAddress,
            lat: result.position.lat,
            lon: result.position.lon,
            address: result.address.freeformAddress
        }));
    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
};
