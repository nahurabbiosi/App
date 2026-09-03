import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type LocationData = {
  latitude: number;
  longitude: number;
};

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        setError('No se pudo obtener la ubicación');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, error, loading };
}
