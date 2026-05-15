import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../lib/tailwind';

const PERMISSIONS_SHOWN_KEY = 'wayfinder_permissions_shown';

const PERMISSION_ITEMS = [
    {
        icon: 'location-on' as const,
        color: '#FF6A00',
        title: 'Location',
        description: 'So your convoy sees where you are on the map in real time.',
    },
    {
        icon: 'mic' as const,
        color: '#00D1FF',
        title: 'Microphone',
        description: 'For Push-to-Talk so you can speak directly to your convoy.',
    },
];

export async function markPermissionsShown() {
    await AsyncStorage.setItem(PERMISSIONS_SHOWN_KEY, 'true');
}

export async function hasSeenPermissions(): Promise<boolean> {
    const val = await AsyncStorage.getItem(PERMISSIONS_SHOWN_KEY);
    return val === 'true';
}

export default function PermissionsScreen() {
    const [loading, setLoading] = useState(false);

    const handleAllow = async () => {
        setLoading(true);
        await Location.requestForegroundPermissionsAsync();
        if (Platform.OS === 'ios') {
            await Location.requestBackgroundPermissionsAsync();
        }
        await markPermissionsShown();
        router.replace('/onboarding');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#121212]`}>
            <View style={tw`flex-1 px-8 justify-center`}>
                <View style={tw`items-center mb-14`}>
                    <View style={tw`w-24 h-24 bg-[#FF6A00]/20 rounded-3xl items-center justify-center mb-5 border border-[#FF6A00]/40`}>
                        <MaterialIcons name="explore" size={48} color="#FF6A00" />
                    </View>
                    <Text style={tw`text-white font-black text-4xl tracking-tighter`}>WAYFINDER</Text>
                    <Text style={tw`text-zinc-500 text-xs uppercase tracking-[5px] mt-1`}>Needs a couple of things</Text>
                </View>

                <View style={tw`gap-4 mb-12`}>
                    {PERMISSION_ITEMS.map((item) => (
                        <View
                            key={item.title}
                            style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 flex-row items-center gap-4`}
                        >
                            <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: item.color + '20' }]}>
                                <MaterialIcons name={item.icon} size={24} color={item.color} />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-white font-black text-base uppercase tracking-wider`}>{item.title}</Text>
                                <Text style={tw`text-zinc-400 text-sm mt-0.5`}>{item.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleAllow}
                    disabled={loading}
                    style={tw`bg-[#FF6A00] py-5 rounded-2xl items-center shadow-xl`}
                >
                    <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>
                        {loading ? 'Setting up...' : 'Allow & Continue'}
                    </Text>
                </TouchableOpacity>

                <Text style={tw`text-zinc-600 text-xs text-center mt-4`}>
                    You can change these anytime in your device Settings.
                </Text>
            </View>
        </SafeAreaView>
    );
}
