import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette as C } from '@/constants/theme';

// ─── User data ────────────────────────────────────────────────────────────────

const USER = {
  name: 'Admin',
  phone: '+998 90 000 00 00',
  email: 'admin@unigo.uz',
  deliveries: 142,
  rating: 4.8,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string | number;
  label: string;
}) {
  return (
    <View style={statStyles.card}>
      <View style={statStyles.iconCircle}>
        <Feather name={icon} size={20} color={C.primary} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// ─── MenuRow ──────────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  label,
  value,
  hasChevron = false,
  onPress,
  rightElement,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value?: string;
  hasChevron?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={rowStyles.iconBox}>
        <Feather name={icon} size={16} color={C.primary} />
      </View>
      <View style={rowStyles.content}>
        <Text style={rowStyles.label}>{label}</Text>
        {value ? <Text style={rowStyles.value}>{value}</Text> : null}
      </View>
      {rightElement ??
        (hasChevron ? (
          <Feather name="chevron-right" size={17} color={C.textMuted} />
        ) : null)}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: C.textPrimary,
  },
  value: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
});

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

function RowDivider() {
  return <View style={sectionStyles.divider} />;
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 66,
  },
});

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Chiqish', "Tizimdan chiqishni tasdiqlaysizmi?", [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: () => console.log('Logout pressed'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 24 }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{getInitials(USER.name)}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{USER.name}</Text>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={11} color={C.primary} />
            <Text style={styles.roleText}>Yetkazuvchi</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="package" value={USER.deliveries} label="Yetkazilgan" />
          <View style={styles.statsSpacer} />
          <StatCard icon="star" value={USER.rating} label="Reyting" />
        </View>

        {/* Personal info */}
        <Section title="Shaxsiy ma'lumotlar">
          <MenuRow icon="phone" label="Telefon" value={USER.phone} />
          <RowDivider />
          <MenuRow icon="mail" label="Email" value={USER.email} />
        </Section>

        {/* Settings */}
        <Section title="Sozlamalar">
          <MenuRow
            icon="bell"
            label="Bildirishnomalar"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E9ED', true: C.primaryMuted }}
                thumbColor={notifications ? C.primary : '#CBD5E1'}
                ios_backgroundColor="#E5E9ED"
              />
            }
          />
          <RowDivider />
          <MenuRow
            icon="clock"
            label="Buyurtmalar tarixi"
            hasChevron
            onPress={() => {}}
          />
        </Section>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={C.danger} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: C.card,
    marginBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: C.primary,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 83,
    height: 83,
    borderRadius: 42,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 5,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsSpacer: {
    width: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 16,
    backgroundColor: C.dangerSoft,
    borderRadius: 14,
    gap: 9,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.danger,
  },
  bottomSpacer: {
    height: 24,
  },
});
