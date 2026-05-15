import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { useNavigation } from '../contexts/NavigationContext';

export default function NavigationPanel({ currentSpeed }: { currentSpeed?: number }) {
    const isDark = useColorScheme() === 'dark';
    const nav = useNavigation();

    if (nav.mode !== 'navigating') return null;

    return (
        <>
            {/* ─── Top Card: Current Instruction ─────────────────────── */}
            <View style={[tw`absolute left-4 right-4 z-40`, { top: Platform.OS === 'web' ? 80 : 100 }]}>
                {/* Rerouting Banner */}
                {nav.isRerouting && (
                    <View style={tw`bg-[#FF6A00] rounded-2xl px-4 py-3 mb-2 flex-row items-center gap-2 shadow-xl`}>
                        <MaterialIcons name="refresh" size={18} color="white" />
                        <Text style={tw`text-white font-black text-xs uppercase tracking-widest`}>
                            Recalculating route...
                        </Text>
                    </View>
                )}

                {/* Off-route Warning */}
                {nav.isOffRoute && !nav.isRerouting && (
                    <View style={tw`bg-[#FF3366] rounded-2xl px-4 py-3 mb-2 flex-row items-center gap-2 shadow-xl`}>
                        <MaterialIcons name="wrong-location" size={18} color="white" />
                        <Text style={tw`text-white font-black text-xs uppercase tracking-widest`}>
                            Off route — recalculating...
                        </Text>
                    </View>
                )}

                {/* Main Instruction Card */}
                <View style={tw`bg-[#1C1C1E] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden`}>
                    <View style={tw`flex-row items-center`}>
                        {/* Maneuver Icon */}
                        <View style={tw`bg-[#FF6A00] w-20 py-5 items-center justify-center`}>
                            <Text style={tw`text-3xl`}>{nav.currentManeuverIcon}</Text>
                            <Text style={tw`text-white font-black text-[10px] mt-1`}>
                                {nav.distanceToNextStepDisplay}
                            </Text>
                        </View>

                        {/* Instruction Text */}
                        <View style={tw`flex-1 px-4 py-3`}>
                            <Text
                                style={tw`text-white font-bold text-sm`}
                                numberOfLines={2}
                            >
                                {nav.currentInstruction}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ─── Bottom Card: Trip Summary ──────────────────────────── */}
            <View style={tw`absolute bottom-28 left-4 right-4 z-40`}>
                <View style={tw`bg-[#1C1C1E] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden`}>

                    {/* Progress Bar */}
                    <View style={tw`h-1 bg-zinc-800`}>
                        <View
                            style={[
                                tw`h-1 bg-[#FF6A00]`,
                                { width: `${Math.min(nav.progress * 100, 100)}%` },
                            ]}
                        />
                    </View>

                    <View style={tw`flex-row items-center px-4 py-4`}>
                        {/* Speed */}
                        <View style={tw`items-center mr-4 pr-4 border-r border-zinc-800`}>
                            <Text style={tw`text-white font-black text-2xl`}>
                                {currentSpeed ?? 0}
                            </Text>
                            <Text style={tw`text-zinc-400 text-[9px] font-bold uppercase tracking-widest`}>
                                km/h
                            </Text>
                        </View>

                        {/* ETA + Distance */}
                        <View style={tw`flex-1`}>
                            <View style={tw`flex-row items-baseline gap-2`}>
                                <Text style={tw`text-white font-black text-lg`}>
                                    {nav.remainingDurationDisplay}
                                </Text>
                                <Text style={tw`text-zinc-400 text-xs font-bold`}>
                                    {nav.remainingDistanceDisplay}
                                </Text>
                            </View>
                            <Text style={tw`text-[#FF6A00] text-[10px] font-bold uppercase tracking-widest`}>
                                ETA {nav.etaDisplay}
                            </Text>
                        </View>

                        {/* End Navigation */}
                        <TouchableOpacity
                            onPress={nav.stopNavigation}
                            style={tw`bg-red-500/10 w-11 h-11 rounded-xl items-center justify-center border border-red-500/20`}
                        >
                            <MaterialIcons name="close" size={22} color="#FF3366" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
}
