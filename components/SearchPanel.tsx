import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { useNavigation } from '../contexts/NavigationContext';
import { searchPlaces, getPlaceIcon, type PlaceResult } from '../services/GeocodingService';
import { formatDistance, formatDuration, calculateETA } from '../services/RoutingService';

export default function SearchPanel() {
    const isDark = useColorScheme() === 'dark';
    const nav = useNavigation();

    const [isExpanded, setIsExpanded] = useState(false);
    const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchPlaces(searchQuery);
            setSuggestions(results);
            setIsSearching(false);
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    const handleSelectPlace = useCallback((place: PlaceResult) => {
        const point = { lat: place.lat, lng: place.lng };

        if (activeField === 'origin') {
            nav.setOrigin(point, place.shortName);
        } else {
            nav.setDestination(point, place.shortName);
        }

        setSearchQuery('');
        setSuggestions([]);
        setActiveField(null);

        // Auto-calculate route if both points are set
        if (activeField === 'destination' && nav.origin) {
            setTimeout(() => nav.calculateRoute(), 200);
        } else if (activeField === 'origin' && nav.destination) {
            setTimeout(() => nav.calculateRoute(), 200);
        }
    }, [activeField, nav]);

    const handleClearRoute = useCallback(() => {
        nav.clearRoute();
        setIsExpanded(false);
        setSearchQuery('');
        setSuggestions([]);
        setActiveField(null);
    }, [nav]);

    const handleStartNavigation = useCallback(() => {
        nav.startNavigation();
        setIsExpanded(false);
    }, [nav]);

    // Hide when navigating
    if (nav.mode === 'navigating') return null;

    // ─── Collapsed State ──────────────────────────────────────────────────────
    if (!isExpanded && nav.mode === 'idle') {
        return (
            <View style={[tw`absolute left-4 right-4 z-40`, { top: Platform.OS === 'web' ? 100 : 128 }]}>
                <TouchableOpacity
                    onPress={() => setIsExpanded(true)}
                    activeOpacity={0.9}
                    style={tw`bg-[#1C1C1E] rounded-2xl px-5 py-4 flex-row items-center gap-3 border border-zinc-800 shadow-xl`}
                >
                    <MaterialIcons name="search" size={22} color="#FF6A00" />
                    <Text style={tw`text-zinc-400 dark:text-zinc-500 font-bold text-base flex-1`}>
                        Where to?
                    </Text>
                    <View style={tw`bg-[#FF6A00]/10 px-3 py-1.5 rounded-full`}>
                        <Text style={tw`text-[#FF6A00] text-[10px] font-black uppercase tracking-widest`}>Navigate</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Expanded State ───────────────────────────────────────────────────────
    return (
        <View style={[tw`absolute left-4 right-4 z-40`, { top: Platform.OS === 'web' ? 80 : 100 }]}>
            <View style={tw`bg-[#1C1C1E] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden`}>

                {/* Header */}
                <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-2`}>
                    <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#FF6A00]`}>
                        Route Planner
                    </Text>
                    <TouchableOpacity onPress={handleClearRoute} style={tw`p-1`}>
                        <MaterialIcons name="close" size={20} color={isDark ? '#52525B' : '#A1A1AA'} />
                    </TouchableOpacity>
                </View>

                {/* Origin + Destination Fields */}
                <View style={tw`px-4 pb-3`}>
                    {/* Origin */}
                    <TouchableOpacity
                        onPress={() => { setActiveField('origin'); setSearchQuery(''); }}
                        style={tw`flex-row items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800`}
                    >
                        <View style={tw`w-6 h-6 rounded-full bg-[#00FF66] items-center justify-center`}>
                            <Text style={tw`text-black text-[10px] font-black`}>A</Text>
                        </View>
                        {activeField === 'origin' ? (
                            <TextInput
                                ref={inputRef}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search start location..."
                                placeholderTextColor="#52525B"
                                style={tw`flex-1 text-white font-bold text-sm h-8`}
                                autoFocus
                                onBlur={() => {
                                    if (!searchQuery) setActiveField(null);
                                }}
                            />
                        ) : (
                            <Text
                                style={tw`flex-1 ${nav.origin ? 'text-white font-bold' : 'text-zinc-500'} text-sm`}
                                numberOfLines={1}
                            >
                                {nav.originLabel || 'My Location'}
                            </Text>
                        )}
                        {nav.origin && activeField !== 'origin' && (
                            <MaterialIcons name="check-circle" size={16} color="#00FF66" />
                        )}
                    </TouchableOpacity>

                    {/* Destination */}
                    <TouchableOpacity
                        onPress={() => { setActiveField('destination'); setSearchQuery(''); }}
                        style={tw`flex-row items-center gap-3 py-3`}
                    >
                        <View style={tw`w-6 h-6 rounded-full bg-[#FF3366] items-center justify-center`}>
                            <Text style={tw`text-white text-[10px] font-black`}>B</Text>
                        </View>
                        {activeField === 'destination' ? (
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search destination..."
                                placeholderTextColor="#52525B"
                                style={tw`flex-1 text-white font-bold text-sm h-8`}
                                autoFocus
                                onBlur={() => {
                                    if (!searchQuery) setActiveField(null);
                                }}
                            />
                        ) : (
                            <Text
                                style={tw`flex-1 ${nav.destination ? 'text-white font-bold' : 'text-zinc-500'} text-sm`}
                                numberOfLines={1}
                            >
                                {nav.destinationLabel || 'Where to?'}
                            </Text>
                        )}
                        {nav.destination && activeField !== 'destination' && (
                            <MaterialIcons name="check-circle" size={16} color="#FF3366" />
                        )}
                    </TouchableOpacity>

                    {/* Swap button */}
                    {(nav.origin || nav.destination) && (
                        <TouchableOpacity
                            onPress={nav.swapOriginDestination}
                            style={tw`absolute right-4 top-12 w-8 h-8 bg-zinc-800 rounded-full items-center justify-center`}
                        >
                            <MaterialIcons name="swap-vert" size={18} color={isDark ? '#A1A1AA' : '#52525B'} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Results */}
                {activeField && (
                    <View style={tw`border-t border-zinc-100 dark:border-zinc-800`}>
                        {isSearching && (
                            <View style={tw`py-4 items-center`}>
                                <ActivityIndicator size="small" color="#FF6A00" />
                            </View>
                        )}
                        {!isSearching && suggestions.length > 0 && (
                            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                                {suggestions.map(place => (
                                    <TouchableOpacity
                                        key={place.id}
                                        onPress={() => handleSelectPlace(place)}
                                        style={tw`flex-row items-center gap-3 px-4 py-3 border-b border-zinc-50 dark:border-zinc-900`}
                                    >
                                        <Text style={tw`text-lg`}>{getPlaceIcon(place.type)}</Text>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-white font-bold text-sm`} numberOfLines={1}>
                                                {place.shortName}
                                            </Text>
                                            <Text style={tw`text-zinc-400 text-[10px]`} numberOfLines={1}>
                                                {place.displayName}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        {!isSearching && searchQuery.length >= 2 && suggestions.length === 0 && (
                            <View style={tw`py-4 items-center`}>
                                <Text style={tw`text-zinc-400 text-xs`}>No results found</Text>
                            </View>
                        )}

                        {/* "Click map" hint */}
                        <View style={tw`px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50`}>
                            <View style={tw`flex-row items-center gap-2`}>
                                <MaterialIcons name="touch-app" size={14} color="#FF6A00" />
                                <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-widest`}>
                                    Or click on the map to set {activeField === 'origin' ? 'start' : 'destination'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Route Summary + Actions */}
                {nav.route && !activeField && (
                    <View style={tw`border-t border-zinc-100 dark:border-zinc-800 px-4 py-4`}>
                        {/* Route info */}
                        <View style={tw`flex-row items-center gap-4 mb-4`}>
                            <View style={tw`flex-1`}>
                                <View style={tw`flex-row items-baseline gap-2`}>
                                    <Text style={tw`text-white font-black text-2xl`}>
                                        {formatDuration(nav.route.duration)}
                                    </Text>
                                    <Text style={tw`text-zinc-400 text-xs font-bold`}>
                                        {formatDistance(nav.route.distance)}
                                    </Text>
                                </View>
                                <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1`}>
                                    ETA {calculateETA(nav.route.duration)}
                                </Text>
                            </View>
                            <View style={tw`bg-[#FF6A00]/10 px-3 py-2 rounded-xl`}>
                                <Text style={tw`text-[#FF6A00] text-2xl`}>🚗</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity
                                onPress={handleClearRoute}
                                style={tw`flex-1 bg-zinc-800 py-3.5 rounded-2xl items-center`}
                            >
                                <Text style={tw`text-zinc-300 font-black uppercase tracking-widest text-xs`}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleStartNavigation}
                                style={tw`flex-2 bg-[#FF6A00] py-3.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg px-6`}
                            >
                                <MaterialIcons name="navigation" size={18} color="white" />
                                <Text style={tw`text-white font-black uppercase tracking-widest text-xs`}>
                                    Start
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Loading state */}
                {nav.isLoading && (
                    <View style={tw`border-t border-zinc-100 dark:border-zinc-800 px-4 py-6 items-center flex-row justify-center gap-3`}>
                        <ActivityIndicator size="small" color="#FF6A00" />
                        <Text style={tw`text-zinc-400 text-xs font-bold uppercase tracking-widest`}>Calculating route...</Text>
                    </View>
                )}

                {/* Error */}
                {nav.error && (
                    <View style={tw`border-t border-zinc-100 dark:border-zinc-800 px-4 py-3`}>
                        <View style={tw`bg-red-500/10 rounded-xl px-4 py-3 flex-row items-center gap-2`}>
                            <MaterialIcons name="error-outline" size={16} color="#FF3366" />
                            <Text style={tw`text-[#FF3366] text-xs font-bold flex-1`}>{nav.error}</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
