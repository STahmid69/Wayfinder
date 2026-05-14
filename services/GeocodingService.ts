// ─── Nominatim Geocoding Service ──────────────────────────────────────────────
// Free geocoding using OpenStreetMap's Nominatim API.
// Rate limit: max 1 request per second (we debounce in the UI).

export type PlaceResult = {
    id: string;
    displayName: string;
    shortName: string;
    lat: number;
    lng: number;
    type: string;
};

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Simple in-memory cache for recent searches
const searchCache = new Map<string, { results: PlaceResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
    if (!query || query.trim().length < 2) return [];

    const cacheKey = query.trim().toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.results;
    }

    try {
        const params = new URLSearchParams({
            q: query.trim(),
            format: 'json',
            addressdetails: '1',
            limit: '6',
            'accept-language': 'en',
        });

        const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
            headers: {
                'User-Agent': 'Wayfinder-App/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();
        const results: PlaceResult[] = data.map((item: any) => ({
            id: item.place_id?.toString() || Math.random().toString(36).substring(2, 9),
            displayName: item.display_name || '',
            shortName: buildShortName(item),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || item.class || 'place',
        }));

        searchCache.set(cacheKey, { results, timestamp: Date.now() });
        return results;
    } catch (error) {
        console.warn('Geocoding error:', error);
        return [];
    }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            'accept-language': 'en',
            zoom: '18',
        });

        const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
            headers: {
                'User-Agent': 'Wayfinder-App/1.0',
            },
        });

        if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const data = await response.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function buildShortName(item: any): string {
    const addr = item.address || {};
    const name = item.name || addr.amenity || addr.building || addr.shop || addr.tourism || '';
    const road = addr.road || addr.pedestrian || '';
    const city = addr.city || addr.town || addr.village || addr.suburb || '';

    if (name && city) return `${name}, ${city}`;
    if (name) return name;
    if (road && city) return `${road}, ${city}`;
    if (road) return road;
    if (city) return city;

    // Fallback: truncate display_name
    const display = item.display_name || '';
    const parts = display.split(',').slice(0, 2);
    return parts.join(',').trim() || display.substring(0, 40);
}

// Map place types to emoji icons for the UI
export function getPlaceIcon(type: string): string {
    const map: Record<string, string> = {
        restaurant: '🍽️',
        cafe: '☕',
        fuel: '⛽',
        hospital: '🏥',
        hotel: '🏨',
        parking: '🅿️',
        school: '🏫',
        university: '🎓',
        supermarket: '🛒',
        pharmacy: '💊',
        bank: '🏦',
        cinema: '🎬',
        airport: '✈️',
        station: '🚉',
        bus_stop: '🚌',
        mosque: '🕌',
        church: '⛪',
        temple: '🛕',
        park: '🌳',
        mall: '🏬',
    };
    return map[type] || '📍';
}
