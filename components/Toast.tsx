import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Text, View } from 'react-native';

type ToastConfig = { message: string; icon: string; color: string };

// Module-level ref — Toast component registers itself here on mount
let _showToast: ((config: ToastConfig) => void) | null = null;

export function showToast(message: string, icon: string, color: string) {
  _showToast?.({ message, icon, color });
}

export function useToast() {
  return { showToast };
}

export default function Toast() {
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((cfg: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfig(cfg);
    translateY.setValue(-120);
    Animated.timing(translateY, {
      toValue: 0, duration: 320, useNativeDriver: true,
    }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120, duration: 320, useNativeDriver: true,
      }).start(() => setConfig(null));
    }, 3000);
  }, [translateY]);

  useEffect(() => {
    _showToast = show;
    return () => { _showToast = null; };
  }, [show]);

  if (!config) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: Platform.OS === 'web' ? 60 : 88,
        left: 12,
        right: 12,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <View style={{
        backgroundColor: 'rgba(20,20,24,0.97)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: config.color + '66',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: config.color,
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      }}>
        <Text style={{ fontSize: 20 }}>{config.icon}</Text>
        <Text style={{
          flex: 1,
          fontSize: 13,
          fontWeight: '600',
          color: '#F4F4F6',
          letterSpacing: 0.2,
        }}>
          {config.message}
        </Text>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: config.color,
        }} />
      </View>
    </Animated.View>
  );
}
