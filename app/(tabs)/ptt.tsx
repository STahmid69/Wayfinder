import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, Share, Text, TouchableOpacity, Vibration, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRIVER_STATUS_LABELS, DriverStatus, useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  amber: '#FF6A00',
  amberHi: '#FF8A2A',
  cyan: '#00D4FF',
  green: '#00FF88',
  red: '#FF2D55',
  yellow: '#FFC400',
  text: '#F4F4F6',
  textMut: 'rgba(244,244,246,0.62)',
  textDim: 'rgba(244,244,246,0.38)',
};

const STATUS_OPTIONS: { key: DriverStatus; label: string; emoji: string; dot: string }[] = [
  { key: 'moving', label: 'Moving', emoji: '🟢', dot: WF.green },
  { key: 'gas', label: 'Gas Stop', emoji: '⛽', dot: WF.yellow },
  { key: 'bathroom', label: 'Restroom', emoji: '🚻', dot: WF.cyan },
  { key: 'food', label: 'Food', emoji: '🍔', dot: WF.amberHi },
  { key: 'car_trouble', label: 'Hazard', emoji: '⚠️', dot: WF.red },
  { key: 'pulling_over', label: 'Pulled Over', emoji: '🅿️', dot: '#888888' },
];

function BreathingRing() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(scale, { toValue: 1.0, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: 240, height: 240, borderRadius: 120,
      borderWidth: 1.5,
      borderColor: WF.amber + '55',
      transform: [{ scale }],
    }} />
  );
}

function SoundWaveBars() {
  const bar1 = useRef(new Animated.Value(8)).current;
  const bar2 = useRef(new Animated.Value(20)).current;
  const bar3 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const makeAnim = (val: Animated.Value, min: number, max: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: max, duration, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(val, { toValue: min, duration, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        ])
      );
    const a1 = makeAnim(bar1, 8, 28, 380);
    const a2 = makeAnim(bar2, 14, 40, 280);
    const a3 = makeAnim(bar3, 8, 32, 330);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 48, marginBottom: 12 }}>
      {([{ val: bar1, w: 4 }, { val: bar2, w: 5 }, { val: bar3, w: 4 }] as { val: Animated.Value; w: number }[]).map(({ val, w }, i) => (
        <Animated.View
          key={i}
          style={{
            width: w,
            height: val,
            borderRadius: w / 2,
            backgroundColor: WF.amber,
          }}
        />
      ))}
    </View>
  );
}

function PulseRing({ active, delay = 0, size = 220 }: { active: boolean; delay?: number; size?: number }) {
  const opacity = useRef(new Animated.Value(0.7)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duration = active ? 700 : 2000;
    const toScale = active ? 1.25 : 1.55;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: toScale, duration, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active, delay]);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: size, height: size, borderRadius: size / 2,
      borderWidth: active ? 2 : 1.5,
      borderColor: WF.amber,
      opacity,
      transform: [{ scale }],
    }} />
  );
}

export default function PttScreen() {
  const { users, myId, convoyId, whoIsTalking, setTalking, myStatus, setMyStatus } = useConvoy();
  const insets = useSafeAreaInsets();
  const [isTalking, setIsTalking] = useState(false);
  const [isLatchMode, setIsLatchMode] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 4;

  const channels = [
    { id: 'ALL', name: 'Convoy', color: WF.amber },
    ...(users.filter(u => u.id !== myId).slice(0, 2).map(u => ({ id: u.id, name: u.name, color: u.color }))),
  ];
  while (channels.length < 3) {
    channels.push({ id: `pad_${channels.length}`, name: channels.length === 1 ? 'Lead Only' : 'Squad B', color: WF.textMut });
  }

  const [activeChannelId, setActiveChannelId] = useState('ALL');

  const talkingUser = whoIsTalking ? users.find(u => u.id === whoIsTalking) : null;

  const handlePressIn = () => {
    if (isLatchMode) return;
    if (Platform.OS !== 'web') Vibration.vibrate(50);
    setIsTalking(true);
    setTalking(true);
  };

  const handlePressOut = () => {
    if (isLatchMode) return;
    setIsTalking(false);
    setTalking(false);
  };

  const handlePress = () => {
    if (isLatchMode) {
      if (Platform.OS !== 'web') Vibration.vibrate(50);
      const nextTalking = !isTalking;
      setIsTalking(nextTalking);
      setTalking(nextTalking);
    }
  };

  const activeLabel = channels.find(c => c.id === activeChannelId)?.name ?? 'Convoy';

  return (
    <View style={{ flex: 1, backgroundColor: WF.bg }}>
      {/* Ambient glow when active */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: isTalking ? 'rgba(255,106,0,0.09)' : 'transparent',
        } as any}
      />

      <View style={{ flex: 1, paddingTop: topPad }}>

        {/* ── Top header ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: WF.textMut, textTransform: 'uppercase' }}>
              COMM · CH 01
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: WF.green }} />
              <Text style={{ fontSize: 10, color: WF.green, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' }}>
                LINK · {users.length > 0 ? 'STRONG' : 'SEARCHING'}
              </Text>
            </View>
          </View>

          {/* Channel pill selector */}
          <View style={{
            flexDirection: 'row', padding: 4, borderRadius: 999,
            backgroundColor: 'rgba(20,20,24,0.9)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            gap: 2,
          }}>
            {channels.slice(0, 3).map((ch) => {
              const sel = activeChannelId === ch.id;
              return (
                <TouchableOpacity
                  key={ch.id}
                  onPress={() => setActiveChannelId(ch.id)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
                    backgroundColor: sel ? WF.amber : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',
                    color: sel ? '#0A0A0F' : WF.textMut,
                  }}>{ch.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── ON AIR listener strip ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: WF.textMut, textTransform: 'uppercase' }}>
            ON AIR
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {users.slice(0, 5).map((u, i) => (
              <View key={u.id} style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: u.color + '99',
                borderWidth: 2, borderColor: WF.bg,
                alignItems: 'center', justifyContent: 'center',
                marginLeft: i === 0 ? 0 : -8,
                zIndex: 5 - i,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#0A0A0F', letterSpacing: 0.5 }}>
                  {u.name[0]?.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          {users.length > 0 && (
            <Text style={{ fontSize: 10, color: WF.textMut, marginLeft: 4 }}>
              {users.length} listening
            </Text>
          )}
        </View>

        {/* ── Transcript ────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 28, paddingVertical: 16, minHeight: 80, alignItems: 'center', justifyContent: 'center' }}>
          {isTalking ? (
            <>
              <Text style={{ fontSize: 10, fontWeight: '700', color: WF.amber, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                YOU · LIVE
              </Text>
              <Text style={{ fontSize: 17, color: WF.text, fontWeight: '600', lineHeight: 24, letterSpacing: -0.3, textAlign: 'center' }}>
                Transmitting to {activeLabel}...
              </Text>
            </>
          ) : talkingUser && whoIsTalking !== myId ? (
            <>
              <Text style={{ fontSize: 10, fontWeight: '700', color: WF.textMut, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                {talkingUser.name.toUpperCase()} · LIVE
              </Text>
              <Text style={{ fontSize: 17, color: WF.textMut, fontStyle: 'italic', lineHeight: 24, textAlign: 'center' }}>
                Speaking on channel...
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 10, fontWeight: '700', color: WF.textMut, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                CHANNEL CLEAR
              </Text>
              <Text style={{ fontSize: 17, color: WF.textDim, fontStyle: 'italic', lineHeight: 24, textAlign: 'center' }}>
                {isLatchMode ? 'Tap the button to transmit' : 'Hold the button to transmit'}
              </Text>
            </>
          )}
        </View>

        {/* ── Mode Toggle Switch ───────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: -10, zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') Vibration.vibrate(20);
              // Turn off talk state when switching modes to prevent stuck audio
              setIsTalking(false);
              setTalking(false);
              setIsLatchMode(!isLatchMode);
            }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(20, 20, 24, 0.85)',
              borderWidth: 1,
              borderColor: isLatchMode ? 'rgba(255, 106, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 14,
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name={isLatchMode ? "lock" : "gesture-tap-hold"}
              size={14}
              color={isLatchMode ? WF.amber : WF.textDim}
            />
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              color: isLatchMode ? WF.amber : WF.textMut,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}>
              Mode: {isLatchMode ? 'Latch (Tap)' : 'Hold to Talk'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── PTT Button ───────────────────────────────────────────── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isTalking && <SoundWaveBars />}
          <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
            {!isTalking && <BreathingRing />}
            <PulseRing active={isTalking} delay={0} />
            <PulseRing active={isTalking} delay={isTalking ? 350 : 700} />
            {!isTalking && <PulseRing active={false} delay={1400} />}

            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handlePress}
              pressRetentionOffset={{ top: 150, bottom: 150, left: 150, right: 150 }}
              {...(Platform.OS === 'web' ? {
                onPointerDown: isLatchMode ? undefined : handlePressIn,
                onPointerUp: isLatchMode ? undefined : handlePressOut,
                onPointerLeave: isLatchMode ? undefined : handlePressOut,
                onContextMenu: (e: any) => e.preventDefault(),
              } as any : {})}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{
                width: 220, height: 220, borderRadius: 110,
                backgroundColor: isTalking ? WF.amber : 'rgba(10,10,15,0.95)',
                borderWidth: 2, borderColor: WF.amber,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: WF.amber,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isTalking ? 0.9 : 0.25,
                shadowRadius: isTalking ? 50 : 22,
                elevation: isTalking ? 20 : 6,
                ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } as any : {}),
              }}
            >
              <MaterialCommunityIcons
                name="microphone-variant"
                size={64}
                color={isTalking ? '#0A0A0F' : WF.amber}
                pointerEvents="none"
              />
              <Text
                style={{ fontSize: 11, fontWeight: '800', letterSpacing: 3.5, marginTop: 8, color: isTalking ? '#0A0A0F' : WF.amber, textTransform: 'uppercase' }}
                pointerEvents="none"
              >
                {isTalking ? 'TRANSMITTING' : isLatchMode ? 'TAP TO TALK' : 'HOLD TO TALK'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Status chip strip ────────────────────────────────────── */}
        <View style={{ paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 78 }}>
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase' }}>
              BROADCAST STATUS
            </Text>
            <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
              TAP TO SEND
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 8, flexDirection: 'row' }}
          >
            {STATUS_OPTIONS.map(opt => {
              const sel = myStatus === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setMyStatus(opt.key)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                    backgroundColor: sel ? opt.dot + '1e' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1,
                    borderColor: sel ? opt.dot + 'aa' : 'rgba(255,255,255,0.08)',
                    flexDirection: 'row', alignItems: 'center', gap: 7,
                    shadowColor: sel ? opt.dot : 'transparent',
                    shadowOpacity: sel ? 0.3 : 0,
                    shadowRadius: 8, elevation: sel ? 4 : 0,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: sel ? opt.dot : WF.text, letterSpacing: 0.4 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
