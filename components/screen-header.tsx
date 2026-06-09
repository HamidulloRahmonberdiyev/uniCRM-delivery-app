import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette as C } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  badge?: string | number;
  children?: React.ReactNode;
}

export function ScreenHeader({ title, rightElement, badge, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <View style={styles.spacer} />
        {rightElement}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  badge: {
    backgroundColor: C.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
  spacer: {
    flex: 1,
  },
});
