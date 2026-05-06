import { MaterialIcons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';

interface TopAppBarProps {
    customStyle?: string;
}

export default function TopAppBar({ customStyle }: TopAppBarProps) {
    return (
        <SafeAreaView edges={['top']} style={tw`${customStyle || 'absolute top-0 w-full z-50 bg-white/90 dark:bg-[#121212]/90 shadow-sm'}`}>
            <View style={tw`flex-row justify-between items-center px-6 h-16 w-full mt-2`}>
                <View style={tw`flex-row items-center gap-2`}>
                    <MaterialIcons name="explore" size={26} color="#FF6A00" />
                    <Text style={tw`text-xl font-bold italic text-black dark:text-white tracking-widest`}>WAYFINDER</Text>
                </View>
                <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`bg-zinc-100 dark:bg-[#1C1C1E] p-2 rounded-full border border-zinc-200 dark:border-zinc-800`}>
                        <MaterialIcons name="notifications" size={20} style={tw`text-black dark:text-white`} />
                    </View>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM6IdpKcPH_FoRKicmfAnitQT3VYIQvD7EcxDUzok62RIEwCktZf3bV5-j0jroLllXlRmRheLf6CsqQf9ltSc5HfmkvrZnzQgxNrjk_0LOt0elrbWK2SYKGOGAZSVMoTtmXTqNEI52LgBYjTDisVtD6rsan8sfFPc37zkOCaKkc-7QEsLQ6LmmHTwfb-v7gpNaivV3mg06EGZYreWno48q99ukehFn9QNNZH-XyTYjIpOq3V2IcbLRzi_pJ4KPZ-rQocPC_ibjqns' }}
                        style={tw`w-10 h-10 rounded-full border-2 border-[#FF6A00]`}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
