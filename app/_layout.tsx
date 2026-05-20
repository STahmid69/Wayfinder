import { router, Stack, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ConvoyProvider, useConvoy } from '../contexts/ConvoyContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import Toast from '../components/Toast';

function WebWrapper({ children }: { children: React.ReactNode }) {
    if (Platform.OS !== 'web') return <>{children}</>;

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#000',
            height: '100dvh' as any,
            // Using margin: '0 auto' for more stable centering of absolute children on web
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                html, #root {
                    background-color: #000;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    height: 100dvh;
                    overflow: hidden;
                }

                body {
                    background-color: #000;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    height: 100%;
                    height: 100dvh;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* Ensure all children except inputs/textareas inherit user-select: none and touch-callout: none */
                *, *::before, *::after {
                    -webkit-user-select: inherit;
                    -moz-user-select: inherit;
                    -ms-user-select: inherit;
                    user-select: inherit;
                    -webkit-touch-callout: inherit;
                }
                
                /* Explicitly allow selection/editing on text fields and editable elements */
                input, textarea, [contenteditable="true"] {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }

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
                marginHorizontal: 'auto', // Centering
                backgroundColor: '#000',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                position: 'relative',
            }}>
                {children}
            </View>
        </View>
    );
}

function InitialLayout() {
    const { isLoaded, myName, convoyId } = useConvoy();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoaded) return;

        if (pathname === '/trip-summary') return;

        if (!myName) {
            router.replace('/onboarding');
        } else if (!convoyId) {
            router.replace('/lobby');
        } else if (pathname === '/onboarding' || pathname === '/lobby') {
            router.replace('/(tabs)');
        }
    }, [isLoaded, myName, convoyId, pathname]);

    return (
        <>
            <Stack screenOptions={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'fade' }}>
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="lobby" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="trip-summary" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
            <Toast />
        </>
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
