import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Share, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
import { PastConvoy, useConvoy } from '../contexts/ConvoyContext';
import { CURRENCY_SYMBOL } from '../constants/currency';
import tw from '../lib/tailwind';

function StatRow({ icon, label, value, color = '#FF6A00' }: { icon: string; label: string; value: string; color?: string }) {
    return (
        <View style={tw`flex-row items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800`}>
            <View style={tw`flex-row items-center gap-3`}>
                <View style={[tw`w-8 h-8 rounded-xl items-center justify-center`, { backgroundColor: color + '20' }]}>
                    <MaterialIcons name={icon as any} size={16} color={color} />
                </View>
                <Text style={tw`text-zinc-600 dark:text-zinc-400 font-medium`}>{label}</Text>
            </View>
            <Text style={tw`text-black dark:text-white font-black text-base`}>{value}</Text>
        </View>
    );
}

export default function TripSummaryScreen() {
    const { leaveConvoy } = useConvoy();
    const params = useLocalSearchParams<{ convoy: string }>();
    const convoy: PastConvoy | null = params.convoy ? JSON.parse(params.convoy) : null;

    useEffect(() => {
        if (!convoy || Platform.OS === 'web') return;
        StoreReview.isAvailableAsync().then((available) => {
            if (available) StoreReview.requestReview();
        });
    }, []);

    const handleShare = () => {
        if (!convoy) return;
        Share.share({
            message:
                `🚗 Wayfinder Convoy Summary\n` +
                `Code: ${convoy.code}\n` +
                `Duration: ${convoy.durationMin < 60 ? `${convoy.durationMin}m` : `${Math.floor(convoy.durationMin / 60)}h ${convoy.durationMin % 60}m`}\n` +
                `Distance: ${convoy.distanceKm} km\n` +
                `Members: ${convoy.members}\n` +
                `Expenses: ${CURRENCY_SYMBOL}${convoy.expensesTotal.toFixed(2)}\n\n` +
                `Powered by Wayfinder 🧭`,
        });
    };

    if (!convoy) {
        return (
            <SafeAreaView style={tw`flex-1 bg-[#121212] items-center justify-center px-8`}>
                <Text style={tw`text-white font-bold text-center`}>No trip data found.</Text>
                <TouchableOpacity onPress={() => router.replace('/lobby')} style={tw`mt-6 bg-[#FF6A00] px-6 py-3 rounded-full`}>
                    <Text style={tw`text-white font-black uppercase tracking-widest`}>Back to Lobby</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const durationLabel = convoy.durationMin < 60
        ? `${convoy.durationMin} min`
        : `${Math.floor(convoy.durationMin / 60)}h ${convoy.durationMin % 60}m`;

    const date = new Date(convoy.date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    return (
        <SafeAreaView style={tw`flex-1 bg-[#121212]`}>
            <ScrollView contentContainerStyle={tw`px-6 pb-12`}>

                {/* Header */}
                <View style={tw`items-center pt-10 pb-8`}>
                    <View style={tw`w-20 h-20 bg-[#FF6A00]/20 rounded-3xl items-center justify-center mb-5 border border-[#FF6A00]/30`}>
                        <MaterialIcons name="flag" size={40} color="#FF6A00" />
                    </View>
                    <Text style={tw`text-[#FF6A00] text-[10px] font-bold uppercase tracking-widest mb-1`}>{date}</Text>
                    <Text style={tw`text-white font-black text-4xl tracking-tighter`}>Trip Complete</Text>
                    <Text style={tw`text-zinc-500 text-sm mt-1`}>Convoy {convoy.code}</Text>
                </View>

                {/* Big distance hero */}
                <View style={tw`bg-[#FF6A00] rounded-3xl p-6 mb-6 items-center shadow-xl`}>
                    <Text style={tw`text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1`}>Total Distance</Text>
                    <Text style={tw`text-white font-black text-6xl tracking-tighter`}>{convoy.distanceKm}</Text>
                    <Text style={tw`text-white/80 font-bold text-lg`}>km  •  {(convoy.distanceKm * 0.621).toFixed(1)} mi</Text>
                </View>

                {/* Stats list */}
                <View style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-2xl px-5 mb-6`}>
                    <StatRow icon="timer" label="Duration" value={durationLabel} color="#00D1FF" />
                    <StatRow icon="people" label="Members" value={`${convoy.members} cars`} color="#00FF66" />
                    <StatRow icon="chat" label="Messages" value={`${convoy.messages}`} color="#B44FFF" />
                    <StatRow icon="how-to-vote" label="Votes" value={`${convoy.votesCount}`} color="#FFD600" />
                    <View style={tw`flex-row items-center justify-between py-4`}>
                        <View style={tw`flex-row items-center gap-3`}>
                            <View style={tw`w-8 h-8 rounded-xl items-center justify-center bg-[#FF6A00]/20`}>
                                <MaterialIcons name="receipt-long" size={16} color="#FF6A00" />
                            </View>
                            <Text style={tw`text-zinc-400 font-medium`}>Shared Expenses</Text>
                        </View>
                        <Text style={tw`text-white font-black text-base`}>{CURRENCY_SYMBOL} {convoy.expensesTotal.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity onPress={handleShare} style={tw`bg-zinc-800 border border-zinc-700 rounded-2xl py-4 flex-row items-center justify-center gap-2 mb-3`}>
                    <MaterialIcons name="share" size={20} color="#FF6A00" />
                    <Text style={tw`text-white font-black uppercase tracking-widest`}>Share Summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        leaveConvoy();
                        router.replace('/lobby');
                    }}
                    style={tw`bg-[#FF6A00] rounded-2xl py-5 items-center shadow-xl`}
                >
                    <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>Back to Lobby</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}
