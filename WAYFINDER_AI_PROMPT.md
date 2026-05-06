# Wayfinder AI Studio Prompt

Copy and paste the text below into AI Studio (or any AI coding assistant) to perfectly recreate, understand, and continue building "The Wayfinder" App.

---
**[COPY FROM HERE DOWNWARD]**

You are an expert React Native and Expo developer. We are building a mobile application called **"The Wayfinder"**. 
It is an advanced road-trip tracking and communication app designed for a convoy of multiple cars driving together.

### The Application Features:
1. **Live Convoy Radar**: Real-time GPS tracking mapping all cars.
2. **Push-To-Talk (Walkie-Talkie)**: A massive PTT communication center supporting "Broadcast" or "Car-to-Car" channels.
3. **Smart Hub (Voting, Chat, Ledger)**: A unified dashboard where the convoy can vote on pit-stops.
4. **Trip Leaderboard**: A gamified stats page showing who has navigated best.

### Tech Stack & Libraries:
- **Framework:** Expo SDK / React Native (Expo Router)
- **Styling:** twrnc (Tailwind CSS for React Native)
- **Map & Location:** react-native-maps, expo-location
- **Gestures/UI:** @gorhom/bottom-sheet, react-native-safe-area-context
- **Icons**: @expo/vector-icons

### Design System: "Rugged Editorial"
- **Dual-Theme Support**: Must natively support system Light and Dark Mode.
- **Dark Mode**: Background bg-[#121212], surface bg-[#1C1C1E], neon orange accents #FF6A00.
- **Light Mode**: Background bg-[#FAFAFA], surface bg-white, neon orange accents #FF6A00.

Below is the current codebase. Please deeply read and understand these core files.


### `app/(tabs)/_layout.tsx`
```tsx
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, useColorScheme, View } from 'react-native';
import { useDeviceContext } from 'twrnc';
import tw from '../../lib/tailwind';

export default function TabLayout() {
  useDeviceContext(tw);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6A00',
        tabBarInactiveTintColor: isDark ? '#52525B' : '#A1A1AA',
        tabBarStyle: tw`bg-[#FFFFFF] dark:bg-[#121212] h-24 pt-2 pb-6 absolute bottom-0 w-full shadow-2xl border-t border-zinc-200 dark:border-zinc-800 elevation-10`,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MaterialIcons name="map" size={28} color={color} />,
          tabBarLabel: ({ color }) => <Text style={[tw`text-[10px] uppercase font-bold tracking-widest mt-1`, { color }]}>Map</Text>,
        }}
      />
      <Tabs.Screen
        name="ptt"
        options={{
          title: 'PTT',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="microphone-variant" size={28} color={color} />,
          tabBarLabel: ({ color }) => <Text style={[tw`text-[10px] uppercase font-bold tracking-widest mt-1`, { color }]}>Talk</Text>,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Hub',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard-customize" size={28} color={color} />,
          tabBarLabel: ({ color }) => <Text style={[tw`text-[10px] uppercase font-bold tracking-widest mt-1`, { color }]}>Hub</Text>,
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          title: 'Trip',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? tw`bg-[#FF6A00] rounded-xl py-2 px-6 shadow-md` : {}}>
              <MaterialIcons name="route" size={28} color={focused ? 'white' : (isDark ? '#52525B' : '#A1A1AA')} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            focused ? null : <Text style={tw`text-[10px] uppercase font-bold tracking-widest mt-1 dark:text-zinc-500 text-zinc-400`}>Stats</Text>
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

```

### `components/TopAppBar.tsx`
```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';

interface TopAppBarProps {
    customStyle?: string;
}

export default function TopAppBar({ customStyle }: TopAppBarProps) {
    return (
        <SafeAreaView edges={['top']} style={tw`${customStyle || 'absolute top-0 w-full z-50 bg-white/90 dark:bg-[#121212]/90 shadow-sm'}`}>
            <View style={tw`flex-row justify-between items-center px-6 h-16 w-full mt-2`}>
                <View style={tw`flex-row items-center gap-2`}>
                    <MaterialIcons name="explore" size={26} color="#FF6A00" />
                    <Text style={tw`text-xl font-bold italic text-black dark:text-white tracking-widest`}>WAYFINDER</Text>
                </View>
                <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`bg-zinc-100 dark:bg-[#1C1C1E] p-2 rounded-full border border-zinc-200 dark:border-zinc-800`}>
                        <MaterialIcons name="notifications" size={20} style={tw`text-black dark:text-white`} />
                    </View>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM6IdpKcPH_FoRKicmfAnitQT3VYIQvD7EcxDUzok62RIEwCktZf3bV5-j0jroLllXlRmRheLf6CsqQf9ltSc5HfmkvrZnzQgxNrjk_0LOt0elrbWK2SYKGOGAZSVMoTtmXTqNEI52LgBYjTDisVtD6rsan8sfFPc37zkOCaKkc-7QEsLQ6LmmHTwfb-v7gpNaivV3mg06EGZYreWno48q99ukehFn9QNNZH-XyTYjIpOq3V2IcbLRzi_pJ4KPZ-rQocPC_ibjqns' }}
                        style={tw`w-10 h-10 rounded-full border-2 border-[#FF6A00]`}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

```

### `app/(tabs)/index.tsx`
```tsx
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

let MapView: any, Marker: any, PROVIDER_DEFAULT: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
}

const { width, height } = Dimensions.get('window');

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
  const snapPoints = useMemo(() => ['15%', '45%'], []);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let initialLoc = await Location.getCurrentPositionAsync({});
      setLocation(initialLoc);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (newLoc) => {
          setLocation(newLoc);
        }
      );
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

  // Default to Vegas if location is missing
  const myLat = location ? location.coords.latitude : 36.1627;
  const myLng = location ? location.coords.longitude : -115.1398;
  const mySpeed = location ? Math.max(0, Math.round((location.coords.speed || 0) * 2.23694)) : 0; // m/s to mph

  const mockUsers = [
    { id: 1, name: 'You (Car 1)', color: '#00D1FF', lat: myLat, lng: myLng, speed: mySpeed, eta: '20m', status: 'Leading' },
    { id: 2, name: 'Alex (Car 2)', color: '#00FF66', lat: myLat - 0.005, lng: myLng - 0.005, speed: 62, eta: '22m', status: '2 Miles Behind' },
    { id: 3, name: 'Sarah (Car 3)', color: '#FF3366', lat: myLat + 0.01, lng: myLng + 0.015, speed: 0, eta: '28m', status: 'Stopped at Gas' },
  ];

  return (
    <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
      {/* Map Layer */}
      <View style={StyleSheet.absoluteFill}>
        {!isWeb ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            customMapStyle={isDark ? darkMapStyle : lightMapStyle}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: myLat,
              longitude: myLng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={false}
          >
            {mockUsers.map(user => (
              <Marker key={user.id} coordinate={{ latitude: user.lat, longitude: user.lng }}>
                <View style={tw`items-center`}>
                  <View style={[tw`px-2 py-1 rounded-full mb-1 shadow-sm`, { backgroundColor: user.color }]}>
                    <Text style={tw`text-black text-[10px] font-bold`}>{user.name}</Text>
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
            <Text style={tw`text-zinc-500 dark:text-gray-400 mt-4`}>Live Map requires iOS/Android simulator.</Text>
          </View>
        )}
      </View>

      <TopAppBar customStyle="bg-transparent absolute top-0 left-0 right-0 z-50 pt-8" />

      {/* Map Overlay & HUD */}
      <View style={[tw`absolute top-32 left-0 right-0 px-4 pointer-events-none`]}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <View style={tw`bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 flex-row items-center gap-2 shadow-sm`}>
            <View style={tw`w-2 h-2 rounded-full bg-red-500`} />
            <Text style={tw`text-black dark:text-white text-[10px] font-bold uppercase tracking-widest`}>Radar Active</Text>
          </View>
          <TouchableOpacity
            onPress={centerOnUser}
            style={tw`bg-white/90 dark:bg-black/80 w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 items-center justify-center pointer-events-auto shadow-sm`}
          >
            <MaterialIcons name="my-location" size={20} style={tw`text-black dark:text-white`} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Convoy Status Bottom Sheet */}
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
            <View style={tw`bg-red-500/10 dark:bg-red-500/20 px-2 py-0.5 rounded-sm flex-row items-center gap-1`}>
              <MaterialIcons name="warning" size={10} color="#FF3366" />
              <Text style={tw`text-[#FF3366] text-[8px] font-bold uppercase`}>Car 3 Stopped</Text>
            </View>
          </View>

          <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 mb-2 flex-row`}>
            {mockUsers.map((user) => (
              <View key={user.id} style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 w-44 relative overflow-hidden shadow-sm`}>
                <View style={[tw`absolute left-0 top-0 bottom-0 w-1`, { backgroundColor: user.color }]} />
                <Text style={tw`text-black dark:text-white font-bold text-base mb-1 ml-1`} numberOfLines={1}>{user.name}</Text>
                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-xs mb-3 ml-1`} numberOfLines={1}>{user.status}</Text>
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

          <View style={tw`mt-4 bg-[#FAFAFA] dark:bg-[#2C2C2E] rounded-xl p-3 flex-row items-center justify-between border border-zinc-200 dark:border-zinc-700`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`bg-[#FFD600]/20 p-1.5 rounded-lg`}>
                <MaterialCommunityIcons name="food" size={16} color="#B29400" style={tw`dark:text-[#FFD600]`} />
              </View>
              <View>
                <Text style={tw`text-black dark:text-white font-bold text-sm`}>Next Stop: Taco Bell</Text>
                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-xs`}>Proposed by Alex</Text>
              </View>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`text-[#B29400] dark:text-[#FFD600] font-black text-lg`}>14<Text style={tw`text-xs`}>mi</Text></Text>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

```

### `app/(tabs)/chat.tsx`
```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

export default function SocialHubScreen() {
    const [activeTab, setActiveTab] = useState('VOTES'); // CHAT | VOTES | LEDGER

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar customStyle="absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 pt-8" />

            <View style={tw`pt-32 px-4 pb-24 flex-1`}>

                {/* Segmented Control */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-full p-1 flex-row mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xl`}>
                    {['CHAT', 'VOTES', 'LEDGER'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[tw`flex-1 py-3 rounded-full items-center`, activeTab === tab ? tw`bg-zinc-100 dark:bg-white` : null]}
                        >
                            <Text style={[tw`font-bold tracking-widest text-[11px] uppercase`, activeTab === tab ? tw`text-black` : tw`text-zinc-400 dark:text-zinc-500`]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* ---------------- VOTES TAB ---------------- */}
                    {activeTab === 'VOTES' && (
                        <View>
                            <View style={tw`flex-row items-center justify-between mb-4 mt-2 px-2`}>
                                <Text style={tw`text-black dark:text-white text-lg font-black tracking-widest uppercase`}>Active Votes</Text>
                                <TouchableOpacity style={tw`bg-[#FF6A00] px-4 py-1.5 rounded-full shadow-lg`}>
                                    <Text style={tw`text-white text-xs font-bold`}>+ Propose Stop</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Vote Card */}
                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 mb-4 shadow-sm dark:shadow-xl`}>
                                <View style={tw`flex-row justify-between items-start mb-4`}>
                                    <View style={tw`flex-row items-center gap-3`}>
                                        <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM6IdpKcPH_FoRKicmfAnitQT3VYIQvD7EcxDUzok62RIEwCktZf3bV5-j0jroLllXlRmRheLf6CsqQf9ltSc5HfmkvrZnzQgxNrjk_0LOt0elrbWK2SYKGOGAZSVMoTtmXTqNEI52LgBYjTDisVtD6rsan8sfFPc37zkOCaKkc-7QEsLQ6LmmHTwfb-v7gpNaivV3mg06EGZYreWno48q99ukehFn9QNNZH-XyTYjIpOq3V2IcbLRzi_pJ4KPZ-rQocPC_ibjqns' }} style={tw`w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-white`} />
                                        <View>
                                            <Text style={tw`text-black dark:text-white font-bold text-lg`}>Lunch Break</Text>
                                            <Text style={tw`text-[#FF6A00] text-[10px] uppercase font-bold tracking-widest`}>Proposed by You</Text>
                                        </View>
                                    </View>
                                    <View style={tw`bg-red-500/10 dark:bg-red-500/20 px-3 py-1.5 rounded-full`}>
                                        <Text style={tw`text-red-500 text-[10px] font-black`}>CLOSING IN 5M</Text>
                                    </View>
                                </View>

                                {/* Winning Option */}
                                <TouchableOpacity style={tw`bg-[#FAFAFA] dark:bg-[#121212] border-2 border-[#FF6A00] rounded-2xl p-4 mb-3 flex-row justify-between items-center relative overflow-hidden`}>
                                    <View style={[tw`absolute left-0 top-0 bottom-0 bg-[#FF6A00]/20`, { width: '75%' }]} />
                                    <View style={tw`flex-row items-center gap-3 z-10`}>
                                        <View style={tw`w-6 h-6 rounded-full border border-[#FF6A00] bg-white items-center justify-center`}>
                                            <MaterialIcons name="check" size={14} color="black" />
                                        </View>
                                        <Text style={tw`text-black dark:text-white font-black text-lg uppercase`}>Taco Bell</Text>
                                    </View>
                                    <Text style={tw`text-black dark:text-white font-bold z-10`}>3 Votes</Text>
                                </TouchableOpacity>

                                {/* Losing Option */}
                                <TouchableOpacity style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex-row justify-between items-center relative overflow-hidden`}>
                                    <View style={[tw`absolute left-0 top-0 bottom-0 bg-zinc-200/50 dark:bg-zinc-800/30`, { width: '25%' }]} />
                                    <View style={tw`flex-row items-center gap-3 z-10`}>
                                        <View style={tw`w-6 h-6 rounded-full border border-zinc-400 dark:border-zinc-600 bg-transparent`} />
                                        <Text style={tw`text-zinc-500 dark:text-zinc-400 font-bold text-lg uppercase`}>Wendy's</Text>
                                    </View>
                                    <Text style={tw`text-zinc-400 dark:text-zinc-500 font-bold z-10`}>1 Vote</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ---------------- CHAT TAB ---------------- */}
                    {activeTab === 'CHAT' && (
                        <View style={tw`flex-1`}>
                            <View style={tw`mb-4`}>
                                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 self-start p-4 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl mb-3 max-w-[80%] shadow-sm`}>
                                    <Text style={tw`text-[#00C253] dark:text-[#00FF66] text-[10px] font-black uppercase mb-1 tracking-widest`}>Alex (Car 2)</Text>
                                    <Text style={tw`text-black dark:text-white text-base`}>Can we pull over at the next exit? Need to stretch.</Text>
                                </View>
                                <View style={tw`bg-[#FF6A00] self-end p-4 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl mb-3 max-w-[80%] shadow-lg`}>
                                    <Text style={tw`text-white font-bold text-base`}>Yeah sure, I'll propose a pit stop vote now.</Text>
                                </View>
                            </View>

                            <View style={tw`flex-row items-center bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-2 mt-8 shadow-sm`}>
                                <TouchableOpacity style={tw`mr-3`}>
                                    <MaterialIcons name="add-circle-outline" size={26} color="#FF6A00" />
                                </TouchableOpacity>
                                <TextInput
                                    placeholder="Message the convoy..."
                                    placeholderTextColor="#A1A1AA"
                                    style={tw`flex-1 text-black dark:text-white h-12`}
                                />
                                <TouchableOpacity style={tw`bg-[#FF6A00] w-10 h-10 rounded-full items-center justify-center shadow-lg`}>
                                    <MaterialIcons name="arrow-upward" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ---------------- LEDGER TAB ---------------- */}
                    {activeTab === 'LEDGER' && (
                        <View>
                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 mb-6 shadow-xl items-center`}>
                                <Text style={tw`text-zinc-500 text-xs font-black uppercase tracking-widest`}>Total Trip Spend</Text>
                                <Text style={tw`text-black dark:text-white text-6xl font-black mt-2 mb-6`}>$142.50</Text>
                                <View style={tw`w-full flex-row justify-between items-center bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4`}>
                                    <Text style={tw`text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]`}>You owe:</Text>
                                    <Text style={tw`text-[#FF3366] font-black text-lg`}>$24.00 <Text style={tw`text-sm font-bold`}>to Alex</Text></Text>
                                </View>
                            </View>

                            <TouchableOpacity style={tw`bg-[#FF6A00] rounded-2xl p-4 flex-row justify-center items-center gap-2 mb-4 shadow-lg`}>
                                <MaterialIcons name="receipt-long" size={24} color="white" />
                                <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>Add New Expense</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </View>
        </View>
    );
}

```

### `app/(tabs)/ptt.tsx`
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Vibration, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

export default function PttScreen() {
    const [activeChannel, setActiveChannel] = useState('ALL');
    const [isTalking, setIsTalking] = useState(false);

    const channels = [
        { id: 'ALL', name: 'Convoy Broadcast', icon: 'earth', color: '#FF6A00' },
        { id: 'CAR2', name: 'Car 2 (Alex)', icon: 'car-side', color: '#00FF66' },
        { id: 'CAR3', name: 'Car 3 (Sarah)', icon: 'car-side', color: '#FF3366' },
    ];

    const handlePressIn = () => {
        Vibration.vibrate(50);
        setIsTalking(true);
    };

    const handlePressOut = () => {
        setIsTalking(false);
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
                <View style={tw`mb-12`}>
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
                                <Text style={[tw`mt-3 font-bold text-center`, activeChannel === channel.id ? tw`text-black dark:text-white` : tw`text-zinc-400`]}>
                                    {channel.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Status Ring & PTT Button */}
                <View style={tw`flex-1 items-center justify-center mb-24`}>
                    <View style={[tw`absolute w-[320px] h-[320px] rounded-full border border-[#FF6A00]/20 items-center justify-center`, isTalking && tw`bg-[#FF6A00]/10`]}>
                        {isTalking && (
                            <MaterialCommunityIcons name="access-point" size={100} color="#FF6A00" style={tw`absolute -top-10 opacity-50`} />
                        )}
                    </View>

                    <TouchableOpacity
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={0.9}
                        style={[
                            tw`w-56 h-56 rounded-full items-center justify-center shadow-2xl`,
                            isTalking ? tw`bg-[#FF6A00]` : tw`bg-white dark:bg-[#1C1C1E] border-4 border-[${channels.find(c => c.id === activeChannel)?.color || '#FF6A00'}]`
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="microphone-variant"
                            size={80}
                            color={isTalking ? "white" : (channels.find(c => c.id === activeChannel)?.color || '#FF6A00')}
                        />
                        <Text style={[tw`font-black text-2xl uppercase tracking-widest mt-2`, isTalking ? tw`text-white` : tw`text-[${channels.find(c => c.id === activeChannel)?.color || '#FF6A00'}]`]}>
                            {isTalking ? 'Transmitting' : 'Hold To Talk'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

```

### `app/(tabs)/trip.tsx`
```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

export default function TripLeaderboard() {
    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar customStyle="absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 pt-8" />

            <ScrollView contentContainerStyle={tw`pt-32 px-6 pb-40`}>
                {/* Hero Section */}
                <View style={tw`mb-8`}>
                    <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-[#FF6A00] mb-2`}>Current Expedition: Pacific Coast Highway</Text>
                    <Text style={tw`text-5xl font-extrabold tracking-tighter text-black dark:text-white`}>Trip</Text>
                    <Text style={tw`text-5xl font-extrabold tracking-tighter text-black dark:text-white`}>Leaderboard.</Text>
                </View>

                {/* Top Navigator Card */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-[380px] mb-6 justify-between overflow-hidden shadow-sm dark:shadow-xl`}>
                    <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt9ZY4RXdKRh480Nj0fRxLIXObDnhIzt4G1V7YeUV9QY34ENFuBWmeFk9RIch6qlLMzvIQ-14qFp77Ng4_2UprRcDhKwOwec8VvmbpQkJ2jkimgYqSNl1rLtSJ2lDiCsJ-9RP3bzyzlRdV2LrILqdeFG-2cbHhjynl7ubS0jkCqTde4_CNcjfG3U4ouZcGDcW07r_aOrkZAYHSd_oKbUjYpnd227-VQGmb0Jzx5B-08ISOBotDuH4FQQwbiExbwVIShFyagrcALaM' }} style={[tw`absolute w-full h-[380px] opacity-10 dark:opacity-20`]} />
                    <View style={tw`z-10`}>
                        <View style={tw`bg-[#1b6d24] dark:bg-[#FF6A00]/20 self-start px-3 py-1.5 rounded-full mb-4 border border-[#1b6d24] dark:border-[#FF6A00]`}>
                            <Text style={tw`text-white dark:text-[#FF6A00] text-[10px] font-bold uppercase tracking-widest`}>Current Leader</Text>
                        </View>
                        <Text style={tw`text-4xl font-bold text-black dark:text-white mb-2`}>Top Navigator</Text>
                        <Text style={tw`text-zinc-600 dark:text-zinc-400 font-medium`}>Alex has pinpointed 14 hidden viewpoints with zero missed exits since Big Sur.</Text>
                    </View>

                    <View style={tw`z-10 flex-row justify-between items-end mt-8`}>
                        <View style={tw`flex-row items-center gap-4`}>
                            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArH6i5OBwQcc9ZhDmAOBp7pXVBi_cmCx-z4KuzKGyx1mPkhrSWUWm3pj0igydrzZlwpY3erMz4iBesSjB_kbfwzAjt6XD1d4L993vAERNpUKAFw2FyZXUUytrjivMuNGB0vYH7WeDT7VYwpRZvx4XE-0_DYVWbCvXWt2PODyVCml3zQ-W1ybwDByNSBloSZHm70CXEjjZS-PVm1MrFmz9Dily_MNz9W2WT0ycmJFp0WUurzCrZ--SOtDZjrytvZNnrEuR1_QubSuM' }} style={tw`w-14 h-14 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-md`} />
                            <View>
                                <Text style={tw`text-lg font-bold text-black dark:text-white`}>Alex Chen</Text>
                                <Text style={tw`text-[#FF6A00] font-bold`}>2,450 pts</Text>
                            </View>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1`}>Last Stop</Text>
                            <Text style={tw`font-bold text-sm text-black dark:text-white max-w-[80px] text-right`}>Bixby Creek Bridge</Text>
                        </View>
                    </View>
                </View>

                {/* Distance Card */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#0058bb] dark:border-l-[#00D1FF] mb-4`}>
                    <View style={tw`flex-row justify-between items-start mb-4`}>
                        <View>
                            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500`}>Distance Covered</Text>
                            <Text style={tw`text-3xl font-black text-black dark:text-white mt-1`}>842.5 <Text style={tw`text-sm font-bold text-zinc-500 dark:text-zinc-400`}>mi</Text></Text>
                        </View>
                        <MaterialIcons name="route" size={24} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                    </View>
                    <View style={tw`w-full bg-zinc-200 dark:bg-[#121212] rounded-full h-1.5 overflow-hidden`}>
                        <View style={tw`bg-[#0058bb] dark:bg-[#00D1FF] h-full w-[68%] rounded-full`} />
                    </View>
                    <Text style={tw`text-[11px] mt-3 font-medium text-zinc-500 dark:text-zinc-400`}>68% of total planned route completed</Text>
                </View>

                {/* Stops Status Card */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#a63b00] dark:border-l-[#FF6A00] mb-8`}>
                    <View style={tw`flex-row justify-between items-start mb-4`}>
                        <View>
                            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500`}>Most Stops Added</Text>
                            <Text style={tw`text-3xl font-black text-black dark:text-white mt-1`}>32</Text>
                        </View>
                        <MaterialIcons name="location-on" size={24} color="#a63b00" style={tw`dark:text-[#FF6A00]`} />
                    </View>
                    <View style={tw`flex-row items-center mb-2 mt-2`}>
                        <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsPX7QC5Y-nWWeBGfoUTpY_cTEbjiQnBCpqJuqiRhkxgz8JkyWJmR4fFikdAoC9NZGtPX0BquQaBydSJzxN9VG6kNY79Ie3bvG0gYcuR-bx-6KXgwnsKhHDzuqjqGK8sKTeRkFyEiJvYWA0-lfjKsOV3GnaJdw9rG__XbjzY8q9cSXaTXW5h4_NyksiP1gr11WE2-FArlMIvruOUXksUv1JPnZLaLmncz6QO_NVxrArWck6t2osB39_Z3CygfIhCvsj46BuCGoKlQ' }} style={tw`w-10 h-10 rounded-full border-2 border-white dark:border-[#1C1C1E] absolute z-20`} />
                        <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyepba1VHwBh4Wwox-RzwQTS3gLKEsCz7dXuVM__ORGT8XX4ZUaqrGpOpBUHSbNIehuDMlMX9Auxnvl8RT1N1mUumpAa75dnQFbiZ4GK0pNSGLa322NjtaN8rWfl216LizbJsPZIKyn5khNm5wTZOJMphED5atZWjlW69lzoDk1ZlyeE8o3PuL4tZNbd3n5i-G5IyEUMLf9Nv9VoqhVrPYoy1vbXAw5TsBoRAOU5MKUVRjLZ0-9OHpSBpD8wm2kEctgtnu3Zeam9k' }} style={tw`w-10 h-10 rounded-full border-2 border-white dark:border-[#1C1C1E] absolute left-6 z-10`} />
                        <View style={tw`w-10 h-10 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-zinc-100 dark:bg-[#121212] items-center justify-center absolute left-12 z-0`}>
                            <Text style={tw`text-[10px] font-bold text-black dark:text-white`}>+5</Text>
                        </View>
                    </View>
                    <Text style={tw`text-[11px] mt-10 font-medium text-zinc-500 dark:text-zinc-400`}>Sarah is currently leading with 12 unique pins.</Text>
                </View>

                {/* Group Ranking Header */}
                <View style={tw`mb-4 mt-2 flex-row items-center gap-2`}>
                    <MaterialIcons name="military-tech" size={24} color="#FF6A00" />
                    <Text style={tw`text-xl font-bold text-black dark:text-white tracking-widest uppercase`}>Ranking</Text>
                </View>

                {/* Rank Items */}
                {[{ rank: '01', name: 'Alex Chen', role: 'The Sentinel', score: '2,450', diff: '+120 Today', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLVElMbsp54C7zY7eJL7yqjYAZUz0arY3VcGLONq52HSwp3niUAuMe5FMqS59zM4WnH9MmkyIurANQ_abi8WMPIea-tCO9hFNgf16BbkxxUekNYoMw-9yemcoe5zfpz9Fdh5iurBZbaWB8j7EByhxjXNBEdwtBaVvut_KF4u5McAh9d6pE1N_uf6zosjC7eI-bNehqESEszIutYq5Yq0UGY9ovbNqmh8X47ptbO7s9U5EVati7OdiXZTyjEBofxpCmy4KLs6YZnyI', color: 'text-[#1b6d24] dark:text-[#00FF66]' },
                { rank: '02', name: 'Sarah Jenkins', role: 'Stop Master', score: '2,180', diff: '+85 Today', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF3tE3ypfT9f4ab_Szm6SL91n08hs0_DYpLENi_oxixUfFw6mJnSjfMPZGCqs8c5NCqqE5uc08eHUqWDOCPEFcdG7t9buQPsWzd8ZBSNgW4izcf5K7ex3ZQTrexFyu3OPtkrEBBH6Iv4TJZyYfTB06iZpSXvauOTGZroWekgCrGGIYxpJNeDGA-UXo8H2-dHdEh9rMH3ywtGxlSkuLxE7EjtpdNWidVgLcP0eJf3dgp5Ojy2b3r2U2mIcRPVhk_BN4CmKYZJovls0', color: 'text-[#1b6d24] dark:text-[#00FF66]' },
                { rank: '03', name: 'Mike Ross', role: 'Trail Blazer', score: '1,940', diff: '-10 Today', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbYuniv8bdvFs5eFu1-inetiBG5OI5QaM2KGGnvcOEck5yuNZTi2IbOVti4_1-R5lIOQMWsZXrz2NKkAzlD5m0Wv8bgg6fcn-FoP843qP6SavkZcWpEK5GFa2MsHdlUHh1ygNzxEIh96MDO_K_bz7bu4sfjf9CE06LteW7yQPezpjdlFU6YfF5jocpQ7mL8oj-5gWk0QwqjyJ5EskFlCCIz3em85zwKcS6frH4ybB1ZXIInce10UFo2DqJONZdmdnwUk0awE_rHf4', color: 'text-red-500 dark:text-[#FF3366]' }].map((user) => (
                    <View key={user.rank} style={tw`flex-row items-center justify-between p-4 bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl mb-3 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-4`}>
                            <Text style={tw`text-2xl font-black text-zinc-300 dark:text-zinc-700 w-8`}>{user.rank}</Text>
                            <Image source={{ uri: user.img }} style={tw`w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-700`} />
                            <View>
                                <Text style={tw`font-bold text-black dark:text-white text-base`}>{user.name}</Text>
                                <Text style={tw`text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5`}>{user.role}</Text>
                            </View>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={tw`font-black text-lg text-black dark:text-white`}>{user.score}</Text>
                            <Text style={tw`text-[10px] font-black tracking-widest ${user.color}`}>{user.diff}</Text>
                        </View>
                    </View>
                ))}

            </ScrollView>

            {/* Contextual FAB */}
            <TouchableOpacity style={[tw`absolute right-6 w-14 h-14 bg-[#FF6A00] rounded-full items-center justify-center shadow-lg z-40`, { bottom: 120 }]}>
                <MaterialIcons name="share" size={24} color="white" />
            </TouchableOpacity>
        </View>
    )
}

```

### **Your Task Next:**
Currently, the front-end UI is completely constructed with beautiful layout and dual-themes.
I need you to help me connect this frontend to a Supabase backend database. We need to replace the `mockUsers`, dummy chats, dummy votes, and PTT mock states with live, real-time syncing mechanisms. Please outline the database schema and architecture we need to achieve this!