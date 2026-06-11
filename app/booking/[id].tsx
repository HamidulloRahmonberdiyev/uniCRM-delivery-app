import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette as C } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notify";
import { cancelBookedOrder, getOrderById } from "@/services/orders-api";
import type { OrderDetailView } from "@/types/order";
import { openNavigation } from "@/utils/navigation";
import { mapOrderResourceToDetail } from "@/utils/order";

function DetailRow({
  icon,
  label,
  value,
  onPress,
  accent,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  onPress?: () => void;
  accent?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={16} color={C.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text
          style={[styles.rowValue, accent && styles.rowValueAccent]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <Feather name="chevron-right" size={16} color={C.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Array.isArray(id) ? id[0] : id;

  const [detail, setDetail] = useState<OrderDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setDetail(mapOrderResourceToDetail(data));
    } catch (error) {
      setDetail(null);
      notify.error(
        "Xatolik",
        error instanceof Error ? error.message : "Buyurtma yuklanmadi",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder]),
  );

  const handleCall = (phone: string) => {
    if (!phone || phone === "—") return;
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  const handleNavigate = () => {
    if (!detail) return;
    openNavigation({
      address: detail.address,
      latitude: detail.latitude,  
      longitude: detail.longitude,
    });
  };

  const handleCancel = () => {
    if (!orderId || !detail?.canCancel) return;

    const supplierId = detail.supplierId ?? user?.id;
    if (!supplierId) {
      notify.error("Xatolik", "Yetkazib beruvchi aniqlanmadi");
      return;
    }

    notify.confirm("Bekor qilish", "Haqiqiy Buyurtmani bekor qilmoqchimisiz?", [
      { text: "Yo'q", style: "cancel" },
      {
        text: "Bekor qilish",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBookedOrder(orderId, supplierId);
            notify.success("Bekor qilindi", "Buyurtma bekor qilingan");
            router.back();
          } catch (error) {
            notify.error(
              "Xatolik",
              error instanceof Error
                ? error.message
                : "Bekor qilish amalga oshmadi",
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma #{orderId ?? "—"}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Yuklanmoqda...</Text>
        </View>
      ) : !detail ? (
        <View style={styles.center}>
          <Feather name="inbox" size={32} color={C.textMuted} />
          <Text style={styles.loadingText}>Buyurtma topilmadi</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroAvatar}>
              <Feather name="user" size={28} color="#fff" />
            </View>
            <Text style={styles.heroName}>{detail.customerName}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{detail.statusLabel}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mijoz</Text>
            <View style={styles.card}>
              <DetailRow
                icon="phone"
                label="Telefon"
                value={detail.phone}
                onPress={() => handleCall(detail.phone)}
                accent
              />
              {detail.phone2 !== "—" ? (
                <DetailRow
                  icon="phone"
                  label="Telefon 2"
                  value={detail.phone2}
                  onPress={() => handleCall(detail.phone2)}
                  accent
                />
              ) : null}
              <DetailRow icon="map-pin" label="Tuman" value={detail.district} />
              <DetailRow
                icon="home"
                label="Mahalla"
                value={detail.neighborhood}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyurtma</Text>
            <View style={styles.card}>
              <DetailRow
                icon="clock"
                label="Yaratilgan vaqt"
                value={detail.createdAtLabel}
              />
              <DetailRow
                icon="calendar"
                label="Buyurtma sanasi"
                value={detail.orderDate}
              />
              <DetailRow
                icon="package"
                label="Miqdor"
                value={`${detail.quantity} ta`}
              />
              <DetailRow
                icon="box"
                label="Mahsulot"
                value={detail.productName}
              />
              <DetailRow icon="credit-card" label="Summa" value={detail.sum} />
              <DetailRow
                icon="map-pin"
                label="Manzil"
                value={detail.address}
                onPress={handleNavigate}
              />
              <DetailRow icon="tag" label="Manba" value={detail.source} />
              {detail.note !== "—" ? (
                <DetailRow icon="file-text" label="Izoh" value={detail.note} />
              ) : null}
              {detail.supplierName !== "—" ? (
                <DetailRow
                  icon="truck"
                  label="Yetkazuvchi"
                  value={detail.supplierName}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleNavigate}
              activeOpacity={0.85}
            >
              <Feather name="navigation" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Navigatsiya</Text>
            </TouchableOpacity>

            {detail.canCancel ? (
              <TouchableOpacity
                style={[
                  styles.dangerBtn,
                  cancelling && styles.dangerBtnDisabled,
                ]}
                onPress={handleCancel}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="x-circle" size={18} color="#fff" />
                    <Text style={styles.dangerBtnText}>Bekor qilish</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: C.textPrimary,
    marginHorizontal: 8,
  },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: C.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1B2A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  statusPill: {
    backgroundColor: C.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: { fontSize: 13, fontWeight: "600", color: C.primary },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#1B2A3D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowValue: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  rowValueAccent: { color: C.primary, fontWeight: "600" },
  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    minHeight: 50,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.danger,
    borderRadius: 14,
    paddingVertical: 15,
    minHeight: 50,
  },
  dangerBtnDisabled: { opacity: 0.85 },
  dangerBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
