import { MapFloatControls } from "@/components/map-float-controls";
import { MapOrderCallout } from "@/components/map-order-callout";
import {
  centerMapOn,
  LocationMapView,
  zoomMapBy,
} from "@/components/yandex-map-bridge";
import { MAP_BG } from "@/lib/yandex-map-theme";
import {
  DRIVER_ZOOM,
  ORDER_FOCUS_ZOOM,
  type LocationMapHandle,
} from "@/lib/yandex-maps";
import { Palette as C } from "@/constants/theme";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useYamapInit } from "@/hooks/use-yamap-init";
import { notify } from "@/lib/notify";
import { canShowYandexMap, isExpoGo } from "@/lib/yandex-maps";
import { bookOrder, getActiveOrders } from "@/services/orders-api";
import type { OrderListItem } from "@/types/order";
import { type Coordinates, haversineDistanceKm } from "@/utils/geo";
import { openNavigation } from "@/utils/navigation";
import { attachDistanceToOrders } from "@/utils/order";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function sortOrdersByDistance(
  orders: OrderListItem[],
  driverLocation: Coordinates | null,
): OrderListItem[] {
  if (!driverLocation) return orders;

  return [...orders].sort((a, b) => {
    const dist = (order: OrderListItem) => {
      if (order.latitude == null || order.longitude == null) return Infinity;
      return haversineDistanceKm(driverLocation, {
        latitude: order.latitude,
        longitude: order.longitude,
      });
    };
    return dist(a) - dist(b);
  });
}

function hasCoordinates(order: OrderListItem): boolean {
  return order.latitude != null && order.longitude != null;
}

// ─── Map fallback ─────────────────────────────────────────────────────────────

function MapFallback({ insetsTop }: { insetsTop: number }) {
  const subtitle = isExpoGo
    ? "Yandex Maps API kaliti kerak.\n.env faylida EXPO_PUBLIC_YANDEX_MAPS_API_KEY ni kiriting.\nExpo Go da WebView xarita ishlatiladi."
    : "Yandex Maps API kaliti kerak.\n.env faylida EXPO_PUBLIC_YANDEX_MAPS_API_KEY ni kiriting.";

  return (
    <View style={[fallbackStyles.container, { paddingTop: insetsTop + 14 }]}>
      <View style={fallbackStyles.iconCircle}>
        <Feather name="map" size={36} color={C.primary} />
      </View>
      <Text style={fallbackStyles.title}>Xarita sozlanmagan</Text>
      <Text style={fallbackStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MAP_BG,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,136,204,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
});

// ─── Order Card ───────────────────────────────────────────────────────────────

function NearbyOrderCard({
  order,
  onBook,
  onFocus,
  onNavigate,
  booking,
}: {
  order: OrderListItem;
  onBook: (id: string) => void;
  onFocus: (order: OrderListItem) => void;
  onNavigate: (order: OrderListItem) => void;
  booking?: boolean;
}) {
  return (
    <TouchableOpacity
      style={cardStyles.card}
      activeOpacity={0.85}
      onPress={() => onFocus(order)}
    >
      <View style={cardStyles.row}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>
            {getInitials(order.customerName)}
          </Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {order.customerName}
          </Text>
          <View style={cardStyles.addressRow}>
            <Feather name="map-pin" size={11} color={C.textMuted} />
            <Text style={cardStyles.address} numberOfLines={1}>
              {order.address}
            </Text>
          </View>
          <View style={cardStyles.timeRow}>
            <Feather name="clock" size={11} color={C.textMuted} />
            <Text style={cardStyles.timeText} numberOfLines={1}>
              {order.dateTimeLabel}
            </Text>
          </View>
        </View>
      </View>
      <View style={cardStyles.bottom}>
        <View style={cardStyles.stats}>
          <View style={cardStyles.stat}>
            <Feather name="navigation" size={12} color={C.primary} />
            <Text style={cardStyles.statVal}>{order.distance ?? "—"}</Text>
          </View>
        </View>
        <View style={cardStyles.actions}>
          <TouchableOpacity
            style={[cardStyles.bookBtn, booking && cardStyles.bookBtnDisabled]}
            activeOpacity={0.85}
            onPress={() => onBook(order.id)}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={cardStyles.bookBtnText}>Band qilish</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={cardStyles.navBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate(order)}
          >
            <Feather name="navigation" size={16} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: "#1B2A3D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  info: { flex: 1, marginLeft: 10 },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
    marginBottom: 2,
  },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { flex: 1, fontSize: 12, color: C.textMuted },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    flex: 1,
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: "500",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  stats: { flexDirection: "row", alignItems: "center", gap: 6 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statVal: { fontSize: 12, fontWeight: "600", color: C.textPrimary },
  bookBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 108,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  bookBtnDisabled: { opacity: 0.85 },
  bookBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<LocationMapHandle>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const isFirstFocus = useRef(true);
  const { location, refreshLocation } = useDriverLocation();

  const { ready: mapReady } = useYamapInit();

  const mapOrders = useMemo(() => orders.filter(hasCoordinates), [orders]);
  const canShowMap = canShowYandexMap() && mapReady;

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const driverLocation = location ?? (await refreshLocation());
        const data = await getActiveOrders();
        const withDistance = attachDistanceToOrders(data, driverLocation);
        setOrders(sortOrdersByDistance(withDistance, driverLocation));
      } catch (error) {
        setOrders([]);
        if (!silent) {
          notify.error(
            "Xatolik",
            error instanceof Error
              ? error.message
              : "Buyurtmalarni yuklab bo'lmadi",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [location, refreshLocation],
  );

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadOrders(true);
    }, [loadOrders]),
  );

  useEffect(() => {
    if (!location || !canShowMap) return;
    centerMapOn(mapRef, location, DRIVER_ZOOM);
  }, [location?.latitude, location?.longitude, canShowMap]);

  const handleBook = useCallback(async (id: string) => {
    setBookingId(id);
    try {
      await bookOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedOrder((prev) => (prev?.id === id ? null : prev));
      notify.success("Band qilindi", "Buyurtma muvaffaqiyatli band qilindi");
    } catch (error) {
      notify.error(
        "Xatolik",
        error instanceof Error ? error.message : "Band qilish amalga oshmadi",
      );
    } finally {
      setBookingId(null);
    }
  }, []);

  const handleMapOrderPress = useCallback(
    (order: OrderListItem) => {
      setSelectedOrder(order);
      if (hasCoordinates(order)) {
        centerMapOn(
          mapRef,
          { latitude: order.latitude!, longitude: order.longitude! },
          ORDER_FOCUS_ZOOM,
          0.5,
        );
      }
    },
    [],
  );

  const handleFocus = useCallback(
    (order: OrderListItem) => {
      if (!canShowMap || !hasCoordinates(order)) return;
      centerMapOn(
        mapRef,
        { latitude: order.latitude!, longitude: order.longitude! },
        ORDER_FOCUS_ZOOM,
        0.6,
      );
    },
    [canShowMap],
  );

  const handleNavigate = useCallback((order: OrderListItem) => {
    openNavigation({
      address: order.address,
      latitude: order.latitude,
      longitude: order.longitude,
    });
  }, []);

  const handleCenterOnDriver = useCallback(() => {
    if (!location) return;
    centerMapOn(mapRef, location, DRIVER_ZOOM);
  }, [location]);

  const { refreshControl } = useRefreshControl(() => loadOrders(true));

  const listHeader = (
    <>
      <View style={styles.panelHandle}>
        <View style={styles.handleBar} />
      </View>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Yaqin atrofda buyurtmalar</Text>
        <Text style={styles.panelCount}>{orders.length} ta</Text>
      </View>
    </>
  );

  const mapHeight = SCREEN_H * 0.52;

  const handleZoomIn = useCallback(() => zoomMapBy(mapRef, 1), []);
  const handleZoomOut = useCallback(() => zoomMapBy(mapRef, -1), []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.mapContainer, { height: mapHeight + insets.top }]}>
        {canShowMap ? (
          <LocationMapView
            ref={mapRef}
            driverLocation={location}
            orders={mapOrders}
            onOrderPress={handleMapOrderPress}
            onMapLoaded={() => {
              if (location) {
                centerMapOn(mapRef, location, DRIVER_ZOOM);
              }
            }}
          />
        ) : (
          <MapFallback insetsTop={insets.top} />
        )}

        <View
          style={[styles.mapOverlay, { paddingTop: insets.top + 14 }]}
          pointerEvents="box-none"
        >
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Xarita</Text>
              <Text style={styles.mapSubtitle}>
                {orders.length} ta buyurtma atrofda
              </Text>
            </View>
            <View style={styles.mapLive}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {canShowMap && !selectedOrder ? (
          <MapFloatControls
            bottom={selectedOrder ? 120 : 28}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onMyLocation={handleCenterOnDriver}
          />
        ) : null}

        {selectedOrder ? (
          <MapOrderCallout
            order={selectedOrder}
            booking={bookingId === selectedOrder.id}
            onBook={() => handleBook(selectedOrder.id)}
            onNavigate={() => handleNavigate(selectedOrder)}
            onClose={() => setSelectedOrder(null)}
          />
        ) : null}
      </View>

      <View style={styles.bottomPanel}>
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <NearbyOrderCard
              order={item}
              onBook={handleBook}
              onFocus={handleFocus}
              onNavigate={handleNavigate}
              booking={bookingId === item.id}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.emptyText}>Yuklanmoqda...</Text>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Feather name="map-pin" size={24} color={C.textMuted} />
                <Text style={styles.emptyText}>Atrofda buyurtma yo&apos;q</Text>
              </View>
            )
          }
          refreshControl={refreshControl}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mapContainer: { overflow: "hidden", backgroundColor: MAP_BG },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mapSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mapLive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 28, 38, 0.88)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2ECC71" },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.6,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  panelHandle: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.divider,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  panelTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  panelCount: { fontSize: 13, fontWeight: "600", color: C.textMuted },
  listContent: { paddingBottom: 20 },
  emptyBox: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: C.textMuted },
});
