import {
  DRIVER_PIN_DATA_URI,
  DRIVER_PIN_DISPLAY,
  ORDER_PIN_DATA_URI,
  ORDER_PIN_DISPLAY,
} from '@/lib/order-marker-icon';
import { MAP_BG, WEB_MAP_TYPE } from '@/lib/yandex-map-theme';
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  YANDEX_MAPS_API_KEY,
  type LocationMapHandle,
} from '@/lib/yandex-maps';
import type { OrderListItem } from '@/types/order';
import type { Coordinates } from '@/utils/geo';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

const FALLBACK = { lat: 41.3111, lon: 69.2797 };

type MapPayload = {
  driver: { lat: number; lon: number } | null;
  orders: { id: string; lat: number; lon: number; title: string }[];
};

function buildMapHtml(apiKey: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${MAP_BG}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = null;
    var driverMark = null;
    var orderMarks = {};
    var didAutoFit = false;
    var pendingPayload = null;

    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }

    var driverPinHref = ${JSON.stringify(DRIVER_PIN_DATA_URI)};
    var orderPinHref = ${JSON.stringify(ORDER_PIN_DATA_URI)};

    var orderW = ${ORDER_PIN_DISPLAY.width};
    var orderH = ${ORDER_PIN_DISPLAY.height};
    var driverW = ${DRIVER_PIN_DISPLAY.width};
    var driverH = ${DRIVER_PIN_DISPLAY.height};

    function driverIconOptions() {
      return {
        iconLayout: 'default#image',
        iconImageHref: driverPinHref,
        iconImageSize: [driverW, driverH],
        iconImageOffset: [-driverW / 2, -driverH / 2],
        zIndex: 1000,
      };
    }

    function orderIconOptions() {
      return {
        iconLayout: 'default#image',
        iconImageHref: orderPinHref,
        iconImageSize: [orderW, orderH],
        iconImageOffset: [-orderW / 2, -orderH],
        zIndex: 500,
      };
    }

    function clearOrders() {
      Object.keys(orderMarks).forEach(function(id) {
        map.geoObjects.remove(orderMarks[id]);
        delete orderMarks[id];
      });
    }

    function fitToData(data) {
      var points = [];
      if (data.driver) points.push([data.driver.lat, data.driver.lon]);
      (data.orders || []).forEach(function(o) { points.push([o.lat, o.lon]); });
      if (!map || points.length === 0) return;

      if (points.length === 1) {
        map.setCenter(points[0], 15, { duration: 300 });
        return;
      }

      var bounds = ymaps.util.bounds.fromPoints(points);
      map.setBounds(bounds, {
        checkZoomRange: true,
        zoomMargin: [60, 40, 100, 40],
        duration: 300,
      });
    }

    function applyPayload(data, autoFit) {
      if (!map) {
        pendingPayload = data;
        return;
      }

      if (driverMark) {
        map.geoObjects.remove(driverMark);
        driverMark = null;
      }
      clearOrders();

      if (data.driver) {
        driverMark = new ymaps.Placemark(
          [data.driver.lat, data.driver.lon],
          { hintContent: 'Sizning joylashuvingiz', balloonContent: 'Yetkazuvchi' },
          driverIconOptions()
        );
        map.geoObjects.add(driverMark);
      }

      (data.orders || []).forEach(function(o) {
        var mark = new ymaps.Placemark(
          [o.lat, o.lon],
          { hintContent: o.title },
          orderIconOptions()
        );
        mark.events.add('click', function(e) {
          e.stopPropagation();
          post(JSON.stringify({ type: 'orderPress', orderId: o.id }));
        });
        orderMarks[o.id] = mark;
        map.geoObjects.add(mark);
      });

      if (autoFit && !didAutoFit && (data.driver || (data.orders && data.orders.length))) {
        fitToData(data);
        didAutoFit = true;
      }
    }

    window.mapSetCenter = function(lat, lon, zoom) {
      if (!map) return;
      map.setCenter([lat, lon], zoom, { duration: 300 });
    };

    window.mapZoomBy = function(delta) {
      if (!map) return;
      var next = Math.min(${MAP_MAX_ZOOM}, Math.max(${MAP_MIN_ZOOM}, map.getZoom() + delta));
      map.setZoom(next, { duration: 220 });
    };

    function handleRNMessage(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'update') applyPayload(msg.payload, true);
        if (msg.type === 'center') window.mapSetCenter(msg.lat, msg.lon, msg.zoom);
        if (msg.type === 'zoomBy') window.mapZoomBy(msg.delta);
      } catch (e) {}
    }

    document.addEventListener('message', handleRNMessage);
    window.addEventListener('message', handleRNMessage);

    ymaps.ready(function() {
      var preferredType = '${WEB_MAP_TYPE}';
      var mapType = ymaps.mapType.storage.get(preferredType)
        ? preferredType
        : 'yandex#map';

      map = new ymaps.Map('map', {
        center: [${FALLBACK.lat}, ${FALLBACK.lon}],
        zoom: 12,
        type: mapType,
        controls: [],
      }, { suppressMapOpenBlock: true });

      if (pendingPayload) {
        applyPayload(pendingPayload, true);
        pendingPayload = null;
      }

      post('ready');
    });
  </script>
</body>
</html>`;
}

type Props = {
  driverLocation: Coordinates | null;
  orders: OrderListItem[];
  style?: StyleProp<ViewStyle>;
  onMapLoaded?: () => void;
  onOrderPress?: (order: OrderListItem) => void;
};

export const YandexMapWebView = forwardRef<LocationMapHandle, Props>(
  function YandexMapWebView(
    { driverLocation, orders, style, onMapLoaded, onOrderPress },
    ref,
  ) {
    const webRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);

    const html = useMemo(
      () => buildMapHtml(YANDEX_MAPS_API_KEY),
      [],
    );

    const payload = useMemo<MapPayload>(
      () => ({
        driver: driverLocation
          ? { lat: driverLocation.latitude, lon: driverLocation.longitude }
          : null,
        orders: orders
          .filter((o) => o.latitude != null && o.longitude != null)
          .map((o) => ({
            id: o.id,
            lat: o.latitude!,
            lon: o.longitude!,
            title: o.customerName,
          })),
      }),
      [driverLocation, orders],
    );

    const postToMap = useCallback(
      (message: Record<string, unknown>) => {
        webRef.current?.postMessage(JSON.stringify(message));
      },
      [],
    );

    useEffect(() => {
      if (!ready) return;
      postToMap({ type: 'update', payload });
    }, [payload, ready, postToMap]);

    useImperativeHandle(
      ref,
      () => ({
        centerOn(coords, zoom) {
          postToMap({
            type: 'center',
            lat: coords.latitude,
            lon: coords.longitude,
            zoom,
          });
        },
        zoomBy(delta) {
          postToMap({ type: 'zoomBy', delta });
        },
      }),
      [postToMap],
    );

    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        const raw = event.nativeEvent.data;
        if (raw === 'ready') {
          setReady(true);
          onMapLoaded?.();
          return;
        }

        try {
          const msg = JSON.parse(raw) as { type?: string; orderId?: string };
          if (msg.type === 'orderPress' && msg.orderId && onOrderPress) {
            const order = orders.find((o) => o.id === msg.orderId);
            if (order) onOrderPress(order);
          }
        } catch {
          // not a JSON message
        }
      },
      [onMapLoaded, onOrderPress, orders],
    );

    return (
      <WebView
        ref={webRef}
        style={[StyleSheet.absoluteFillObject, style]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        androidLayerType="hardware"
      />
    );
  },
);
