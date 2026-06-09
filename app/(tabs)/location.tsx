import { Palette as C } from "@/constants/theme";
import { openNavigation } from "@/utils/navigation";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
  "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearbyOrder {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  distance: string;
  eta: string;
  lat: number;
  lng: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const NEARBY_ORDERS: NearbyOrder[] = [
  {
    id: "1",
    customerName: "Alisher Karimov",
    address: "Chilonzor, 3-kvartal, 15-uy",
    phone: "+998 90 123 45 67",
    distance: "1.2 km",
    eta: "5 min",
    lat: 41.2867,
    lng: 69.2044,
  },
  {
    id: "2",
    customerName: "Zulfiya Rahimova",
    address: "Yunusobod, Amir Temur ko'chasi, 108",
    phone: "+998 91 987 65 43",
    distance: "3.4 km",
    eta: "12 min",
    lat: 41.3252,
    lng: 69.2856,
  },
  {
    id: "3",
    customerName: "Bobur Mirzayev",
    address: "Mirzo Ulug'bek, Bunyodkor ko'chasi, 22",
    phone: "+998 93 456 78 90",
    distance: "5.8 km",
    eta: "18 min",
    lat: 41.34,
    lng: 69.335,
  },
  {
    id: "4",
    customerName: "Nilufar Toshmatova",
    address: "Shayxontohur, Navoiy ko'chasi, 7",
    phone: "+998 97 111 22 33",
    distance: "2.1 km",
    eta: "8 min",
    lat: 41.315,
    lng: 69.248,
  },
];

const DRIVER_LOCATION = { latitude: 41.3111, longitude: 69.2797 };

const TASHKENT_CENTER = {
  ...DRIVER_LOCATION,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Yetkazuvchi marker ───────────────────────────────────────────────────────

const DRIVER_MARKER_SIZE = 72;

function DriverMarkerView() {
  return (
    <View style={driverMarkerStyles.wrapper} collapsable={false}>
      <Image
        source={require("@/assets/images/delivery.webp")}
        style={driverMarkerStyles.image}
        contentFit="contain"
      />
    </View>
  );
}

const driverMarkerStyles = StyleSheet.create({
  wrapper: {
    width: DRIVER_MARKER_SIZE,
    height: DRIVER_MARKER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: DRIVER_MARKER_SIZE,
    height: DRIVER_MARKER_SIZE,
  },
});

// ─── Buyurtma marker (oddiy pin) ──────────────────────────────────────────────

function OrderMarkerView() {
  return (
    <View style={orderMarkerStyles.wrapper} collapsable={false}>
      <View style={orderMarkerStyles.pin}>
        <View style={orderMarkerStyles.pinInner} />
      </View>
      <View style={orderMarkerStyles.pinTail} />
    </View>
  );
}

const orderMarkerStyles = StyleSheet.create({
  wrapper: { alignItems: "center", width: 32, height: 40 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E67E22",
    borderWidth: 2.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#E67E22",
    marginTop: -1,
  },
});

// ─── Map fallback (API key yo'q yoki xarita yuklanmasa) ───────────────────────

function MapFallback({ insetsTop }: { insetsTop: number }) {
  return (
    <View style={[fallbackStyles.container, { paddingTop: insetsTop + 14 }]}>
      <View style={fallbackStyles.iconCircle}>
        <Feather name="map" size={36} color={C.primary} />
      </View>
      <Text style={fallbackStyles.title}>Xarita sozlanmagan</Text>
      <Text style={fallbackStyles.subtitle}>
        Android APK uchun Google Maps API kaliti kerak.{"\n"}
        .env faylida EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ni kiriting va APK ni qayta
        build qiling.
      </Text>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a2a3a",
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
}: {
  order: NearbyOrder;
  onBook: (id: string) => void;
  onFocus: (order: NearbyOrder) => void;
  onNavigate: (order: NearbyOrder) => void;
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
        </View>
      </View>
      <View style={cardStyles.bottom}>
        <View style={cardStyles.stats}>
          <View style={cardStyles.stat}>
            <Feather name="navigation" size={12} color={C.primary} />
            <Text style={cardStyles.statVal}>{order.distance}</Text>
          </View>
          <View style={cardStyles.statDot} />
          <View style={cardStyles.stat}>
            <Feather name="clock" size={12} color={C.primary} />
            <Text style={cardStyles.statVal}>{order.eta}</Text>
          </View>
        </View>
        <View style={cardStyles.actions}>
          <TouchableOpacity
            style={cardStyles.bookBtn}
            activeOpacity={0.85}
            onPress={() => onBook(order.id)}
          >
            <Text style={cardStyles.bookBtnText}>Band qilish</Text>
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
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.textMuted,
  },
  bookBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
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
  const mapRef = useRef<MapView>(null);
  const [orders, setOrders] = useState(NEARBY_ORDERS);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Custom markerlar birinchi renderda snapshot olishi kerak
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [orders.length]);

  const handleMapReady = useCallback(() => {
    setTracksViewChanges(true);
    setTimeout(() => setTracksViewChanges(false), 600);
  }, []);

  const canShowMap = useMemo(() => {
    if (Platform.OS === "web") return false;
    // Expo Go has built-in key; standalone Android needs explicit key
    if (Constants.appOwnership === "expo") return true;
    if (Platform.OS === "android") return Boolean(GOOGLE_MAPS_API_KEY);
    return true;
  }, []);

  const mapProvider = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

  const handleBook = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleFocus = useCallback(
    (order: NearbyOrder) => {
      if (!canShowMap) return;
      mapRef.current?.animateToRegion(
        {
          latitude: order.lat,
          longitude: order.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600,
      );
    },
    [canShowMap],
  );

  const handleNavigate = useCallback((order: NearbyOrder) => {
    openNavigation({
      address: order.address,
      latitude: order.lat,
      longitude: order.lng,
    });
  }, []);

  const mapHeight = SCREEN_H * 0.48;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.mapContainer, { height: mapHeight + insets.top }]}>
        {canShowMap ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={mapProvider}
            initialRegion={TASHKENT_CENTER}
            mapType="satellite"
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            loadingEnabled
            onMapReady={handleMapReady}
          >
            <Marker
              coordinate={DRIVER_LOCATION}
              title="Sizning joylashuvingiz"
              description="Yetkazuvchi"
              anchor={{ x: 0.5, y: 0.38 }}
              zIndex={1000}
              tracksViewChanges={tracksViewChanges}
            >
              <DriverMarkerView />
            </Marker>
            {orders.map((o) => (
              <Marker
                key={o.id}
                coordinate={{ latitude: o.lat, longitude: o.lng }}
                title={o.customerName}
                description={o.address}
                anchor={{ x: 0.5, y: 0.95 }}
                zIndex={100}
                tracksViewChanges={tracksViewChanges}
              >
                <OrderMarkerView />
              </Marker>
            ))}
          </MapView>
        ) : (
          <MapFallback insetsTop={insets.top} />
        )}

        <View
          style={[styles.mapOverlay, { paddingTop: insets.top + 14 }]}
          pointerEvents="box-none"
        >
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Lokatsiya</Text>
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

        {canShowMap && (
          <TouchableOpacity
            style={[styles.myLocBtn, { bottom: 28 }]}
            activeOpacity={0.8}
            onPress={() =>
              mapRef.current?.animateToRegion(TASHKENT_CENTER, 500)
            }
          >
            <Feather name="crosshair" size={18} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle}>
          <View style={styles.handleBar} />
        </View>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Yaqin buyurtmalar</Text>
          <Text style={styles.panelCount}>{orders.length} ta</Text>
        </View>
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <NearbyOrderCard
              order={item}
              onBook={handleBook}
              onFocus={handleFocus}
              onNavigate={handleNavigate}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="map-pin" size={24} color={C.textMuted} />
              <Text style={styles.emptyText}>Atrofda buyurtma yo'q</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mapContainer: { overflow: "hidden", backgroundColor: "#1a2a3a" },
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
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2ECC71" },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.6,
  },
  myLocBtn: {
    position: "absolute",
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
