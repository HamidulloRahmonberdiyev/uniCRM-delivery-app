import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette as C } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  customerName: string;
  date: string;
  time: string;
  address: string;
  phone: string;
  distance: string;
  eta: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    customerName: 'Alisher Karimov',
    date: '05.06.2026',
    time: '10:30',
    address: 'Toshkent sh., Chilonzor t., 3-kvartal, 15-uy',
    phone: '+998 90 123 45 67',
    distance: '1.2 km',
    eta: '5 min',
  },
  {
    id: '2',
    customerName: 'Zulfiya Rahimova',
    date: '05.06.2026',
    time: '11:15',
    address: "Toshkent sh., Yunusobod t., Amir Temur shoh ko'chasi, 108-uy",
    phone: '+998 91 987 65 43',
    distance: '3.8 km',
    eta: '14 min',
  },
  {
    id: '3',
    customerName: 'Bobur Mirzayev',
    date: '05.06.2026',
    time: '12:00',
    address: "Toshkent sh., Mirzo Ulug'bek t., Bunyodkor ko'chasi, 22-uy",
    phone: '+998 93 456 78 90',
    distance: '5.1 km',
    eta: '18 min',
  },
  {
    id: '4',
    customerName: 'Nilufar Toshmatova',
    date: '05.06.2026',
    time: '13:45',
    address: "Toshkent sh., Shayxontohur t., Navoiy ko'chasi, 7-uy",
    phone: '+998 97 111 22 33',
    distance: '2.4 km',
    eta: '9 min',
  },
  {
    id: '5',
    customerName: 'Sardor Xasanov',
    date: '05.06.2026',
    time: '14:20',
    address: "Toshkent sh., Uchtepa t., Bog'ishamol ko'chasi, 44-uy",
    phone: '+998 99 888 77 66',
    distance: '7.3 km',
    eta: '22 min',
  },
  {
    id: '6',
    customerName: 'Madina Yusupova',
    date: '05.06.2026',
    time: '15:00',
    address: "Toshkent sh., Olmazor t., Qoratosh ko'chasi, 3-uy",
    phone: '+998 94 555 44 33',
    distance: '4.6 km',
    eta: '16 min',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  onBook: (id: string) => void;
  onNavigate: (address: string) => void;
  onCall: (phone: string) => void;
}

function OrderCard({ order, onBook, onNavigate, onCall }: OrderCardProps) {
  return (
    <View style={cardStyles.card}>
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{getInitials(order.customerName)}</Text>
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.customerName} numberOfLines={1}>
            {order.customerName}
          </Text>
          <Text style={cardStyles.dateTime}>
            {order.date}  ·  {order.time}
          </Text>
        </View>
        {/* Distance badge */}
        <View style={cardStyles.distanceBadge}>
          <Feather name="navigation" size={11} color={C.primary} />
          <Text style={cardStyles.distanceText}>{order.distance}</Text>
        </View>
      </View>

      {/* Info rows */}
      <View style={cardStyles.infoSection}>
        <TouchableOpacity
          style={cardStyles.infoRow}
          onPress={() => onNavigate(order.address)}
          activeOpacity={0.7}
        >
          <Feather name="map-pin" size={13} color={C.primary} />
          <Text style={cardStyles.infoText} numberOfLines={2}>
            {order.address}
          </Text>
          <Feather name="chevron-right" size={14} color={C.textMuted} />
        </TouchableOpacity>

        <View style={cardStyles.infoDivider} />

        <View style={cardStyles.infoRow}>
          <TouchableOpacity
            style={cardStyles.phoneRow}
            onPress={() => onCall(order.phone)}
            activeOpacity={0.7}
          >
            <Feather name="phone" size={13} color={C.primary} />
            <Text style={[cardStyles.infoText, { color: C.primary, fontWeight: '500' }]}>
              {order.phone}
            </Text>
          </TouchableOpacity>
          <View style={cardStyles.etaBadge}>
            <Feather name="clock" size={10} color={C.textMuted} />
            <Text style={cardStyles.etaText}>~{order.eta}</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={cardStyles.bookBtn}
          onPress={() => onBook(order.id)}
          activeOpacity={0.85}
        >
          <Feather name="check-circle" size={15} color="#fff" />
          <Text style={cardStyles.bookBtnText}>Band qilish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={cardStyles.navBtn}
          onPress={() => onNavigate(order.address)}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1B2A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 3,
  },
  dateTime: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '400',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  infoSection: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 7,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Feather name="inbox" size={32} color={C.textMuted} />
      </View>
      <Text style={emptyStyles.title}>Buyurtma topilmadi</Text>
      <Text style={emptyStyles.subtitle}>Qidiruv so'zini o'zgartiring</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 17, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActiveOrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(
    () =>
      MOCK_ORDERS.filter(
        (o) =>
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.address.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const handleBook = useCallback((id: string) => {
    console.log('Book order:', id);
  }, []);

  const handleNavigate = useCallback((address: string) => {
    const query = encodeURIComponent(address);
    const url = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
  }, []);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    Alert.alert('Ovozli qidiruv', "Mikrofonga ruxsat kerak bo'ladi");
  }, []);

  return (
    <View style={screenStyles.container}>
      <ScreenHeader title="Buyurtmalar" badge={filteredOrders.length}>
        {/* Search bar */}
        <View style={screenStyles.searchBar}>
          <Feather name="search" size={16} color={C.textMuted} />
          <TextInput
            style={screenStyles.searchInput}
            placeholder="Ism yoki manzil bo'yicha qidiring..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleVoiceSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={screenStyles.micBtn}
            >
              <Feather name="mic" size={16} color={C.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScreenHeader>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onBook={handleBook}
            onNavigate={handleNavigate}
            onCall={handleCall}
          />
        )}
        contentContainerStyle={screenStyles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    gap: 10,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});
