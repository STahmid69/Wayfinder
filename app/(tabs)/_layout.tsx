import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDeviceContext } from 'twrnc';
import { useConvoy } from '../../contexts/ConvoyContext';
import VoiceEngine from '../../components/VoiceEngine';
import tw from '../../lib/tailwind';

const AMBER = '#FF6A00';
const INACTIVE = '#555555';
const BG = '#0A0A0F';

function TabIcon({ name, focused, size = 24 }: { name: any; focused: boolean; size?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <MaterialIcons name={name} size={size} color={focused ? AMBER : INACTIVE} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: focused ? AMBER : 'transparent' }} />
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{
      fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5,
      color: focused ? AMBER : INACTIVE, marginTop: focused ? 0 : 4,
    }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  useDeviceContext(tw);
  const { convoyId, joinConvoy } = useConvoy();
  const [code, setCode] = useState('');

  if (!convoyId) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 48, marginTop: 48 }}>
          <View style={{ width: 96, height: 96, backgroundColor: 'rgba(255,106,0,0.12)', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,106,0,0.3)' }}>
            <MaterialCommunityIcons name="steering" size={48} color={AMBER} />
          </View>
          <Text style={{ color: '#F4F4F6', fontWeight: '900', fontSize: 36, marginBottom: 8, letterSpacing: -1, textAlign: 'center' }}>WAYFINDER</Text>
          <Text style={{ color: 'rgba(244,244,246,0.38)', fontWeight: '700', letterSpacing: 3, fontSize: 10, textTransform: 'uppercase', textAlign: 'center' }}>Convoy Operations Protocol</Text>
        </View>

        <View style={{ backgroundColor: '#141418', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: '#F4F4F6', fontWeight: '900', fontSize: 16, marginBottom: 20, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 }}>Join a Trip</Text>

          <TextInput
            placeholder="CODE"
            placeholderTextColor="rgba(244,244,246,0.25)"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={8}
            style={{ backgroundColor: '#0A0A0F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, color: '#F4F4F6', fontWeight: '900', fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 14, height: 64 }}
          />

          <TouchableOpacity
            onPress={() => joinConvoy(code.toUpperCase() || 'GLOBAL')}
            style={{ backgroundColor: AMBER, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: AMBER, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 }}
          >
            <Text style={{ color: '#0A0A0F', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Sync Convoy</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <Text style={{ color: 'rgba(244,244,246,0.38)', fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </View>

          <TouchableOpacity
            onPress={() => {
              const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
              joinConvoy(randomCode);
            }}
            style={{ backgroundColor: '#0A0A0F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#F4F4F6', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Create New Trip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <VoiceEngine />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: AMBER,
          tabBarInactiveTintColor: INACTIVE,
          tabBarStyle: {
            backgroundColor: BG,
            height: Platform.OS === 'web' ? 90 : 88,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.06)',
            paddingBottom: Platform.OS === 'web' ? 20 : 24,
            paddingTop: Platform.OS === 'web' ? 8 : 8,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginTop: 2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ptt"
          options={{
            title: 'Talk',
            tabBarIcon: ({ focused }) => <TabIcon name="mic" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Hub',
            tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="trip"
          options={{
            title: 'Stats',
            tabBarIcon: ({ focused }) => <TabIcon name="insights" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ledger"
          options={{
            title: 'Ledger',
            tabBarIcon: ({ focused }) => <TabIcon name="payments" focused={focused} />,
          }}
        />
      </Tabs>
    </>
  );
}
