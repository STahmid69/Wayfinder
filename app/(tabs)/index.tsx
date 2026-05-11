import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

import { MapView, Marker, PROVIDER_DEFAULT } from '../../components/NativeMap';
import { useConvoy } from '../../contexts/ConvoyContext';

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#303030" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1a1a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];
const lightMapStyle = [
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }
];

export default function ConvoyRadarScreen() {
  const isWeb = Platform.OS === 'web';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<any>(null);
  const snapPoints = useMemo(() => ['15%', '70%'], []);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { users, convoyId } = useConvoy();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable location services for Expo Go in your phone settings to see your live position.');
          return;
        }

        // Try to get a fast last known location so it doesn't hang
        let initialLoc = await Location.getLastKnownPositionAsync({});
        if (!initialLoc) {
          initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }

        if (initialLoc) {
          setLocation(initialLoc);
          // Auto-pan to real location when found
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: initialLoc.coords.latitude,
              longitude: initialLoc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }

        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
          (newLoc) => {
            setLocation(newLoc);
          }
        );
      } catch (error) {
        console.warn(error);
        Alert.alert('Location Error', 'There was an issue fetching your location.');
      }
    })();
  }, []);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const myLat = location ? location.coords.latitude : 36.1627;
  const myLng = location ? location.coords.longitude : -115.1398;
  const mySpeed = location ? Math.max(0, Math.round((location.coords.speed || 0) * 2.23694)) : 0;

  // Mix live DB users with static fallbacks for UI demo if unauthenticated
  const activeUsers = convoyId && users.length > 0 ? users.map((u, i) => ({
    id: u.id,
    name: `Car ${i + 1}`,
    color: i === 0 ? '#00D1FF' : '#00FF66',
    lat: u.lat,
    lng: u.lng,
    speed: u.speed,
    eta: 'Live',
    status: 'Connected'
  })) : [
    { id: 1, name: 'You (Car 1)', color: '#00D1FF', lat: myLat, lng: myLng, speed: mySpeed, eta: '20m', status: 'Pacemaker / Leader' },
    { id: 2, name: 'Safwans car', color: '#00FF66', lat: myLat - 0.005, lng: myLng - 0.005, speed: 62, eta: '22m', status: '1.2 Miles Behind' },
    { id: 3, name: 'Sarah (Car 3)', color: '#FF3366', lat: myLat + 0.01, lng: myLng + 0.015, speed: 0, eta: '28m', status: 'Stopped - Falling Behind' },
  ];

  const [aiAlertVisible, setAiAlertVisible] = useState(true);
  const [sosActive, setSosActive] = useState(false);

  return (
    <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
      <View style={StyleSheet.absoluteFill}>
        {/* ENABLED FOR NATIVE BUILD */}
        {true ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            customMapStyle={isDark ? darkMapStyle : lightMapStyle}
            provider={PROVIDER_DEFAULT}
            initialRegion={{ latitude: myLat, longitude: myLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {activeUsers.map((user: any) => (
              <Marker key={user.id} coordinate={{ latitude: user.lat, longitude: user.lng }}>
                <View style={tw`items-center`}>
                  <View style={[tw`px-2 py-1 rounded-full mb-1 shadow-sm border`, { backgroundColor: user.color, borderColor: 'white' }]}>
                    <Text style={tw`text-black text-[10px] font-bold`}>{user.name} {user.id === 1 ? '👑' : ''}</Text>
                  </View>
                  <View style={[tw`w-6 h-6 rounded-full border-2 border-white items-center justify-center shadow-lg`, { backgroundColor: user.color }]}>
                    <MaterialCommunityIcons name="car-side" size={14} color="black" />
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={tw`flex-1 items-center justify-center bg-[#FAFAFA] dark:bg-[#1a1a1a]`}>
            <MaterialIcons name="map" size={48} style={tw`text-zinc-300 dark:text-[#444]`} />
            <Text style={tw`text-zinc-500 dark:text-gray-400 mt-4 text-center px-10`}>The Live Map is temporarily disabled to prevent crashing. To enable it on a custom Android build, a Google Maps API Key must be added to app.json.</Text>
          </View>
        )}
      </View>

      <TopAppBar customStyle="bg-transparent absolute top-0 left-0 right-0 z-50 pt-8" />

      {/* AI Smart Assistant Banner */}
      {aiAlertVisible && (
        <View style={tw`absolute top-32 left-4 right-4 bg-white dark:bg-[#1C1C1E] border border-red-500/30 rounded-3xl p-4 shadow-xl z-50 flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center gap-3 flex-1`}>
            <View style={tw`bg-red-500/10 dark:bg-red-500/20 p-2 rounded-full`}>
              <MaterialCommunityIcons name="car-brake-alert" size={20} color="#EF4444" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-red-500 dark:text-red-400 font-black text-xs uppercase tracking-widest mb-0.5`}>Intelligent Alert</Text>
              <Text style={tw`text-black dark:text-white font-bold text-xs`}>Sarah (Car 3) has fallen 3 miles behind.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setAiAlertVisible(false)} style={tw`bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full items-center justify-center ml-2`}>
            <Text style={tw`text-black dark:text-white font-bold text-[10px] uppercase`}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Unified Convoy Commands (Regroup & SOS) */}
      <View style={tw`absolute right-4 ${aiAlertVisible ? 'top-56' : 'top-32'} items-end gap-3 z-50`}>
        <TouchableOpacity
          style={tw`bg-white dark:bg-[#1C1C1E] border border-blue-500/50 w-14 h-14 rounded-full shadow-2xl items-center justify-center flex-row gap-1`}
        >
          <MaterialCommunityIcons name="set-center" size={20} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSosActive(!sosActive)}
          style={tw`bg-white dark:bg-[#1C1C1E] border border-red-500/50 w-14 h-14 rounded-full shadow-2xl items-center justify-center`}
        >
          <Text style={tw`text-red-500 font-black text-[10px] uppercase tracking-widest`}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Active Modal */}
      {sosActive && (
        <View style={tw`absolute inset-0 bg-[#FAFAFA]/95 dark:bg-[#121212]/95 z-50 items-center justify-center p-6 backdrop-blur-md`}>
          <View style={tw`w-24 h-24 bg-red-500/10 rounded-full items-center justify-center mb-6 border border-red-500/30`}>
            <MaterialIcons name="warning" size={48} color="#EF4444" />
          </View>
          <Text style={tw`text-black dark:text-white font-black text-4xl mb-2 text-center tracking-tighter uppercase`}>Emergency</Text>
          <Text style={tw`text-zinc-600 dark:text-zinc-400 text-center font-medium mb-12 max-w-[80%]`}>Broadcasting exact coordinates to all convoy members and sounding alarm...</Text>

          <TouchableOpacity onPress={() => setSosActive(false)} style={tw`bg-black dark:bg-white px-10 py-5 rounded-full shadow-xl`}>
            <Text style={tw`text-white dark:text-black font-black text-sm uppercase tracking-widest`}>Cancel Alert</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[tw`absolute top-[280px] left-0 right-0 px-4 pointer-events-none`]}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <View style={tw`bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 flex-row items-center gap-2 shadow-sm`}>
            <View style={tw`w-2 h-2 rounded-full ${convoyId ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text selectable={true} style={tw`text-black dark:text-white text-[10px] font-bold uppercase tracking-widest`}>
              CODE: {convoyId}
            </Text>
          </View>
          <TouchableOpacity onPress={centerOnUser} style={tw`bg-white/90 dark:bg-black/80 w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 items-center justify-center pointer-events-auto shadow-sm`}>
            <MaterialIcons name="my-location" size={20} style={tw`text-black dark:text-white`} />
          </TouchableOpacity>
        </View>
      </View>

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
            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-[#0099D1] dark:text-[#00D1FF]`}>Convoy Status • Live Run</Text>
            <View style={tw`bg-green-500/10 dark:bg-green-500/20 px-2 py-0.5 rounded-sm flex-row items-center gap-1`}>
              <MaterialIcons name="alt-route" size={10} color="#00FF66" />
              <Text style={tw`text-[#1b6d24] dark:text-[#00FF66] text-[8px] font-bold uppercase tracking-widest`}>Auto-Following Pacemaker</Text>
            </View>
          </View>

          <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 mb-2 flex-row`}>
            {activeUsers.map((user: any) => (
              <View key={user.id} style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 w-44 relative overflow-hidden shadow-sm`}>
                <View style={[tw`absolute left-0 top-0 bottom-0 w-1`, { backgroundColor: user.color }]} />
                <Text style={tw`text-black dark:text-white font-bold text-base mb-1 ml-1`} numberOfLines={1}>{user.name}</Text>
                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-xs mb-3 ml-1`}>{user.status}</Text>
                <View style={tw`flex-row items-end justify-between ml-1`}>
                  <View>
                    <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase`}>ETA</Text>
                    <Text style={tw`text-black dark:text-white font-bold`}>{user.eta}</Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-black dark:text-white font-black text-xl`}>{user.speed}<Text style={tw`text-zinc-500 text-[10px] font-normal`}>mph</Text></Text>
                  </View>
                </View>
              </View>
            ))}
          </BottomSheetScrollView>

          <View style={tw`flex-row justify-between items-center mt-6 mb-4`}>
            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-[#FF6A00]`}>Nearby Hotspots • Malaysia</Text>
          </View>

          <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 pb-8`}>
            {[
              { id: 1, name: 'Petronas Twin Towers', type: 'Landmark', distance: '1.2 km', color: '#00D1FF', icon: 'office-building' },
              { id: 2, name: 'Batu Caves', type: 'Attraction', distance: '12 km', color: '#FF3366', icon: 'terrain' },
              { id: 3, name: 'Genting Highlands', type: 'Resort/Rest Stop', distance: '45 km', color: '#00FF66', icon: 'pine-tree' },
              { id: 4, name: 'KL Tower', type: 'Landmark', distance: '2.5 km', color: '#FF6A00', icon: 'radio-tower' },
            ].map((spot) => (
              <View key={spot.id} style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 w-44 items-center shadow-sm`}>
                <View style={[tw`w-12 h-12 rounded-full mb-3 items-center justify-center`, { backgroundColor: spot.color + '20' }]}>
                  <MaterialCommunityIcons name={spot.icon as any} size={24} color={spot.color} />
                </View>
                <Text style={tw`text-black dark:text-white font-bold text-center mb-1`} numberOfLines={1}>{spot.name}</Text>
                <Text style={tw`text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-center mb-2`}>{spot.type}</Text>
                <View style={tw`bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-zinc-600 dark:text-zinc-300 font-bold text-xs`}>{spot.distance}</Text>
                </View>
              </View>
            ))}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
