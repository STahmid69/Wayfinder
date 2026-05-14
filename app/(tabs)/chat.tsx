import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import { Vote, useConvoy } from '../../contexts/ConvoyContext';
import tw from '../../lib/tailwind';

function getTimeAgo(isoString: string): string {
    const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ─── Propose Vote Sheet ───────────────────────────────────────────────────────
function ProposeVoteSheet({ onClose }: { onClose: () => void }) {
    const { proposeVote } = useConvoy();
    const isDark = useColorScheme() === 'dark';
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleSubmit = () => {
        const valid = options.map(o => o.trim()).filter(Boolean);
        if (!title.trim() || valid.length < 2) {
            Alert.alert('Missing Info', 'Add a title and at least 2 options.');
            return;
        }
        proposeVote(title.trim(), valid);
        onClose();
    };

    return (
        <View style={tw`absolute inset-0 bg-black/60 z-50 items-center justify-center p-4`}>
            <View style={[tw`bg-white dark:bg-[#1C1C1E] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl`, { width: '100%', maxWidth: 500, maxHeight: '90%' }]}>
                {/* Header */}
                <View style={tw`flex-row justify-between items-center p-6 pb-4 border-b border-zinc-100 dark:border-zinc-900`}>
                    <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest`}>
                        Propose
                    </Text>
                    
                    <View style={tw`flex-row items-center gap-3`}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={tw`bg-[#FF6A00] px-4 py-2 rounded-xl items-center justify-center shadow-lg`}
                        >
                            <Text style={tw`text-white font-black uppercase tracking-widest text-[10px]`}>
                                Send
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={onClose} style={tw`p-1`}>
                            <MaterialIcons name="close" size={24} color={isDark ? '#52525B' : '#A1A1AA'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView 
                    style={tw`px-6 pt-6`} 
                    contentContainerStyle={tw`pb-12`} 
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1 ml-1`}>Title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Lunch Break"
                        placeholderTextColor="#3F3F46"
                        style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white font-bold mb-4`}
                        autoFocus
                    />

                    <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1`}>Options</Text>
                    {options.map((opt, i) => (
                        <View key={i} style={tw`flex-row items-center gap-2 mb-2`}>
                            <TextInput
                                value={opt}
                                onChangeText={v => setOptions(prev => prev.map((o, j) => (j === i ? v : o)))}
                                placeholder={`Option ${i + 1}`}
                                placeholderTextColor="#3F3F46"
                                style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white font-bold`}
                            />
                            {options.length > 2 && (
                                <TouchableOpacity onPress={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                                    <MaterialIcons name="remove-circle-outline" size={22} color="#FF3366" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => setOptions(prev => [...prev, ''])}
                        style={tw`flex-row items-center gap-1 mt-4`}
                        disabled={options.length >= 5}
                    >
                        <MaterialIcons name="add" size={16} color={options.length >= 5 ? '#3F3F46' : '#FF6A00'} />
                        <Text style={tw`font-bold text-sm ${options.length >= 5 ? 'text-zinc-700' : 'text-[#FF6A00]'}`}>
                            Add another option
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────
function AddExpenseSheet({ onClose }: { onClose: () => void }) {
    const { addLedgerItem } = useConvoy();
    const isDark = useColorScheme() === 'dark';
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = () => {
        const parsed = parseFloat(amount);
        if (!description.trim()) {
            Alert.alert('Missing Info', 'Please add a description.');
            return;
        }
        if (!amount || isNaN(parsed) || parsed <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }
        addLedgerItem(description.trim(), parsed);
        onClose();
    };

    return (
        <View style={tw`absolute inset-0 bg-black/60 z-50 items-center justify-center p-4`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%', maxWidth: 500 }}
            >
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl`}>
                    <View style={tw`flex-row justify-between items-center p-6 pb-4 border-b border-zinc-100 dark:border-zinc-900`}>
                        <Text style={tw`text-black dark:text-white font-black text-lg uppercase tracking-widest`}>
                            Add Expense
                        </Text>
                        <View style={tw`flex-row items-center gap-3`}>
                            <TouchableOpacity onPress={handleSubmit} style={tw`bg-[#FF6A00] px-4 py-2 rounded-xl`}>
                                <Text style={tw`text-white font-black uppercase tracking-widest text-[10px]`}>Add</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={tw`p-1`}>
                                <MaterialIcons name="close" size={24} color={isDark ? '#52525B' : '#A1A1AA'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={tw`px-6 pt-5 pb-8`}>
                        <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1 ml-1`}>Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="e.g. Gas, Lunch, Toll"
                            placeholderTextColor="#3F3F46"
                            style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white font-bold mb-4`}
                            autoFocus
                            returnKeyType="next"
                            maxLength={60}
                        />

                        <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1 ml-1`}>Amount (RM)</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#3F3F46"
                            keyboardType="decimal-pad"
                            style={tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white font-black text-2xl mb-2`}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />
                        <Text style={tw`text-zinc-400 text-[10px] ml-1`}>Logged as paid by you and split equally</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Vote Card ────────────────────────────────────────────────────────────────
function VoteCard({ vote }: { vote: Vote }) {
    const { castVote, myId } = useConvoy();
    const totalVotes = vote.options.reduce((s, o) => s + o.voterIds.length, 0);
    const myVotedOptionId = vote.options.find(o => o.voterIds.includes(myId))?.id;
    return (
        <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 mb-4 shadow-sm`}>
            <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-black dark:text-white font-bold text-lg`}>{vote.title}</Text>
                    <Text style={tw`text-[#FF6A00] text-[10px] uppercase font-bold tracking-widest`}>
                        by {vote.proposedByName}
                    </Text>
                </View>
                <View style={tw`bg-green-500/10 dark:bg-green-500/20 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-green-600 dark:text-green-400 text-[10px] font-black`}>OPEN</Text>
                </View>
            </View>

            {vote.options.map(option => {
                const pct = totalVotes > 0 ? (option.voterIds.length / totalVotes) * 100 : 0;
                const isMyVote = option.id === myVotedOptionId;
                return (
                    <TouchableOpacity
                        key={option.id}
                        onPress={() => castVote(vote.id, option.id)}
                        style={[
                            tw`rounded-2xl p-4 mb-3 flex-row justify-between items-center relative overflow-hidden`,
                            isMyVote
                                ? tw`bg-[#FAFAFA] dark:bg-[#121212] border-2 border-[#FF6A00]`
                                : tw`bg-[#FAFAFA] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800`,
                        ]}
                    >
                        <View
                            style={[
                                tw`absolute left-0 top-0 bottom-0`,
                                { width: `${pct}%`, backgroundColor: isMyVote ? 'rgba(255,106,0,0.15)' : 'rgba(160,160,160,0.1)' },
                            ]}
                        />
                        <View style={tw`flex-row items-center gap-3 z-10`}>
                            <View style={[
                                tw`w-6 h-6 rounded-full border items-center justify-center`,
                                isMyVote ? tw`border-[#FF6A00] bg-white` : tw`border-zinc-400 dark:border-zinc-600`,
                            ]}>
                                {isMyVote && <MaterialIcons name="check" size={14} color="black" />}
                            </View>
                            <Text style={[
                                tw`font-black text-base uppercase`,
                                isMyVote ? tw`text-black dark:text-white` : tw`text-zinc-500 dark:text-zinc-400`,
                            ]}>
                                {option.text}
                            </Text>
                        </View>
                        <Text style={[
                            tw`font-bold z-10`,
                            isMyVote ? tw`text-black dark:text-white` : tw`text-zinc-400 dark:text-zinc-500`,
                        ]}>
                            {option.voterIds.length}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SocialHubScreen() {
    const { messages, votes, ledger, sendMessage, addLedgerItem, myId, users } = useConvoy();
    const isDark = useColorScheme() === 'dark';
    const [activeTab, setActiveTab] = useState<'CHAT' | 'VOTES' | 'LEDGER' | 'MEMBERS'>('MEMBERS');
    const [text, setText] = useState('');
    const [showPropose, setShowPropose] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const totalExpenses = ledger.reduce((s, i) => s + i.amount, 0);
    const fairShare = users.length > 0 ? totalExpenses / users.length : 0;
    const myPaid = ledger.filter(i => i.userId === myId).reduce((s, i) => s + i.amount, 0);
    const myBalance = myPaid - fairShare;

    const handleSend = () => {
        if (!text.trim()) return;
        sendMessage(text.trim());
        setText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    };

    return (
        <View style={tw`flex-1 bg-[#FAFAFA] dark:bg-[#121212]`}>
            <TopAppBar customStyle={`absolute top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#121212]/90 ${Platform.OS === 'web' ? 'pt-4' : 'pt-8'}`} />

            <View style={tw`${Platform.OS === 'web' ? 'pt-24' : 'pt-32'} px-4 pb-24 flex-1`}>
                {/* Tab Selector */}
                <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-full p-1 flex-row mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm`}>
                    {(['CHAT', 'VOTES', 'LEDGER', 'MEMBERS'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                tw`flex-1 py-3 rounded-full items-center`,
                                activeTab === tab ? tw`bg-zinc-100 dark:bg-white` : null,
                            ]}
                        >
                            <Text style={[
                                tw`font-bold tracking-widest text-[9px] uppercase`,
                                activeTab === tab ? tw`text-black` : tw`text-zinc-400 dark:text-zinc-500`,
                            ]}>
                                {tab === 'VOTES' && votes.length > 0 ? `Votes (${votes.length})` : tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── CHAT ── */}
                {activeTab === 'CHAT' && (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'web' ? undefined : 'height')}
                        style={tw`flex-1`}
                        keyboardVerticalOffset={Platform.OS === 'web' ? 0 : 130}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={tw`items-center justify-center py-16`}>
                                    <MaterialIcons name="chat-bubble-outline" size={40} color={isDark ? '#27272A' : '#E4E4E7'} />
                                    <Text style={tw`text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-3`}>
                                        No messages yet
                                    </Text>
                                </View>
                            }
                            renderItem={({ item }) => {
                                const isMe = item.userId === myId;
                                return (
                                    <View style={[tw`mb-3`, isMe ? tw`items-end` : tw`items-start`]}>
                                        {!isMe && (
                                            <Text style={tw`text-[10px] font-black uppercase tracking-widest text-[#00C253] dark:text-[#00FF66] mb-1 ml-4`}>
                                                {item.userName}
                                            </Text>
                                        )}
                                        <View style={[
                                            tw`max-w-[80%] p-4`,
                                            isMe
                                                ? tw`bg-[#FF6A00] rounded-tl-3xl rounded-bl-3xl rounded-br-3xl`
                                                : tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl`,
                                        ]}>
                                            <Text style={[
                                                tw`text-base`,
                                                isMe ? tw`text-white font-bold` : tw`text-black dark:text-white`,
                                            ]}>
                                                {item.content}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }}
                            style={tw`flex-1`}
                            contentContainerStyle={tw`pb-2`}
                        />
                        <View style={tw`flex-row items-center bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-2 mt-2 shadow-sm`}>
                            <TextInput
                                value={text}
                                onChangeText={setText}
                                placeholder="Message the convoy..."
                                placeholderTextColor="#A1A1AA"
                                style={tw`flex-1 text-black dark:text-white h-12`}
                                returnKeyType="send"
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!text.trim()}
                                style={[
                                    tw`w-10 h-10 rounded-full items-center justify-center shadow-lg`,
                                    text.trim() ? tw`bg-[#FF6A00]` : tw`bg-zinc-200 dark:bg-zinc-700`,
                                ]}
                            >
                                <MaterialIcons name="arrow-upward" size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}

                {/* ── VOTES ── */}
                {activeTab === 'VOTES' && (
                    <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-center mb-6 px-1`}>
                            <Text style={tw`text-black dark:text-white text-lg font-black tracking-widest uppercase`}>
                                Active Polls ({votes.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowPropose(true)}
                                style={tw`bg-[#FF6A00] px-4 py-2 rounded-full shadow-lg`}
                            >
                                <Text style={tw`text-white font-black text-[10px] uppercase tracking-widest`}>
                                    + Propose
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`}>
                            {votes.length === 0 ? (
                                <View style={tw`items-center justify-center py-16`}>
                                    <MaterialIcons name="how-to-vote" size={40} color={isDark ? '#27272A' : '#E4E4E7'} />
                                    <Text style={tw`text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-3`}>
                                        No active polls
                                    </Text>
                                </View>
                            ) : (
                                votes.map(vote => <VoteCard key={vote.id} vote={vote} />)
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* ── LEDGER ── */}
                {activeTab === 'LEDGER' && (
                    <View style={tw`flex-1`}>
                        {/* Header */}
                        <View style={tw`flex-row justify-between items-center mb-5 px-1`}>
                            <View>
                                <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-widest`}>Total Trip Spend</Text>
                                <Text style={tw`text-black dark:text-white font-black text-3xl mt-0.5`}>
                                    RM {totalExpenses.toFixed(2)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowAddExpense(true)}
                                style={tw`bg-[#FF6A00] px-4 py-2.5 rounded-full shadow-lg flex-row items-center gap-1`}
                            >
                                <MaterialIcons name="add" size={14} color="white" />
                                <Text style={tw`text-white font-black text-[10px] uppercase tracking-widest`}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Balance card — only show when there's data */}
                        {totalExpenses > 0 && users.length > 0 && (
                            <View style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-5 shadow-sm`}>
                                <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3`}>Your Balance</Text>
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={tw`text-zinc-500 text-sm`}>You paid</Text>
                                    <Text style={tw`text-black dark:text-white font-bold`}>RM {myPaid.toFixed(2)}</Text>
                                </View>
                                <View style={tw`flex-row justify-between mb-3`}>
                                    <Text style={tw`text-zinc-500 text-sm`}>Your share ({users.length} {users.length === 1 ? 'person' : 'people'})</Text>
                                    <Text style={tw`text-black dark:text-white font-bold`}>RM {fairShare.toFixed(2)}</Text>
                                </View>
                                <View style={tw`h-[1px] bg-zinc-100 dark:bg-zinc-800 mb-3`} />
                                <View style={tw`flex-row justify-between items-center`}>
                                    <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest`}>Net</Text>
                                    <View style={tw`items-end`}>
                                        <Text style={[
                                            tw`font-black text-xl`,
                                            myBalance > 0.009 ? tw`text-[#00C853]` : myBalance < -0.009 ? tw`text-[#FF3366]` : tw`text-zinc-400`,
                                        ]}>
                                            {myBalance > 0.009 ? '+' : ''}RM {myBalance.toFixed(2)}
                                        </Text>
                                        <Text style={tw`text-zinc-400 text-[10px] font-bold uppercase tracking-widest`}>
                                            {myBalance > 0.009 ? 'you are owed' : myBalance < -0.009 ? 'you owe' : 'settled up'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Expense list */}
                        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`}>
                            {ledger.length === 0 ? (
                                <View style={tw`items-center justify-center py-16`}>
                                    <MaterialIcons name="receipt-long" size={40} color={isDark ? '#27272A' : '#E4E4E7'} />
                                    <Text style={tw`text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-3`}>No expenses yet</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowAddExpense(true)}
                                        style={tw`mt-5 bg-[#FF6A00] px-6 py-3 rounded-full shadow-lg`}
                                    >
                                        <Text style={tw`text-white font-black text-xs uppercase tracking-widest`}>Add First Expense</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                ledger.map(item => {
                                    const isMe = item.userId === myId;
                                    return (
                                        <View key={item.id} style={tw`bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 mb-3 flex-row items-center justify-between shadow-sm`}>
                                            <View style={tw`flex-1 mr-3`}>
                                                <Text style={tw`text-black dark:text-white font-bold text-base`} numberOfLines={1}>
                                                    {item.description}
                                                </Text>
                                                <Text style={tw`text-zinc-400 text-[10px] uppercase tracking-widest mt-0.5`}>
                                                    {isMe ? 'Paid by You' : `Paid by ${item.userName}`} • {getTimeAgo(item.createdAt)}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                tw`font-black text-lg`,
                                                isMe ? tw`text-[#FF6A00]` : tw`text-black dark:text-white`,
                                            ]}>
                                                RM {item.amount.toFixed(2)}
                                            </Text>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* ── MEMBERS ── */}
                {activeTab === 'MEMBERS' && (
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-black dark:text-white text-lg font-black tracking-widest uppercase mb-4 mt-2 px-1`}>
                            Live Convoy ({users.length})
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`}>
                            {users.map(user => {
                                const isMe = user.id === myId;
                                const handleWaze = () => {
                                    const url = `https://www.waze.com/ul?ll=${user.lat},${user.lng}&navigate=yes`;
                                    Linking.openURL(url);
                                };

                                return (
                                    <View key={user.id} style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 mb-3 flex-row justify-between items-center shadow-sm`}>
                                        <View style={tw`flex-row items-center gap-3`}>
                                            <View style={[tw`w-10 h-10 rounded-2xl items-center justify-center`, { backgroundColor: user.color }]}>
                                                <MaterialIcons name="car-repair" size={24} color="black" />
                                            </View>
                                            <View>
                                                <Text style={tw`text-black dark:text-white font-bold text-base`}>
                                                    {user.name} {isMe ? '(You)' : ''}
                                                </Text>
                                                <View style={tw`flex-row items-center gap-2`}>
                                                    <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: user.status === 'Moving' ? '#10B981' : '#EF4444' }]} />
                                                    <Text style={tw`text-zinc-500 text-[10px] font-bold uppercase tracking-widest`}>
                                                        {user.status} • {user.speed} KM/H
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {!isMe && (
                                            <TouchableOpacity 
                                                onPress={handleWaze}
                                                style={tw`bg-[#33CCFF] px-4 py-2 rounded-2xl flex-row items-center gap-2 shadow-md`}
                                            >
                                                <MaterialIcons name="navigation" size={16} color="white" />
                                                <Text style={tw`text-white font-black text-xs uppercase tracking-tighter`}>Waze</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>

            {showPropose && <ProposeVoteSheet onClose={() => setShowPropose(false)} />}
            {showAddExpense && <AddExpenseSheet onClose={() => setShowAddExpense(false)} />}
        </View>
    );
}
