import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  type LocationMapHandle,
  isExpoGo,
} from '@/lib/yandex-maps';
import type { OrderListItem } from '@/types/order';
import type { Coordinates } from '@/utils/geo';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { YandexMapWebView } from './yandex-map-webview';

export {
  DRIVER_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  ORDER_FOCUS_ZOOM,
  type LocationMapHandle,
} from '@/lib/yandex-maps';

type LocationMapViewProps = {
  driverLocation: Coordinates | null;
  orders: OrderListItem[];
  style?: StyleProp<ViewStyle>;
  onMapLoaded?: () => void;
  onOrderPress?: (order: OrderListItem) => void;
};

type YamapRef = {
  setCenter: (
    center: { lat: number; lon: number },
    zoom?: number,
    azimuth?: number,
    tilt?: number,
    duration?: number,
    animation?: number,
  ) => void;
  setZoom: (zoom: number, duration?: number, animation?: number) => void;
  getCameraPosition: (callback: (position: {
    zoom: number;
    point: { lat: number; lon: number };
  }) => void) => void;
};

let YamapMap: React.ForwardRefExoticComponent<
  LocationMapViewProps & React.RefAttributes<YamapRef>
> | null = null;
let yamapAnimation: { SMOOTH: number } | null = null;

if (!isExpoGo) {
  try {
    const yamap = require('react-native-yamap-plus');
    yamapAnimation = yamap.Animation;
    YamapMap = require('./yandex-location-map').YandexLocationMap;
  } catch {
    YamapMap = null;
  }
}

export const isYamapNativeAvailable = YamapMap !== null;
export const isWebViewMapAvailable = true;

function createMapHandle(yamapRef: React.RefObject<YamapRef | null>): LocationMapHandle {
  return {
    centerOn(coords, zoom, duration = 0.5) {
      yamapRef.current?.setCenter(
        { lat: coords.latitude, lon: coords.longitude },
        zoom,
        0,
        0,
        duration,
        yamapAnimation?.SMOOTH,
      );
    },
    zoomBy(delta) {
      yamapRef.current?.getCameraPosition((position) => {
        const next = Math.min(
          MAP_MAX_ZOOM,
          Math.max(MAP_MIN_ZOOM, position.zoom + delta),
        );
        yamapRef.current?.setZoom(next, 0.25, yamapAnimation?.SMOOTH);
      });
    },
  };
}

const NativeLocationMap = forwardRef<
  LocationMapHandle,
  LocationMapViewProps
>(function NativeLocationMap(props, ref) {
  const yamapRef = useRef<YamapRef>(null);

  useImperativeHandle(ref, () => createMapHandle(yamapRef), []);

  if (!YamapMap) return null;
  return <YamapMap ref={yamapRef} {...props} />;
});

export const LocationMapView = forwardRef<LocationMapHandle, LocationMapViewProps>(
  function LocationMapView(props, ref) {
    if (isYamapNativeAvailable) {
      return <NativeLocationMap ref={ref} {...props} />;
    }

    return <YandexMapWebView ref={ref} {...props} />;
  },
);

export function centerMapOn(
  mapRef: React.RefObject<LocationMapHandle | null>,
  coords: Coordinates,
  zoom: number,
  duration = 0.5,
) {
  mapRef.current?.centerOn(coords, zoom, duration);
}

export function zoomMapBy(
  mapRef: React.RefObject<LocationMapHandle | null>,
  delta: number,
) {
  mapRef.current?.zoomBy(delta);
}
