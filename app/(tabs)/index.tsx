import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView, Marker, RoutePolyline, RouteMarker, PROVIDER_DEFAULT } from '../../components/NativeMap';
import { DRIVER_STATUS_LABELS, DriverStatus, HAZARD_LABELS, HazardType, useConvoy } from '../../contexts/ConvoyContext';
import { useNavigation } from '../../contexts/NavigationContext';
import SearchPanel from '../../components/SearchPanel';
import NavigationPanel from '../../components/NavigationPanel';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  line: 'rgba(255,255,255,0.09)',
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

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A0B10' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#52525B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0B10' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1A24' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0D0D14' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#232330' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06101C' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0E0E18' }] },
];

const HAZARD_EMOJI: Record<HazardType, string> = {
  speed_trap: '🚔', pothole: '🕳️', accident: '💥', road_closed: '🚧', construction: '🏗️',
};

const STATUS_OPTIONS: { key: DriverStatus; label: string; icon: string; color: string }[] = [
  { key: 'moving', label: 'Moving', icon: 'navigation', color: WF.green },
  { key: 'gas', label: 'Gas Stop', icon: 'local-gas-station', color: WF.yellow },
  { key: 'bathroom', label: 'Restroom', icon: 'wc', color: WF.cyan },
  { key: 'food', label: 'Food Stop', icon: 'restaurant', color: WF.amberHi },
  { key: 'car_trouble', label: 'Car Trouble', icon: 'car-repair', color: WF.red },
  { key: 'pulling_over', label: 'Pulling Over', icon: 'pull-off', color: '#B44FFF' },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Glassmorphism-style panel
function GlassPanel({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: 'rgba(14,14,20,0.88)',
      borderWidth: 1,
      borderColor: WF.line,
      borderRadius: 16,
      ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } as any : {}),
    }, style]}>
      {children}
    </View>
  );
}

// Expandable FAB
function MapFAB({ onSOS, onHazard }: { onSOS: () => void; onHazard: () => void }) {
  const [open, setOpen] = useState(false);
  const items = [
    { id: 'sos', label: 'SOS', color: WF.red, onPress: () => { onSOS(); setOpen(false); } },
    { id: 'hazard', label: 'Hazard', color: WF.yellow, onPress: () => { onHazard(); setOpen(false); } },
    { id: 'share', label: 'Share', color: WF.amber, onPress: () => setOpen(false) },
  ];

  return (
    <View style={{ position: 'absolute', right: 14, bottom: Platform.OS === 'web' ? 230 : 240, zIndex: 40, alignItems: 'flex-end', gap: 10 }}>
      {open && items.map(it => (
        <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <GlassPanel style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: WF.text, textTransform: 'uppercase' }}>{it.label}</Text>
          </GlassPanel>
          <TouchableOpacity
            onPress={it.onPress}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: it.color, alignItems: 'center', justifyContent: 'center', shadowColor: it.color, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8 }}
          >
            {it.id === 'sos' && <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>SOS</Text>}
            {it.id === 'hazard' && <Text style={{ fontSize: 20 }}>⚠️</Text>}
            {it.id === 'share' && <MaterialIcons name="share" size={20} color="#0A0A0F" />}
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: open ? 'rgba(20,20,24,0.95)' : WF.amber,
          borderWidth: open ? 1 : 0, borderColor: WF.line,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: open ? '#000' : WF.amber, shadowOpacity: open ? 0.3 : 0.5, shadowRadius: 20, elevation: 8,
          transform: [{ rotate: open ? '45deg' : '0deg' }],
        }}
      >
        <MaterialIcons name="add" size={28} color={open ? WF.text : '#0A0A0F'} />
      </TouchableOpacity>
    </View>
  );
}

// Member row in convoy drawer
function DrawerRow({ user, isMe, myId, me }: { user: any; isMe: boolean; myId: string; me: any }) {
  const initials = user.name.split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
  const isStale = !isMe && Date.now() - user.lastSeen > 60000;
  const hasGps = user.lat !== 0 || user.lng !== 0;
  const dist = isMe || !me || !hasGps ? null : haversineKm(me.lat, me.lng, user.lat, user.lng);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.025)', borderLeftWidth: 3, borderLeftColor: user.color, opacity: isStale ? 0.5 : 1 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: user.color + '20', borderWidth: 1, borderColor: user.color + '55', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: user.color, letterSpacing: 0.5 }}>{initials}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: WF.text }}>
            {isMe ? 'You' : user.name}
          </Text>
          {user.role === 'leader' && (
            <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(255,106,0,0.18)' }}>
              <Text style={{ fontSize: 8, fontWeight: '800', color: WF.amber, letterSpacing: 1 }}>LEAD</Text>
            </View>
          )}
        </View>
        {isStale && (
          <Text style={{ fontSize: 9, color: '#FBBF24', marginTop: 1 }}>⚠ Signal lost</Text>
        )}
        <Text style={{ fontSize: 10, color: WF.textMut, letterSpacing: 0.2 }}>{user.status}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: user.speed > 0 ? WF.text : WF.textDim, lineHeight: 20 }}>
          {user.speed}<Text style={{ fontSize: 9, color: WF.textMut }}> KM/H</Text>
        </Text>
        <Text style={{ fontSize: 9, color: user.speed > 0 ? WF.green : WF.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
          {user.speed > 0 ? '▲ MOVING' : '■ STOPPED'}
        </Text>
        {isMe ? (
          <Text style={{ fontSize: 9, color: '#71717A', marginTop: 1 }}>You</Text>
        ) : !hasGps ? (
          <Text style={{ fontSize: 9, color: '#F59E0B', marginTop: 1 }}>No GPS</Text>
        ) : dist !== null ? (
          <Text style={{ fontSize: 9, color: '#71717A', marginTop: 1 }}>{dist.toFixed(1)} km away</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ConvoyRadarScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<any>(null);
  const snapPoints = useMemo(() => ['18%', '50%'], []);
  const hasCenteredRef = useRef(false);
  const insets = useSafeAreaInsets();

  const { users, myId, convoyId, hazardPins, sosAlerts, myStatus, addHazardPin, sendSOS, dismissSOS, setMyStatus } = useConvoy();
  const nav = useNavigation();

  const me = users.find(u => u.id === myId);
  const meHasGps = !!(me && (me.lat !== 0 || me.lng !== 0));
  // Use || so that lat:0 falls through to the fallback (0 is falsy, ?? would keep it)
  const centerLat = me?.lat || 3.139;
  const centerLng = me?.lng || 101.6869;

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showHazardPicker, setShowHazardPicker] = useState(false);

  useEffect(() => {
    // Only lock-in the auto-center once we have a real GPS fix (not 0,0)
    if (me && meHasGps && !hasCenteredRef.current && mapRef.current) {
      hasCenteredRef.current = true;
      mapRef.current.animateToRegion({ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  }, [me?.lat, me?.lng, meHasGps]);

  useEffect(() => {
    if (me && !nav.origin && nav.mode === 'planning') {
      nav.setOrigin({ lat: me.lat, lng: me.lng }, 'My Location');
    }
  }, [me?.lat, me?.lng, nav.mode]);

  useEffect(() => {
    if (me && nav.mode === 'navigating') {
      nav.updatePosition({ lat: me.lat, lng: me.lng });
    }
  }, [me?.lat, me?.lng, nav.mode]);

  useEffect(() => {
    if (nav.route && mapRef.current?.fitBounds) {
      const bbox = nav.route.bbox;
      if (bbox && bbox[0] !== 0) {
        mapRef.current.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
      }
    }
  }, [nav.route]);

  const centerOnUser = () => {
    if (me && meHasGps && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  };

  const fitAllCars = () => {
    if (!mapRef.current || users.length < 2) return;
    const validUsers = users.filter(u => u.lat !== 0 || u.lng !== 0);
    if (validUsers.length < 2) return;
    const lats = validUsers.map(u => u.lat);
    const lngs = validUsers.map(u => u.lng);
    const sw: [number, number] = [Math.min(...lats), Math.min(...lngs)];
    const ne: [number, number] = [Math.max(...lats), Math.max(...lngs)];
    mapRef.current.fitBounds([sw, ne], { padding: 80 });
  };

  const handleSOS = () => {
    Alert.alert('🚨 Send SOS?', 'This will alert your entire convoy.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send SOS', style: 'destructive', onPress: sendSOS },
    ]);
  };

  const handleAddHazard = (type: HazardType) => {
    const pos = me ?? { lat: centerLat, lng: centerLng };
    addHazardPin(type, pos.lat, pos.lng);
    setShowHazardPicker(false);
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    if (nav.mode === 'idle') return;
    if (!nav.destination) nav.setDestination(latlng);
    else if (!nav.origin) nav.setOrigin(latlng);
    else nav.setDestination(latlng);
  };

  const isNavigating = nav.mode === 'navigating';
  const topPad = Platform.OS === 'web' ? 20 : insets.top + 8;

  return (
    <View style={{ flex: 1, backgroundColor: WF.bg }}>
      {/* Map */}
      <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          customMapStyle={darkMapStyle}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          showsUserLocation={false}
          onMapClick={nav.mode !== 'idle' ? handleMapClick : undefined}
        >
          {nav.route && <RoutePolyline positions={nav.route.polyline} color={WF.amber} weight={5} opacity={0.9} />}
          {nav.origin && <RouteMarker coordinate={{ latitude: nav.origin.lat, longitude: nav.origin.lng }} type="origin" label={nav.originLabel} />}
          {nav.destination && <RouteMarker coordinate={{ latitude: nav.destination.lat, longitude: nav.destination.lng }} type="destination" label={nav.destinationLabel} />}

          {users.filter(u => u.lat !== 0 || u.lng !== 0).map(user => (
            <Marker
              key={user.id}
              coordinate={{ latitude: user.lat, longitude: user.lng }}
              markerColor={user.color}
              markerLabel={user.name}
            >
              <View style={{ alignItems: 'center' }}>
                {/* Name pill */}
                <View style={{ backgroundColor: 'rgba(10,10,15,0.82)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: user.color }} />
                  <Text style={{ color: WF.text, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
                    {user.id === myId ? 'YOU' : user.name.toUpperCase()}
                  </Text>
                  {user.speed > 0 && (
                    <Text style={{ color: WF.textDim, fontSize: 9 }}>· {user.speed}</Text>
                  )}
                </View>
                {/* Glowing orb */}
                <View style={{
                  width: user.id === myId ? 22 : 16,
                  height: user.id === myId ? 22 : 16,
                  borderRadius: user.id === myId ? 11 : 8,
                  backgroundColor: user.color,
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
                  shadowColor: user.color, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6,
                  ...(user.isTalking ? { borderColor: WF.yellow, borderWidth: 3 } : {}),
                }} />
              </View>
            </Marker>
          ))}

          {hazardPins.map(pin => (
            <Marker key={pin.id} coordinate={{ latitude: pin.lat, longitude: pin.lng }} markerColor={WF.yellow} markerLabel={HAZARD_EMOJI[pin.type]}>
              <View style={{ backgroundColor: 'rgba(255,196,0,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 14 }}>{HAZARD_EMOJI[pin.type]}</Text>
              </View>
            </Marker>
          ))}

          {sosAlerts.map(sos => (
            <Marker key={sos.id} coordinate={{ latitude: sos.lat, longitude: sos.lng }} markerColor={WF.red} markerLabel={`🚨 ${sos.userName}`}>
              <View style={{ backgroundColor: WF.red, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>🚨 {sos.userName}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* ── Glassmorphism top bar ─────────────────────────────────── */}
      <View style={{ position: 'absolute', top: topPad, left: 12, right: 12, zIndex: 30, flexDirection: 'row', gap: 8 }}>
        <GlassPanel style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', letterSpacing: -0.4, color: WF.amber }}>
                WAYFINDER
              </Text>
              <Text style={{ fontSize: 9, color: WF.textMut, letterSpacing: 1.5, marginTop: -1, textTransform: 'uppercase' }}>
                {convoyId ? `CONVOY · ${users.length} CARS` : 'NO CONVOY'}
              </Text>
            </View>
            {convoyId && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,106,0,0.14)', borderWidth: 1, borderColor: 'rgba(255,106,0,0.4)' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: WF.amber, letterSpacing: 1.4, textTransform: 'uppercase' }}>{convoyId}</Text>
              </View>
            )}
          </View>
        </GlassPanel>
        {/* Map layers button */}
        <GlassPanel style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="layers" size={18} color={WF.text} />
        </GlassPanel>
      </View>

      {/* Search + Navigation panels */}
      <SearchPanel />
      <NavigationPanel currentSpeed={me?.speed ?? 0} />

      {/* SOS alerts */}
      {sosAlerts.length > 0 && (
        <View style={{ position: 'absolute', top: topPad + 70, left: 12, right: 12, zIndex: 30 }}>
          {sosAlerts.map(sos => (
            <View key={sos.id} style={{ backgroundColor: WF.red, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🚨</Text>
                <View>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{sos.userName} needs help!</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Tap map pin to navigate</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => dismissSOS(sos.id)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 20 }}>
                <MaterialIcons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Side controls: center + fit-all + compass */}
      {!isNavigating && (
        <View style={{ position: 'absolute', left: 14, bottom: Platform.OS === 'web' ? 230 : 240, zIndex: 30, gap: 8 }}>
          <TouchableOpacity onPress={centerOnUser}>
            <GlassPanel style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="my-location" size={18} color={WF.cyan} />
            </GlassPanel>
          </TouchableOpacity>
          {users.length > 1 && (
            <TouchableOpacity onPress={fitAllCars}>
              <GlassPanel style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="car-multiple" size={18} color={WF.amber} />
              </GlassPanel>
            </TouchableOpacity>
          )}
          <GlassPanel style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: WF.amber, letterSpacing: 1 }}>N</Text>
            <Text style={{ fontSize: 8, color: WF.textDim }}>↑</Text>
          </GlassPanel>
        </View>
      )}

      {/* Recenter (during navigation) */}
      {isNavigating && (
        <TouchableOpacity onPress={centerOnUser} style={{ position: 'absolute', right: 14, bottom: Platform.OS === 'web' ? 300 : 310, zIndex: 30 }}>
          <GlassPanel style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="my-location" size={22} color={WF.text} />
          </GlassPanel>
        </TouchableOpacity>
      )}

      {/* Expandable FAB */}
      <MapFAB onSOS={handleSOS} onHazard={() => setShowHazardPicker(true)} />

      {/* Bottom convoy drawer */}
      {!isNavigating && (
        Platform.OS === 'web' ? (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 210, zIndex: 20 }}>
            {/* Fade gradient */}
            <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' } as any} />
            <GlassPanel style={{ position: 'absolute', left: 12, right: 12, top: 10, bottom: 8, padding: 12, borderRadius: 22 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase' }}>
                    CONVOY · {users.length} CARS
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, letterSpacing: -0.3, marginTop: 2 }}>
                    {convoyId ?? 'No Active Convoy'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: WF.green }} />
                  <Text style={{ fontSize: 9, color: WF.green, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' }}>LIVE</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row', paddingBottom: 4 }}>
                {users.map(user => {
                  const isMe = user.id === myId;
                  const isStale = !isMe && Date.now() - user.lastSeen > 60000;
                  const hasGps = user.lat !== 0 || user.lng !== 0;
                  const dist = isMe || !me || !hasGps ? null : haversineKm(me.lat, me.lng, user.lat, user.lng);
                  return (
                    <View key={user.id} style={{ width: 150, flexDirection: 'column', padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.025)', borderLeftWidth: 3, borderLeftColor: user.color, opacity: isStale ? 0.5 : 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: WF.text }} numberOfLines={1}>
                        {isMe ? 'You' : user.name}
                      </Text>
                      {isStale && (
                        <Text style={{ fontSize: 9, color: '#FBBF24', marginTop: 1 }}>⚠ Signal lost</Text>
                      )}
                      <Text style={{ fontSize: 9, color: WF.textMut, marginTop: 1 }}>{user.status}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: user.speed > 0 ? WF.text : WF.textDim, marginTop: 4 }}>
                        {user.speed}<Text style={{ fontSize: 8, color: WF.textMut }}> KM/H</Text>
                      </Text>
                      {isMe ? (
                        <Text style={{ fontSize: 9, color: '#71717A', marginTop: 2 }}>You</Text>
                      ) : !hasGps ? (
                        <Text style={{ fontSize: 9, color: '#F59E0B', marginTop: 2 }}>No GPS</Text>
                      ) : dist !== null ? (
                        <Text style={{ fontSize: 9, color: '#71717A', marginTop: 2 }}>{dist.toFixed(1)} km away</Text>
                      ) : null}
                      {!isMe && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`https://www.waze.com/ul?ll=${user.lat},${user.lng}&navigate=yes`)}
                          style={{ marginTop: 6, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: WF.cyan + '55', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}
                        >
                          <Text style={{ fontSize: 9, color: WF.cyan, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Navigate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </GlassPanel>
          </View>
        ) : (
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 38, height: 4 }}
            backgroundStyle={{ backgroundColor: 'rgba(14,14,20,0.96)', borderWidth: 1, borderColor: WF.line, borderBottomWidth: 0 }}
          >
            <BottomSheetView style={{ flex: 1, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.textMut, fontWeight: '700', textTransform: 'uppercase' }}>
                    CONVOY · {users.length} CARS
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, marginTop: 2, letterSpacing: -0.3 }}>
                    {convoyId ?? 'No Active Convoy'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: WF.green }} />
                  <Text style={{ fontSize: 9, color: WF.green, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' }}>LIVE</Text>
                </View>
              </View>
              <BottomSheetScrollView contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
                {users.map(user => (
                  <DrawerRow key={user.id} user={user} isMe={user.id === myId} myId={myId} me={me} />
                ))}
              </BottomSheetScrollView>
            </BottomSheetView>
          </BottomSheet>
        )
      )}

      {/* Status Picker Modal */}
      <Modal visible={showStatusPicker} transparent animationType="slide" onRequestClose={() => setShowStatusPicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={() => setShowStatusPicker(false)} />
        <View style={{ backgroundColor: WF.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, borderColor: WF.line }}>
          <Text style={{ color: WF.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>My Status</Text>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => { setMyStatus(opt.key); setShowStatusPicker(false); }}
              style={[{
                flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1,
                borderColor: myStatus === opt.key ? opt.color : WF.line,
                backgroundColor: myStatus === opt.key ? opt.color + '14' : 'transparent',
              }]}
            >
              <MaterialIcons name={opt.icon as any} size={22} color={myStatus === opt.key ? opt.color : WF.textMut} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: myStatus === opt.key ? opt.color : WF.text }}>{opt.label}</Text>
              {myStatus === opt.key && <MaterialIcons name="check" size={18} color={opt.color} style={{ marginLeft: 'auto' } as any} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Hazard Picker Modal */}
      <Modal visible={showHazardPicker} transparent animationType="slide" onRequestClose={() => setShowHazardPicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={() => setShowHazardPicker(false)} />
        <View style={{ backgroundColor: WF.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, borderColor: WF.line }}>
          <Text style={{ color: WF.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>Report Hazard</Text>
          <Text style={{ color: WF.textMut, fontSize: 11, textAlign: 'center', marginBottom: 14 }}>Pins at your current location, visible to all members</Text>
          {(Object.keys(HAZARD_LABELS) as HazardType[]).map(type => (
            <TouchableOpacity key={type} onPress={() => handleAddHazard(type)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: WF.line, backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Text style={{ fontSize: 22 }}>{HAZARD_EMOJI[type]}</Text>
              <Text style={{ color: WF.text, fontWeight: '700', fontSize: 15 }}>{HAZARD_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}
