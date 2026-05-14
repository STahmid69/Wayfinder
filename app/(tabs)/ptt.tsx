import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, Vibration, View, useColorScheme } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import VoiceEngine from '../../components/VoiceEngine';
import { DRIVER_STATUS_LABELS, DriverStatus, useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

const STATUS_OPTIONS: { key: DriverStatus; emoji: string; color: string }[] = [
    { key: 'moving', emoji: '🟢', color: '#00FF66' },
    { key: 'gas', emoji: '⛽', color: '#FFD600' },
    { key: 'bathroom', emoji: '🚻', color: '#00D1FF' },
    { key: 'food', emoji: '🍔', color: '#FF6A00' },
    { key: 'car_trouble', emoji: '⚠️', color: '#FF3366' },
    { key: 'pulling_over', emoji: '🛑', color: '#B44FFF' },
];

export default function PttScreen() {
    const { users, myId, convoyId, whoIsTalking, setTalking, myStatus, setMyStatus } = useConvoy();
    const isDark = useColorScheme() === 'dark';
    const [isTalking, setIsTalking] = useState(false);

    const channels = [
        { id: 'ALL', name: 'Convoy Broadcast', icon: 'earth', color: '#FF6A00' },
        ...users
            .filter(u => u.id !== myId)
            .map(u => ({ id: u.id, name: u.name, icon: 'car-side', color: u.color })),
    ];
    const [activeChannelId, setActiveChannelId] = useState('ALL');
    const activeChannel = channels.find(c => c.id === activeChannelId) ?? channels[0];

    // Broadcast → convoy code channel. Car-to-car → sorted ID pair so both ends compute the same name.
    const agoraChannelId = activeChannelId === 'ALL'
        ? (convoyId ?? '')
        : [myId, activeChannelId].sort().join('_');

    const talkingUser = whoIsTalking ? users.find(u => u.id === whoIsTalking) : null;

    const handlePressIn = () => {
        if (Platform.OS !== 'web') Vibration.vibrate(50);
        setIsTalking(true);
        setTalking(true);
    };

    const handlePressOut = () => {
        setIsTalking(false);
        setTalking(false);
    };

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            {convoyId && <VoiceEngine channelId={agoraChannelId} isTalking={isTalking} />}
            <TopAppBar customStyle={`absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 ${Platform.OS === 'web' ? 'pt-4' : 'pt-8'}`} />

            <View style={tw`${Platform.OS === 'web' ? 'pt-24' : 'pt-32'} px-6 flex-1`}>
                <View style={tw`mb-6 items-center`}>
                    <Text style={tw`text-black dark:text-white font-black text-3xl tracking-tighter`}>Comm Center</Text>
                    <Text style={tw`text-zinc-500 dark:text-zinc-400 text-sm mt-1 uppercase tracking-widest font-bold`}>
                        {activeChannel?.name ?? 'Convoy Broadcast'}
                    </Text>
                </View>

                {/* "On Air" indicator */}
                {whoIsTalking && whoIsTalking !== myId && (
                    <View style={tw`bg-yellow-400/20 border border-yellow-400/40 rounded-2xl px-4 py-3 flex-row items-center gap-3 mb-4`}>
                        <View style={tw`w-2 h-2 rounded-full bg-yellow-400`} />
                        <Text style={tw`text-yellow-600 dark:text-yellow-300 font-black text-sm uppercase tracking-widest`}>
                            {talkingUser?.name ?? 'Someone'} is talking...
                        </Text>
                    </View>
                )}

                {/* Channel Selector */}
                <View style={tw`mb-6`}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-4`}>
                        {channels.map(channel => {
                            const isActive = activeChannelId === channel.id;
                            return (
                                <TouchableOpacity
                                    key={channel.id}
                                    onPress={() => setActiveChannelId(channel.id)}
                                    style={[
                                        tw`p-4 rounded-3xl border w-36 items-center bg-white dark:bg-[#121212]`,
                                        isActive
                                            ? { borderColor: channel.color, borderWidth: 2, backgroundColor: isDark ? '#1C1C1E' : '#fff' }
                                            : tw`border-zinc-200 dark:border-zinc-800`,
                                    ]}
                                >
                                    <MaterialCommunityIcons name={channel.icon as any} size={28} color={isActive ? channel.color : '#52525B'} />
                                    <Text style={[tw`mt-2 font-bold text-center text-xs`, isActive ? tw`text-black dark:text-white` : tw`text-zinc-400`]} numberOfLines={1}>
                                        {channel.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* PTT Button */}
                <View style={tw`flex-1 items-center justify-center`}>
                    <View style={[
                        tw`absolute w-[300px] h-[300px] rounded-full border items-center justify-center`,
                        isTalking
                            ? { borderColor: `${activeChannel?.color ?? '#FF6A00'}40`, backgroundColor: `${activeChannel?.color ?? '#FF6A00'}10` }
                            : tw`border-zinc-200/50 dark:border-zinc-800/50`,
                    ]}>
                        {isTalking && (
                            <MaterialCommunityIcons name="access-point" size={90} color={activeChannel?.color ?? '#FF6A00'} style={tw`absolute -top-10 opacity-50`} />
                        )}
                    </View>

                    <TouchableOpacity
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={0.9}
                        delayLongPress={0}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        style={[
                            tw`w-52 h-52 rounded-full items-center justify-center shadow-2xl`,
                            isTalking
                                ? { backgroundColor: activeChannel?.color ?? '#FF6A00' }
                                : { backgroundColor: isDark ? '#1C1C1E' : '#fff', borderWidth: 4, borderColor: activeChannel?.color ?? '#FF6A00' },
                        ]}
                    >
                        <MaterialCommunityIcons name="microphone-variant" size={72} color={isTalking ? 'white' : (activeChannel?.color ?? '#FF6A00')} />
                        <Text style={[tw`font-black text-lg uppercase tracking-widest mt-1`, { color: isTalking ? 'white' : (activeChannel?.color ?? '#FF6A00') }]}>
                            {isTalking ? 'Transmitting' : 'Hold To Talk'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Status Strip */}
                <View style={tw`pb-28`}>
                    <Text style={tw`text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3 text-center`}>
                        My Status — tap to broadcast
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2 justify-center flex-row px-2`}>
                        {STATUS_OPTIONS.map(opt => {
                            const isActive = myStatus === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    onPress={() => setMyStatus(opt.key)}
                                    style={[
                                        tw`px-3 py-2 rounded-full border flex-row items-center gap-1.5`,
                                        isActive
                                            ? { backgroundColor: opt.color + '25', borderColor: opt.color }
                                            : tw`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C1E]`,
                                    ]}
                                >
                                    <Text style={tw`text-sm`}>{opt.emoji}</Text>
                                    <Text style={[tw`text-[11px] font-bold`, isActive ? { color: opt.color } : tw`text-zinc-500`]}>
                                        {DRIVER_STATUS_LABELS[opt.key].replace('Stopping — ', '').replace('⚠️ ', '')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}
