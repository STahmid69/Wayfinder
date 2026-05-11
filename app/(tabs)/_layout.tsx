import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, useColorScheme, Vibration, View } from 'react-native';
import { useDeviceContext } from 'twrnc';
import { useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

export default function TabLayout() {
  useDeviceContext(tw);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { convoyId, joinConvoy } = useConvoy();
  const [code, setCode] = useState('');

  if (!convoyId) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212] justify-center px-8`}>
        <View style={tw`items-center mb-12 mt-12`}>
          <View style={tw`w-24 h-24 bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 rounded-full items-center justify-center mb-6 border border-[#FF6A00]/30`}>
            <MaterialCommunityIcons name="steering" size={48} color="#FF6A00" />
          </View>
          <Text style={tw`text-black dark:text-white font-black text-4xl mb-2 tracking-tighter text-center`}>WAYFINDER</Text>
          <Text style={tw`text-zinc-500 font-bold tracking-widest text-[10px] uppercase text-center`}>Convoy Operations Protocol</Text>
        </View>

        <View style={tw`bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl`}>
          <Text style={tw`text-black dark:text-white font-black text-lg mb-4 text-center uppercase tracking-widest`}>Join a Trip</Text>

          <TextInput
            placeholder="CODE"
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={5}
            style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-black dark:text-white font-black text-2xl text-center tracking-[10px] mb-4 uppercase h-16`}
          />

          <TouchableOpacity
            onPress={() => {
              Vibration.vibrate(50);
              joinConvoy(code.toUpperCase() || 'GLOBAL');
            }}
            style={tw`bg-[#FF6A00] py-4 rounded-xl items-center shadow-lg`}
          >
            <Text style={tw`text-white font-black uppercase tracking-widest`}>Sync Convoy</Text>
          </TouchableOpacity>

          <View style={tw`flex-row items-center justify-center my-6 gap-4`}>
            <View style={tw`flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800`} />
            <Text style={tw`text-zinc-400 font-bold text-[10px] uppercase`}>OR</Text>
            <View style={tw`flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800`} />
          </View>

          <TouchableOpacity
            onPress={() => {
              Vibration.vibrate(50);
              const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
              joinConvoy(randomCode);
            }}
            style={tw`bg-zinc-100 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 py-4 rounded-xl items-center`}
          >
            <Text style={tw`text-black dark:text-white font-black uppercase tracking-widest`}>Create New Trip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ color }) => <MaterialIcons name="payments" size={28} color={color} />,
          tabBarLabel: ({ color }) => <Text style={[tw`text-[10px] uppercase font-bold tracking-widest mt-1`, { color }]}>Ledger</Text>,
        }}
      />
    </Tabs>
  );
}
