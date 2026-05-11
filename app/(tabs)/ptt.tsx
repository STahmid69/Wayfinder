import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, ScrollView, Text, TouchableOpacity, Vibration, View } from 'react-native';

// Safe Mock for Expo Go compatibility
let createAgoraRtcEngine: any;
let ChannelProfileType: any = { ChannelProfileLiveBroadcasting: 1 };
let ClientRoleType: any = { ClientRoleBroadcaster: 1 };

try {
    const Agora = require('react-native-agora');
    createAgoraRtcEngine = Agora.createAgoraRtcEngine;
    ChannelProfileType = Agora.ChannelProfileType;
    ClientRoleType = Agora.ClientRoleType;
} catch (e) {
    console.log("Agora native module not found, using mock for Expo Go.");
    createAgoraRtcEngine = () => ({
        initialize: () => { console.log("Mock: Initializing Agora"); },
        setChannelProfile: () => {},
        setClientRole: () => {},
        enableAudio: () => {},
        joinChannel: () => { console.log("Mock: Joining Channel"); },
        leaveChannel: () => { console.log("Mock: Leaving Channel"); },
        release: () => {},
    });
}

import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

export default function PttScreen() {
    const [activeChannel, setActiveChannel] = useState('ALL');
    const [isTalking, setIsTalking] = useState(false);
    const [handsFree, setHandsFree] = useState(false);
    const [continuousMode, setContinuousMode] = useState(false);
    const engineRef = useRef<IRtcEngine | null>(null);

    const getPermission = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);
        }
    };

    useEffect(() => {
        setupAgora();
        return () => {
            if (engineRef.current) {
                engineRef.current.leaveChannel();
                engineRef.current.release();
            }
        };
    }, []);

    const setupAgora = async () => {
        try {
            await getPermission();
            const engine = createAgoraRtcEngine();
            engineRef.current = engine;
            engine.initialize({ appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '' });
            engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
            engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
            engine.enableAudio();
        } catch (e) {
            console.warn("Agora Init Error:", e);
        }
    };

    const channels = [
        { id: 'ALL', name: 'Convoy Broadcast', icon: 'earth', color: '#FF6A00', isPriority: true },
        { id: 'CAR2', name: 'Safwans car', icon: 'car-side', color: '#00FF66' },
        { id: 'CAR3', name: 'Car 3 (Sarah)', icon: 'car-side', color: '#FF3366' },
    ];

    const toggleTalk = () => {
        Vibration.vibrate(50);
        const nextState = !isTalking;
        setIsTalking(nextState);

        try {
            if (nextState) {
                engineRef.current?.joinChannel('', activeChannel, 0, {
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                    channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
                });
            } else {
                engineRef.current?.leaveChannel();
            }
        } catch (e) {
            console.warn("Agora Join Error:", e);
        }
    };

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar customStyle="absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 pt-8" />

            <View style={tw`pt-32 px-6 flex-1`}>
                <View style={tw`mb-8 items-center`}>
                    <Text style={tw`text-black dark:text-white font-black text-3xl tracking-tighter`}>Comm Center</Text>
                    <Text style={tw`text-zinc-500 dark:text-zinc-400 text-sm mt-1 uppercase tracking-widest font-bold`}>Current Channel: {channels.find(c => c.id === activeChannel)?.name}</Text>
                </View>

                {/* Channel Selector */}
                <View style={tw`mb-8`}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-4`}>
                        {channels.map((channel) => (
                            <TouchableOpacity
                                key={channel.id}
                                onPress={() => setActiveChannel(channel.id)}
                                style={[
                                    tw`p-4 rounded-3xl border w-40 items-center bg-white dark:bg-[#121212]`,
                                    activeChannel === channel.id ? tw`dark:bg-[#1C1C1E] border-[${channel.color}]` : tw`border-zinc-200 dark:border-zinc-800`
                                ]}
                            >
                                <MaterialCommunityIcons name={channel.icon as any} size={32} color={activeChannel === channel.id ? channel.color : '#52525B'} />
                                {channel.isPriority && (
                                    <View style={tw`absolute top-2 right-2 bg-red-500/10 px-2 py-0.5 rounded-sm`}>
                                        <Text style={tw`text-red-500 text-[8px] font-bold uppercase`}>Priority</Text>
                                    </View>
                                )}
                                <Text style={[tw`mt-3 font-bold text-center`, activeChannel === channel.id ? tw`text-black dark:text-white` : tw`text-zinc-400`]}>
                                    {channel.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Hands-Free & Continuous Mode Toggles */}
                <View style={tw`flex-row gap-4 mb-10`}>
                    <TouchableOpacity
                        onPress={() => setHandsFree(!handsFree)}
                        style={[tw`flex-1 rounded-2xl p-4 border flex-row items-center justify-between shadow-sm`, handsFree ? tw`bg-[#00D1FF]/10 border-[#00D1FF]` : tw`bg-white dark:bg-[#1C1C1E] border-zinc-200 dark:border-zinc-800`]}
                    >
                        <View>
                            <Text style={tw`text-black dark:text-white font-bold text-sm mb-1`}>"Hey Wayfinder"</Text>
                            <Text style={tw`text-zinc-500 text-[10px] uppercase font-black tracking-widest`}>{handsFree ? 'Listening / Active' : 'Hands-Free Off'}</Text>
                        </View>
                        <MaterialCommunityIcons name="face-recognition" size={24} color={handsFree ? "#00D1FF" : "#52525B"} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setContinuousMode(!continuousMode)}
                        style={[tw`flex-1 rounded-2xl p-4 border flex-row items-center justify-between shadow-sm`, continuousMode ? tw`bg-[#FF6A00]/10 border-[#FF6A00]` : tw`bg-white dark:bg-[#1C1C1E] border-zinc-200 dark:border-zinc-800`]}
                    >
                        <View>
                            <Text style={tw`text-black dark:text-white font-bold text-sm mb-1`}>Open Channel</Text>
                            <Text style={tw`text-zinc-500 text-[10px] uppercase font-black tracking-widest`}>{continuousMode ? 'Live Feed on' : 'Stream Off'}</Text>
                        </View>
                        <MaterialCommunityIcons name="podcast" size={24} color={continuousMode ? "#FF6A00" : "#52525B"} />
                    </TouchableOpacity>
                </View>

                {/* Status Ring & PTT Button */}
                <View style={tw`flex-1 items-center justify-center mb-24`}>
                    <View style={[tw`absolute w-[320px] h-[320px] rounded-full border border-[#FF6A00]/20 items-center justify-center`, isTalking && tw`bg-[#FF6A00]/10`]}>
                        {isTalking && (
                            <MaterialCommunityIcons name="access-point" size={100} color="#FF6A00" style={tw`absolute -top-10 opacity-50`} />
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={toggleTalk}
                        activeOpacity={0.9}
                        style={[
                            tw`w-56 h-56 rounded-full items-center justify-center shadow-2xl`,
                            isTalking ? tw`bg-[#FF6A00]` : tw`bg-white dark:bg-[#1C1C1E] border-4 border-[${channels.find(c => c.id === activeChannel)?.color || '#FF6A00'}]`
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={isTalking ? "microphone" : "microphone-off"}
                            size={80}
                            color={isTalking ? "white" : (channels.find(c => c.id === activeChannel)?.color || '#FF6A00')}
                        />
                        <Text style={[tw`font-black text-2xl uppercase tracking-widest mt-2`, isTalking ? tw`text-white` : tw`text-[${channels.find(c => c.id === activeChannel)?.color || '#FF6A00'}]`]}>
                            {isTalking ? 'Live (Tap to Mute)' : 'Tap to Connect'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
