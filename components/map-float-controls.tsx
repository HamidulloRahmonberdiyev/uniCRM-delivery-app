import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMyLocation?: () => void;
  bottom?: number;
};

function ControlButton({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      activeOpacity={0.82}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Feather name={icon} size={18} color="#E8EDF4" />
    </TouchableOpacity>
  );
}

export function MapFloatControls({
  onZoomIn,
  onZoomOut,
  onMyLocation,
  bottom = 28,
}: Props) {
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.zoomGroup}>
        <ControlButton icon="plus" onPress={onZoomIn} />
        <View style={styles.divider} />
        <ControlButton icon="minus" onPress={onZoomOut} />
      </View>
      {onMyLocation ? (
        <ControlButton icon="navigation" onPress={onMyLocation} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 10,
    zIndex: 12,
  },
  zoomGroup: {
    backgroundColor: 'rgba(22, 28, 38, 0.94)',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  btn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
});
