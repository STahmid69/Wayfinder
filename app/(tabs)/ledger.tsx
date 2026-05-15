import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

const CATEGORIES = [
    { id: 'all',   label: 'All',   emoji: null },
    { id: 'gas',   label: 'Gas',   emoji: '⛽' },
    { id: 'toll',  label: 'Toll',  emoji: '🛣️' },
    { id: 'food',  label: 'Food',  emoji: '🍔' },
    { id: 'other', label: 'Other', emoji: '📦' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const CATEGORY_STYLES: Record<Exclude<CategoryId, 'all'>, { bg: string; text: string; icon: string }> = {
    gas:   { bg: '#FF6A00', text: 'white', icon: '⛽' },
    toll:  { bg: '#3B82F6', text: 'white', icon: '🛣️' },
    food:  { bg: '#10B981', text: 'white', icon: '🍔' },
    other: { bg: '#8B5CF6', text: 'white', icon: '📦' },
};

function detectCategory(description: string): Exclude<CategoryId, 'all'> {
    const d = description.toLowerCase();
    if (d.match(/gas|petrol|fuel|shell|petronas|bhp|caltex/)) return 'gas';
    if (d.match(/toll|highway|plus|lekas|kesas/)) return 'toll';
    if (d.match(/food|mcd|mcdonalds|kfc|burger|lunch|dinner|breakfast|makan|restaurant|cafe/)) return 'food';
    return 'other';
}

export default function LedgerScreen() {
    const { ledger, addLedgerItem, convoyId, users, myName, myId } = useConvoy();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Exclude<CategoryId, 'all'>>('other');
    const [activeFilter, setActiveFilter] = useState<CategoryId>('all');
    const [isAdding, setIsAdding] = useState(false);

    const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
    const memberCount = Math.max(users.length, 1);
    const splitAmount = totalAmount / memberCount;

    const perPerson: Record<string, { id: string; name: string; total: number; count: number; color: string }> = {};
    users.forEach(u => { perPerson[u.id] = { id: u.id, name: u.name, total: 0, count: 0, color: u.color }; });
    ledger.forEach(item => {
        if (!perPerson[item.userId]) {
            // Fallback for older items or if user left
            perPerson[item.userId] = { id: item.userId, name: item.userName, total: 0, count: 0, color: '#71717A' };
        }
        perPerson[item.userId].total += item.amount;
        perPerson[item.userId].count += 1;
    });

    const filteredLedger = activeFilter === 'all'
        ? ledger
        : ledger.filter(item => detectCategory(item.description) === activeFilter);

    const sortedLedger = [...filteredLedger].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleDescriptionChange = (text: string) => {
        setDescription(text);
        setSelectedCategory(detectCategory(text));
    };

    const handleAdd = async () => {
        if (!description.trim() || !amount) return;
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) return;
        await addLedgerItem(description.trim(), num);
        setDescription('');
        setAmount('');
        setIsAdding(false);
        setSelectedCategory('other');
    };

    if (!convoyId) {
        return (
            <View style={tw`flex-1 bg-[#121212] items-center justify-center p-8`}>
                <MaterialIcons name="lock-outline" size={64} color="#3F3F46" />
                <Text style={tw`text-zinc-500 font-bold uppercase tracking-widest mt-4 text-center`}>
                    Join a convoy to access the shared ledger
                </Text>
            </View>
        );
    }

    const renderEntry = ({ item }: { item: typeof ledger[number] }) => {
        const cat = detectCategory(item.description);
        const style = CATEGORY_STYLES[cat];
        const perHead = (item.amount / memberCount).toFixed(2);

        return (
            <View style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-[28px] p-5 mb-4 flex-row items-center justify-between shadow-sm`}>
                <View style={tw`flex-row items-center gap-4 flex-1 mr-3`}>
                    <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center bg-[#121212] border border-zinc-800`]}>
                        <Text style={{ fontSize: 22 }}>{style.icon}</Text>
                    </View>

                    <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-black text-base mb-1`} numberOfLines={1}>
                            {item.description}
                        </Text>
                        <View style={tw`flex-row items-center gap-2`}>
                            <View style={[tw`px-2 py-0.5 rounded-md`, { backgroundColor: style.bg }]}>
                                <Text style={[tw`text-[8px] font-black uppercase tracking-[1px]`, { color: style.text }]}>
                                    {cat}
                                </Text>
                            </View>
                            <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-tight`}>{item.userName}</Text>
                            <Text style={tw`text-zinc-700 text-[10px] font-bold`}>
                                · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={tw`items-end`}>
                    <Text style={tw`text-[#FF6A00] font-black text-lg tracking-tight`}>
                        RM {item.amount.toFixed(2)}
                    </Text>
                    <Text style={tw`text-zinc-700 text-[9px] font-bold mt-0.5`}>
                        RM {perHead} / head
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={tw`flex-1 bg-[#121212]`}>
            {/* Top Status Bar (Custom for Ledger Design) */}
            <View style={tw`flex-row justify-between items-center px-6 pt-12 pb-4`}>
                <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <View style={tw`w-2 h-2 rounded-full bg-[#FF6A00]`} />
                        <Text style={tw`text-[#FF6A00] font-black text-[10px] uppercase tracking-[3px]`}>Live</Text>
                    </View>
                    <Text style={tw`text-zinc-600 font-bold text-[10px] uppercase tracking-widest`}>· {convoyId}</Text>
                </View>
                <View style={tw`bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700`}>
                    <Text style={tw`text-zinc-400 font-black text-[10px] uppercase tracking-widest`}>{users.length} Members</Text>
                </View>
            </View>

            <FlatList
                data={sortedLedger}
                renderItem={renderEntry}
                keyExtractor={item => item.id}
                contentContainerStyle={tw`pb-32 pt-2 px-6`}
                ListHeaderComponent={
                    <>
                        {/* Ledger Header */}
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <Text style={tw`text-white font-black text-4xl uppercase tracking-tighter`}>Ledger</Text>
                            <TouchableOpacity
                                onPress={() => setIsAdding(!isAdding)}
                                style={tw`bg-white px-5 py-2 rounded-full flex-row items-center gap-2 shadow-lg`}
                            >
                                <MaterialIcons name={isAdding ? 'close' : 'add'} size={20} color="black" />
                                <Text style={tw`text-black font-black text-[11px] uppercase tracking-widest`}>
                                    {isAdding ? 'Cancel' : 'Add'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add Form (Expandable) */}
                        {isAdding && (
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={tw`mb-8 bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-6 shadow-2xl`}
                            >
                                <Text style={tw`text-white font-black text-xs uppercase tracking-widest mb-5`}>New Expense</Text>
                                <View style={tw`flex-row gap-2 mb-5`}>
                                    {(Object.keys(CATEGORY_STYLES) as Exclude<CategoryId, 'all'>[]).map(cat => {
                                        const s = CATEGORY_STYLES[cat];
                                        const isActive = selectedCategory === cat;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                onPress={() => setSelectedCategory(cat)}
                                                style={[
                                                    tw`flex-1 items-center py-3 rounded-2xl border`,
                                                    { backgroundColor: isActive ? s.bg : '#121212', borderColor: isActive ? s.text : '#27272A' },
                                                ]}
                                            >
                                                <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                                                <Text style={[tw`text-[9px] font-black uppercase tracking-wide mt-1`, { color: isActive ? s.text : '#52525B' }]}>{cat}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <TextInput
                                    placeholder="Description"
                                    placeholderTextColor="#3F3F46"
                                    value={description}
                                    onChangeText={handleDescriptionChange}
                                    style={tw`bg-[#121212] border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold text-base mb-4`}
                                />
                                <TextInput
                                    placeholder="Amount (RM)"
                                    placeholderTextColor="#3F3F46"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                    style={tw`bg-[#121212] border border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-xl mb-4`}
                                />
                                <TouchableOpacity onPress={handleAdd} style={tw`bg-[#FF6A00] py-4 rounded-2xl items-center`}>
                                    <Text style={tw`text-white font-black uppercase tracking-widest text-sm`}>Save</Text>
                                </TouchableOpacity>
                            </KeyboardAvoidingView>
                        )}

                        {/* Total Card */}
                        <View style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-[36px] p-8 mb-8 overflow-hidden`}>
                            <MaterialCommunityIcons name="wallet" size={160} color="rgba(255,255,255,0.02)" style={tw`absolute -right-6 -bottom-6`} />
                            
                            <Text style={tw`text-zinc-500 font-black text-[10px] uppercase tracking-[3px] mb-2`}>Total Expenses</Text>
                            <View style={tw`flex-row items-baseline mb-6`}>
                                <Text style={tw`text-[#FF6A00] font-black text-2xl mr-2`}>RM</Text>
                                <Text style={tw`text-white font-black text-6xl tracking-tighter leading-none`}>
                                    {totalAmount.toFixed(2)}
                                </Text>
                            </View>

                            <View style={tw`flex-row items-center gap-3 mb-6`}>
                                <View style={tw`bg-[#FF6A00] px-3 py-1.5 rounded-lg`}>
                                    <Text style={tw`text-white font-black text-[10px] uppercase tracking-widest`}>{ledger.length} Entries</Text>
                                </View>
                                <Text style={tw`text-zinc-500 font-black text-[10px] uppercase tracking-widest`}>Shared Live</Text>
                            </View>

                            {/* Split Section */}
                            <View style={tw`bg-black/20 rounded-[28px] p-5 flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center gap-4`}>
                                    <View style={tw`w-10 h-10 bg-[#FF6A00]/10 rounded-xl items-center justify-center`}>
                                        <Text style={tw`text-[#FF6A00] font-black text-xl`}>÷</Text>
                                    </View>
                                    <View>
                                        <Text style={tw`text-zinc-500 text-[10px] font-black uppercase tracking-widest`}>Split per head</Text>
                                        <Text style={tw`text-zinc-600 text-[10px] font-bold`}>{users.length} members</Text>
                                    </View>
                                </View>
                                <View style={tw`items-end`}>
                                    <Text style={tw`text-white font-black text-2xl tracking-tight`}>RM {splitAmount.toFixed(2)}</Text>
                                    <Text style={tw`text-zinc-600 text-[9px] font-bold uppercase`}>per person</Text>
                                </View>
                            </View>
                        </View>

                        {/* Category Filters */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2 mb-8`}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setActiveFilter(cat.id)}
                                    style={[
                                        tw`px-6 py-2.5 rounded-full border flex-row items-center gap-2`,
                                        activeFilter === cat.id ? tw`bg-white border-white` : tw`bg-[#1C1C1E] border-zinc-800`
                                    ]}
                                >
                                    {cat.emoji && <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>}
                                    <Text style={[tw`font-black text-[11px] uppercase tracking-widest`, activeFilter === cat.id ? tw`text-black` : tw`text-zinc-500`]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* By Member Section */}
                        <Text style={tw`text-white font-black text-[11px] uppercase tracking-[3px] mb-4`}>By Member</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 mb-10`}>
                            {Object.values(perPerson).map(data => (
                                <View key={data.id} style={tw`bg-[#1C1C1E] border border-zinc-800 rounded-[28px] p-5 min-w-[150px] shadow-sm`}>
                                    <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mb-4`, { backgroundColor: data.color }]}>
                                        <Text style={tw`text-black font-black text-lg`}>{data.name[0].toUpperCase()}</Text>
                                    </View>
                                    <Text style={tw`text-white font-black text-base mb-1`}>{data.name}</Text>
                                    <Text style={tw`text-[#FF6A00] font-black text-xl mb-0.5`}>RM {data.total.toFixed(2)}</Text>
                                    <Text style={tw`text-zinc-600 text-[10px] font-bold uppercase tracking-widest`}>{data.count} Entries</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* History Header */}
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <Text style={tw`text-white font-black text-xl uppercase tracking-widest`}>History</Text>
                            <View style={tw`bg-zinc-800/50 px-4 py-1.5 rounded-full border border-zinc-800`}>
                                <Text style={tw`text-zinc-500 font-black text-[9px] uppercase tracking-widest`}>↓ Newest</Text>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={tw`items-center justify-center py-20`}>
                        <MaterialCommunityIcons name="receipt" size={64} color="#27272A" />
                        <Text style={tw`text-zinc-600 font-black uppercase tracking-widest text-xs mt-4`}>No entries yet</Text>
                    </View>
                }
            />
        </View>
    );
}
