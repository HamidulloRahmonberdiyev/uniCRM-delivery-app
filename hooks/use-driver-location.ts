import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import type { Coordinates } from '@/utils/geo';

export function useDriverLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);

  const refreshLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      return coords;
    } catch {
      return null;
    }
  }, []);

  return { location, refreshLocation };
}
