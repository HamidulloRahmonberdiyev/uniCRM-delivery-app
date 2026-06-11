import { Palette as C } from '@/constants/theme';
import type { OrderListItem } from '@/types/order';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  order: OrderListItem;
  booking?: boolean;
  onBook: () => void;
  onNavigate: () => void;
  onClose: () => void;
};

export function MapOrderCallout({
  order,
  booking,
  onBook,
  onNavigate,
  onClose,
}: Props) {
  const meta = [order.distance, order.quantity, order.sum]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {order.customerName}
            </Text>
            <Text style={styles.address} numberOfLines={2}>
              {order.address}
            </Text>
            {meta ? (
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather name="x" size={15} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.bookBtn, booking && styles.bookBtnDisabled]}
            activeOpacity={0.85}
            onPress={onBook}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.bookBtnText}>Band qilish</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            activeOpacity={0.85}
            onPress={onNavigate}
          >
            <Feather name="navigation" size={16} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 14,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#1B2A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 2,
  },
  address: {
    fontSize: 11,
    color: C.textSecondary,
    lineHeight: 15,
    fontWeight: '500',
  },
  meta: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 9,
    minHeight: 36,
  },
  bookBtnDisabled: {
    opacity: 0.85,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
