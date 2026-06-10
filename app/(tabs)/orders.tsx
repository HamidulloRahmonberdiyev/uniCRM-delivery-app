import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Palette as C } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';
import { useDriverLocation } from '@/hooks/use-driver-location';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useVoiceSearch } from '@/hooks/use-voice-search';
import { notify } from '@/lib/notify';
import { bookOrder, getActiveOrders } from '@/services/orders-api';
import type { OrderListItem } from '@/types/order';
import { attachDistanceToOrders, formatOrderSum } from '@/utils/order';
import { openNavigation } from '@/utils/navigation';

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
  order: OrderListItem;
  onBook: (id: string) => void;
  onNavigate: (order: OrderListItem) => void;
  onCall: (phone: string) => void;
  booking?: boolean;
}

function OrderCard({ order, onBook, onNavigate, onCall, booking }: OrderCardProps) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{getInitials(order.customerName)}</Text>
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.customerName} numberOfLines={1}>
            {order.customerName}
          </Text>
          <View style={cardStyles.dateTimeRow}>
            <Feather name="clock" size={11} color={C.textMuted} />
            <Text style={cardStyles.dateTime} numberOfLines={1}>
              {order.dateTimeLabel}
            </Text>
          </View>
        </View>
        <View style={cardStyles.distanceBadge}>
          <Feather name="navigation" size={11} color={C.primary} />
          <Text style={cardStyles.distanceText}>{order.distance ?? '—'}</Text>
        </View>
      </View>

      <View style={cardStyles.infoSection}>
        <TouchableOpacity
          style={cardStyles.infoRow}
          onPress={() => onNavigate(order)}
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
            disabled={!order.phone}
          >
            <Feather name="phone" size={13} color={C.primary} />
            <Text style={[cardStyles.infoText, { color: C.primary, fontWeight: '500' }]}>
              {order.phone || 'Telefon yo\'q'}
            </Text>
          </TouchableOpacity>
          <View style={cardStyles.metaBadges}>
            <View style={cardStyles.metaBadge}>
              <Feather name="package" size={10} color={C.textMuted} />
              <Text style={cardStyles.metaText}>{order.quantity} ta</Text>
            </View>
            <View style={cardStyles.metaBadge}>
              <Feather name="credit-card" size={10} color={C.textMuted} />
              <Text style={cardStyles.metaText}>{formatOrderSum(order.sum)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={[cardStyles.bookBtn, booking && cardStyles.bookBtnDisabled]}
          onPress={() => onBook(order.id)}
          activeOpacity={0.85}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={cardStyles.bookBtnText}>Band qilish</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={cardStyles.navBtn}
          onPress={() => onNavigate(order)}
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
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTime: {
    flex: 1,
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
  metaBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 130,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    flexShrink: 1,
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
    minHeight: 48,
  },
  bookBtnDisabled: {
    opacity: 0.85,
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

// ─── Empty / Loading ──────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Feather name="inbox" size={32} color={C.textMuted} />
      </View>
      <Text style={emptyStyles.title}>
        {hasSearch ? 'Buyurtma topilmadi' : 'Faol buyurtma yo\'q'}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {hasSearch
          ? 'Qidiruv so\'zini o\'zgartiring'
          : 'Hozircha yangi buyurtmalar mavjud emas'}
      </Text>
    </View>
  );
}

function ListLoader() {
  return (
    <View style={emptyStyles.container}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={emptyStyles.subtitle}>Yuklanmoqda...</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 17, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 400;

export default function ActiveOrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const isFirstFocus = useRef(true);
  searchQueryRef.current = searchQuery;
  const { location, refreshLocation } = useDriverLocation();

  const loadOrders = useCallback(async (search?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const driverLocation = location ?? (await refreshLocation());
      const data = await getActiveOrders(search);
      setOrders(attachDistanceToOrders(data, driverLocation));
    } catch (error) {
      setOrders([]);
      if (!silent) {
        notify.error(
          'Xatolik',
          error instanceof Error ? error.message : 'Buyurtmalarni yuklab bo\'lmadi',
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [location, refreshLocation]);

  const { refreshControl } = useRefreshControl(() => loadOrders(searchQuery, true));

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadOrders(searchQueryRef.current, true);
    }, [loadOrders]),
  );

  useEffect(() => {
    const delay = searchQuery ? SEARCH_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => loadOrders(searchQuery), delay);
    return () => clearTimeout(timer);
  }, [searchQuery, loadOrders]);

  const handleBook = useCallback(
    async (id: string) => {
      setBookingId(id);
      try {
        await bookOrder(id);
        setOrders((prev) => prev.filter((o) => o.id !== id));
        notify.success('Band qilindi', 'Buyurtma muvaffaqiyatli band qilindi');
      } catch (error) {
        notify.error(
          'Xatolik',
          error instanceof Error ? error.message : 'Band qilish amalga oshmadi',
        );
      } finally {
        setBookingId(null);
      }
    },
    [],
  );

  const handleNavigate = useCallback((order: OrderListItem) => {
    openNavigation({
      address: order.address,
      latitude: order.latitude,
      longitude: order.longitude,
    });
  }, []);

  const handleCall = useCallback((phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  }, []);

  const { isListening, toggleListening } = useVoiceSearch(setSearchQuery);

  return (
    <View style={screenStyles.container}>
      <ScreenHeader title="Buyurtmalar" badge={orders.length}>
        <View style={screenStyles.searchBar}>
          <Feather name="search" size={16} color={C.textMuted} />
          <TextInput
            style={screenStyles.searchInput}
            placeholder="Ism yoki telefon bo'yicha qidiring..."
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
              onPress={toggleListening}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                screenStyles.micBtn,
                isListening && screenStyles.micBtnActive,
              ]}
            >
              <Feather
                name={isListening ? 'mic-off' : 'mic'}
                size={16}
                color={isListening ? '#fff' : C.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </ScreenHeader>

      <FlatList
        style={screenStyles.list}
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onBook={handleBook}
            onNavigate={handleNavigate}
            onCall={handleCall}
            booking={bookingId === item.id}
          />
        )}
        contentContainerStyle={
          orders.length === 0 ? screenStyles.listContentEmpty : screenStyles.listContent
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? <ListLoader /> : <EmptyState hasSearch={searchQuery.length > 0} />
        }
        refreshControl={refreshControl}
      />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  list: {
    flex: 1,
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
  micBtnActive: {
    backgroundColor: C.danger,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
