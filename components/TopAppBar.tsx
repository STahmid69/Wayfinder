import { MaterialIcons } from '@expo/vector-icons';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConvoy } from '../contexts/ConvoyContext';
import tw from '../lib/tailwind';

interface TopAppBarProps {
    customStyle?: string;
}

export default function TopAppBar({ customStyle }: TopAppBarProps) {
    const { convoyId, myName, myColor } = useConvoy();

    const handleShare = () => {
        if (!convoyId) return;
        Share.share({
            message: `Join my Wayfinder convoy! Code: ${convoyId}`,
            title: 'Wayfinder Convoy',
        });
    };

    return (
        <SafeAreaView edges={['top']} style={tw`${customStyle || 'absolute top-0 w-full z-50 bg-[#121212]/90 shadow-sm'}`}>
            <View style={tw`flex-row justify-between items-center px-6 h-16 w-full mt-2`}>
                {/* Logo */}
                <View style={tw`flex-row items-center gap-2`}>
                    <MaterialIcons name="explore" size={26} color="#FF6A00" />
                    <Text style={tw`text-xl font-bold italic text-white tracking-widest`}>WAYFINDER</Text>
                </View>

                {/* Right side */}
                <View style={tw`flex-row items-center gap-3`}>
                    {/* Convoy code badge — tap to share */}
                    {convoyId && (
                        <TouchableOpacity
                            onPress={handleShare}
                            style={tw`bg-[#FF6A00]/10 border border-[#FF6A00]/30 px-3 py-1.5 rounded-full flex-row items-center gap-1.5`}
                        >
                            <MaterialIcons name="share" size={12} color="#FF6A00" />
                            <Text style={tw`text-[#FF6A00] font-black text-[11px] tracking-widest`}>
                                {convoyId}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Avatar — colored dot with initial */}
                    <View style={[
                        tw`w-10 h-10 rounded-full border-2 items-center justify-center`,
                        { backgroundColor: myColor, borderColor: myColor },
                    ]}>
                        <Text style={tw`text-black font-black text-sm`}>
                            {myName ? myName[0].toUpperCase() : '?'}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
