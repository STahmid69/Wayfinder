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
