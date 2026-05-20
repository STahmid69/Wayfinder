import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAR_COLORS, useConvoy } from '../contexts/ConvoyContext';
import tw from '../lib/tailwind';

export default function OnboardingScreen() {
    const { setIdentity } = useConvoy();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0]);

    const handleContinue = async () => {
        if (!name.trim()) return;
        await setIdentity(name.trim(), selectedColor);
        router.replace('/lobby');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#121212]`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <View style={tw`flex-1 px-8 justify-center`}>
                    {/* Logo */}
                    <View style={tw`items-center mb-14`}>
                        <View style={tw`w-24 h-24 bg-[#FF6A00]/20 rounded-3xl items-center justify-center mb-5 border border-[#FF6A00]/40`}>
                            <MaterialIcons name="explore" size={48} color="#FF6A00" />
                        </View>
                        <Text style={tw`text-white font-black text-4xl tracking-tighter`}>WAYFINDER</Text>
                        <Text style={tw`text-zinc-500 text-xs uppercase tracking-[5px] mt-1`}>Convoy Companion</Text>
                    </View>

                    {/* Name */}
                    <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1`}>
                        Your Name
                    </Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Alex or Car 1"
                        placeholderTextColor="#3F3F46"
                        style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-2xl px-5 py-4 text-white text-lg font-bold mb-8`}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleContinue}
                        maxLength={20}
                    />

                    {/* Color Picker */}
                    <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4 ml-1`}>
                        Your Car Color
                    </Text>
                    <View style={tw`flex-row gap-3 mb-12`}>
                        {CAR_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => setSelectedColor(color)}
                                style={[
                                    tw`w-12 h-12 rounded-full items-center justify-center`,
                                    { backgroundColor: color },
                                    selectedColor === color && tw`border-4 border-white`,
                                ]}
                            >
                                {selectedColor === color && (
                                    <MaterialIcons name="check" size={20} color="black" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!name.trim()}
                        style={[
                            tw`py-5 rounded-2xl items-center shadow-xl`,
                            name.trim() ? tw`bg-[#FF6A00]` : tw`bg-zinc-800`,
                        ]}
                    >
                        <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>
                            Let&apos;s Roll
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
