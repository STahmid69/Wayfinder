import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import {
    getRoute,
    distanceToRoute,
    findClosestPointIndex,
    haversineMeters,
    formatDistance,
    formatDuration,
    calculateETA,
    getManeuverIcon,
    type LatLng,
    type RouteResult,
    type RouteStep,
} from '../services/RoutingService';
import { reverseGeocode } from '../services/GeocodingService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavigationMode = 'idle' | 'planning' | 'navigating';

export type NavigationState = {
    mode: NavigationMode;
    origin: LatLng | null;
    originLabel: string;
    destination: LatLng | null;
    destinationLabel: string;
    route: RouteResult | null;
    isLoading: boolean;
    error: string | null;

    // Live navigation state
    currentStepIndex: number;
    distanceToNextStep: number;  // meters
    remainingDistance: number;    // meters
    remainingDuration: number;   // seconds
    progress: number;            // 0-1
    isOffRoute: boolean;
    isRerouting: boolean;
};

type NavigationContextType = NavigationState & {
    setOrigin: (point: LatLng, label?: string) => void;
    setDestination: (point: LatLng, label?: string) => void;
    swapOriginDestination: () => void;
    calculateRoute: () => Promise<void>;
    startNavigation: () => void;
    stopNavigation: () => void;
    clearRoute: () => void;
    updatePosition: (pos: LatLng) => void;
    currentInstruction: string;
    currentManeuverIcon: string;
    etaDisplay: string;
    remainingDistanceDisplay: string;
    remainingDurationDisplay: string;
    distanceToNextStepDisplay: string;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const ORS_API_KEY = typeof process !== 'undefined'
    ? (process.env?.EXPO_PUBLIC_ORS_API_KEY || '')
    : '';

const OFF_ROUTE_THRESHOLD = 80; // meters
const REROUTE_COOLDOWN = 10000;  // 10 seconds between reroutes

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<NavigationMode>('idle');
    const [origin, setOriginState] = useState<LatLng | null>(null);
    const [originLabel, setOriginLabel] = useState('My Location');
    const [destination, setDestinationState] = useState<LatLng | null>(null);
    const [destinationLabel, setDestinationLabel] = useState('');
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Live nav state
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [distanceToNextStep, setDistanceToNextStep] = useState(0);
    const [remainingDistance, setRemainingDistance] = useState(0);
    const [remainingDuration, setRemainingDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isOffRoute, setIsOffRoute] = useState(false);
    const [isRerouting, setIsRerouting] = useState(false);

    const lastRerouteRef = useRef(0);
    const routeRef = useRef<RouteResult | null>(null);
    const modeRef = useRef<NavigationMode>('idle');

    useEffect(() => { routeRef.current = route; }, [route]);
    useEffect(() => { modeRef.current = mode; }, [mode]);

    const setOrigin = useCallback((point: LatLng, label?: string) => {
        setOriginState(point);
        if (label) {
            setOriginLabel(label);
        } else {
            // Reverse geocode in background
            reverseGeocode(point.lat, point.lng).then(name => {
                const short = name.split(',').slice(0, 2).join(',').trim();
                setOriginLabel(short || 'Selected Location');
            });
        }
        setMode('planning');
        setRoute(null);
        setError(null);
    }, []);

    const setDestination = useCallback((point: LatLng, label?: string) => {
        setDestinationState(point);
        if (label) {
            setDestinationLabel(label);
        } else {
            reverseGeocode(point.lat, point.lng).then(name => {
                const short = name.split(',').slice(0, 2).join(',').trim();
                setDestinationLabel(short || 'Selected Location');
            });
        }
        setMode('planning');
        setRoute(null);
        setError(null);
    }, []);

    const swapOriginDestination = useCallback(() => {
        setOriginState(prev => {
            setDestinationState(origin);
            return destination;
        });
        const tempLabel = originLabel;
        setOriginLabel(destinationLabel);
        setDestinationLabel(tempLabel);
        setRoute(null);
    }, [origin, destination, originLabel, destinationLabel]);

    const calculateRoute = useCallback(async () => {
        if (!origin || !destination) {
            setError('Set both origin and destination');
            return;
        }

        if (!ORS_API_KEY) {
            setError('Missing ORS API key. Add EXPO_PUBLIC_ORS_API_KEY to .env');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await getRoute(origin, destination, ORS_API_KEY);
            setRoute(result);
            setRemainingDistance(result.distance);
            setRemainingDuration(result.duration);
            setCurrentStepIndex(0);
            setProgress(0);
        } catch (err: any) {
            setError(err.message || 'Failed to calculate route');
            setRoute(null);
        } finally {
            setIsLoading(false);
        }
    }, [origin, destination]);

    const startNavigation = useCallback(() => {
        if (!route) return;
        setMode('navigating');
        setCurrentStepIndex(0);
        setProgress(0);
        setIsOffRoute(false);
    }, [route]);

    const stopNavigation = useCallback(() => {
        setMode('planning');
        setIsOffRoute(false);
        setIsRerouting(false);
    }, []);

    const clearRoute = useCallback(() => {
        setMode('idle');
        setOriginState(null);
        setOriginLabel('My Location');
        setDestinationState(null);
        setDestinationLabel('');
        setRoute(null);
        setError(null);
        setCurrentStepIndex(0);
        setProgress(0);
        setIsOffRoute(false);
        setIsRerouting(false);
    }, []);

    const updatePosition = useCallback((pos: LatLng) => {
        const currentRoute = routeRef.current;
        const currentMode = modeRef.current;
        if (!currentRoute || currentMode !== 'navigating') return;

        const polyline = currentRoute.polyline;
        const steps = currentRoute.steps;

        // Find closest point on route
        const closestIdx = findClosestPointIndex(pos, polyline);
        const distFromRoute = distanceToRoute(pos, polyline);

        // Off-route detection
        if (distFromRoute > OFF_ROUTE_THRESHOLD) {
            setIsOffRoute(true);

            // Auto reroute with cooldown
            if (Date.now() - lastRerouteRef.current > REROUTE_COOLDOWN) {
                lastRerouteRef.current = Date.now();
                setIsRerouting(true);
                setOriginState(pos);

                // Trigger reroute
                const dest = destination;
                if (dest && ORS_API_KEY) {
                    getRoute(pos, dest, ORS_API_KEY)
                        .then(newRoute => {
                            setRoute(newRoute);
                            setRemainingDistance(newRoute.distance);
                            setRemainingDuration(newRoute.duration);
                            setCurrentStepIndex(0);
                            setIsOffRoute(false);
                            setIsRerouting(false);
                        })
                        .catch(() => {
                            setIsRerouting(false);
                        });
                }
            }
        } else {
            setIsOffRoute(false);
        }

        // Calculate progress
        const totalPoints = polyline.length;
        const progressPct = totalPoints > 0 ? closestIdx / totalPoints : 0;
        setProgress(progressPct);

        // Calculate remaining distance from closest point to end
        let remaining = 0;
        for (let i = closestIdx; i < polyline.length - 1; i++) {
            remaining += haversineMeters(polyline[i], polyline[i + 1]);
        }
        setRemainingDistance(remaining);

        // Estimate remaining duration based on progress
        const totalDuration = currentRoute.duration;
        setRemainingDuration(totalDuration * (1 - progressPct));

        // Find current step
        let stepIdx = 0;
        for (let i = 0; i < steps.length; i++) {
            const wp = steps[i].waypoints;
            if (wp && wp.length >= 2 && closestIdx >= wp[0]) {
                stepIdx = i;
            }
        }
        setCurrentStepIndex(stepIdx);

        // Distance to next step
        if (stepIdx < steps.length - 1) {
            const nextStepWp = steps[stepIdx + 1]?.waypoints?.[0];
            if (nextStepWp !== undefined && nextStepWp < polyline.length) {
                const distToNext = haversineMeters(pos, polyline[nextStepWp]);
                setDistanceToNextStep(distToNext);
            }
        } else {
            // Last step: distance to destination
            const lastPoint = polyline[polyline.length - 1];
            setDistanceToNextStep(haversineMeters(pos, lastPoint));
        }
    }, [destination]);

    // Derived display values
    const currentStep = route?.steps?.[currentStepIndex];
    const currentInstruction = currentStep?.instruction || 'Follow the route';
    const currentManeuverIcon = currentStep ? getManeuverIcon(currentStep.type) : '↑';
    const etaDisplay = remainingDuration > 0 ? calculateETA(remainingDuration) : '--:--';
    const remainingDistanceDisplay = formatDistance(remainingDistance);
    const remainingDurationDisplay = formatDuration(remainingDuration);
    const distanceToNextStepDisplay = formatDistance(distanceToNextStep);

    return (
        <NavigationContext.Provider value={{
            mode,
            origin,
            originLabel,
            destination,
            destinationLabel,
            route,
            isLoading,
            error,
            currentStepIndex,
            distanceToNextStep,
            remainingDistance,
            remainingDuration,
            progress,
            isOffRoute,
            isRerouting,
            setOrigin,
            setDestination,
            swapOriginDestination,
            calculateRoute,
            startNavigation,
            stopNavigation,
            clearRoute,
            updatePosition,
            currentInstruction,
            currentManeuverIcon,
            etaDisplay,
            remainingDistanceDisplay,
            remainingDurationDisplay,
            distanceToNextStepDisplay,
        }}>
            {children}
        </NavigationContext.Provider>
    );
}

export const useNavigation = () => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
    return ctx;
};
