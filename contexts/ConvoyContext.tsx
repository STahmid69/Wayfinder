import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverStatus = 'moving' | 'gas' | 'bathroom' | 'food' | 'car_trouble' | 'pulling_over';
export type ConvoyRole = 'leader' | 'tail' | 'driver';
export type HazardType = 'speed_trap' | 'pothole' | 'accident' | 'road_closed' | 'construction';

export type ConvoyMember = {
    id: string;
    name: string;
    color: string;
    lat: number;
    lng: number;
    speed: number;
    status: string;
    driverStatus: DriverStatus;
    role: ConvoyRole;
    isTalking: boolean;
    lastSeen: number;
};

export type Message = {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
};

export type VoteOption = {
    id: string;
    text: string;
    voterIds: string[];
};

export type Vote = {
    id: string;
    title: string;
    proposedById: string;
    proposedByName: string;
    options: VoteOption[];
    status: 'OPEN' | 'CLOSED';
};

export type LedgerItem = {
    id: string;
    description: string;
    amount: number;
    userId: string;
    userName: string;
    createdAt: string;
};

export type HazardPin = {
    id: string;
    lat: number;
    lng: number;
    type: HazardType;
    addedByName: string;
    createdAt: string;
};

export type SOSAlert = {
    id: string;
    userId: string;
    userName: string;
    lat: number;
    lng: number;
    createdAt: string;
};

export type PastConvoy = {
    id: string;
    code: string;
    date: string;
    durationMin: number;
    distanceKm: number;
    members: number;
    messages: number;
    expensesTotal: number;
    votesCount: number;
};

type ConvoyContextType = {
    isLoaded: boolean;
    convoyId: string | null;
    myId: string;
    myName: string;
    myColor: string;
    myRole: ConvoyRole;
    myStatus: DriverStatus;
    users: ConvoyMember[];
    messages: Message[];
    votes: Vote[];
    ledger: LedgerItem[];
    hazardPins: HazardPin[];
    sosAlerts: SOSAlert[];
    whoIsTalking: string | null;
    isTalkingLocally: boolean;
    tripStartTime: number | null;
    totalDistanceKm: number;
    setIdentity: (name: string, color: string) => Promise<void>;
    joinConvoy: (code: string) => void;
    leaveConvoy: () => void;
    endConvoy: () => Promise<void>;
    sendMessage: (content: string) => void;
    addLedgerItem: (description: string, amount: number) => void;
    proposeVote: (title: string, options: string[]) => void;
    castVote: (voteId: string, optionId: string) => void;
    setTalking: (isTalking: boolean) => void;
    addHazardPin: (type: HazardType, lat: number, lng: number) => void;
    sendSOS: () => void;
    dismissSOS: (id: string) => void;
    setMyStatus: (status: DriverStatus) => void;
    claimRole: (role: ConvoyRole) => void;
};

const ConvoyContext = createContext<ConvoyContextType | undefined>(undefined);

export const CAR_COLORS = ['#FF6A00', '#00D1FF', '#00FF66', '#FF3366', '#FFD600', '#B44FFF'];

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
    moving: 'Moving',
    gas: 'Stopping — Gas',
    bathroom: 'Stopping — Bathroom',
    food: 'Stopping — Food',
    car_trouble: '⚠️ Car Trouble',
    pulling_over: 'Pulling Over',
};

export const HAZARD_LABELS: Record<HazardType, string> = {
    speed_trap: '🚔 Speed Trap',
    pothole: '🕳️ Pothole',
    accident: '💥 Accident',
    road_closed: '🚧 Road Closed',
    construction: '🏗️ Construction',
};

function genId() {
    return Math.random().toString(36).substring(2, 9);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function sendExpoPush(tokens: string[], title: string, body: string) {
    if (tokens.length === 0) return;
    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokens.map(to => ({ to, title, body, sound: 'default' }))),
        });
    } catch (_) { /* non-fatal */ }
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const canUseNotifications = Platform.OS === 'web' ? false : !(Platform.OS === 'android' && isExpoGo);

let Notifications: any = null;
if (canUseNotifications) {
    try {
        Notifications = require('expo-notifications');
    } catch (e) {
        console.warn('Could not load expo-notifications');
    }
}

export function ConvoyProvider({ children }: { children: React.ReactNode }) {
    // Synchronous initial state for Web to prevent redirect flickers
    const getInitial = (key: string) => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
        }
        return null;
    };

    const [isLoaded, setIsLoaded] = useState(false);
    const [convoyId, setConvoyId] = useState<string | null>(getInitial('wayfinder_convoy_id'));
    const [myId, setMyId] = useState(getInitial('wayfinder_id') || '');
    const [myName, setMyName] = useState(getInitial('wayfinder_name') || '');
    const [myColor, setMyColor] = useState(getInitial('wayfinder_color') || CAR_COLORS[0]);
    const [myRole, setMyRole] = useState<ConvoyRole>('driver');
    const [myStatus, setMyStatusState] = useState<DriverStatus>('moving');
    const [users, setUsers] = useState<ConvoyMember[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [ledger, setLedger] = useState<LedgerItem[]>([]);
    const [hazardPins, setHazardPins] = useState<HazardPin[]>([]);
    const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
    const [whoIsTalking, setWhoIsTalking] = useState<string | null>(null);
    const [isTalkingLocally, setIsTalkingLocally] = useState(false);
    const [tripStartTime, setTripStartTime] = useState<number | null>(null);
    const [totalDistanceKm, setTotalDistanceKm] = useState(0);

    const channelRef = useRef<any>(null);
    const locationSubRef = useRef<any>(null);
    const myNameRef = useRef(myName);
    const myColorRef = useRef(myColor);
    const myIdRef = useRef(myId);
    const myRoleRef = useRef<ConvoyRole>('driver');
    const myStatusRef = useRef<DriverStatus>('moving');
    const isTalkingRef = useRef(false);
    const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
    const pushTokensRef = useRef<Record<string, string>>({});
    const myPushTokenRef = useRef('');
    const totalDistanceRef = useRef(0);
    const prevUserIdsRef = useRef<string[]>([]);
    const initialSyncDoneRef = useRef(false);

    useEffect(() => { myNameRef.current = myName; }, [myName]);
    useEffect(() => { myColorRef.current = myColor; }, [myColor]);
    useEffect(() => { myIdRef.current = myId; }, [myId]);

    // Load identity + register push notifications on mount
    useEffect(() => {
        (async () => {
            // Identity is already partially loaded synchronously on Web.
            // On Native, we still need to load it.
            if (Platform.OS !== 'web') {
                let id = await AsyncStorage.getItem('wayfinder_id');
                if (!id) { id = genId(); await AsyncStorage.setItem('wayfinder_id', id); }
                const name = await AsyncStorage.getItem('wayfinder_name') || '';
                const color = await AsyncStorage.getItem('wayfinder_color') || CAR_COLORS[0];
                const savedConvoyId = await AsyncStorage.getItem('wayfinder_convoy_id');
                const savedStartTime = await AsyncStorage.getItem('wayfinder_trip_start');
                const savedDistance = await AsyncStorage.getItem('wayfinder_total_distance');

                setMyId(id);
                setMyName(name);
                setMyColor(color);
                
                if (savedConvoyId) {
                    setConvoyId(savedConvoyId);
                    if (savedStartTime) setTripStartTime(parseInt(savedStartTime));
                    if (savedDistance) {
                        const dist = parseFloat(savedDistance);
                        setTotalDistanceKm(dist);
                        totalDistanceRef.current = dist;
                    }
                }
            } else {
                // On web, if we don't have an ID yet, generate one
                if (!myId) {
                    const id = genId();
                    setMyId(id);
                    window.localStorage.setItem('wayfinder_id', id);
                }
            }

            // Ensure state propagation before allowing navigation
            setTimeout(() => {
                setIsLoaded(true);
            }, 100);

            // Register push notifications (works in Expo Go, except Android SDK 53+)
            try {
                if (Notifications && Platform.OS !== 'web') {
                    Notifications.setNotificationHandler({
                        handleNotification: async () => ({
                            shouldShowBanner: true,
                            shouldShowList: true,
                            shouldPlaySound: true,
                            shouldSetBadge: false,
                        }),
                    });
                    const { status } = await Notifications.requestPermissionsAsync();
                    if (status === 'granted') {
                        const token = await Notifications.getExpoPushTokenAsync();
                        myPushTokenRef.current = token.data;
                    }
                }
            } catch (_) { /* web or simulator or missing native module — skip */ }
        })();
    }, []);

    // Persist convoy state changes
    useEffect(() => {
        if (isLoaded) {
            if (convoyId) {
                AsyncStorage.setItem('wayfinder_convoy_id', convoyId);
                if (tripStartTime) AsyncStorage.setItem('wayfinder_trip_start', tripStartTime.toString());
                AsyncStorage.setItem('wayfinder_total_distance', totalDistanceKm.toString());
            } else {
                // Only remove if it's an explicit leave (i.e., we were loaded and now we're null)
                AsyncStorage.removeItem('wayfinder_convoy_id');
                AsyncStorage.removeItem('wayfinder_trip_start');
                AsyncStorage.removeItem('wayfinder_total_distance');
            }
        }
    }, [convoyId, tripStartTime, totalDistanceKm, isLoaded]);

    const buildPresencePayload = (): ConvoyMember => ({
        id: myIdRef.current,
        name: myNameRef.current || 'Driver',
        color: myColorRef.current,
        lat: lastPositionRef.current?.lat ?? 0,
        lng: lastPositionRef.current?.lng ?? 0,
        speed: 0,
        status: myStatusRef.current === 'moving' ? 'Moving' : DRIVER_STATUS_LABELS[myStatusRef.current],
        driverStatus: myStatusRef.current,
        role: myRoleRef.current,
        isTalking: isTalkingRef.current,
        lastSeen: Date.now(),
    });

    // Connect to Supabase when convoyId is set
    useEffect(() => {
        if (!convoyId || !myId) return;
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        // Reset join-detection state for this convoy session
        prevUserIdsRef.current = [];
        initialSyncDoneRef.current = false;

        const channel = supabase.channel(`convoy:${convoyId}`, {
            config: {
                broadcast: { ack: true, self: true },
                presence: { key: myId },
            },
        })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // Deduplicate by user ID — multiple tabs/reconnects can create duplicate entries
                const membersMap = new Map<string, ConvoyMember>();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.id) membersMap.set(p.id, p as ConvoyMember);
                    });
                });
                const newMembers = Array.from(membersMap.values());

                // Detect new joins after the initial sync (skip first sync to avoid toasting existing members)
                if (initialSyncDoneRef.current) {
                    const prevIds = prevUserIdsRef.current;
                    newMembers.forEach(member => {
                        if (member.id !== myIdRef.current && !prevIds.includes(member.id)) {
                            showToast(`${member.name} joined the convoy`, '🚗', '#FF6A00');
                        }
                    });
                } else {
                    initialSyncDoneRef.current = true;
                }
                prevUserIdsRef.current = newMembers.map(m => m.id);

                setUsers(newMembers);
            })
            .on('broadcast', { event: 'chat' }, ({ payload }: { payload: Message }) => {
                setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload]);
            })
            .on('broadcast', { event: 'vote_new' }, ({ payload }: { payload: Vote }) => {
                setVotes(prev => prev.some(v => v.id === payload.id) ? prev : [payload, ...prev]);
            })
            .on('broadcast', { event: 'vote_cast' }, ({ payload }: { payload: { voteId: string; optionId: string; userId: string } }) => {
                setVotes(prev => prev.map(v => {
                    if (v.id !== payload.voteId) return v;
                    return {
                        ...v,
                        options: v.options.map(o => {
                            const without = o.voterIds.filter(uid => uid !== payload.userId);
                            return o.id === payload.optionId ? { ...o, voterIds: [...without, payload.userId] } : { ...o, voterIds: without };
                        }),
                    };
                }));
            })
            .on('broadcast', { event: 'ledger' }, ({ payload }: { payload: LedgerItem }) => {
                setLedger(prev => prev.some(i => i.id === payload.id) ? prev : [payload, ...prev]);
            })
            .on('broadcast', { event: 'ptt' }, ({ payload }: { payload: { userId: string; userName?: string; isTalking: boolean } }) => {
                if (payload.isTalking && payload.userId !== myIdRef.current) {
                    showToast(`${payload.userName ?? 'Someone'} is transmitting`, '🎙', '#FF6A00');
                }
                setWhoIsTalking(payload.isTalking ? payload.userId : null);
            })
            .on('broadcast', { event: 'hazard' }, ({ payload }: { payload: HazardPin }) => {
                showToast(`Hazard reported by ${payload.addedByName}`, '⚠️', '#FFC400');
                setHazardPins(prev => prev.some(p => p.id === payload.id) ? prev : [...prev, payload]);
            })
            .on('broadcast', { event: 'sos' }, ({ payload }: { payload: SOSAlert }) => {
                showToast(`${payload.userName} sent an SOS!`, '🚨', '#FF2D55');
                setSOSAlerts(prev => prev.some(a => a.id === payload.id) ? prev : [...prev, payload]);
            })
            .on('broadcast', { event: 'sos_dismiss' }, ({ payload }: { payload: { sosId: string } }) => {
                setSOSAlerts(prev => prev.filter(a => a.id !== payload.sosId));
            })
            .on('broadcast', { event: 'push_token' }, ({ payload }: { payload: { userId: string; token: string } }) => {
                if (payload.userId !== myIdRef.current) {
                    pushTokensRef.current[payload.userId] = payload.token;
                }
            })
            .subscribe(async (status) => {
                if (status !== 'SUBSCRIBED') return;
                await channel.track(buildPresencePayload());
                // Share push token with convoy
                if (myPushTokenRef.current) {
                    channel.send({ type: 'broadcast', event: 'push_token', payload: { userId: myIdRef.current, token: myPushTokenRef.current } });
                }
            });

        channelRef.current = channel;
        setTripStartTime(Date.now());
        totalDistanceRef.current = 0;
        setTotalDistanceKm(0);

        // GPS tracking
        (async () => {
            const handleLocationUpdate = async (lat: number, lng: number, speed: number) => {
                if (lastPositionRef.current) {
                    const d = haversineKm(lastPositionRef.current.lat, lastPositionRef.current.lng, lat, lng);
                    if (d < 0.5) {
                        totalDistanceRef.current += d;
                        setTotalDistanceKm(totalDistanceRef.current);
                    }
                }
                lastPositionRef.current = { lat, lng };

                const payload: ConvoyMember = {
                    id: myIdRef.current,
                    name: myNameRef.current || 'Driver',
                    color: myColorRef.current,
                    lat, lng, speed,
                    status: myStatusRef.current === 'moving'
                        ? (speed > 0 ? 'Moving' : 'Stopped')
                        : DRIVER_STATUS_LABELS[myStatusRef.current],
                    driverStatus: myStatusRef.current,
                    role: myRoleRef.current,
                    isTalking: isTalkingRef.current,
                    lastSeen: Date.now(),
                };
                setUsers(prev => {
                    const idx = prev.findIndex(u => u.id === myIdRef.current);
                    if (idx >= 0) { const n = [...prev]; n[idx] = payload; return n; }
                    return [...prev, payload];
                });
                try {
                    if (channelRef.current) await channelRef.current.track(payload);
                } catch (_) {}
            };

            if (Platform.OS === 'web') {
                // Use navigator.geolocation directly on web — expo-location's watchPositionAsync
                // only fires on movement (not on a timer), so stationary desktop users never
                // get their location broadcast after the initial call.
                if (typeof navigator === 'undefined' || !navigator.geolocation) {
                    showToast('Geolocation not supported in this browser', '📍', '#FF6A00');
                    return;
                }
                const geoOptions = { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 };
                const onPos = (pos: GeolocationPosition) => {
                    handleLocationUpdate(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        Math.max(0, Math.round((pos.coords.speed || 0) * 3.6)),
                    );
                };
                const onErr = () => {
                    showToast('Location blocked — allow it in browser settings', '📍', '#FF6A00');
                };
                navigator.geolocation.getCurrentPosition(onPos, onErr, geoOptions);
                const watchId = navigator.geolocation.watchPosition(onPos, onErr, geoOptions);
                // Re-track every 10 s so Supabase Presence stays current when stationary
                const reTrackInterval = setInterval(() => {
                    if (lastPositionRef.current && channelRef.current) {
                        channelRef.current.track(buildPresencePayload()).catch(() => {});
                    }
                }, 10000);
                locationSubRef.current = {
                    remove: () => {
                        navigator.geolocation.clearWatch(watchId);
                        clearInterval(reTrackInterval);
                    },
                };
                return;
            }

            // Native (iOS / Android) path
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                const handleLocation = async (loc: Location.LocationObject) => {
                    await handleLocationUpdate(
                        loc.coords.latitude,
                        loc.coords.longitude,
                        Math.max(0, Math.round((loc.coords.speed || 0) * 3.6)),
                    );
                };

                const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                handleLocation(initial);
                locationSubRef.current = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
                    handleLocation
                );
            } catch (_) {}
        })();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
            if (locationSubRef.current?.remove) locationSubRef.current.remove();
        };
    }, [convoyId, myId]);

    // ─── Identity ────────────────────────────────────────────────────────────
    const setIdentity = async (name: string, color: string) => {
        if (Platform.OS === 'web') {
            window.localStorage.setItem('wayfinder_name', name);
            window.localStorage.setItem('wayfinder_color', color);
        }
        await AsyncStorage.setItem('wayfinder_name', name);
        await AsyncStorage.setItem('wayfinder_color', color);
        setMyName(name); setMyColor(color);
    };

    // ─── Convoy lifecycle ────────────────────────────────────────────────────
    const joinConvoy = (code: string) => {
        const id = code.toUpperCase().trim();
        if (Platform.OS === 'web') {
            window.localStorage.setItem('wayfinder_convoy_id', id);
        }
        setUsers([]); setMessages([]); setVotes([]); setLedger([]);
        setHazardPins([]); setSOSAlerts([]);
        setMyRole('driver'); myRoleRef.current = 'driver';
        setMyStatusState('moving'); myStatusRef.current = 'moving';
        lastPositionRef.current = null;
        setConvoyId(id);
    };

    const leaveConvoy = () => {
        if (Platform.OS === 'web') {
            window.localStorage.removeItem('wayfinder_convoy_id');
            window.localStorage.removeItem('wayfinder_trip_start');
            window.localStorage.removeItem('wayfinder_total_distance');
        }
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        if (locationSubRef.current?.remove) locationSubRef.current.remove();
        setConvoyId(null);
        setUsers([]); setMessages([]); setVotes([]); setLedger([]);
        setHazardPins([]); setSOSAlerts([]);
        setTripStartTime(null);
        setTotalDistanceKm(0);
    };

    const endConvoy = async () => {
        // 1. Capture data before clearing
        const duration = tripStartTime ? Math.round((Date.now() - tripStartTime) / 60000) : 0;
        const past: PastConvoy = {
            id: genId(),
            code: convoyId || '',
            date: new Date().toISOString(),
            durationMin: duration,
            distanceKm: Math.round(totalDistanceRef.current * 10) / 10,
            members: users.length,
            messages: messages.length,
            expensesTotal: ledger.reduce((s, i) => s + i.amount, 0),
            votesCount: votes.length,
        };

        // 2. Save trip to history
        const existing: PastConvoy[] = JSON.parse(await AsyncStorage.getItem('wayfinder_past_convoys') || '[]');
        await AsyncStorage.setItem('wayfinder_past_convoys', JSON.stringify([past, ...existing].slice(0, 20)));
        
        // 3. Clear current convoy state (similar to leaveConvoy)
        if (Platform.OS === 'web') {
            window.localStorage.removeItem('wayfinder_convoy_id');
            window.localStorage.removeItem('wayfinder_trip_start');
            window.localStorage.removeItem('wayfinder_total_distance');
        }
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        if (locationSubRef.current?.remove) locationSubRef.current.remove();
        
        setConvoyId(null);
        setUsers([]); setMessages([]); setVotes([]); setLedger([]);
        setHazardPins([]); setSOSAlerts([]);
        setTripStartTime(null);
        setTotalDistanceKm(0);
    };

    // ─── Chat ────────────────────────────────────────────────────────────────
    const sendMessage = (content: string) => {
        if (!convoyId || !channelRef.current) return;
        const msg: Message = { id: genId(), userId: myId, userName: myName, content, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, msg]);
        channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    };

    // ─── Ledger ──────────────────────────────────────────────────────────────
    const addLedgerItem = (description: string, amount: number) => {
        if (!convoyId || !channelRef.current) return;
        const item: LedgerItem = { id: genId(), description, amount, userId: myId, userName: myName, createdAt: new Date().toISOString() };
        setLedger(prev => [item, ...prev]);
        channelRef.current.send({ type: 'broadcast', event: 'ledger', payload: item });
    };

    // ─── Votes ───────────────────────────────────────────────────────────────
    const proposeVote = (title: string, optionTexts: string[]) => {
        if (!convoyId || !channelRef.current) return;
        const vote: Vote = {
            id: genId(), title, proposedById: myId, proposedByName: myName,
            options: optionTexts.map(t => ({ id: genId(), text: t, voterIds: [] })),
            status: 'OPEN',
        };
        setVotes(prev => [vote, ...prev]);
        channelRef.current.send({ type: 'broadcast', event: 'vote_new', payload: vote });
    };

    const castVote = (voteId: string, optionId: string) => {
        if (!convoyId || !channelRef.current) return;
        setVotes(prev => prev.map(v => {
            if (v.id !== voteId) return v;
            return {
                ...v,
                options: v.options.map(o => {
                    const without = o.voterIds.filter(uid => uid !== myId);
                    return o.id === optionId ? { ...o, voterIds: [...without, myId] } : { ...o, voterIds: without };
                }),
            };
        }));
        channelRef.current.send({ type: 'broadcast', event: 'vote_cast', payload: { voteId, optionId, userId: myId } });
    };

    // ─── PTT ─────────────────────────────────────────────────────────────────
    const setTalking = (isTalking: boolean) => {
        isTalkingRef.current = isTalking;
        setIsTalkingLocally(isTalking);
        if (!convoyId || !channelRef.current) return;
        channelRef.current.send({ type: 'broadcast', event: 'ptt', payload: { userId: myId, userName: myName, isTalking } });
    };

    // ─── Hazard Pins ─────────────────────────────────────────────────────────
    const addHazardPin = (type: HazardType, lat: number, lng: number) => {
        if (!convoyId || !channelRef.current) return;
        const pin: HazardPin = { id: genId(), lat, lng, type, addedByName: myName, createdAt: new Date().toISOString() };
        setHazardPins(prev => [...prev, pin]);
        channelRef.current.send({ type: 'broadcast', event: 'hazard', payload: pin });
    };

    // ─── SOS ─────────────────────────────────────────────────────────────────
    const sendSOS = async () => {
        if (!convoyId || !channelRef.current) return;
        const pos = lastPositionRef.current ?? { lat: 0, lng: 0 };
        const alert: SOSAlert = { id: genId(), userId: myId, userName: myName, lat: pos.lat, lng: pos.lng, createdAt: new Date().toISOString() };
        setSOSAlerts(prev => [...prev, alert]);
        channelRef.current.send({ type: 'broadcast', event: 'sos', payload: alert });
        // Push notify everyone else in the convoy
        const tokens = Object.values(pushTokensRef.current).filter(Boolean);
        await sendExpoPush(tokens, '🚨 SOS ALERT', `${myName} needs immediate help!`);
    };

    const dismissSOS = (id: string) => {
        setSOSAlerts(prev => prev.filter(a => a.id !== id));
        if (channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'sos_dismiss', payload: { sosId: id } });
        }
    };

    // ─── Driver Status ────────────────────────────────────────────────────────
    const setMyStatus = async (status: DriverStatus) => {
        myStatusRef.current = status;
        setMyStatusState(status);
        if (channelRef.current) await channelRef.current.track({ ...buildPresencePayload(), driverStatus: status, status: DRIVER_STATUS_LABELS[status] });
    };

    // ─── Roles ───────────────────────────────────────────────────────────────
    const claimRole = async (role: ConvoyRole) => {
        myRoleRef.current = role;
        setMyRole(role);
        if (channelRef.current) await channelRef.current.track({ ...buildPresencePayload(), role });
    };

    return (
        <ConvoyContext.Provider value={{
            isLoaded, convoyId, myId, myName, myColor, myRole, myStatus,
            users, messages, votes, ledger, hazardPins, sosAlerts,
            whoIsTalking, isTalkingLocally, tripStartTime, totalDistanceKm,
            setIdentity, joinConvoy, leaveConvoy, endConvoy,
            sendMessage, addLedgerItem, proposeVote, castVote, setTalking,
            addHazardPin, sendSOS, dismissSOS, setMyStatus, claimRole,
        }}>
            {children}
        </ConvoyContext.Provider>
    );
}

export const useConvoy = () => {
    const ctx = useContext(ConvoyContext);
    if (!ctx) throw new Error('useConvoy must be used within ConvoyProvider');
    return ctx;
};
