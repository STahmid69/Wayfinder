import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { ConvoyRole, useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

function formatDuration(startTime: number | null): string {
    if (!startTime) return '0m';
    const mins = Math.floor((Date.now() - startTime) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
    return (
        <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex-1 shadow-sm`}>
            <MaterialIcons name={icon as any} size={20} color={color} style={tw`mb-2`} />
            <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest`}>{label}</Text>
            <Text style={[tw`font-black text-2xl mt-0.5`, { color }]}>{value}</Text>
            {sub && <Text style={tw`text-zinc-400 text-[10px] mt-0.5`}>{sub}</Text>}
        </View>
    );
}

const ROLE_OPTIONS: { key: ConvoyRole; label: string; desc: string; icon: string; emoji: string }[] = [
    { key: 'leader', label: 'Leader', desc: 'Sets the pace, leads navigation', icon: 'crown', emoji: '👑' },
    { key: 'tail', label: 'Tail Gunner', desc: 'Last car, watches for stragglers', icon: 'flag-checkered', emoji: '🔚' },
    { key: 'driver', label: 'Driver', desc: 'Standard convoy member', icon: 'car-side', emoji: '🚗' },
];

export default function TripDashboardScreen() {
    const {
        users, myId, myRole,
        messages, votes, ledger, tripStartTime, totalDistanceKm,
        claimRole, endConvoy, convoyId,
    } = useConvoy();

    const [, setTicker] = useState(0);

    // Re-render every minute to update duration display
    useEffect(() => {
        const t = setInterval(() => setTicker(n => n + 1), 60000);
        return () => clearInterval(t);
    }, []);

    const totalExpenses = ledger.reduce((s, i) => s + i.amount, 0);

    const handleEndConvoy = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('End Convoy? This saves your trip summary and returns you to the lobby.');
            if (confirmed) {
                (async () => {
                    await endConvoy();
                    router.replace({
                        pathname: '/trip-summary' as any,
                        params: {
                            convoy: JSON.stringify({
                                id: '',
                                code: convoyId ?? '',
                                date: new Date().toISOString(),
                                durationMin: tripStartTime ? Math.round((Date.now() - tripStartTime) / 60000) : 0,
                                distanceKm: Math.round(totalDistanceKm * 10) / 10,
                                members: users.length,
                                messages: messages.length,
                                expensesTotal: ledger.reduce((s, i) => s + i.amount, 0),
                                votesCount: votes.length,
                            }),
                        },
                    });
                })();
            }
            return;
        }

        Alert.alert(
            'End Convoy?',
            'This saves your trip summary and returns you to the lobby.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Trip', style: 'destructive', onPress: async () => {
                        await endConvoy();
                        router.replace({
                            pathname: '/trip-summary' as any,
                            params: {
                                convoy: JSON.stringify({
                                    id: '',
                                    code: convoyId ?? '',
                                    date: new Date().toISOString(),
                                    durationMin: tripStartTime ? Math.round((Date.now() - tripStartTime) / 60000) : 0,
                                    distanceKm: Math.round(totalDistanceKm * 10) / 10,
                                    members: users.length,
                                    messages: messages.length,
                                    expensesTotal: ledger.reduce((s, i) => s + i.amount, 0),
                                    votesCount: votes.length,
                                }),
                            },
                        });
                    }
                },
            ]
        );
    };

    return (
        <View style={tw`flex-1 bg-[#F4F4F5] dark:bg-[#121212]`}>
            <TopAppBar customStyle={`absolute top-0 w-full z-50 bg-[#F4F4F5]/90 dark:bg-[#121212]/90 ${Platform.OS === 'web' ? 'pt-4' : 'pt-8'}`} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${Platform.OS === 'web' ? 'pt-24' : 'pt-32'} px-5 pb-40`}>

                {/* Header */}
                <View style={tw`mb-6`}>
                    <Text style={tw`text-[#FF6A00] text-[10px] font-bold uppercase tracking-widest mb-1`}>
                        Active Convoy • {convoyId}
                    </Text>
                    <Text style={tw`text-4xl font-black text-black dark:text-white tracking-tighter`}>Trip Stats</Text>
                </View>

                {/* Live stat cards — row 1 */}
                <View style={tw`flex-row gap-3 mb-3`}>
                    <StatCard
                        label="Duration"
                        value={formatDuration(tripStartTime)}
                        icon="timer"
                        color="#00D1FF"
                    />
                    <StatCard
                        label="Distance"
                        value={`${totalDistanceKm.toFixed(1)} km`}
                        sub={`${(totalDistanceKm * 0.621).toFixed(1)} mi`}
                        icon="route"
                        color="#FF6A00"
                    />
                </View>

                {/* Live stat cards — row 2 */}
                <View style={tw`flex-row gap-3 mb-6`}>
                    <StatCard label="Cars Live" value={`${users.length}`} icon="directions-car" color="#00FF66" />
                    <StatCard label="Messages" value={`${messages.length}`} icon="chat" color="#B44FFF" />
                    <StatCard label="Votes" value={`${votes.length}`} icon="how-to-vote" color="#FFD600" />
                </View>

                {/* Expenses */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <View>
                            <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest`}>Total Expenses</Text>
                            <Text style={tw`text-black dark:text-white font-black text-3xl mt-1`}>RM {totalExpenses.toFixed(2)}</Text>
                        </View>
                        <MaterialIcons name="receipt-long" size={32} color="#FF6A00" />
                    </View>
                    {ledger.length > 0 && (
                        <Text style={tw`text-zinc-400 text-xs mt-2`}>
                            {ledger.length} {ledger.length === 1 ? 'entry' : 'entries'} • split among {users.length} {users.length === 1 ? 'person' : 'people'}
                        </Text>
                    )}
                </View>

                {/* Convoy Roles */}
                <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest mb-3`}>Convoy Roles</Text>
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-6 shadow-sm`}>
                    {ROLE_OPTIONS.map((opt, idx) => {
                        const isMyRole = myRole === opt.key;
                        const holderUser = users.find(u => u.role === opt.key);
                        const holderName = holderUser ? (holderUser.id === myId ? 'You' : holderUser.name) : null;

                        return (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => claimRole(opt.key)}
                                style={[
                                    tw`flex-row items-center justify-between px-5 py-4`,
                                    idx < ROLE_OPTIONS.length - 1 && tw`border-b border-zinc-100 dark:border-zinc-800`,
                                    isMyRole && tw`bg-[#FF6A00]/5`,
                                ]}
                            >
                                <View style={tw`flex-row items-center gap-3`}>
                                    <Text style={tw`text-2xl`}>{opt.emoji}</Text>
                                    <View>
                                        <Text style={[tw`font-bold text-base`, isMyRole ? tw`text-[#FF6A00]` : tw`text-black dark:text-white`]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={tw`text-zinc-400 text-xs`}>{opt.desc}</Text>
                                    </View>
                                </View>
                                <View style={tw`items-end`}>
                                    {holderName ? (
                                        <View style={[tw`px-2 py-1 rounded-full`, isMyRole ? tw`bg-[#FF6A00]/15` : tw`bg-zinc-100 dark:bg-zinc-800`]}>
                                            <Text style={[tw`text-[10px] font-bold`, isMyRole ? tw`text-[#FF6A00]` : tw`text-zinc-500 dark:text-zinc-400`]}>
                                                {holderName}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={tw`text-zinc-400 text-[10px]`}>Claim</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Convoy members leaderboard */}
                <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest mb-3`}>Members</Text>
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-8 shadow-sm`}>
                    {users.length === 0 ? (
                        <View style={tw`items-center py-8`}>
                            <Text style={tw`text-zinc-400 text-sm`}>No members yet</Text>
                        </View>
                    ) : users.map((user, idx) => (
                        <View
                            key={user.id}
                            style={[
                                tw`flex-row items-center px-5 py-4`,
                                idx < users.length - 1 && tw`border-b border-zinc-100 dark:border-zinc-800`,
                            ]}
                        >
                            <View style={[tw`w-9 h-9 rounded-full items-center justify-center mr-3`, { backgroundColor: user.color }]}>
                                <Text style={tw`text-black font-black text-sm`}>{user.name[0]?.toUpperCase()}</Text>
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-black dark:text-white font-bold`}>
                                    {user.name}{user.id === myId ? ' (You)' : ''}
                                </Text>
                                <Text style={tw`text-zinc-400 text-xs`}>{user.speed} km/h</Text>
                            </View>
                            {user.role !== 'driver' && (
                                <Text style={tw`text-base`}>{user.role === 'leader' ? '👑' : '🔚'}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* End Convoy */}
                <TouchableOpacity
                    onPress={handleEndConvoy}
                    style={tw`bg-red-500/10 border border-red-500/30 rounded-2xl py-5 items-center mb-4`}
                >
                    <View style={tw`flex-row items-center gap-2`}>
                        <MaterialIcons name="flag" size={20} color="#FF3366" />
                        <Text style={tw`text-[#FF3366] font-black text-lg uppercase tracking-widest`}>End Convoy</Text>
                    </View>
                    <Text style={tw`text-zinc-500 text-xs mt-1`}>Saves trip summary to history</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
