import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Partido } from '@/types/database';
import { MatchCard } from '@/components/MatchCard';
import { Colors } from '@/constants/colors';

export default function PartidosScreen() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPartidos = useCallback(async () => {
    const { data, error } = await supabase
      .from('partidos')
      .select('*')
      .eq('estado', 'abierto')
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true });

    if (!error && data) {
      setPartidos(data as Partido[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPartidos();
  }, [fetchPartidos]);

  function onRefresh() {
    setRefreshing(true);
    fetchPartidos();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando partidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={partidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            partido={item}
            onPress={() => router.push(`/match/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={
          partidos.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏟️</Text>
            <Text style={styles.emptyTitle}>No hay partidos abiertos</Text>
            <Text style={styles.emptyText}>
              ¡Sé el primero en crear uno!
            </Text>
          </View>
        }
      />
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
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
