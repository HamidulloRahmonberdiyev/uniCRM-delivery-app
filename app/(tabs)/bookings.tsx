import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Palette as C } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';
import { useAuth } from '@/contexts/auth-context';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  completeBookedOrder,
  fetchBookingsData,
  releaseBookedOrder,
} from '@/services/orders-api';
import type { BookingItem, BookingStatus } from '@/types/booking';
import { notify } from '@/lib/notify';
import { openNavigation } from '@/utils/navigation';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Segment tabs ─────────────────────────────────────────────────────────────

const TABS: { key: BookingStatus; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'active', label: 'Jarayonda', icon: 'zap' },
  { key: 'delivered', label: 'Yakunlangan', icon: 'check-circle' },
  { key: 'cancelled', label: 'Bekor', icon: 'x-circle' },
];

function SegmentTabs({
  active,
  onSelect,
  counts,
}: {
  active: BookingStatus;
  onSelect: (k: BookingStatus) => void;
  counts: Record<BookingStatus, number>;
}) {
  return (
    <View style={segStyles.container}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[segStyles.tab, isActive && segStyles.tabActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Feather name={tab.icon} size={14} color={isActive ? '#fff' : C.textMuted} />
            <Text style={[segStyles.tabLabel, isActive && segStyles.tabLabelActive]}>
              {tab.label}
            </Text>
            <View style={[segStyles.countBg, isActive && segStyles.countBgActive]}>
              <Text style={[segStyles.countText, isActive && segStyles.countTextActive]}>
                {counts[tab.key]}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 5,
  },
  tabActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabLabelActive: {
    color: '#fff',
  },
  countBg: {
    backgroundColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  countBgActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
  },
  countTextActive: {
    color: '#fff',
  },
});

// ─── Swipeable Booking Card ───────────────────────────────────────────────────

interface SwipeableCardProps {
  booking: BookingItem;
  onDeliver: (id: string) => void;
  onRelease: (id: string) => void;
  onCall: (phone: string) => void;
  onNavigate: (booking: BookingItem) => void;
  onOpen: (id: string) => void;
  actionLoading?: boolean;
}

function SwipeableBookingCard({
  booking,
  onDeliver,
  onRelease,
  onCall,
  onNavigate,
  onOpen,
  actionLoading,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const cardHeight = useSharedValue(220);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const dismissRight = useCallback(() => {
    onDeliver(booking.id);
  }, [booking.id, onDeliver]);

  const dismissLeft = useCallback(() => {
    onRelease(booking.id);
  }, [booking.id, onRelease]);

  const openDetail = useCallback(() => {
    onOpen(booking.id);
  }, [booking.id, onOpen]);

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(openDetail)();
  });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_W + 50, { duration: 280 });
        cardScale.value = withTiming(0.9, { duration: 250 });
        cardOpacity.value = withTiming(0, { duration: 280 }, () => {
          cardHeight.value = withTiming(0, { duration: 200 });
          runOnJS(dismissRight)();
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_W - 50, { duration: 280 });
        cardScale.value = withTiming(0.9, { duration: 250 });
        cardOpacity.value = withTiming(0, { duration: 280 }, () => {
          cardHeight.value = withTiming(0, { duration: 200 });
          runOnJS(dismissLeft)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardGesture = Gesture.Exclusive(panGesture, tapGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
      {
        rotate: `${interpolate(
          translateX.value, [-SCREEN_W, 0, SCREEN_W], [-6, 0, 6], Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: cardOpacity.value,
  }));

  const wrapperStyle = useAnimatedStyle(() => ({
    height: cardHeight.value === 220 ? undefined : cardHeight.value,
    overflow: 'hidden' as const,
    marginBottom: cardHeight.value === 220 ? 12 : withTiming(0, { duration: 200 }),
  }));

  const rightBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const leftBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.5, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={wrapperStyle}>
      <View style={swipeBg.container}>
        <Animated.View style={[swipeBg.right, rightBgStyle]}>
          <Feather name="check-circle" size={22} color="#fff" />
          <Text style={swipeBg.text}>Yetkazildi</Text>
        </Animated.View>
        <Animated.View style={[swipeBg.left, leftBgStyle]}>
          <Text style={swipeBg.textMuted}>Qaytarish</Text>
          <Feather name="corner-up-left" size={22} color={C.textSecondary} />
        </Animated.View>
      </View>

      <GestureDetector gesture={cardGesture}>
        <Animated.View style={[cStyles.card, cardAnimatedStyle]}>
          <View style={cStyles.header}>
            <View style={cStyles.avatar}>
              <Text style={cStyles.avatarText}>{getInitials(booking.customerName)}</Text>
            </View>
            <View style={cStyles.headerInfo}>
              <Text style={cStyles.name} numberOfLines={1}>{booking.customerName}</Text>
              <View style={cStyles.meta}>
                <Feather name="package" size={11} color={C.textMuted} />
                <Text style={cStyles.metaText}>{booking.quantity} ta</Text>
                <Text style={cStyles.metaDot}>·</Text>
                <Feather name="clock" size={11} color={C.textMuted} />
                <Text style={cStyles.metaText} numberOfLines={1}>{booking.bookedAtLabel}</Text>
              </View>
            </View>
            <Text style={cStyles.totalText}>{booking.total}</Text>
          </View>

          <View style={cStyles.infoSection}>
            <TouchableOpacity
              style={cStyles.infoRow}
              onPress={() => onNavigate(booking)}
              activeOpacity={0.7}
            >
              <Feather name="map-pin" size={13} color={C.primary} />
              <Text style={cStyles.infoText} numberOfLines={1}>{booking.address}</Text>
              <Feather name="chevron-right" size={14} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={cStyles.infoRow}
              onPress={() => onCall(booking.phone)}
              activeOpacity={0.7}
              disabled={!booking.phone}
            >
              <Feather name="phone" size={13} color={C.primary} />
              <Text style={[cStyles.infoText, { color: C.primary, fontWeight: '500' }]}>{booking.phone}</Text>
            </TouchableOpacity>
          </View>

          <View style={cStyles.actions}>
            <TouchableOpacity
              style={[cStyles.finishBtn, actionLoading && cStyles.finishBtnDisabled]}
              activeOpacity={0.85}
              onPress={() => onDeliver(booking.id)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={cStyles.finishBtnText}>Yakunlash</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={cStyles.navBtn}
              activeOpacity={0.85}
              onPress={() => onNavigate(booking)}
            >
              <Feather name="navigation" size={16} color={C.primary} />
            </TouchableOpacity>
          </View>

          <View style={cStyles.swipeHint}><View style={cStyles.swipeBar} /></View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const swipeBg = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', borderRadius: 18, overflow: 'hidden' },
  right: { flex: 1, backgroundColor: '#2ECC71', flexDirection: 'row', alignItems: 'center', paddingLeft: 28, gap: 10, borderRadius: 18 },
  left: { flex: 1, backgroundColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 28, gap: 10, borderRadius: 18 },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
  textMuted: { color: C.textSecondary, fontSize: 15, fontWeight: '700' },
});

const cStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1B2A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  metaDot: { fontSize: 11, color: C.textMuted, marginHorizontal: 2 },
  totalText: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginLeft: 8 },
  infoSection: { backgroundColor: C.bg, borderRadius: 12, padding: 12, gap: 8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  finishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    minHeight: 48,
  },
  finishBtnDisabled: {
    opacity: 0.85,
  },
  finishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHint: { alignItems: 'center', paddingTop: 10 },
  swipeBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border },
});

// ─── Static card for delivered / cancelled ────────────────────────────────────

function StaticBookingCard({
  booking,
  onOpen,
}: {
  booking: BookingItem;
  onOpen: (id: string) => void;
}) {
  const isDone = booking.status === 'delivered';
  return (
    <TouchableOpacity
      style={[staticStyles.card, !isDone && staticStyles.cardCancelled]}
      activeOpacity={0.85}
      onPress={() => onOpen(booking.id)}
    >
      <View style={staticStyles.row}>
        <View style={[staticStyles.avatar, !isDone && { backgroundColor: C.textMuted }]}>
          <Text style={staticStyles.avatarText}>{getInitials(booking.customerName)}</Text>
        </View>
        <View style={staticStyles.info}>
          <Text style={staticStyles.name} numberOfLines={1}>{booking.customerName}</Text>
          <Text style={staticStyles.address} numberOfLines={1}>{booking.address}</Text>
        </View>
        <View style={[staticStyles.statusBadge, isDone ? staticStyles.doneBadge : staticStyles.cancelBadge]}>
          <Feather name={isDone ? 'check' : 'x'} size={11} color={isDone ? '#2ECC71' : C.danger} />
          <Text style={[staticStyles.statusText, { color: isDone ? '#2ECC71' : C.danger }]}>
            {isDone ? 'Yetkazildi' : 'Bekor'}
          </Text>
        </View>
      </View>
      <View style={staticStyles.bottom}>
        <Text style={staticStyles.total}>{booking.total}</Text>
        <Text style={staticStyles.time}>{booking.bookedAtLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const staticStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1B2A3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardCancelled: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  info: { flex: 1, marginLeft: 10 },
  name: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  address: { fontSize: 12, color: C.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, gap: 4, marginLeft: 8 },
  doneBadge: { backgroundColor: '#F0FDF4' },
  cancelBadge: { backgroundColor: C.dangerSoft },
  statusText: { fontSize: 11, fontWeight: '600' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  time: { fontSize: 12, color: C.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<BookingItem[]>([]);
  const [historyBookings, setHistoryBookings] = useState<BookingItem[]>([]);
  const [tab, setTab] = useState<BookingStatus>('active');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { active, history } = await fetchBookingsData();
      setActiveBookings(active);
      setHistoryBookings(history);
    } catch (error) {
      if (!silent) {
        notify.error(
          'Xatolik',
          error instanceof Error ? error.message : 'Bronlarni yuklab bo\'lmadi',
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const { refreshControl } = useRefreshControl(() => loadBookings(true));

  useFocusEffect(
    useCallback(() => {
      loadBookings(false);
    }, [loadBookings]),
  );

  const handleDeliver = useCallback(async (id: string) => {
    const booking = activeBookings.find((b) => b.id === id);
    const supplierId = booking?.supplierId ?? user?.id;

    if (!supplierId) {
      notify.error('Xatolik', 'Yetkazib beruvchi aniqlanmadi');
      return;
    }

    setActiveBookings((prev) => prev.filter((b) => b.id !== id));
    setActionId(id);
    try {
      await completeBookedOrder(id, supplierId);
      await loadBookings(true);
    } catch (error) {
      await loadBookings(false);
      notify.error(
        'Xatolik',
        error instanceof Error ? error.message : 'Yakunlash amalga oshmadi',
      );
    } finally {
      setActionId(null);
    }
  }, [activeBookings, loadBookings, user?.id]);

  const handleRelease = useCallback(async (id: string) => {
    setActiveBookings((prev) => prev.filter((b) => b.id !== id));
    setActionId(id);
    try {
      await releaseBookedOrder(id);
      await loadBookings(true);
    } catch (error) {
      await loadBookings(false);
      notify.error(
        'Xatolik',
        error instanceof Error ? error.message : 'Buyurtmaga qaytarish amalga oshmadi',
      );
    } finally {
      setActionId(null);
    }
  }, [loadBookings]);

  const handleCall = useCallback((phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  }, []);

  const handleNavigate = useCallback((booking: BookingItem) => {
    openNavigation({
      address: booking.address,
      latitude: booking.latitude,
      longitude: booking.longitude,
    });
  }, []);

  const handleOpen = useCallback((id: string) => {
    router.push(`/booking/${id}`);
  }, []);

  const counts = useMemo(() => ({
    active: activeBookings.length,
    delivered: historyBookings.filter((b) => b.status === 'delivered').length,
    cancelled: historyBookings.filter((b) => b.status === 'cancelled').length,
  }), [activeBookings, historyBookings]);

  const filtered = useMemo(() => {
    if (tab === 'active') return activeBookings;
    return historyBookings.filter((b) => b.status === tab);
  }, [tab, activeBookings, historyBookings]);

  const swipeHintVisible = tab === 'active' && counts.active > 0 && !loading;

  return (
    <View style={sStyles.container}>
      <ScreenHeader title="Bron" badge={counts.active}>
        <SegmentTabs active={tab} onSelect={setTab} counts={counts} />
      </ScreenHeader>

      {swipeHintVisible && (
        <Animated.View entering={FadeIn.duration(300)} style={sStyles.hintRow}>
          <Feather name="arrow-left" size={12} color={C.textMuted} />
          <Text style={sStyles.hintText}>Chapga — Buyurtmalar  ·  O'ngga — Yetkazildi</Text>
          <Feather name="arrow-right" size={12} color={C.textMuted} />
        </Animated.View>
      )}

      {tab === 'active' ? (
        <Animated.FlatList
          style={sStyles.list}
          data={filtered}
          keyExtractor={(i) => i.id}
          itemLayoutAnimation={LinearTransition.springify().damping(18)}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
              <SwipeableBookingCard
                booking={item}
                onDeliver={handleDeliver}
                onRelease={handleRelease}
                onCall={handleCall}
                onNavigate={handleNavigate}
                onOpen={handleOpen}
                actionLoading={actionId === item.id}
              />
            </Animated.View>
          )}
          contentContainerStyle={
            filtered.length === 0 ? sStyles.listContentEmpty : sStyles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <ListLoader />
            ) : (
              <EmptyBox icon="inbox" title="Jarayonda bron yo'q" sub="Band qilingan buyurtmalar shu yerda ko'rinadi" />
            )
          }
          refreshControl={refreshControl}
        />
      ) : (
        <FlatList
          style={sStyles.list}
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <StaticBookingCard booking={item} onOpen={handleOpen} />
          )}
          contentContainerStyle={
            filtered.length === 0 ? sStyles.listContentEmpty : sStyles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <ListLoader />
            ) : (
              <EmptyBox
                icon={tab === 'delivered' ? 'check-circle' : 'x-circle'}
                title={tab === 'delivered' ? 'Yakunlangan bron yo\'q' : 'Bekor qilingan bron yo\'q'}
                sub="Hozircha bu yerda hech narsa yo'q"
              />
            )
          }
          refreshControl={refreshControl}
        />
      )}
    </View>
  );
}

function ListLoader() {
  return (
    <View style={sStyles.emptyBox}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={sStyles.emptySub}>Yuklanmoqda...</Text>
    </View>
  );
}

function EmptyBox({ icon, title, sub }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; sub: string }) {
  return (
    <View style={sStyles.emptyBox}>
      <View style={sStyles.emptyIcon}>
        <Feather name={icon} size={28} color={C.textMuted} />
      </View>
      <Text style={sStyles.emptyTitle}>{title}</Text>
      <Text style={sStyles.emptySub}>{sub}</Text>
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { flex: 1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  hintText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
