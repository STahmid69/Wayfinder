// ─── OpenRouteService Routing Service ─────────────────────────────────────────
// Provides driving directions, route polylines, and turn-by-turn instructions.

const ORS_BASE = 'https://api.openrouteservice.org/v2';

export type LatLng = { lat: number; lng: number };

export type RouteStep = {
    instruction: string;
    distance: number;      // meters
    duration: number;       // seconds
    type: number;           // ORS maneuver type
    waypoints: number[];    // indices into the polyline
};

export type RouteResult = {
    polyline: LatLng[];
    distance: number;       // meters
    duration: number;       // seconds
    steps: RouteStep[];
    bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
};

// ORS encodes polylines using the standard Google Polyline Algorithm
function decodePolyline(encoded: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
}

// Map ORS step type numbers to human-readable turn icons
const MANEUVER_ICONS: Record<number, string> = {
    0: '↰',   // Left
    1: '↱',   // Right
    2: '←',   // Sharp left
    3: '→',   // Sharp right
    4: '↖',   // Slight left
    5: '↗',   // Slight right
    6: '↑',   // Straight
    7: '🔄',  // Enter roundabout
    8: '🔄',  // Exit roundabout
    9: '↩',   // U-turn
    10: '🏁', // Arrive
    11: '🚀', // Depart
    12: '↖',  // Keep left
    13: '↗',  // Keep right
};

export function getManeuverIcon(type: number): string {
    return MANEUVER_ICONS[type] || '↑';
}

export async function getRoute(
    start: LatLng,
    end: LatLng,
    apiKey: string
): Promise<RouteResult> {
    const url = `${ORS_BASE}/directions/driving-car`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey,
        },
        body: JSON.stringify({
            coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat],
            ],
            instructions: true,
            geometry: true,
            preference: 'fastest',
            units: 'km',
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Routing failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) {
        throw new Error('No route found');
    }

    const polyline = decodePolyline(route.geometry);
    const summary = route.summary;
    const segments = route.segments || [];

    const steps: RouteStep[] = [];
    for (const segment of segments) {
        for (const step of segment.steps || []) {
            steps.push({
                instruction: step.instruction || '',
                distance: step.distance * 1000,  // km → m
                duration: step.duration,
                type: step.type ?? 6,
                waypoints: step.way_points || [],
            });
        }
    }

    return {
        polyline,
        distance: summary.distance * 1000,  // km → m
        duration: summary.duration,
        steps,
        bbox: route.bbox || [0, 0, 0, 0],
    };
}

// Calculate distance from a point to the nearest point on the route polyline (meters)
export function distanceToRoute(point: LatLng, polyline: LatLng[]): number {
    let minDist = Infinity;

    for (let i = 0; i < polyline.length - 1; i++) {
        const dist = pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
        if (dist < minDist) minDist = dist;
    }

    return minDist;
}

function pointToSegmentDistance(p: LatLng, a: LatLng, b: LatLng): number {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return haversineMeters(p, a);

    let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const proj = { lat: a.lat + t * dy, lng: a.lng + t * dx };
    return haversineMeters(p, proj);
}

export function haversineMeters(a: LatLng, b: LatLng): number {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Find the closest point index on a polyline for progress tracking
export function findClosestPointIndex(point: LatLng, polyline: LatLng[]): number {
    let minDist = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < polyline.length; i++) {
        const dist = haversineMeters(point, polyline[i]);
        if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
        }
    }

    return closestIdx;
}

// Format distance for display
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// Format duration for display
export function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// Calculate ETA
export function calculateETA(durationSeconds: number): string {
    const eta = new Date(Date.now() + durationSeconds * 1000);
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
