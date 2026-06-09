import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette as C } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

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
  { id: '1', customerName: 'Alisher Karimov', address: 'Chilonzor, 3-kvartal, 15-uy', phone: '+998 90 123 45 67', distance: '1.2 km', eta: '5 min', lat: 41.2867, lng: 69.2044 },
  { id: '2', customerName: 'Zulfiya Rahimova', address: "Yunusobod, Amir Temur ko'chasi, 108", phone: '+998 91 987 65 43', distance: '3.4 km', eta: '12 min', lat: 41.3252, lng: 69.2856 },
  { id: '3', customerName: 'Bobur Mirzayev', address: "Mirzo Ulug'bek, Bunyodkor ko'chasi, 22", phone: '+998 93 456 78 90', distance: '5.8 km', eta: '18 min', lat: 41.3400, lng: 69.3350 },
  { id: '4', customerName: 'Nilufar Toshmatova', address: "Shayxontohur, Navoiy ko'chasi, 7", phone: '+998 97 111 22 33', distance: '2.1 km', eta: '8 min', lat: 41.3150, lng: 69.2480 },
];

const DRIVER_LOCATION = { latitude: 41.3111, longitude: 69.2797 };

const TASHKENT_CENTER = {
  ...DRIVER_LOCATION,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function openMaps(address: string) {
  const query = encodeURIComponent(address);
  const url = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

// ─── Custom markers ───────────────────────────────────────────────────────────

function OrderMarker() {
  return (
    <View style={markerStyles.container}>
      <View style={markerStyles.bubble}>
        <Feather name="package" size={13} color="#fff" />
      </View>
      <View style={markerStyles.arrow} />
    </View>
  );
}

function DriverMarker() {
  return (
    <View style={markerStyles.container}>
      <View style={markerStyles.driverOuter}>
        <View style={markerStyles.driverInner}>
          <Feather name="truck" size={14} color="#fff" />
        </View>
      </View>
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  bubble: {
    backgroundColor: C.primary,
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
  arrow: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: C.primary, marginTop: -1,
  },
  driverOuter: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,136,204,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  driverInner: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#0088CC',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});

// ─── Order Card ───────────────────────────────────────────────────────────────

function NearbyOrderCard({ order, onBook, onFocus }: {
  order: NearbyOrder;
  onBook: (id: string) => void;
  onFocus: (order: NearbyOrder) => void;
}) {
  return (
    <TouchableOpacity style={cardStyles.card} activeOpacity={0.85} onPress={() => onFocus(order)}>
      <View style={cardStyles.row}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{getInitials(order.customerName)}</Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>{order.customerName}</Text>
          <View style={cardStyles.addressRow}>
            <Feather name="map-pin" size={11} color={C.textMuted} />
            <Text style={cardStyles.address} numberOfLines={1}>{order.address}</Text>
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
        <TouchableOpacity style={cardStyles.bookBtn} activeOpacity={0.85} onPress={() => onBook(order.id)}>
          <Text style={cardStyles.bookBtnText}>Band qilish</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, marginHorizontal: 16,
    shadowColor: '#1B2A3D', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  info: { flex: 1, marginLeft: 10 },
  name: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { flex: 1, fontSize: 12, color: C.textMuted },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { fontSize: 12, fontWeight: '600', color: C.textPrimary },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textMuted },
  bookBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [orders, setOrders] = useState(NEARBY_ORDERS);

  const handleBook = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleFocus = useCallback((order: NearbyOrder) => {
    mapRef.current?.animateToRegion(
      { latitude: order.lat, longitude: order.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      600,
    );
  }, []);

  const mapHeight = SCREEN_H * 0.48;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Satellite Map */}
      <View style={[styles.mapContainer, { height: mapHeight + insets.top }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={TASHKENT_CENTER}
          mapType="satellite"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Driver location */}
          <Marker
            coordinate={DRIVER_LOCATION}
            title="Sizning joylashuvingiz"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <DriverMarker />
          </Marker>

          {/* Order markers */}
          {orders.map((o) => (
            <Marker
              key={o.id}
              coordinate={{ latitude: o.lat, longitude: o.lng }}
              title={o.customerName}
              description={o.address}
            >
              <OrderMarker />
            </Marker>
          ))}
        </MapView>

        {/* Overlay header */}
        <View style={[styles.mapOverlay, { paddingTop: insets.top + 14 }]}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Lokatsiya</Text>
              <Text style={styles.mapSubtitle}>{orders.length} ta buyurtma atrofda</Text>
            </View>
            <View style={styles.mapLive}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* My location button */}
        <TouchableOpacity
          style={[styles.myLocBtn, { bottom: 28 }]}
          activeOpacity={0.8}
          onPress={() => mapRef.current?.animateToRegion(TASHKENT_CENTER, 500)}
        >
          <Feather name="crosshair" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle}><View style={styles.handleBar} /></View>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Yaqin buyurtmalar</Text>
          <Text style={styles.panelCount}>{orders.length} ta</Text>
        </View>
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <NearbyOrderCard order={item} onBook={handleBook} onFocus={handleFocus} />
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
  mapContainer: { overflow: 'hidden' },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 12 },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mapTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  mapSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  mapLive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6, gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  myLocBtn: {
    position: 'absolute', right: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  bottomPanel: {
    flex: 1, backgroundColor: C.bg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -18,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
  },
  panelHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.divider },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  panelTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  panelCount: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  listContent: { paddingBottom: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: C.textMuted },
});
