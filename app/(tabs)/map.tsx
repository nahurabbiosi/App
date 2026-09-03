import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import { Partido } from '@/types/database';
import { Colors } from '@/constants/colors';

export default function MapScreen() {
  const {
    location,
    loading: locationLoading,
    error: locationError,
  } = useLocation();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPartidos() {
      const { data } = await supabase
        .from('partidos')
        .select('*')
        .eq('estado', 'abierto')
        .gte('fecha_hora', new Date().toISOString())
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (data) setPartidos(data as Partido[]);
    }
    fetchPartidos();
  }, []);

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>📍</Text>
        <Text style={styles.errorTitle}>Sin acceso a ubicación</Text>
        <Text style={styles.errorText}>{locationError}</Text>
      </View>
    );
  }

  // TODO: Reemplazar con MapView cuando react-native-maps esté configurado
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapTitle}>Mapa de partidos</Text>
        {location && (
          <Text style={styles.mapCoords}>
            Tu ubicación: {location.latitude.toFixed(4)},{' '}
            {location.longitude.toFixed(4)}
          </Text>
        )}
        <Text style={styles.mapInfo}>
          {partidos.length} partido{partidos.length !== 1 ? 's' : ''} con
          ubicación
        </Text>
        <Text style={styles.mapNote}>
          El mapa interactivo se habilitará con react-native-maps
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  mapEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  mapCoords: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  mapInfo: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  mapNote: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
