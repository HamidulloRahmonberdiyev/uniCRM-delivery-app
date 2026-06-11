import {
  DRIVER_PIN_DATA_URI,
  ORDER_PIN_DATA_URI,
} from '@/lib/order-marker-icon';
import { NATIVE_MAP_PROPS } from '@/lib/yandex-map-theme';
import type { OrderListItem } from '@/types/order';
import type { Coordinates } from '@/utils/geo';
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Yamap, { Marker, type YamapRef } from 'react-native-yamap-plus';

const FALLBACK_CENTER = { lat: 41.3111, lon: 69.2797 };
const DRIVER_ZOOM = 12;

const DRIVER_MARKER = { uri: DRIVER_PIN_DATA_URI };
const ORDER_MARKER = { uri: ORDER_PIN_DATA_URI };

export type YandexLocationMapProps = {
  driverLocation: Coordinates | null;
  orders: OrderListItem[];
  style?: StyleProp<ViewStyle>;
  onMapLoaded?: () => void;
  onOrderPress?: (order: OrderListItem) => void;
};

export const YandexLocationMap = forwardRef<YamapRef, YandexLocationMapProps>(
  function YandexLocationMap(
    { driverLocation, orders, style, onMapLoaded, onOrderPress },
    ref,
  ) {
    const initialRegion = useMemo(() => {
      if (driverLocation) {
        return {
          lat: driverLocation.latitude,
          lon: driverLocation.longitude,
          zoom: DRIVER_ZOOM,
        };
      }
      return { ...FALLBACK_CENTER, zoom: DRIVER_ZOOM };
    }, [driverLocation?.latitude, driverLocation?.longitude]);

    return (
      <Yamap
        ref={ref}
        style={[StyleSheet.absoluteFillObject, style]}
        initialRegion={initialRegion}
        mapType={NATIVE_MAP_PROPS.mapType}
        nightMode={NATIVE_MAP_PROPS.nightMode}
        tiltGesturesDisabled={NATIVE_MAP_PROPS.tiltGesturesDisabled}
        rotateGesturesDisabled={NATIVE_MAP_PROPS.rotateGesturesDisabled}
        logoPosition={NATIVE_MAP_PROPS.logoPosition}
        logoPadding={NATIVE_MAP_PROPS.logoPadding}
        showUserPosition={false}
        scrollGesturesDisabled={false}
        zoomGesturesDisabled={false}
        onMapLoaded={onMapLoaded}
      >
        {driverLocation ? (
          <Marker
            point={{
              lat: driverLocation.latitude,
              lon: driverLocation.longitude,
            }}
            source={DRIVER_MARKER}
            scale={1.15}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
          />
        ) : null}
        {orders.map((order) => (
          <Marker
            key={order.id}
            point={{
              lat: order.latitude!,
              lon: order.longitude!,
            }}
            source={ORDER_MARKER}
            scale={1.05}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={500}
            handled
            onPress={() => onOrderPress?.(order)}
          />
        ))}
      </Yamap>
    );
  },
);
