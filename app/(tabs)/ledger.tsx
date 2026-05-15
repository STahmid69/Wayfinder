import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { useConvoy } from '../../contexts/ConvoyContext';
import { CURRENCY_SYMBOL } from '../../constants/currency';
import tw from '../../lib/tailwind';

export default function LedgerScreen() {
    const { ledger, addLedgerItem, convoyId } = useConvoy();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);

    const handleAddExpense = async () => {
        if (!description || !amount) return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return;

        await addLedgerItem(description, numAmount);
        setDescription('');
        setAmount('');
        setIsAdding(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-3 shadow-sm flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
                <Text style={tw`text-black dark:text-white font-bold text-base mb-0.5`}>{item.description}</Text>
                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest`}>
                    {item.userName} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={tw`items-end`}>
                <Text style={tw`text-[#FF6A00] font-black text-lg tracking-tighter`}>
                    {CURRENCY_SYMBOL} {item.amount.toFixed(2)}
                </Text>
            </View>
        </View>
    );

    if (!convoyId) {
        return (
            <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212] items-center justify-center p-8`}>
                <MaterialIcons name="lock-outline" size={64} color={isDark ? '#3F3F46' : '#D4D4D8'} />
                <Text style={tw`text-zinc-500 font-bold uppercase tracking-widest mt-4 text-center`}>Join a convoy to access the shared ledger</Text>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar />
            
            <View style={tw`px-5 pt-4 pb-2`}>
                <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl mb-6 overflow-hidden relative`}>
                    {/* Decorative Background Icon */}
                    <MaterialCommunityIcons 
                        name="wallet" 
                        size={120} 
                        color={isDark ? '#FF6A0010' : '#FF6A0005'} 
                        style={tw`absolute -right-8 -bottom-8`}
                    />
                    
                    <Text style={tw`text-zinc-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-[4px] mb-2`}>Total Expenses</Text>
                    <View style={tw`flex-row items-baseline`}>
                        <Text style={tw`text-black dark:text-white font-black text-5xl tracking-tighter`}>
                            {CURRENCY_SYMBOL} {totalAmount.toFixed(2)}
                        </Text>
                    </View>
                    
                    <View style={tw`flex-row items-center gap-2 mt-4`}>
                        <View style={tw`bg-[#FF6A00]/10 dark:bg-[#FF6A00]/20 px-2 py-1 rounded-md border border-[#FF6A00]/20`}>
                            <Text style={tw`text-[#FF6A00] font-bold text-[10px] uppercase tracking-widest`}>
                                {ledger.length} ENTRIES
                            </Text>
                        </View>
                        <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest`}>Shared in real-time</Text>
                    </View>
                </View>

                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest`}>History</Text>
                    <TouchableOpacity 
                        onPress={() => setIsAdding(!isAdding)}
                        style={tw`bg-black dark:bg-white px-4 py-2 rounded-full flex-row items-center gap-2`}
                    >
                        <MaterialIcons name={isAdding ? 'close' : 'add'} size={18} color={isDark ? 'black' : 'white'} />
                        <Text style={tw`text-white dark:text-black font-black text-[10px] uppercase tracking-widest`}>
                            {isAdding ? 'Cancel' : 'Add Entry'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isAdding && (
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={tw`bg-white dark:bg-[#1C1C1E] border-2 border-[#FF6A00] rounded-2xl p-5 mb-6 shadow-2xl`}
                    >
                        <Text style={tw`text-black dark:text-white font-bold text-xs uppercase tracking-widest mb-4`}>New Shared Expense</Text>
                        
                        <View style={tw`gap-4`}>
                            <View>
                                <Text style={tw`text-zinc-500 text-[8px] font-bold uppercase tracking-widest mb-1 ml-1`}>Description</Text>
                                <TextInput
                                    placeholder="Gas, Tolls, Lunch..."
                                    placeholderTextColor={isDark ? '#3F3F46' : '#D4D4D8'}
                                    value={description}
                                    onChangeText={setDescription}
                                    style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white font-bold`}
                                />
                            </View>
                            
                            <View>
                                <Text style={tw`text-zinc-500 text-[8px] font-bold uppercase tracking-widest mb-1 ml-1`}>Amount (RM)</Text>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`bg-zinc-100 dark:bg-[#252529] border border-zinc-200 dark:border-zinc-800 rounded-l-xl px-4 h-12 justify-center`}>
                                        <Text style={tw`text-zinc-500 font-bold`}>RM</Text>
                                    </View>
                                    <TextInput
                                        placeholder="0.00"
                                        placeholderTextColor={isDark ? '#3F3F46' : '#D4D4D8'}
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="decimal-pad"
                                        style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212] border-y border-r border-zinc-200 dark:border-zinc-800 rounded-r-xl px-4 h-12 text-black dark:text-white font-bold`}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={handleAddExpense}
                                style={tw`bg-[#FF6A00] py-4 rounded-xl items-center shadow-lg mt-2`}
                            >
                                <Text style={tw`text-white font-black uppercase tracking-widest`}>Add to Ledger</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}
            </View>

            <FlatList
                data={ledger.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={tw`px-5 pb-32`}
                ListEmptyComponent={
                    <View style={tw`items-center justify-center py-20`}>
                        <MaterialCommunityIcons name="receipt" size={48} color={isDark ? '#27272A' : '#F4F4F5'} />
                        <Text style={tw`text-zinc-400 font-bold uppercase tracking-widest mt-4 text-[10px]`}>No entries yet</Text>
                    </View>
                }
            />
        </View>
    );
}
