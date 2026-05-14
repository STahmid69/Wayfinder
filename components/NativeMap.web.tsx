// @ts-nocheck — react-leaflet types are incompatible with React 19 children props
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';

// Inject Leaflet CSS immediately (not async) so tiles are sized correctly on first render
if (typeof document !== 'undefined' && !document.querySelector('link[data-leaflet-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-leaflet-css', '');
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
        .leaflet-control-zoom { display: none !important; }
        .route-marker-origin, .route-marker-destination {
            transition: transform 0.3s ease;
        }
        .route-marker-origin:hover, .route-marker-destination:hover {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);
}

export const MapView = forwardRef<any, any>(({ initialRegion, children, onMapClick }, ref) => {
    const [isClient, setIsClient] = useState(false);
    const controllerRef = useRef<any>(null);
    const MapComponents = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => controllerRef.current);

    useEffect(() => {
        const init = async () => {
            const L = (await import('leaflet')).default;
            const RL = await import('react-leaflet');
            MapComponents.current = { L, ...RL };
            setIsClient(true);
        };
        init();
    }, []);

    // After map mounts, force Leaflet to recalculate tile sizes
    useEffect(() => {
        if (!isClient) return;
        const timer = setTimeout(() => {
            if (controllerRef.current?._map) {
                controllerRef.current._map.invalidateSize();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [isClient]);

    if (!isClient || !MapComponents.current) {
        return (
            <div style={{
                position: 'absolute', inset: 0,
                backgroundColor: '#aad3df',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ color: '#555', fontFamily: 'sans-serif', fontSize: 14 }}>Loading map…</div>
            </div>
        );
    }

    const { MapContainer, TileLayer, useMap, useMapEvents } = MapComponents.current;

    const center: [number, number] = [
        initialRegion?.latitude ?? 3.139,
        initialRegion?.longitude ?? 101.6869,
    ];

    const isDark = typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const MapController = ({ innerRef, center }: { innerRef: React.MutableRefObject<any>, center: [number, number] }) => {
        const map = useMap();

        // Update map center when coordinates change
        useEffect(() => {
            if (center[0] !== 0 && center[1] !== 0) {
                map.setView(center, map.getZoom());
            }
        }, [center, map]);

        useEffect(() => {
            if (innerRef && !innerRef.current?._map) {
                if (innerRef.current) innerRef.current._map = map;
                setTimeout(() => map.invalidateSize(), 100);
            }
        }, [map]);

        useImperativeHandle(innerRef, () => ({
            _map: map,
            animateToRegion: (region: { latitude: number; longitude: number }) => {
                map.flyTo([region.latitude, region.longitude], map.getZoom(), { duration: 0.8 });
            },
            fitBounds: (bounds: [[number, number], [number, number]]) => {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            },
        }));
        return null;
    };

    // Map click handler component
    const ClickHandler = ({ onClick }: { onClick?: (latlng: { lat: number; lng: number }) => void }) => {
        useMapEvents({
            click: (e: any) => {
                if (onClick) {
                    onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
                }
            },
        });
        return null;
    };

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MapContainer
                center={center}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    attribution={attribution}
                    url={tileUrl}
                    maxZoom={19}
                />
                <MapController innerRef={controllerRef} center={center} />
                {onMapClick && <ClickHandler onClick={onMapClick} />}
                {children}
            </MapContainer>
        </div>
    );
});

MapView.displayName = 'MapView';

// ─── Convoy Car Marker ────────────────────────────────────────────────────────
export function Marker({ coordinate, markerColor = '#FF6A00', markerLabel = '', children }: any) {
    const [L, setL] = useState<any>(null);
    const [RLMarker, setRLMarker] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const Leaflet = (await import('leaflet')).default;
            const { Marker: M } = await import('react-leaflet');
            setL(Leaflet);
            setRLMarker(() => M);
        };
        init();
    }, []);

    if (!L || !RLMarker) return null;

    const icon = L.divIcon({
        className: '',
        iconSize: [110, 50],
        iconAnchor: [55, 50],
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                <div style="
                    background:${markerColor};
                    padding:3px 8px;
                    border-radius:12px;
                    font-size:10px;
                    font-weight:900;
                    color:black;
                    white-space:nowrap;
                    box-shadow:0 2px 6px rgba(0,0,0,0.35);
                    font-family:-apple-system,sans-serif;
                    letter-spacing:0.3px;
                    max-width:110px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                ">${markerLabel}</div>
                <div style="
                    width:28px;
                    height:28px;
                    background:${markerColor};
                    border-radius:50%;
                    border:2.5px solid white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    box-shadow:0 3px 8px rgba(0,0,0,0.4);
                    font-size:15px;
                ">🚗</div>
            </div>
        `,
    });

    return <RLMarker position={[coordinate.latitude, coordinate.longitude]} icon={icon} />;
}

// ─── Route Polyline ───────────────────────────────────────────────────────────
export function RoutePolyline({ positions, color = '#FF6A00', weight = 5, opacity = 0.85 }: {
    positions: { lat: number; lng: number }[];
    color?: string;
    weight?: number;
    opacity?: number;
}) {
    const [Comp, setComp] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const { Polyline } = await import('react-leaflet');
            setComp(() => Polyline);
        };
        init();
    }, []);

    if (!Comp || !positions || positions.length < 2) return null;

    const latLngs = positions.map(p => [p.lat, p.lng] as [number, number]);

    return (
        <>
            {/* Glow/outline */}
            <Comp
                positions={latLngs}
                pathOptions={{
                    color: color,
                    weight: weight + 4,
                    opacity: opacity * 0.3,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
            {/* Main line */}
            <Comp
                positions={latLngs}
                pathOptions={{
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
        </>
    );
}

// ─── Route Endpoint Marker (Origin/Destination) ──────────────────────────────
export function RouteMarker({ coordinate, type, label }: {
    coordinate: { latitude: number; longitude: number };
    type: 'origin' | 'destination';
    label?: string;
}) {
    const [L, setL] = useState<any>(null);
    const [RLMarker, setRLMarker] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const Leaflet = (await import('leaflet')).default;
            const { Marker: M } = await import('react-leaflet');
            setL(Leaflet);
            setRLMarker(() => M);
        };
        init();
    }, []);

    if (!L || !RLMarker) return null;

    const isOrigin = type === 'origin';
    const bgColor = isOrigin ? '#00FF66' : '#FF3366';
    const letter = isOrigin ? 'A' : 'B';
    const displayLabel = label || (isOrigin ? 'Start' : 'Destination');

    const icon = L.divIcon({
        className: `route-marker-${type}`,
        iconSize: [120, 60],
        iconAnchor: [60, 60],
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="
                    background:#1C1C1E;
                    border:2px solid ${bgColor};
                    padding:3px 10px;
                    border-radius:12px;
                    font-size:10px;
                    font-weight:900;
                    color:${bgColor};
                    white-space:nowrap;
                    box-shadow:0 2px 8px rgba(0,0,0,0.5);
                    font-family:-apple-system,sans-serif;
                    letter-spacing:0.5px;
                    max-width:120px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                ">${displayLabel}</div>
                <div style="
                    width:32px;
                    height:32px;
                    background:${bgColor};
                    border-radius:50%;
                    border:3px solid white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    box-shadow:0 3px 10px rgba(0,0,0,0.5);
                    font-size:14px;
                    font-weight:900;
                    color:${isOrigin ? 'black' : 'white'};
                    font-family:-apple-system,sans-serif;
                ">${letter}</div>
            </div>
        `,
    });

    return <RLMarker position={[coordinate.latitude, coordinate.longitude]} icon={icon} />;
}

export const PROVIDER_DEFAULT = null;
