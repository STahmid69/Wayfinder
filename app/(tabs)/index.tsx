import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { MapView, Marker, RoutePolyline, RouteMarker, PROVIDER_DEFAULT } from '../../components/NativeMap';
import { DRIVER_STATUS_LABELS, DriverStatus, HAZARD_LABELS, HazardType, useConvoy } from '../../contexts/ConvoyContext';
import { useNavigation } from '../../contexts/NavigationContext';
import SearchPanel from '../../components/SearchPanel';
import NavigationPanel from '../../components/NavigationPanel';
import tw from '../../lib/tailwind';

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#303030' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];
const lightMapStyle = [{ elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }];

const HAZARD_EMOJI: Record<HazardType, string> = {
    speed_trap: '🚔', pothole: '🕳️', accident: '💥', road_closed: '🚧', construction: '🏗️',
};

const STATUS_OPTIONS: { key: DriverStatus; label: string; icon: string; color: string }[] = [
    { key: 'moving', label: 'Moving', icon: 'navigation', color: '#00FF66' },
    { key: 'gas', label: 'Gas Stop', icon: 'local-gas-station', color: '#FFD600' },
    { key: 'bathroom', label: 'Bathroom', icon: 'wc', color: '#00D1FF' },
    { key: 'food', label: 'Food Stop', icon: 'restaurant', color: '#FF6A00' },
    { key: 'car_trouble', label: 'Car Trouble', icon: 'car-repair', color: '#FF3366' },
    { key: 'pulling_over', label: 'Pulling Over', icon: 'pull-off', color: '#B44FFF' },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ConvoyRadarScreen() {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<any>(null);
    const snapPoints = useMemo(() => ['18%', '50%'], []);
    const isDark = useColorScheme() === 'dark';
    const hasCenteredRef = useRef(false);

    const { users, myId, convoyId, hazardPins, sosAlerts, myStatus, addHazardPin, sendSOS, dismissSOS, setMyStatus } = useConvoy();
    const nav = useNavigation();

    const me = users.find(u => u.id === myId);
    const centerLat = me?.lat ?? 3.139;
    const centerLng = me?.lng ?? 101.6869;
    const currentSpeed = me?.speed ?? 0;

    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showHazardPicker, setShowHazardPicker] = useState(false);

    // Auto-center on first GPS fix
    React.useEffect(() => {
        if (me && !hasCenteredRef.current && mapRef.current) {
            hasCenteredRef.current = true;
            mapRef.current.animateToRegion({ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
    }, [me?.lat, me?.lng]);

    // Auto-set origin to user's location when planning
    useEffect(() => {
        if (me && !nav.origin && nav.mode === 'planning') {
            nav.setOrigin({ lat: me.lat, lng: me.lng }, 'My Location');
        }
    }, [me?.lat, me?.lng, nav.mode]);

    // Feed GPS position to navigation context during active navigation
    useEffect(() => {
        if (me && nav.mode === 'navigating') {
            nav.updatePosition({ lat: me.lat, lng: me.lng });
        }
    }, [me?.lat, me?.lng, nav.mode]);

    // Fit map to route bounds when route is calculated
    useEffect(() => {
        if (nav.route && mapRef.current?.fitBounds) {
            const bbox = nav.route.bbox;
            if (bbox && bbox[0] !== 0) {
                mapRef.current.fitBounds([
                    [bbox[1], bbox[0]], // SW corner [lat, lng]
                    [bbox[3], bbox[2]], // NE corner [lat, lng]
                ]);
            }
        }
    }, [nav.route]);

    const centerOnUser = () => {
        if (me && mapRef.current) {
            mapRef.current.animateToRegion({ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
    };

    const handleSOS = () => {
        Alert.alert('🚨 Send SOS?', 'This will alert your entire convoy and send push notifications to everyone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send SOS', style: 'destructive', onPress: sendSOS },
        ]);
    };

    const handleAddHazard = (type: HazardType) => {
        const pos = me ?? { lat: centerLat, lng: centerLng };
        addHazardPin(type, pos.lat, pos.lng);
        setShowHazardPicker(false);
    };

    // Handle map clicks for setting origin/destination
    const handleMapClick = (latlng: { lat: number; lng: number }) => {
        if (nav.mode === 'idle') return;

        // If no destination is set, set destination
        if (!nav.destination) {
            nav.setDestination(latlng);
        } else if (!nav.origin) {
            nav.setOrigin(latlng);
        } else {
            // Both set — update destination
            nav.setDestination(latlng);
        }
    };

    // Distance to leader (first non-me user with role 'leader', else first other user)
    const leader = users.find(u => u.role === 'leader' && u.id !== myId) ?? users.find(u => u.id !== myId);
    const distToLeader = leader && me ? haversineKm(me.lat, me.lng, leader.lat, leader.lng) : null;

    const isNavigating = nav.mode === 'navigating';

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            {/* Map */}
            <View style={StyleSheet.absoluteFill}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    customMapStyle={isDark ? darkMapStyle : lightMapStyle}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                    showsUserLocation={false}
                    onMapClick={nav.mode !== 'idle' ? handleMapClick : undefined}
                >
                    {/* Route Polyline */}
                    {nav.route && (
                        <RoutePolyline
                            positions={nav.route.polyline}
                            color="#FF6A00"
                            weight={5}
                            opacity={0.9}
                        />
                    )}

                    {/* Route Markers */}
                    {nav.origin && (
                        <RouteMarker
                            coordinate={{ latitude: nav.origin.lat, longitude: nav.origin.lng }}
                            type="origin"
                            label={nav.originLabel}
                        />
                    )}
                    {nav.destination && (
                        <RouteMarker
                            coordinate={{ latitude: nav.destination.lat, longitude: nav.destination.lng }}
                            type="destination"
                            label={nav.destinationLabel}
                        />
                    )}

                    {/* Convoy members */}
                    {users.map(user => (
                        <Marker
                            key={user.id}
                            coordinate={{ latitude: user.lat, longitude: user.lng }}
                            markerColor={user.color}
                            markerLabel={user.name + (user.id === myId ? ' (You)' : '')}
                        >
                            <View style={tw`items-center`}>
                                <View style={[tw`px-2 py-1 rounded-full mb-1 shadow-sm`, { backgroundColor: user.color }]}>
                                    <Text style={tw`text-black text-[10px] font-bold`}>
                                        {user.name}{user.id === myId ? ' (You)' : ''}
                                    </Text>
                                </View>
                                <View style={[
                                    tw`w-7 h-7 rounded-full border-2 border-white items-center justify-center shadow-lg`,
                                    { backgroundColor: user.color },
                                    user.isTalking ? { borderColor: '#FFD600', borderWidth: 3 } : {},
                                ]}>
                                    <MaterialCommunityIcons name="car-side" size={16} color="black" />
                                </View>
                            </View>
                        </Marker>
                    ))}
                    {/* Hazard pins */}
                    {hazardPins.map(pin => (
                        <Marker
                            key={pin.id}
                            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                            markerColor="#FFD600"
                            markerLabel={HAZARD_EMOJI[pin.type]}
                        >
                            <View style={tw`items-center`}>
                                <View style={tw`bg-yellow-400 px-2 py-1 rounded-full shadow-md`}>
                                    <Text style={tw`text-[16px]`}>{HAZARD_EMOJI[pin.type]}</Text>
                                </View>
                            </View>
                        </Marker>
                    ))}
                    {/* SOS pins */}
                    {sosAlerts.map(sos => (
                        <Marker
                            key={sos.id}
                            coordinate={{ latitude: sos.lat, longitude: sos.lng }}
                            markerColor="#FF3366"
                            markerLabel={`🚨 ${sos.userName}`}
                        >
                            <View style={tw`items-center`}>
                                <View style={tw`bg-red-500 px-2 py-1 rounded-full shadow-md`}>
                                    <Text style={tw`text-white text-[10px] font-black`}>🚨 {sos.userName}</Text>
                                </View>
                            </View>
                        </Marker>
                    ))}
                </MapView>
            </View>

            <TopAppBar customStyle={`bg-transparent absolute top-0 left-0 right-0 z-50 ${Platform.OS === 'web' ? 'pt-4' : 'pt-8'}`} />

            {/* Search Panel (hides during navigation) */}
            <SearchPanel />

            {/* Navigation Panel (shows during navigation) */}
            <NavigationPanel currentSpeed={currentSpeed} />

            {/* SOS Alerts Banner */}
            {sosAlerts.length > 0 && (
                <View style={tw`absolute top-32 left-4 right-4 z-30`}>
                    {sosAlerts.map(sos => (
                        <View key={sos.id} style={tw`bg-red-500 rounded-2xl px-4 py-3 mb-2 flex-row items-center justify-between shadow-xl`}>
                            <View style={tw`flex-row items-center gap-2`}>
                                <Text style={tw`text-lg`}>🚨</Text>
                                <View>
                                    <Text style={tw`text-white font-black text-sm`}>{sos.userName} needs help!</Text>
                                    <Text style={tw`text-white/80 text-[10px]`}>Tap map pin to navigate</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => dismissSOS(sos.id)} style={tw`bg-white/20 p-2 rounded-full`}>
                                <MaterialIcons name="close" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* HUD row - only show when NOT navigating */}
            {!isNavigating && (
                <View style={[tw`absolute left-0 right-0 px-4`, { top: sosAlerts.length > 0 ? 200 : (Platform.OS === 'web' ? 100 : 128) }]}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 flex-row items-center gap-2 shadow-sm`}>
                            <View style={tw`w-2 h-2 rounded-full bg-green-500`} />
                            <Text style={tw`text-black dark:text-white text-[10px] font-bold uppercase tracking-widest`}>
                                {users.length} {users.length === 1 ? 'Car' : 'Cars'} Live
                            </Text>
                        </View>
                        <TouchableOpacity onPress={centerOnUser} style={tw`bg-white/90 dark:bg-black/80 w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 items-center justify-center shadow-sm`}>
                            <MaterialIcons name="my-location" size={20} style={tw`text-black dark:text-white`} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Floating Action Buttons (right side) */}
            <View style={{ position: 'absolute', right: 16, bottom: isNavigating ? 160 : 220, zIndex: 40 }}>
                {/* Recenter (during navigation) */}
                {isNavigating && (
                    <TouchableOpacity onPress={centerOnUser} style={tw`w-14 h-14 bg-white dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-700 rounded-full items-center justify-center shadow-xl mb-3`}>
                        <MaterialIcons name="my-location" size={24} style={tw`text-black dark:text-white`} />
                    </TouchableOpacity>
                )}
                {/* SOS */}
                <TouchableOpacity onPress={handleSOS} style={tw`w-14 h-14 bg-red-500 rounded-full items-center justify-center shadow-2xl mb-3`}>
                    <Text style={tw`text-white font-black text-[11px] tracking-widest`}>SOS</Text>
                </TouchableOpacity>
                {/* Hazard */}
                <TouchableOpacity onPress={() => setShowHazardPicker(true)} style={tw`w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-xl mb-3`}>
                    <Text style={tw`text-[22px]`}>⚠️</Text>
                </TouchableOpacity>
                {/* Status */}
                <TouchableOpacity onPress={() => setShowStatusPicker(true)} style={tw`w-14 h-14 bg-white dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-700 rounded-full items-center justify-center shadow-xl`}>
                    <MaterialIcons name="person-pin" size={26} style={tw`text-black dark:text-white`} />
                </TouchableOpacity>
            </View>
 
            {/* Bottom Sheet / Status Panel — hide during navigation */}
            {!isNavigating && (
                Platform.OS === 'web' ? (
                    <View style={[tw`absolute bottom-24 left-0 right-0 bg-white/95 dark:bg-[#1C1C1E]/95 border-t border-zinc-200 dark:border-zinc-800 p-5 rounded-t-3xl shadow-2xl`, { height: 200 }]}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#FF6A00]`}>
                                Live Convoy Dashboard
                            </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 flex-row pb-2`}>
                            {users.map(user => (
                                <View key={user.id} style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 w-44 relative overflow-hidden shadow-sm`}>
                                    <View style={[tw`absolute left-0 top-0 bottom-0 w-1`, { backgroundColor: user.color }]} />
                                    <View style={tw`flex-row items-center gap-1 mb-1 ml-1`}>
                                        <Text style={tw`text-black dark:text-white font-bold text-sm`} numberOfLines={1}>
                                            {user.name}{user.id === myId ? ' (You)' : ''}
                                        </Text>
                                    </View>
                                    <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] mb-2 ml-1 uppercase font-bold tracking-tighter`}>
                                        {user.status}
                                    </Text>
                                    <View style={tw`flex-row items-end justify-between ml-1`}>
                                        <Text style={tw`text-black dark:text-white font-black text-xl`}>
                                            {user.speed}<Text style={tw`text-zinc-500 text-[10px] font-normal`}> KM/H</Text>
                                        </Text>
                                        {user.id !== myId && (
                                            <TouchableOpacity 
                                                onPress={() => Linking.openURL(`https://www.waze.com/ul?ll=${user.lat},${user.lng}&navigate=yes`)}
                                                style={tw`bg-[#33CCFF] w-8 h-8 rounded-lg items-center justify-center shadow-sm`}
                                            >
                                                <MaterialCommunityIcons name="navigation" size={16} color="white" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <BottomSheet
                        ref={bottomSheetRef}
                        index={1}
                        snapPoints={snapPoints}
                        enablePanDownToClose={false}
                        handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#D4D4D8', width: 40 }}
                        backgroundStyle={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800`}
                    >
                        <BottomSheetView style={tw`flex-1 px-5 pt-1 pb-6`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-[#0099D1] dark:text-[#00D1FF]`}>
                                    Convoy Status • Live
                                </Text>
                            </View>
                            <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 flex-row`}>
                                {users.map(user => (
                                    <View key={user.id} style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 w-44 relative overflow-hidden shadow-sm`}>
                                        <View style={[tw`absolute left-0 top-0 bottom-0 w-1`, { backgroundColor: user.color }]} />
                                        <View style={tw`flex-row items-center gap-1 mb-1 ml-1`}>
                                            <Text style={tw`text-black dark:text-white font-bold text-sm`} numberOfLines={1}>
                                                {user.name}{user.id === myId ? ' (You)' : ''}
                                            </Text>
                                        </View>
                                        <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] mb-2 ml-1`}>
                                            {user.status}
                                        </Text>
                                        <View style={tw`flex-row items-end justify-between ml-1`}>
                                            <Text style={tw`text-black dark:text-white font-black text-lg`}>
                                                {user.speed}<Text style={tw`text-zinc-500 text-[10px] font-normal`}> km/h</Text>
                                            </Text>
                                            {user.id !== myId && (
                                                <TouchableOpacity 
                                                    onPress={() => Linking.openURL(`https://www.waze.com/ul?ll=${user.lat},${user.lng}&navigate=yes`)}
                                                    style={tw`bg-[#33CCFF] w-8 h-8 rounded-lg items-center justify-center shadow-sm`}
                                                >
                                                    <MaterialCommunityIcons name="navigation" size={16} color="white" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </BottomSheetScrollView>
                        </BottomSheetView>
                    </BottomSheet>
                )
            )}

            {/* Status Picker Modal */}
            <Modal visible={showStatusPicker} transparent animationType="slide" onRequestClose={() => setShowStatusPicker(false)}>
                <TouchableOpacity style={tw`flex-1 bg-black/50`} activeOpacity={1} onPress={() => setShowStatusPicker(false)} />
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-t-3xl px-6 pt-4 pb-10`}>
                    <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest mb-5 text-center`}>My Status</Text>
                    {STATUS_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.key}
                            onPress={() => { setMyStatus(opt.key); setShowStatusPicker(false); }}
                            style={[
                                tw`flex-row items-center gap-4 p-4 rounded-2xl mb-2 border`,
                                myStatus === opt.key
                                    ? { backgroundColor: opt.color + '20', borderColor: opt.color }
                                    : tw`border-zinc-200 dark:border-zinc-800`,
                            ]}
                        >
                            <MaterialIcons name={opt.icon as any} size={24} color={myStatus === opt.key ? opt.color : (isDark ? '#52525B' : '#A1A1AA')} />
                            <Text style={[tw`font-bold text-base`, myStatus === opt.key ? { color: opt.color } : tw`text-black dark:text-white`]}>
                                {opt.label}
                            </Text>
                            {myStatus === opt.key && <MaterialIcons name="check" size={20} color={opt.color} style={tw`ml-auto`} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* Hazard Picker Modal */}
            <Modal visible={showHazardPicker} transparent animationType="slide" onRequestClose={() => setShowHazardPicker(false)}>
                <TouchableOpacity style={tw`flex-1 bg-black/50`} activeOpacity={1} onPress={() => setShowHazardPicker(false)} />
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-t-3xl px-6 pt-4 pb-10`}>
                    <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest mb-2 text-center`}>Report Hazard</Text>
                    <Text style={tw`text-zinc-500 text-xs text-center mb-5`}>Pins at your current location, visible to all convoy members</Text>
                    {(Object.keys(HAZARD_LABELS) as HazardType[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => handleAddHazard(type)}
                            style={tw`flex-row items-center gap-4 p-4 rounded-2xl mb-2 border border-zinc-200 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#121212]`}
                        >
                            <Text style={tw`text-2xl`}>{HAZARD_EMOJI[type]}</Text>
                            <Text style={tw`text-black dark:text-white font-bold text-base`}>{HAZARD_LABELS[type]}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>
        </View>
    );
}
