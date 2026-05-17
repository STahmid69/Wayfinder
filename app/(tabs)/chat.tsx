import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Linking,
  Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Vote, useConvoy } from '../../contexts/ConvoyContext';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  panelHi: '#1A1A20',
  line: 'rgba(255,255,255,0.07)',
  amber: '#FF6A00',
  amberHi: '#FF8A2A',
  cyan: '#00D4FF',
  green: '#00FF88',
  red: '#FF2D55',
  text: '#F4F4F6',
  textMut: 'rgba(244,244,246,0.62)',
  textDim: 'rgba(244,244,246,0.38)',
};

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line, borderRadius: 16 }, style]}>
      {children}
    </View>
  );
}

// ─── Propose Vote ─────────────────────────────────────────────────────────────
function ProposeVoteSheet({ onClose }: { onClose: () => void }) {
  const { proposeVote } = useConvoy();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleSubmit = () => {
    const valid = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || valid.length < 2) { Alert.alert('Missing Info', 'Add a title and at least 2 options.'); return; }
    proposeVote(title.trim(), valid);
    onClose();
  };

  return (
    <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 16 } as any}>
      <View style={{ width: '100%', maxWidth: 500, backgroundColor: WF.panel, borderRadius: 24, borderWidth: 1, borderColor: WF.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: WF.line }}>
          <Text style={{ color: WF.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Propose</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: WF.amber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
              <Text style={{ color: '#0A0A0F', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={WF.textMut} /></TouchableOpacity>
          </View>
        </View>
        <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={{ color: WF.textMut, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Lunch Break" placeholderTextColor={WF.textDim} autoFocus
            style={{ backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '600', marginBottom: 16 }} />
          <Text style={{ color: WF.textMut, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Options</Text>
          {options.map((opt, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TextInput value={opt} onChangeText={v => setOptions(prev => prev.map((o, j) => j === i ? v : o))} placeholder={`Option ${i + 1}`} placeholderTextColor={WF.textDim}
                style={{ flex: 1, backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '600' }} />
              {options.length > 2 && <TouchableOpacity onPress={() => setOptions(prev => prev.filter((_, j) => j !== i))}><MaterialIcons name="remove-circle-outline" size={22} color={WF.red} /></TouchableOpacity>}
            </View>
          ))}
          <TouchableOpacity onPress={() => setOptions(prev => [...prev, ''])} disabled={options.length >= 5} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <MaterialIcons name="add" size={16} color={options.length >= 5 ? WF.textDim : WF.amber} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: options.length >= 5 ? WF.textDim : WF.amber }}>Add another option</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Add Expense ──────────────────────────────────────────────────────────────
function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const { addLedgerItem } = useConvoy();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!description.trim()) { Alert.alert('Missing Info', 'Please add a description.'); return; }
    if (!amount || isNaN(parsed) || parsed <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid amount.'); return; }
    addLedgerItem(description.trim(), parsed);
    onClose();
  };

  return (
    <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 16 } as any}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', maxWidth: 500 }}>
        <View style={{ backgroundColor: WF.panel, borderRadius: 24, borderWidth: 1, borderColor: WF.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: WF.line }}>
            <Text style={{ color: WF.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Add Expense</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: WF.amber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={{ color: '#0A0A0F', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={WF.textMut} /></TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
            <Text style={{ color: WF.textMut, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="e.g. Gas, Lunch, Toll" placeholderTextColor={WF.textDim} autoFocus maxLength={60}
              style={{ backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '600', marginBottom: 16 }} />
            <Text style={{ color: WF.textMut, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Amount (RM)</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={WF.textDim} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={handleSubmit}
              style={{ backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '900', fontSize: 22 }} />
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
    <GlassCard style={{ padding: 16, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: WF.text, fontWeight: '700', fontSize: 16 }}>{vote.title}</Text>
          <Text style={{ color: WF.amber, fontSize: 9, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 }}>by {vote.proposedByName}</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(0,255,136,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ color: WF.green, fontSize: 9, fontWeight: '900' }}>OPEN</Text>
        </View>
      </View>
      {vote.options.map(option => {
        const pct = totalVotes > 0 ? (option.voterIds.length / totalVotes) * 100 : 0;
        const isMyVote = option.id === myVotedOptionId;
        return (
          <TouchableOpacity key={option.id} onPress={() => castVote(vote.id, option.id)}
            style={{ borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, overflow: 'hidden',
              borderColor: isMyVote ? WF.amber + '99' : 'rgba(255,255,255,0.06)',
              backgroundColor: isMyVote ? 'rgba(255,106,0,0.08)' : 'rgba(255,255,255,0.03)' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%` as any,
              backgroundColor: isMyVote ? 'rgba(255,106,0,0.15)' : 'rgba(255,255,255,0.04)' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: WF.text }}>{option.text}</Text>
                {isMyVote && <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(255,106,0,0.18)' }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: WF.amber, letterSpacing: 1 }}>YOUR PICK</Text>
                </View>}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: WF.text }}>
                {Math.round(pct)}% <Text style={{ color: WF.textDim, fontWeight: '400' }}>· {option.voterIds.length}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </GlassCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SocialHubScreen() {
  const { messages, votes, ledger, sendMessage, myId, users, convoyId } = useConvoy();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'CHAT' | 'VOTES' | 'LEDGER' | 'MEMBERS'>('CHAT');
  const [text, setText] = useState('');
  const [showPropose, setShowPropose] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 4;

  const totalExpenses = ledger.reduce((s, i) => s + i.amount, 0);
  const fairShare = users.length > 0 ? totalExpenses / users.length : 0;
  const myPaid = ledger.filter(i => i.userId === myId).reduce((s, i) => s + i.amount, 0);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const TABS = ['CHAT', 'VOTES', 'LEDGER', 'MEMBERS'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: WF.bg }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 14, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: WF.text, letterSpacing: -0.8 }}>Hub</Text>
          {convoyId && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,106,0,0.14)', borderWidth: 1, borderColor: 'rgba(255,106,0,0.4)' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: WF.amber, letterSpacing: 1.4, textTransform: 'uppercase' }}>{convoyId}</Text>
            </View>
          )}
        </View>

        {/* ── Segmented tabs ─────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: 'rgba(20,20,24,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 2 }}>
          {TABS.map(tab => {
            const sel = activeTab === tab;
            return (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{
                flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center',
                backgroundColor: sel ? WF.amber : 'transparent',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: sel ? '#0A0A0F' : WF.textMut }}>
                  {tab === 'VOTES' && votes.length > 0 ? `${tab} ${votes.length}` : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CHAT ──────────────────────────────────────────────────── */}
      {activeTab === 'CHAT' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8, gap: 10 }}
            ListHeaderComponent={
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: WF.textMut, textTransform: 'uppercase' }}>TODAY</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                <MaterialCommunityIcons name="message-outline" size={52} color="#FF6A00" />
                <Text style={{ color: WF.text, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, marginTop: 16 }}>No messages yet</Text>
                <Text style={{ color: WF.textMut, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Be the first to say something 👋</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.userId === myId;
              const senderColor = users.find(u => u.id === item.userId)?.color ?? WF.textMut;
              return (
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
                  {!isMe && (
                    <Text style={{ color: senderColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginLeft: 4 }}>
                      {item.userName}
                    </Text>
                  )}
                  <View style={{
                    maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 9,
                    borderRadius: 14,
                    borderTopLeftRadius: isMe ? 14 : 4,
                    borderTopRightRadius: isMe ? 4 : 14,
                    backgroundColor: isMe ? WF.amber : 'rgba(255,255,255,0.05)',
                    borderLeftWidth: isMe ? 0 : 2.5,
                    borderLeftColor: senderColor,
                  }}>
                    <Text style={{ fontSize: 13.5, color: isMe ? '#0A0A0F' : WF.text, fontWeight: isMe ? '600' : '400', lineHeight: 19 }}>
                      {item.content}
                    </Text>
                  </View>
                  {isMe && (
                    <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1, marginRight: 4, textTransform: 'uppercase' }}>
                      {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · DELIVERED
                    </Text>
                  )}
                </View>
              );
            }}
          />
          {/* Input */}
          <View style={{ padding: 12, paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 78, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,24,0.9)', borderWidth: 1, borderColor: WF.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
              <TextInput value={text} onChangeText={setText} placeholder="Message convoy…" placeholderTextColor={WF.textDim} returnKeyType="send" onSubmitEditing={handleSend}
                style={{ flex: 1, color: WF.text, fontSize: 13 }} />
            </View>
            <TouchableOpacity onPress={handleSend} disabled={!text.trim()}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? WF.amber : 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', shadowColor: WF.amber, shadowOpacity: text.trim() ? 0.4 : 0, shadowRadius: 10, elevation: 4 }}>
              <MaterialIcons name="arrow-upward" size={20} color={text.trim() ? '#0A0A0F' : WF.textDim} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── VOTES ──────────────────────────────────────────────────── */}
      {activeTab === 'VOTES' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 78 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: WF.text, letterSpacing: -0.3 }}>Active Polls ({votes.length})</Text>
            <TouchableOpacity onPress={() => setShowPropose(true)} style={{ backgroundColor: WF.amber, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#0A0A0F', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>+ Propose</Text>
            </TouchableOpacity>
          </View>
          {votes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <MaterialCommunityIcons name="poll" size={52} color="#FF6A00" />
              <Text style={{ color: WF.text, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, marginTop: 16 }}>No votes yet</Text>
              <Text style={{ color: WF.textMut, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Propose something to the convoy</Text>
            </View>
          ) : votes.map(vote => <VoteCard key={vote.id} vote={vote} />)}
        </ScrollView>
      )}

      {/* ── LEDGER ─────────────────────────────────────────────────── */}
      {activeTab === 'LEDGER' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 78 }}>
          {/* Hero total */}
          <View style={{ marginTop: 4, marginBottom: 14, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,106,0,0.22)', backgroundColor: 'rgba(20,20,24,0.9)', overflow: 'hidden' }}>
            <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.amber, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>TOTAL SPENT · TRIP</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: WF.amber }}>RM</Text>
              <Text style={{ fontSize: 48, fontWeight: '800', color: WF.text, letterSpacing: -2, lineHeight: 52 }}>{totalExpenses.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View>
                <Text style={{ fontSize: 9, letterSpacing: 1.5, color: WF.textMut, textTransform: 'uppercase' }}>YOUR SHARE</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, marginTop: 2 }}>RM {fairShare.toFixed(2)}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
              <View>
                <Text style={{ fontSize: 9, letterSpacing: 1.5, color: WF.textMut, textTransform: 'uppercase' }}>YOU PAID</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: WF.green, marginTop: 2 }}>RM {myPaid.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowAddExpense(true)} style={{ backgroundColor: 'rgba(255,106,0,0.08)', borderWidth: 1, borderColor: WF.amber + '66', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: WF.amber, fontWeight: '700', fontSize: 12.5, letterSpacing: 1.4, textTransform: 'uppercase' }}>+ Add Expense</Text>
          </TouchableOpacity>
          {ledger.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="receipt-outline" size={52} color="#FF6A00" />
              <Text style={{ color: WF.text, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, marginTop: 16 }}>No expenses yet</Text>
              <Text style={{ color: WF.textMut, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Track shared costs here</Text>
            </View>
          ) : [...ledger].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(item => {
            const isMe = item.userId === myId;
            const paidByColor = users.find(u => u.id === item.userId)?.color ?? WF.textMut;
            return (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: 'rgba(20,20,24,0.7)', borderWidth: 1, borderColor: WF.line, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: WF.text, fontWeight: '600', fontSize: 13.5, letterSpacing: -0.1 }} numberOfLines={1}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: paidByColor }} />
                    <Text style={{ fontSize: 11, color: WF.textMut }}>{isMe ? 'You' : item.userName} paid</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, letterSpacing: -0.3 }}>RM {item.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' }}>SPLIT · {users.length}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── MEMBERS ────────────────────────────────────────────────── */}
      {activeTab === 'MEMBERS' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 78 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: WF.text, letterSpacing: -0.3, marginBottom: 12, marginTop: 4 }}>
            Live Convoy ({users.length})
          </Text>
          {users.map(user => {
            const isMe = user.id === myId;
            return (
              <GlassCard key={user.id} style={{ padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <View style={{ position: 'relative' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: user.color, alignItems: 'center', justifyContent: 'center', shadowColor: user.color, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 }}>
                    <MaterialIcons name="directions-car" size={24} color="#0A0A0F" />
                  </View>
                  <View style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: WF.green, borderWidth: 2, borderColor: WF.panel }} />
                </View>
                {/* Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: WF.text }}>{isMe ? 'You' : user.name}</Text>
                    {user.role === 'leader' && (
                      <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(255,106,0,0.18)' }}>
                        <Text style={{ fontSize: 8.5, fontWeight: '800', color: WF.amber, letterSpacing: 1 }}>LEAD</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: WF.textMut, marginTop: 2 }}>{user.status}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: user.speed > 0 ? WF.green : WF.textDim, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
                      {user.speed > 0 ? `▲ ${user.speed} KM/H` : '■ STOPPED'}
                    </Text>
                    <Text style={{ fontSize: 10, color: WF.textDim, letterSpacing: 0.5 }}>· ONLINE</Text>
                  </View>
                </View>
                {/* Navigate button */}
                {!isMe && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://www.waze.com/ul?ll=${user.lat},${user.lng}&navigate=yes`)}
                    style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: WF.cyan + '66', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <MaterialIcons name="navigation" size={12} color={WF.cyan} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: WF.cyan, textTransform: 'uppercase', letterSpacing: 1.2 }}>Navigate</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            );
          })}
          {users.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <MaterialIcons name="group" size={40} color="rgba(255,255,255,0.08)" />
              <Text style={{ color: WF.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10, marginTop: 12 }}>No members yet</Text>
            </View>
          )}
          {convoyId && (
            <TouchableOpacity style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: WF.textMut, textTransform: 'uppercase', letterSpacing: 1.4 }}>+ Invite · code {convoyId}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {showPropose && <ProposeVoteSheet onClose={() => setShowPropose(false)} />}
      {showAddExpense && <AddExpenseSheet onClose={() => setShowAddExpense(false)} />}
    </View>
  );
}
