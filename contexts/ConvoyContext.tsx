import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type LedgerItem = {
    id: string;
    description: string;
    amount: number;
    userId: string;
    userName: string;
    createdAt: string;
};

type ConvoyContextType = {
    convoyId: string | null;
    users: any[];
    messages: any[];
    ledger: LedgerItem[];
    joinConvoy: (code: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    addLedgerItem: (description: string, amount: number) => Promise<void>;
};

const ConvoyContext = createContext<ConvoyContextType | undefined>(undefined);

export function ConvoyProvider({ children }: { children: React.ReactNode }) {
    // 💡 We automatically drop you into a private test room so you can test instantly
    const [convoyId, setConvoyId] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [ledger, setLedger] = useState<LedgerItem[]>([]);

    // Generate a quick random ID for this active session (bypassing heavy auth)
    const myId = useRef('user_' + Math.floor(Math.random() * 10000)).current;

    useEffect(() => {
        if (!convoyId) return;

        // 📡 Subscribe to ultra-low latency memory channels instead of saving to a hard drive database
        const channel = supabase.channel(`room:${convoyId}`, {
            config: { broadcast: { ack: false, self: false } }
        })
            .on('broadcast', { event: 'location_update' }, ({ payload }) => {
                setUsers(prev => {
                    const existing = prev.find(u => u.id === payload.userId);
                    if (existing) {
                        return prev.map(u => u.id === payload.userId ? { ...u, lat: payload.latitude, lng: payload.longitude, speed: payload.speed } : u);
                    } else {
                        return [...prev, { id: payload.userId, name: `Driver #${payload.userId.split('_')[1]}`, color: '#00FF66', lat: payload.latitude, lng: payload.longitude, speed: payload.speed, status: 'Active' }];
                    }
                });
            })
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                setMessages(prev => [...prev, { id: Math.random().toString(), user_id: payload.userId, content: payload.content, created_at: new Date().toISOString() }]);
            })
            .on('broadcast', { event: 'ledger_update' }, ({ payload }) => {
                setLedger(prev => [...prev, payload.item]);
            })
            .subscribe();

        // 📍 Broadcast our Real-time GPS Location to everyone else
        let locationSub: any;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            locationSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 }, (loc) => {
                const speed_mph = Math.max(0, Math.round((loc.coords.speed || 0) * 2.23694));
                channel.send({
                    type: 'broadcast',
                    event: 'location_update',
                    payload: { userId: myId, latitude: loc.coords.latitude, longitude: loc.coords.longitude, speed: speed_mph }
                });
            });
        })();

        return () => {
            supabase.removeChannel(channel);
            if (locationSub && typeof locationSub.remove === 'function') locationSub.remove();
        };
    }, [convoyId]);

    const joinConvoy = async (code: string) => {
        setConvoyId(code);
    };

    const sendMessage = async (content: string) => {
        if (!convoyId) return;
        // Show our own message instantly
        setMessages(prev => [...prev, { id: Math.random().toString(), user_id: myId, content, created_at: new Date().toISOString() }]);

        // Broadcast it to everyone else
        supabase.channel(`room:${convoyId}`).send({
            type: 'broadcast',
            event: 'chat_message',
            payload: { userId: myId, content }
        });
    }

    const addLedgerItem = async (description: string, amount: number) => {
        if (!convoyId) return;
        const newItem: LedgerItem = {
            id: Math.random().toString(),
            description,
            amount,
            userId: myId,
            userName: `Driver #${myId.split('_')[1]}`,
            createdAt: new Date().toISOString()
        };

        setLedger(prev => [...prev, newItem]);

        // Broadcast it to everyone else
        supabase.channel(`room:${convoyId}`).send({
            type: 'broadcast',
            event: 'ledger_update',
            payload: { item: newItem }
        });
    }

    return (
        <ConvoyContext.Provider value={{ convoyId, users, messages, ledger, joinConvoy, sendMessage, addLedgerItem }}>
            {children}
        </ConvoyContext.Provider>
    )
}

export const useConvoy = () => {
    const context = useContext(ConvoyContext);
    if (context === undefined) throw new Error('useConvoy must be used within ConvoyProvider');
    return context;
}
