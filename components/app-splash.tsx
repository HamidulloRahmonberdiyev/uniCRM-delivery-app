import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette as C } from '@/constants/theme';

export function AppSplash() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.logoRing}>
        <View style={styles.logoInner}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>
      </View>
      <Text style={styles.brand}>uniGo</Text>
      <Text style={styles.tagline}>uniGo kuryerlar ilovasi</Text>
      <ActivityIndicator
        size="large"
        color="#fff"
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  logoRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  loader: {
    marginTop: 40,
  },
});
