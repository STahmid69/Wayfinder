import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ConvoyContextType = {
    convoyId: string | null;
    users: any[];
    messages: any[];
    joinConvoy: (code: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
};

const ConvoyContext = createContext<ConvoyContextType | undefined>(undefined);

export function ConvoyProvider({ children }: { children: React.ReactNode }) {
    const [convoyId, setConvoyId] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    // 📡 Real-time Listener for GPS Map Tracking & Chat
    useEffect(() => {
        if (!convoyId) return;

        const channel = supabase.channel('wayfinder-live')
            // 🚗 Listen for Other Cars Moving
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_locations', filter: `convoy_id=eq.${convoyId}` }, (payload) => {
                setUsers(prev => {
                    const existing = prev.find(u => u.id === payload.new.user_id);
                    if (existing) {
                        return prev.map(u => u.id === payload.new.user_id ? { ...u, lat: payload.new.latitude, lng: payload.new.longitude, speed: payload.new.speed_mph } : u);
                    } else {
                        return [...prev, { id: payload.new.user_id, lat: payload.new.latitude, lng: payload.new.longitude, speed: payload.new.speed_mph }];
                    }
                });
            })
            // 💬 Listen for Chat Messages
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `convoy_id=eq.${convoyId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [convoyId]);

    // 📍 Push OUR Real-time GPS Location to the rest of the Convoy
    useEffect(() => {
        if (!convoyId) return;
        let locationSub: any;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            locationSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 }, async (loc) => {
                const speed_mph = Math.max(0, Math.round((loc.coords.speed || 0) * 2.23694));

                // Upsert our GPS coordinate instantly to the cloud so all other phones move our pin
                await supabase.from('live_locations').upsert({
                    user_id: user.id,
                    convoy_id: convoyId,
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    speed_mph: speed_mph,
                    heading: loc.coords.heading || 0
                }, { onConflict: 'user_id' });
            });
        })();

        return () => {
            if (locationSub && typeof locationSub.remove === 'function') locationSub.remove();
        }
    }, [convoyId]);

    // 🔑 Join a Trip via the Trip code on the Dashboard
    const joinConvoy = async (code: string) => {
        const { data, error } = await supabase.from('convoys').select('id').eq('join_code', code).single();
        if (!error && data) {
            setConvoyId(data.id);
        } else {
            console.error("Invalid Code or Network Error");
        }
    };

    // ✉️ Send a new Map message
    const sendMessage = async (content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !convoyId) return;
        await supabase.from('messages').insert({ convoy_id: convoyId, user_id: user.id, content });
    }

    return (
        <ConvoyContext.Provider value={{ convoyId, users, messages, joinConvoy, sendMessage }}>
            {children}
        </ConvoyContext.Provider>
    )
}

export const useConvoy = () => {
    const context = useContext(ConvoyContext);
    if (context === undefined) throw new Error('useConvoy must be used within ConvoyProvider');
    return context;
}
