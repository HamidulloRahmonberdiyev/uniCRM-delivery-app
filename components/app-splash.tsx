import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette as C } from '@/constants/theme';

export function AppSplash() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={styles.brandBlock}>
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
        </View>

        <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brandBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 4,
    marginBottom: 20,
  },
  logoInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
});
