import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConvoyRole, useConvoy } from '../../contexts/ConvoyContext';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  panelHi: '#1A1A20',
  line: 'rgba(255,255,255,0.06)',
  amber: '#FF6A00',
  amberHi: '#FF8A2A',
  cyan: '#00D4FF',
  green: '#00FF88',
  red: '#FF2D55',
  yellow: '#FFC400',
  purple: '#B27CFF',
  text: '#F4F4F6',
  textMut: 'rgba(244,244,246,0.62)',
  textDim: 'rgba(244,244,246,0.38)',
};

function formatDuration(startTime: number | null): string {
  if (!startTime) return '0:00';
  const mins = Math.floor((Date.now() - startTime) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: 'rgba(20,20,24,0.8)',
      borderWidth: 1,
      borderColor: WF.line,
      borderRadius: 18,
    }, style]}>
      {children}
    </View>
  );
}

function StatCard({ label, value, unit, accent = WF.text }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <GlassCard style={{ padding: 14, flex: 1 }}>
      <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: accent, letterSpacing: -1, lineHeight: 32 }}>
          {value}
        </Text>
        <Text style={{ fontSize: 10, color: WF.textMut, letterSpacing: 1.2, fontWeight: '600' }}>
          {unit}
        </Text>
      </View>
    </GlassCard>
  );
}

function SpeedDial({ speed }: { speed: number }) {
  const max = 180;
  const pct = Math.min(speed / max, 1);
  const ticks = Array.from({ length: 19 }, (_, i) => i);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 240, height: 240 }}>
      {/* Outer ring */}
      <View style={{
        position: 'absolute',
        width: 220, height: 220, borderRadius: 110,
        borderWidth: 12, borderColor: 'rgba(255,255,255,0.05)',
      }} />
      {/* Amber progress ring (simulated with a glow overlay) */}
      <View style={{
        position: 'absolute',
        width: 220, height: 220, borderRadius: 110,
        borderWidth: 12,
        borderColor: WF.amber,
        opacity: 0.15,
      }} />
      {/* Tick marks as colored dots */}
      {ticks.map(i => {
        const angle = (-225 + (i / 18) * 270) * (Math.PI / 180);
        const r = 95;
        const x = 120 + r * Math.cos(angle);
        const y = 120 + r * Math.sin(angle);
        const filled = i / 18 <= pct;
        const major = i % 3 === 0;
        return (
          <View key={i} style={{
            position: 'absolute',
            width: major ? 8 : 4,
            height: major ? 8 : 4,
            borderRadius: major ? 4 : 2,
            backgroundColor: filled ? WF.amber : 'rgba(255,255,255,0.15)',
            left: x - (major ? 4 : 2),
            top: y - (major ? 4 : 2),
          }} />
        );
      })}
      {/* Center content */}
      <Text style={{ fontSize: 9, fontWeight: '700', color: WF.textMut, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
        CURRENT
      </Text>
      <Text style={{ fontSize: 56, fontWeight: '800', color: WF.text, letterSpacing: -2, lineHeight: 58 }}>
        {speed}
      </Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: WF.amber, letterSpacing: 2.5, textTransform: 'uppercase' }}>
        KM/H
      </Text>
    </View>
  );
}

function ReplayMap() {
  return (
    <GlassCard style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase' }}>
          ROUTE · SESSION
        </Text>
        <Text style={{ fontSize: 9, color: WF.cyan, letterSpacing: 1, fontWeight: '600' }}>LIVE ▸</Text>
      </View>
      {/* Decorative map thumbnail */}
      <View style={{ height: 80, borderRadius: 10, backgroundColor: '#0D1117', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%` as any, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
        ))}
        {[0.25, 0.5, 0.75].map(f => (
          <View key={f} style={{ position: 'absolute', top: 0, bottom: 0, left: `${f * 100}%` as any, width: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
        ))}
        {/* Route line */}
        <View style={{ position: 'absolute', left: 20, right: 20, height: 3, backgroundColor: 'rgba(255,106,0,0.2)', borderRadius: 2 }} />
        <View style={{ position: 'absolute', left: 20, right: '35%', height: 3, backgroundColor: WF.amber, borderRadius: 2, opacity: 0.85 }} />
        {/* Start dot */}
        <View style={{ position: 'absolute', left: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: WF.green, borderWidth: 1.5, borderColor: WF.bg }} />
        {/* End/current dot */}
        <View style={{ position: 'absolute', right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: WF.amber, borderWidth: 1.5, borderColor: WF.bg }} />
        {/* Labels */}
        <Text style={{ position: 'absolute', bottom: 6, left: 28, fontSize: 8, color: WF.green, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
          START
        </Text>
        <Text style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 8, color: WF.amber, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
          NOW
        </Text>
      </View>
    </GlassCard>
  );
}

const ROLE_OPTIONS: { key: ConvoyRole; label: string; emoji: string; desc: string }[] = [
  { key: 'leader', label: 'Leader', emoji: '👑', desc: 'Sets the pace' },
  { key: 'tail', label: 'Tail Gunner', emoji: '🔚', desc: 'Watches rear' },
  { key: 'driver', label: 'Driver', emoji: '🚗', desc: 'Standard member' },
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
      {/* Subtle racing grid background */}
      <View pointerEvents="none" style={{
        position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.6,
      } as any}>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * 80, height: 1, backgroundColor: 'rgba(255,255,255,0.018)' }} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 60, width: 1, backgroundColor: 'rgba(255,255,255,0.018)' }} />
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingHorizontal: 14, paddingBottom: 110 }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: WF.text, letterSpacing: -0.8, lineHeight: 36 }}>
              Telemetry
            </Text>
            <Text style={{ fontSize: 10, color: WF.textMut, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
              {convoyId ? convoyId.toUpperCase() : 'NO CONVOY'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: WF.green, shadowColor: WF.green, shadowOpacity: 0.8, shadowRadius: 4, elevation: 2 }} />
            <Text style={{ fontSize: 10, color: WF.green, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' }}>
              LIVE
            </Text>
          </View>
        </View>

        {/* ── Speedometer ────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginBottom: 16, position: 'relative' }}>
          <View style={{
            position: 'absolute', width: 200, height: 200,
            borderRadius: 100,
            backgroundColor: WF.amber + '18',
            shadowColor: WF.amber, shadowOpacity: 0.3, shadowRadius: 40, elevation: 10,
            top: 20,
          }} />
          <SpeedDial speed={currentSpeed} />
        </View>

        {/* ── Stat grid ──────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard label="TOTAL DISTANCE" value={totalDistanceKm.toFixed(1)} unit="KM" />
          <StatCard label="TRIP DURATION" value={formatDuration(tripStartTime)} unit="" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard label="CARS LIVE" value={`${users.length}`} unit="" accent={WF.green} />
          <StatCard label="EXPENSES" value={`${totalExpenses.toFixed(0)}`} unit="RM" accent={WF.amber} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <StatCard label="MESSAGES" value={`${messages.length}`} unit="" accent={WF.cyan} />
          <StatCard label="VOTES" value={`${votes.length}`} unit="" accent={WF.purple} />
        </View>

        {/* ── Route replay ───────────────────────────────────────── */}
        <View style={{ marginBottom: 12 }}>
          <ReplayMap />
        </View>

        {/* ── Convoy speed leaderboard ────────────────────────────── */}
        {sortedBySpeed.length > 0 && (
          <GlassCard style={{ padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase' }}>
                LIVE SPEED · CONVOY
              </Text>
              <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1 }}>SESSION</Text>
            </View>
            {sortedBySpeed.slice(0, 5).map((u, i) => {
              const maxSpeed = sortedBySpeed[0].speed || 1;
              const pct = (u.speed / maxSpeed) * 100;
              return (
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <Text style={{ width: 16, fontSize: 11, color: i === 0 ? WF.amber : WF.textMut, fontWeight: '700', textAlign: 'center' }}>
                    {i + 1}
                  </Text>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: u.color }} />
                  <Text style={{ flex: 1, fontSize: 12.5, color: WF.text, fontWeight: '600' }}>
                    {u.id === myId ? 'You' : u.name}
                  </Text>
                  <View style={{ flex: 2, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: i === 0 ? WF.amber : 'rgba(255,255,255,0.3)' }} />
                  </View>
                  <Text style={{ width: 60, textAlign: 'right', fontSize: 12, fontWeight: '700', color: i === 0 ? WF.amber : WF.text }}>
                    {u.speed}<Text style={{ fontSize: 9, color: WF.textMut }}> KM</Text>
                  </Text>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* ── Convoy Roles ────────────────────────────────────────── */}
        <Text style={{ fontSize: 10, fontWeight: '700', color: WF.textMut, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 }}>
          CONVOY ROLES
        </Text>
        <GlassCard style={{ overflow: 'hidden', marginBottom: 14 }}>
          {ROLE_OPTIONS.map((opt, idx) => {
            const isMyRole = myRole === opt.key;
            const holder = users.find(u => u.role === opt.key);
            const holderName = holder ? (holder.id === myId ? 'You' : holder.name) : null;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => claimRole(opt.key)}
                style={[{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingVertical: 14,
                  backgroundColor: isMyRole ? 'rgba(255,106,0,0.06)' : 'transparent',
                }, idx < ROLE_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: WF.line }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isMyRole ? WF.amber : WF.text }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: WF.textDim, marginTop: 1 }}>{opt.desc}</Text>
                  </View>
                </View>
                {holderName ? (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: isMyRole ? 'rgba(255,106,0,0.15)' : 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isMyRole ? WF.amber : WF.textMut }}>
                      {holderName}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 10, color: WF.textDim }}>Claim</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        {/* ── End Convoy ──────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleEndConvoy}
          style={{ backgroundColor: 'rgba(255,45,85,0.08)', borderWidth: 1, borderColor: 'rgba(255,45,85,0.3)', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="flag" size={20} color={WF.red} />
            <Text style={{ color: WF.red, fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 2 }}>
              End Convoy
            </Text>
          </View>
          <Text style={{ color: WF.textDim, fontSize: 11, marginTop: 4 }}>Saves trip summary to history</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
