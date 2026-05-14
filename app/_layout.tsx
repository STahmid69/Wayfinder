import { router, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ConvoyProvider, useConvoy } from '../contexts/ConvoyContext';
import { NavigationProvider } from '../contexts/NavigationContext';

function WebWrapper({ children }: { children: React.ReactNode }) {
    if (Platform.OS !== 'web') return <>{children}</>;

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                body { background-color: #000; overflow: hidden; }
                /* Custom scrollbar for web */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #444; }
            `}} />
            <View style={{
                width: '100%',
                maxWidth: 480,
                height: '100%',
                maxHeight: 900,
                backgroundColor: '#121212',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
            }}>
                {children}
            </View>
        </View>
    );
}

function InitialLayout() {
    const { isLoaded, myName, convoyId } = useConvoy();

    useEffect(() => {
        if (!isLoaded) return;
        if (!myName) {
            router.replace('/onboarding');
        } else if (!convoyId) {
            router.replace('/lobby');
        } else {
            router.replace('/(tabs)');
        }
    }, [isLoaded, myName, convoyId]);

    return (
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="lobby" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="trip-summary" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <ConvoyProvider>
                    <NavigationProvider>
                        <WebWrapper>
                            <InitialLayout />
                        </WebWrapper>
                    </NavigationProvider>
                </ConvoyProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
