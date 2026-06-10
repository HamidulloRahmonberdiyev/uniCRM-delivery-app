import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/** Kichik yetkazuvchi mashina — delivery.webp, to'liq ko'rinishi uchun contain */
const TRUCK_WIDTH = 36;
const TRUCK_HEIGHT = 26;
const CANVAS_SIZE = 48;

export function MapDriverMarker({ onLayout }: { onLayout?: () => void }) {
  return (
    <View style={styles.canvas} onLayout={onLayout} collapsable={false}>
      <Image
        source={require('@/assets/images/delivery.webp')}
        style={styles.truck}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

export const DRIVER_MARKER_ANCHOR = { x: 0.5, y: 0.5 } as const;

const styles = StyleSheet.create({
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  truck: {
    width: TRUCK_WIDTH,
    height: TRUCK_HEIGHT,
  },
});
