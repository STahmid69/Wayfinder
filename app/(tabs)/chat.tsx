import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

export default function SocialHubScreen() {
    const [activeTab, setActiveTab] = useState('VOTES'); // CHAT | VOTES | LEDGER
    const { messages, sendMessage, convoyId } = useConvoy();
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;
        if (convoyId) {
            sendMessage(text.trim());
        }
        setText('');
    };

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar customStyle="absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 pt-8" />

            <View style={tw`pt-32 px-4 pb-24 flex-1`}>

                {/* Segmented Control */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-full p-1 flex-row mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xl`}>
                    {['CHAT', 'VOTES', 'LEDGER'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[tw`flex-1 py-3 rounded-full items-center`, activeTab === tab ? tw`bg-zinc-100 dark:bg-white` : null]}
                        >
                            <Text style={[tw`font-bold tracking-widest text-[11px] uppercase`, activeTab === tab ? tw`text-black` : tw`text-zinc-400 dark:text-zinc-500`]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* ---------------- VOTES TAB ---------------- */}
                    {activeTab === 'VOTES' && (
                        <View>
                            <View style={tw`flex-row items-center justify-between mb-4 mt-2 px-2`}>
                                <Text style={tw`text-black dark:text-white text-lg font-black tracking-widest uppercase`}>Active Votes</Text>
                                <TouchableOpacity style={tw`bg-[#FF6A00] px-4 py-1.5 rounded-full shadow-lg`}>
                                    <Text style={tw`text-white text-xs font-bold`}>+ Propose Stop</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Smart Assistant Auto-Suggestion */}
                            <TouchableOpacity style={tw`bg-[#1b6d24]/10 dark:bg-[#00FF66]/10 border border-[#1b6d24]/30 dark:border-[#00FF66]/30 p-4 rounded-2xl mb-6 flex-row justify-between items-center`}>
                                <View style={tw`flex-row items-center gap-3`}>
                                    <MaterialCommunityIcons name="robot" size={24} color="#00FF66" />
                                    <View>
                                        <Text style={tw`text-[#1b6d24] dark:text-[#00FF66] font-black text-sm`}>Smart Suggestion</Text>
                                        <Text style={tw`text-black dark:text-white text-[10px]`}>It's 12:30 PM. Propose Lunch spots?</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="arrow-forward" size={16} color="#00FF66" />
                            </TouchableOpacity>

                            {/* Vote Card */}
                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 mb-4 shadow-sm dark:shadow-xl`}>
                                <View style={tw`flex-row justify-between items-start mb-4`}>
                                    <View style={tw`flex-row items-center gap-3`}>
                                        <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM6IdpKcPH_FoRKicmfAnitQT3VYIQvD7EcxDUzok62RIEwCktZf3bV5-j0jroLllXlRmRheLf6CsqQf9ltSc5HfmkvrZnzQgxNrjk_0LOt0elrbWK2SYKGOGAZSVMoTtmXTqNEI52LgBYjTDisVtD6rsan8sfFPc37zkOCaKkc-7QEsLQ6LmmHTwfb-v7gpNaivV3mg06EGZYreWno48q99ukehFn9QNNZH-XyTYjIpOq3V2IcbLRzi_pJ4KPZ-rQocPC_ibjqns' }} style={tw`w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-white`} />
                                        <View>
                                            <Text style={tw`text-black dark:text-white font-bold text-lg`}>Lunch Break</Text>
                                            <Text style={tw`text-[#FF6A00] text-[10px] uppercase font-bold tracking-widest`}>Proposed by You</Text>
                                        </View>
                                    </View>
                                    <View style={tw`items-end gap-1`}>
                                        <View style={tw`bg-red-500/10 dark:bg-red-500/20 px-3 py-1.5 rounded-full`}>
                                            <Text style={tw`text-red-500 text-[10px] font-black`}>CLOSING IN 5M</Text>
                                        </View>
                                        <TouchableOpacity style={tw`flex-row items-center gap-1`}>
                                            <MaterialIcons name="map" size={12} color="#A1A1AA" />
                                            <Text style={tw`text-zinc-500 text-[10px] font-bold`}>View Map</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Winning Option */}
                                <TouchableOpacity style={tw`bg-[#FAFAFA] dark:bg-[#121212] border-2 border-[#FF6A00] rounded-2xl p-4 mb-3 flex-row justify-between items-center relative overflow-hidden`}>
                                    <View style={[tw`absolute left-0 top-0 bottom-0 bg-[#FF6A00]/20`, { width: '75%' }]} />
                                    <View style={tw`flex-row items-center gap-3 z-10`}>
                                        <View style={tw`w-6 h-6 rounded-full border border-[#FF6A00] bg-white items-center justify-center`}>
                                            <MaterialIcons name="check" size={14} color="black" />
                                        </View>
                                        <Text style={tw`text-black dark:text-white font-black text-lg uppercase`}>Taco Bell</Text>
                                    </View>
                                    <Text style={tw`text-black dark:text-white font-bold z-10`}>3 Votes</Text>
                                </TouchableOpacity>

                                {/* Losing Option */}
                                <TouchableOpacity style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex-row justify-between items-center relative overflow-hidden`}>
                                    <View style={[tw`absolute left-0 top-0 bottom-0 bg-zinc-200/50 dark:bg-zinc-800/30`, { width: '25%' }]} />
                                    <View style={tw`flex-row items-center gap-3 z-10`}>
                                        <View style={tw`w-6 h-6 rounded-full border border-zinc-400 dark:border-zinc-600 bg-transparent`} />
                                        <Text style={tw`text-zinc-500 dark:text-zinc-400 font-bold text-lg uppercase`}>Wendy's</Text>
                                    </View>
                                    <Text style={tw`text-zinc-400 dark:text-zinc-500 font-bold z-10`}>1 Vote</Text>
                                </TouchableOpacity>
                                {/* Auto-Nav Toggle */}
                                <View style={tw`mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex-row justify-between items-center`}>
                                    <View style={tw`flex-row items-center gap-2`}>
                                        <MaterialIcons name="navigation" size={16} color="#00D1FF" />
                                        <Text style={tw`text-black dark:text-white font-bold text-xs`}>Auto-Navigate Convoy to Winner</Text>
                                    </View>
                                    <View style={tw`w-10 h-6 bg-[#00D1FF] rounded-full p-1 items-end`}>
                                        <View style={tw`w-4 h-4 bg-white rounded-full`} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ---------------- CHAT TAB ---------------- */}
                    {activeTab === 'CHAT' && (
                        <View style={tw`flex-1`}>
                            <View style={tw`mb-4`}>
                                {/* Live Supabase Messages */}
                                {messages.map((m: any, i: number) => (
                                    <View key={i} style={tw`bg-[#FF6A00] self-end p-4 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl mb-3 max-w-[80%] shadow-lg`}>
                                        <Text style={tw`text-white font-bold text-base`}>{m.content}</Text>
                                    </View>
                                ))}

                                {/* Fallback UI for Offline / Design Presentation */}
                                {messages.length === 0 && (
                                    <>
                                        <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 self-start p-4 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl mb-3 max-w-[80%] shadow-sm`}>
                                            <Text style={tw`text-[#00C253] dark:text-[#00FF66] text-[10px] font-black uppercase mb-1 tracking-widest`}>Safwans Car</Text>
                                            <Text style={tw`text-black dark:text-white text-base`}>Can we pull over at the next exit? Need to stretch.</Text>
                                        </View>
                                        <View style={tw`bg-[#FF6A00] self-end p-4 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl mb-3 max-w-[80%] shadow-lg`}>
                                            <Text style={tw`text-white font-bold text-base`}>Yeah sure, I'll propose a pit stop vote now.</Text>
                                        </View>
                                    </>
                                )}
                            </View>

                            <View style={tw`flex-row items-center bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-2 mt-8 shadow-sm`}>
                                <TouchableOpacity style={tw`mr-3`}>
                                    <MaterialIcons name="add-circle-outline" size={26} color="#FF6A00" />
                                </TouchableOpacity>
                                <TextInput
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="Message the convoy..."
                                    placeholderTextColor="#A1A1AA"
                                    style={tw`flex-1 text-black dark:text-white h-12`}
                                />
                                <TouchableOpacity onPress={handleSend} style={tw`bg-[#FF6A00] w-10 h-10 rounded-full items-center justify-center shadow-lg`}>
                                    <MaterialIcons name="arrow-upward" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ---------------- LEDGER TAB ---------------- */}
                    {activeTab === 'LEDGER' && (
                        <View>
                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 mb-6 shadow-xl items-center`}>
                                <Text style={tw`text-zinc-500 text-xs font-black uppercase tracking-widest`}>Total Trip Spend</Text>
                                <Text style={tw`text-black dark:text-white text-6xl font-black mt-2 mb-6`}>$142.50</Text>
                                <View style={tw`w-full flex-row justify-between items-center bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4`}>
                                    <Text style={tw`text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]`}>You owe:</Text>
                                    <Text style={tw`text-[#FF3366] font-black text-lg`}>$24.00 <Text style={tw`text-sm font-bold`}>to Alex</Text></Text>
                                </View>
                            </View>

                            <TouchableOpacity style={tw`bg-[#FF6A00] rounded-2xl p-4 flex-row justify-center items-center gap-2 mb-6 shadow-lg`}>
                                <MaterialIcons name="receipt-long" size={24} color="white" />
                                <Text style={tw`text-white font-black text-lg uppercase tracking-widest`}>Add New Expense</Text>
                            </TouchableOpacity>

                            {/* Recent Transactions */}
                            <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest mb-3 px-2`}>Recent Transactions</Text>

                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-3 flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center gap-4`}>
                                    <View style={tw`w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center`}>
                                        <MaterialIcons name="local-gas-station" size={24} color="#00D1FF" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-black dark:text-white font-bold text-base`}>Gas Station (Alex)</Text>
                                        <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase`}>Split evenly (3 ways)</Text>
                                    </View>
                                </View>
                                <Text style={tw`text-black dark:text-white font-black text-lg`}>$60.00</Text>
                            </View>

                            <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-3 flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center gap-4`}>
                                    <View style={tw`w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-full items-center justify-center`}>
                                        <MaterialIcons name="fastfood" size={24} color="#FF6A00" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-black dark:text-white font-bold text-base`}>Drive-thru (You)</Text>
                                        <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase`}>Split evenly (3 ways)</Text>
                                    </View>
                                </View>
                                <Text style={tw`text-black dark:text-white font-black text-lg`}>$34.50</Text>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </View>
        </View>
    );
}
