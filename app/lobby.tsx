import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PastConvoy, useConvoy } from '../contexts/ConvoyContext';
import tw from '../lib/tailwind';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

type Mode = 'choose' | 'join' | 'created';

export default function LobbyScreen() {
    const { myName, myColor, joinConvoy } = useConvoy();
    const [mode, setMode] = useState<Mode>('choose');
    const [joinCode, setJoinCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [pastConvoys, setPastConvoys] = useState<PastConvoy[]>([]);

    useEffect(() => {
        AsyncStorage.getItem('wayfinder_past_convoys').then(raw => {
            if (raw) setPastConvoys(JSON.parse(raw));
        });
    }, []);

    const handleCreate = () => {
        setCreatedCode(generateCode());
        setMode('created');
    };

    const handleStartConvoy = () => {
        joinConvoy(createdCode);
        router.replace('/(tabs)');
    };

    const handleJoin = () => {
        const code = joinCode.trim().toUpperCase();
        if (code.length < 4) { Alert.alert('Invalid Code', 'Please enter the full convoy code.'); return; }
        joinConvoy(code);
        router.replace('/(tabs)');
    };

    const handleShare = () => {
        Share.share({ message: `Join my Wayfinder convoy! Code: ${createdCode}`, title: 'Wayfinder Convoy' });
    };

    const handleRejoin = (code: string) => {
        joinConvoy(code);
        router.replace('/(tabs)');
    };

    const handleViewSummary = (convoy: PastConvoy) => {
        router.push({ pathname: '/trip-summary' as any, params: { convoy: JSON.stringify(convoy) } });
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#121212]`}>
            <ScrollView contentContainerStyle={tw`px-8 py-10`} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={tw`mb-8`}>
                    <View style={tw`flex-row items-center gap-3 mb-4`}>
                        <View style={[tw`w-10 h-10 rounded-full border-2 border-white items-center justify-center`, { backgroundColor: myColor }]}>
                            <Text style={tw`text-black font-black text-sm`}>{myName?.[0]?.toUpperCase() ?? '?'}</Text>
                        </View>
                        <Text style={tw`text-[#FF6A00] text-[10px] font-bold uppercase tracking-widest`}>
                            Signed in as {myName}
                        </Text>
                    </View>
                    <Text style={tw`text-white font-black text-4xl tracking-tighter leading-tight`}>
                        {mode === 'created' ? 'Share Your\nCode.' : mode === 'join' ? 'Enter the\nCode.' : 'Join the\nConvoy.'}
                    </Text>
                </View>

                {/* ── CHOOSE MODE ── */}
                {mode === 'choose' && (
                    <View style={tw`gap-4 mb-10`}>
                        <TouchableOpacity onPress={handleCreate} style={tw`bg-[#FF6A00] rounded-2xl p-6 flex-row items-center justify-between shadow-xl`}>
                            <View>
                                <Text style={tw`text-white font-black text-xl uppercase tracking-wider`}>Create Convoy</Text>
                                <Text style={tw`text-white/70 text-sm mt-1`}>Start a session and share the code</Text>
                            </View>
                            <MaterialIcons name="add-circle-outline" size={32} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setMode('join')} style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 flex-row items-center justify-between`}>
                            <View>
                                <Text style={tw`text-white font-black text-xl uppercase tracking-wider`}>Join Convoy</Text>
                                <Text style={tw`text-zinc-500 text-sm mt-1`}>Enter a code from your crew</Text>
                            </View>
                            <MaterialIcons name="group-add" size={32} color="#52525B" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── JOIN MODE ── */}
                {mode === 'join' && (
                    <View style={tw`mb-10`}>
                        <TouchableOpacity onPress={() => setMode('choose')} style={tw`flex-row items-center gap-2 mb-6`}>
                            <MaterialIcons name="arrow-back" size={20} color="#FF6A00" />
                            <Text style={tw`text-[#FF6A00] font-bold`}>Back</Text>
                        </TouchableOpacity>
                        <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1`}>Convoy Code</Text>
                        <TextInput
                            value={joinCode}
                            onChangeText={t => setJoinCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="e.g. AB3X7Q"
                            placeholderTextColor="#3F3F46"
                            autoCapitalize="characters"
                            maxLength={8}
                            style={tw`bg-[#1C1C1E] border-2 border-[#FF6A00] rounded-2xl px-5 py-4 text-white text-3xl font-black tracking-[8px] mb-6 text-center`}
                            autoFocus
                            returnKeyType="go"
                            onSubmitEditing={handleJoin}
                        />
                        <TouchableOpacity
                            onPress={handleJoin}
                            disabled={joinCode.trim().length < 4}
                            style={[tw`py-5 rounded-2xl items-center`, joinCode.trim().length >= 4 ? tw`bg-[#FF6A00]` : tw`bg-zinc-800`]}
                        >
                            <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>Join Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── CREATED MODE ── */}
                {mode === 'created' && (
                    <View style={tw`mb-10`}>
                        <View style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-8 items-center mb-6`}>
                            <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3`}>Your Convoy Code</Text>
                            <Text style={tw`text-white font-black text-5xl tracking-[10px] mb-6`}>{createdCode}</Text>
                            <TouchableOpacity onPress={handleShare} style={tw`bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-full flex-row items-center gap-2`}>
                                <MaterialIcons name="share" size={18} color="#FF6A00" />
                                <Text style={tw`text-white font-bold uppercase tracking-widest text-[11px]`}>Share with Crew</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={tw`text-zinc-500 text-xs text-center mb-6`}>Share this code so your friends can join.</Text>
                        <TouchableOpacity onPress={handleStartConvoy} style={tw`bg-[#FF6A00] py-5 rounded-2xl items-center shadow-xl`}>
                            <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>Start Convoy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMode('choose')} style={tw`mt-4 items-center`}>
                            <Text style={tw`text-zinc-600 font-bold text-sm`}>Generate new code</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── PAST CONVOYS ── */}
                {mode === 'choose' && pastConvoys.length > 0 && (
                    <View>
                        <Text style={tw`text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4`}>Recent Trips</Text>
                        {pastConvoys.map(c => {
                            const date = new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return (
                                <View key={c.id} style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4 mb-3 flex-row items-center`}>
                                    <View style={tw`flex-1`}>
                                        <View style={tw`flex-row items-center gap-2 mb-1`}>
                                            <Text style={tw`text-white font-black tracking-widest`}>{c.code}</Text>
                                            <View style={tw`bg-zinc-700 px-2 py-0.5 rounded-full`}>
                                                <Text style={tw`text-zinc-400 text-[9px] font-bold uppercase`}>{date}</Text>
                                            </View>
                                        </View>
                                        <Text style={tw`text-zinc-500 text-xs`}>
                                            {formatDuration(c.durationMin)}  •  {c.distanceKm} km  •  {c.members} cars
                                        </Text>
                                    </View>
                                    <View style={tw`flex-row gap-2`}>
                                        <TouchableOpacity
                                            onPress={() => handleViewSummary(c)}
                                            style={tw`bg-zinc-800 px-3 py-2 rounded-xl`}
                                        >
                                            <MaterialIcons name="bar-chart" size={16} color="#A1A1AA" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleRejoin(c.code)}
                                            style={tw`bg-[#FF6A00]/15 border border-[#FF6A00]/30 px-3 py-2 rounded-xl`}
                                        >
                                            <MaterialIcons name="replay" size={16} color="#FF6A00" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
