import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConvoy } from '../../contexts/ConvoyContext';

const WF = {
  bg: '#0A0A0F',
  panel: '#141418',
  line: 'rgba(255,255,255,0.07)',
  amber: '#FF6A00',
  amberHi: '#FF8A2A',
  cyan: '#00D4FF',
  green: '#00FF88',
  red: '#FF2D55',
  yellow: '#FFC400',
  purple: '#B27CFF',
  text: '#F4F4F6',
  textMut: 'rgba(244,244,246,0.62)',
  textDim: 'rgba(244,244,246,0.38)',
};

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: null },
  { id: 'gas', label: 'Gas', emoji: '⛽', color: WF.yellow },
  { id: 'toll', label: 'Toll', emoji: '🛣️', color: WF.cyan },
  { id: 'food', label: 'Food', emoji: '🍔', color: WF.amberHi },
  { id: 'other', label: 'Other', emoji: '📦', color: WF.purple },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

function detectCategory(description: string): Exclude<CategoryId, 'all'> {
  const d = description.toLowerCase();
  if (d.match(/gas|petrol|fuel|shell|petronas|bhp|caltex/)) return 'gas';
  if (d.match(/toll|highway|plus|lekas|kesas/)) return 'toll';
  if (d.match(/food|mcd|mcdonalds|kfc|burger|lunch|dinner|breakfast|makan|restaurant|cafe/)) return 'food';
  return 'other';
}

const CAT_COLOR: Record<Exclude<CategoryId, 'all'>, string> = {
  gas: WF.yellow, toll: WF.cyan, food: WF.amberHi, other: WF.purple,
};
const CAT_EMOJI: Record<Exclude<CategoryId, 'all'>, string> = {
  gas: '⛽', toll: '🛣️', food: '🍔', other: '📦',
};

export default function LedgerScreen() {
  const { ledger, addLedgerItem, convoyId, users, myId } = useConvoy();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 24 : insets.top;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Exclude<CategoryId, 'all'>>('other');
  const [activeFilter, setActiveFilter] = useState<CategoryId>('all');
  const [isAdding, setIsAdding] = useState(false);

  const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
  const memberCount = Math.max(users.length, 1);
  const splitAmount = totalAmount / memberCount;
  const myPaid = ledger.filter(i => i.userId === myId).reduce((s, i) => s + i.amount, 0);
  const myShare = totalAmount / memberCount;
  const iOwe = myShare - myPaid;

  const perPerson: Record<string, { id: string; name: string; total: number; count: number; color: string }> = {};
  users.forEach(u => { perPerson[u.id] = { id: u.id, name: u.name, total: 0, count: 0, color: u.color }; });
  ledger.forEach(item => {
    if (!perPerson[item.userId]) perPerson[item.userId] = { id: item.userId, name: item.userName, total: 0, count: 0, color: WF.textMut };
    perPerson[item.userId].total += item.amount;
    perPerson[item.userId].count += 1;
  });

  const filteredLedger = activeFilter === 'all' ? ledger : ledger.filter(item => detectCategory(item.description) === activeFilter);
  const sortedLedger = [...filteredLedger].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDescriptionChange = (t: string) => { setDescription(t); setSelectedCategory(detectCategory(t)); };

  const handleAdd = async () => {
    if (!description.trim() || !amount) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    await addLedgerItem(description.trim(), num);
    setDescription(''); setAmount(''); setIsAdding(false); setSelectedCategory('other');
  };

  if (!convoyId) {
    return (
      <View style={{ flex: 1, backgroundColor: WF.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <MaterialIcons name="lock-outline" size={64} color="rgba(255,255,255,0.08)" />
        <Text style={{ color: WF.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16, textAlign: 'center', fontSize: 11 }}>
          Join a convoy to access the shared ledger
        </Text>
      </View>
    );
  }

  const renderEntry = ({ item }: { item: typeof ledger[number] }) => {
    const cat = detectCategory(item.description);
    const color = CAT_COLOR[cat];
    const emoji = CAT_EMOJI[cat];
    const perHead = (item.amount / memberCount).toFixed(2);
    const paidByColor = users.find(u => u.id === item.userId)?.color ?? WF.textMut;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,20,24,0.7)', borderWidth: 1, borderColor: WF.line, marginBottom: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '20', borderWidth: 1, borderColor: color + '55', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: WF.text, fontWeight: '600', fontSize: 13.5, letterSpacing: -0.1 }} numberOfLines={1}>{item.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: paidByColor }} />
            <Text style={{ fontSize: 11, color: WF.textMut }}>{item.userId === myId ? 'You' : item.userName} paid · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, letterSpacing: -0.3 }}>RM {item.amount.toFixed(2)}</Text>
          <Text style={{ fontSize: 9, color: WF.textDim, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' }}>RM {perHead} / head</Text>
        </View>
      </View>
    );
  };

  // Category totals for the bar
  const catTotals = { gas: 0, toll: 0, food: 0, other: 0 };
  ledger.forEach(item => { catTotals[detectCategory(item.description)] += item.amount; });

  return (
    <View style={{ flex: 1, backgroundColor: WF.bg }}>
      <FlatList
        data={sortedLedger}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 96 : insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Top status row ───────────────────────────────────── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: topPad + 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: WF.amber }} />
                <Text style={{ color: WF.amber, fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3 }}>Live</Text>
                <Text style={{ color: WF.textDim, fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>· {convoyId}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: WF.line }}>
                <Text style={{ color: WF.textMut, fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>{users.length} Members</Text>
              </View>
            </View>

            {/* ── Hero total card ───────────────────────────────────── */}
            <View style={{ marginHorizontal: 14, marginBottom: 14, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,106,0,0.25)', backgroundColor: 'rgba(20,20,24,0.92)', overflow: 'hidden', position: 'relative' }}>
              {/* Glow blob */}
              <View style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: WF.amber + '22', opacity: 0.6 }} />
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 9, letterSpacing: 2, color: WF.amber, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                  TOTAL SPENT · TRIP
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: WF.amber }}>RM</Text>
                  <Text style={{ fontSize: 52, fontWeight: '800', color: WF.text, letterSpacing: -2, lineHeight: 56 }}>{totalAmount.toFixed(2)}</Text>
                </View>

                {/* Quick stats row */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <View>
                    <Text style={{ fontSize: 9, letterSpacing: 1.5, color: WF.textMut, textTransform: 'uppercase' }}>YOUR SHARE</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: WF.text, marginTop: 2 }}>RM {myShare.toFixed(2)}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                  <View>
                    <Text style={{ fontSize: 9, letterSpacing: 1.5, color: WF.textMut, textTransform: 'uppercase' }}>YOU PAID</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: WF.green, marginTop: 2 }}>RM {myPaid.toFixed(2)}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                  <View>
                    <Text style={{ fontSize: 9, letterSpacing: 1.5, color: WF.textMut, textTransform: 'uppercase' }}>YOU OWE</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: iOwe > 0 ? WF.amber : WF.green, marginTop: 2 }}>
                      RM {Math.abs(iOwe).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Category breakdown bar */}
                {totalAmount > 0 && (
                  <>
                    <View style={{ height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', gap: 2 }}>
                      {(Object.entries(catTotals) as [Exclude<CategoryId, 'all'>, number][]).map(([cat, v]) => v > 0 && (
                        <View key={cat} style={{ flex: v, backgroundColor: CAT_COLOR[cat] }} />
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      {(Object.entries(catTotals) as [Exclude<CategoryId, 'all'>, number][]).map(([cat, v]) => v > 0 && (
                        <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: CAT_COLOR[cat] }} />
                          <Text style={{ fontSize: 10, color: WF.textMut, textTransform: 'capitalize' }}>{cat}</Text>
                          <Text style={{ fontSize: 10, color: WF.text, fontWeight: '600' }}>RM {v.toFixed(0)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* ── Add button / form ─────────────────────────────────── */}
            <View style={{ marginHorizontal: 14, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,106,0,0.08)', borderWidth: 1, borderColor: WF.amber + '66' }}>
                <MaterialIcons name={isAdding ? 'close' : 'add'} size={20} color={WF.amber} />
                <Text style={{ color: WF.amber, fontWeight: '700', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                  {isAdding ? 'Cancel' : 'Add Expense'}
                </Text>
              </TouchableOpacity>

              {isAdding && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ marginTop: 10, backgroundColor: WF.panel, borderRadius: 20, borderWidth: 1, borderColor: WF.line, padding: 16 }}>
                  <Text style={{ color: WF.textMut, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>NEW EXPENSE</Text>
                  {/* Category chips */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                      const isActive = selectedCategory === cat.id;
                      const color = CAT_COLOR[cat.id as Exclude<CategoryId, 'all'>];
                      return (
                        <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, backgroundColor: isActive ? color + '22' : WF.bg, borderColor: isActive ? color + 'aa' : WF.line }}>
                          <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: isActive ? color : WF.textDim, marginTop: 2 }}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput placeholder="Description" placeholderTextColor={WF.textDim} value={description} onChangeText={handleDescriptionChange}
                    style={{ backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '600', marginBottom: 10 }} />
                  <TextInput placeholder="Amount (RM)" placeholderTextColor={WF.textDim} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" onSubmitEditing={handleAdd}
                    style={{ backgroundColor: WF.bg, borderWidth: 1, borderColor: WF.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: WF.text, fontWeight: '900', fontSize: 22, marginBottom: 12 }} />
                  <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: WF.amber, paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#0A0A0F', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Save Expense</Text>
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              )}
            </View>

            {/* ── Category filters ─────────────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.id} onPress={() => setActiveFilter(cat.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: activeFilter === cat.id ? WF.amber : 'rgba(20,20,24,0.8)', borderColor: activeFilter === cat.id ? WF.amber : WF.line }}>
                  {cat.emoji && <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>}
                  <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, color: activeFilter === cat.id ? '#0A0A0F' : WF.textMut }}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── By member ────────────────────────────────────────── */}
            {Object.values(perPerson).some(p => p.total > 0) && (
              <>
                <Text style={{ fontSize: 9, fontWeight: '700', color: WF.textMut, textTransform: 'uppercase', letterSpacing: 2, paddingHorizontal: 14, marginBottom: 10 }}>BY MEMBER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, marginBottom: 16 }}>
                  {Object.values(perPerson).filter(p => p.total > 0).map(data => (
                    <View key={data.id} style={{ backgroundColor: 'rgba(20,20,24,0.8)', borderWidth: 1, borderColor: WF.line, borderRadius: 18, padding: 14, minWidth: 130 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: data.color, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <Text style={{ color: '#0A0A0F', fontWeight: '900', fontSize: 16 }}>{data.name[0].toUpperCase()}</Text>
                      </View>
                      <Text style={{ color: WF.text, fontWeight: '700', fontSize: 13 }}>{data.name}</Text>
                      <Text style={{ color: WF.amber, fontWeight: '900', fontSize: 18, marginTop: 2 }}>RM {data.total.toFixed(2)}</Text>
                      <Text style={{ color: WF.textDim, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{data.count} entries</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* ── History header ───────────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: WF.textMut, textTransform: 'uppercase', letterSpacing: 2 }}>
                EXPENSES · {sortedLedger.length}
              </Text>
              <Text style={{ fontSize: 9, color: WF.cyan, letterSpacing: 1, fontWeight: '600', textTransform: 'uppercase' }}>FILTER ▾</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 14 }}>
            <MaterialCommunityIcons name="receipt" size={56} color="rgba(255,255,255,0.06)" />
            <Text style={{ color: WF.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10, marginTop: 16 }}>No entries yet</Text>
            <TouchableOpacity onPress={() => setIsAdding(true)} style={{ marginTop: 16, backgroundColor: WF.amber, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
              <Text style={{ color: '#0A0A0F', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => null}
        style={{ paddingHorizontal: 14 }}
      />

      {/* ── Floating add FAB ─────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => setIsAdding(!isAdding)}
        style={{ position: 'absolute', right: 18, bottom: Platform.OS === 'web' ? 104 : insets.bottom + 86, width: 56, height: 56, borderRadius: 28, backgroundColor: WF.amber, alignItems: 'center', justifyContent: 'center', shadowColor: WF.amber, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}
      >
        <MaterialIcons name={isAdding ? 'close' : 'add'} size={28} color="#0A0A0F" />
      </TouchableOpacity>
    </View>
  );
}
