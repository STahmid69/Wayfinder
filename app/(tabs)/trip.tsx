import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConvoyRole, useConvoy } from '../../contexts/ConvoyContext';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  line: 'rgba(255,255,255,0.06)',
  amber: '#FF6A00',
  cyan: '#00D4FF',
  green: '#00FF88',
  red: '#FF2D55',
  yellow: '#FFC400',
  purple: '#B27CFF',
  text: '#F4F4F6',
  textMut: 'rgba(244,244,246,0.62)',
  textDim: 'rgba(244,244,246,0.38)',
};

const MAX_SPEED = 180;

function formatDuration(startTime: number | null): string {
  if (!startTime) return '0m';
  const mins = Math.floor((Date.now() - startTime) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const ROLE_OPTIONS: { key: ConvoyRole; label: string; emoji: string }[] = [
  { key: 'leader', label: 'Leader', emoji: '👑' },
  { key: 'tail', label: 'Tail', emoji: '🔚' },
  { key: 'driver', label: 'Driver', emoji: '🚗' },
];

export default function TripDashboardScreen() {
  const { users, myId, myRole, messages, votes, ledger, tripStartTime, totalDistanceKm, claimRole, endConvoy, convoyId } = useConvoy();
  const insets = useSafeAreaInsets();
  const [, setTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const me = users.find(u => u.id === myId);
  const currentSpeed = me?.speed ?? 0;
  const totalExpenses = ledger.reduce((s, i) => s + i.amount, 0);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 4;
  const speedPct = Math.min(currentSpeed / MAX_SPEED, 1);
  const sortedBySpeed = [...users].sort((a, b) => b.speed - a.speed);

  const handleEndConvoy = () => {
    const doEnd = async () => {
      await endConvoy();
      router.replace({
        pathname: '/trip-summary' as any,
        params: {
          convoy: JSON.stringify({
            id: '', code: convoyId ?? '',
            date: new Date().toISOString(),
            durationMin: tripStartTime ? Math.round((Date.now() - tripStartTime) / 60000) : 0,
            distanceKm: Math.round(totalDistanceKm * 10) / 10,
            members: users.length, messages: messages.length,
            expensesTotal: totalExpenses, votesCount: votes.length,
          }),
        },
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('End Convoy? This saves your trip summary and returns you to the lobby.')) doEnd();
    } else {
      Alert.alert('End Convoy?', 'This saves your trip summary and returns you to the lobby.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Trip', style: 'destructive', onPress: doEnd },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: WF.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topPad + 8, paddingHorizontal: 14, paddingBottom: 110 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 11, color: WF.textMut, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>
              TRIP STATS
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: WF.text, letterSpacing: -0.5, marginTop: 2 }}>
              {convoyId ?? 'No Convoy'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)' }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: WF.green }} />
              <Text style={{ fontSize: 9, color: WF.green, fontWeight: '800', letterSpacing: 2 }}>LIVE</Text>
            </View>
            <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {users.length} ONLINE
            </Text>
          </View>
        </View>

        {/* ── Speed hero card ─────────────────────────────────────── */}
        <View style={{
          backgroundColor: 'rgba(20,20,24,0.95)',
          borderWidth: 1,
          borderColor: currentSpeed > 0 ? WF.amber + '50' : WF.line,
          borderRadius: 24,
          padding: 20,
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          {currentSpeed > 0 && (
            <View pointerEvents="none" style={{
              position: 'absolute', right: -30, top: -30,
              width: 150, height: 150, borderRadius: 75,
              backgroundColor: WF.amber + '0D',
            }} />
          )}
          <Text style={{ fontSize: 9, fontWeight: '800', color: WF.textMut, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            YOUR SPEED
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 18 }}>
            <Text style={{
              fontSize: 88, fontWeight: '900', letterSpacing: -5, lineHeight: 84,
              color: currentSpeed > 0 ? WF.text : WF.textDim,
            }}>
              {currentSpeed}
            </Text>
            <View style={{ paddingBottom: 10, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: WF.amber, letterSpacing: 2 }}>KM/H</Text>
              <View style={{
                paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
                backgroundColor: currentSpeed > 0 ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: currentSpeed > 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 1.5, color: currentSpeed > 0 ? WF.green : WF.textMut }}>
                  {currentSpeed > 0 ? '▲ MOVING' : '■ STOPPED'}
                </Text>
              </View>
            </View>
          </View>
          {/* Progress track */}
          <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <View style={{
              width: `${speedPct * 100}%`,
              height: '100%', borderRadius: 3,
              backgroundColor: speedPct > 0.75 ? WF.red : speedPct > 0.4 ? WF.yellow : WF.amber,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={{ fontSize: 8, color: WF.textDim, letterSpacing: 1 }}>0</Text>
            <Text style={{ fontSize: 8, color: WF.textDim, letterSpacing: 1 }}>{MAX_SPEED} KM/H MAX</Text>
          </View>
        </View>

        {/* ── Distance + Duration ─────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1.3, backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line, borderRadius: 18, padding: 16 }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: WF.textMut, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>DISTANCE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: WF.text, letterSpacing: -2, lineHeight: 38 }}>
                {totalDistanceKm.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: WF.textMut, letterSpacing: 1 }}>KM</Text>
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line, borderRadius: 18, padding: 16 }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: WF.textMut, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>DURATION</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: WF.text, letterSpacing: -2, lineHeight: 38 }}>
              {formatDuration(tripStartTime)}
            </Text>
          </View>
        </View>

        {/* ── Convoy snapshot chips ───────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'CARS', value: `${users.length}`, color: WF.green },
            { label: 'MSGS', value: `${messages.length}`, color: WF.cyan },
            { label: 'VOTES', value: `${votes.length}`, color: WF.purple },
            { label: 'RM', value: totalExpenses.toFixed(0), color: WF.amber },
          ].map(chip => (
            <View key={chip.label} style={{
              flex: 1, backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line,
              borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 3,
            }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: chip.color, letterSpacing: -0.5 }}>
                {chip.value}
              </Text>
              <Text style={{ fontSize: 7, color: WF.textDim, letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase' }}>
                {chip.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Live speed leaderboard ──────────────────────────────── */}
        {sortedBySpeed.length > 0 && (
          <View style={{ backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line, borderRadius: 18, padding: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 9, letterSpacing: 2.5, color: WF.textMut, fontWeight: '800', textTransform: 'uppercase' }}>
                LIVE SPEEDS
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: WF.green }} />
                <Text style={{ fontSize: 8, color: WF.green, letterSpacing: 1.5, fontWeight: '700' }}>REAL TIME</Text>
              </View>
            </View>
            {sortedBySpeed.slice(0, 5).map((u, i) => {
              const maxSpd = Math.max(sortedBySpeed[0].speed, 1);
              const pct = (u.speed / maxSpd) * 100;
              const isMe = u.id === myId;
              return (
                <View key={u.id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: 'rgba(255,255,255,0.04)',
                }}>
                  <Text style={{ width: 16, fontSize: 10, color: i === 0 ? WF.amber : WF.textDim, fontWeight: '900', textAlign: 'center' }}>
                    {i + 1}
                  </Text>
                  <View style={{
                    width: 28, height: 28, borderRadius: 9,
                    backgroundColor: u.color + '22', borderWidth: 1.5, borderColor: u.color + '77',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: u.color }}>
                      {u.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: isMe ? WF.amber : WF.text, fontWeight: isMe ? '800' : '600', marginBottom: 4 }}>
                      {isMe ? 'You' : u.name}
                    </Text>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <View style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        backgroundColor: i === 0 ? WF.amber : u.color + 'bb',
                      }} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: i === 0 ? WF.amber : WF.text, letterSpacing: -0.5 }}>
                    {u.speed}<Text style={{ fontSize: 8, color: WF.textMut, fontWeight: '400' }}> km</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Convoy role picker ──────────────────────────────────── */}
        <Text style={{ fontSize: 9, fontWeight: '800', color: WF.textMut, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 }}>
          YOUR ROLE
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {ROLE_OPTIONS.map(opt => {
            const isActive = myRole === opt.key;
            const holder = users.find(u => u.role === opt.key && u.id !== myId);
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => claimRole(opt.key)}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 5,
                  backgroundColor: isActive ? 'rgba(255,106,0,0.12)' : 'rgba(20,20,24,0.8)',
                  borderWidth: 1,
                  borderColor: isActive ? WF.amber + '60' : WF.line,
                }}
              >
                <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', color: isActive ? WF.amber : WF.textMut, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {opt.label}
                </Text>
                {holder && (
                  <Text style={{ fontSize: 8, color: WF.textDim, letterSpacing: 0.5 }}>{holder.name}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── End Convoy ──────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleEndConvoy}
          style={{
            backgroundColor: 'rgba(255,45,85,0.07)',
            borderWidth: 1, borderColor: 'rgba(255,45,85,0.28)',
            borderRadius: 16, paddingVertical: 18, alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="flag" size={18} color={WF.red} />
            <Text style={{ color: WF.red, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>
              End Convoy
            </Text>
          </View>
          <Text style={{ color: WF.textDim, fontSize: 11, marginTop: 4 }}>Saves trip summary to history</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
