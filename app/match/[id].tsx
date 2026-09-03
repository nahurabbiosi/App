import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Partido, Usuario, Inscripcion } from '@/types/database';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';

type MatchWithCreator = Partido & { creador?: Usuario };
type InscriptionWithUser = Inscripcion & { usuario?: Usuario };

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [partido, setPartido] = useState<MatchWithCreator | null>(null);
  const [inscripciones, setInscripciones] = useState<InscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  async function fetchMatchDetails() {
    setLoading(true);
    try {
      // 1. Obtener detalles del partido y el creador
      const { data: partidoData, error: partidoError } = await supabase
        .from('partidos')
        .select('*, creador:usuarios(*)')
        .eq('id', id as string)
        .single();

      if (partidoError) throw partidoError;
      
      // castear porque el join devuelve un array o un objeto dependiendo de la relacion,
      // pero sabemos que es un solo creador.  El SDK tipa esto un poco flojo en joins.
      const matchWithCreator = {
          ...partidoData,
          creador: (partidoData as any).creador
      } as MatchWithCreator;

      setPartido(matchWithCreator);

      // 2. Obtener inscripciones
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select('*, usuario:usuarios(*)')
        .eq('partido_id', id as string);

      if (inscripcionesError) throw inscripcionesError;

      // castear
      const inscriptionsWithUsers = inscripcionesData.map(i => ({
          ...i,
          usuario: (i as any).usuario
      })) as InscriptionWithUser[];

      setInscripciones(inscriptionsWithUsers);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar el partido');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  const isCreator = user?.id === partido?.creador_id;
  const myInscription = inscripciones.find((i) => i.usuario_id === user?.id);
  const spotsLeft = partido ? partido.jugadores_necesarios - partido.jugadores_confirmados : 0;
  const isFull = spotsLeft <= 0;

  async function handleJoin() {
    if (!user || !partido) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('inscripciones').insert({
        partido_id: partido.id,
        usuario_id: user.id,
        estado: 'pendiente',
      });
      if (error) throw error;
      Alert.alert('¡Anotado!', 'Tu solicitud fue enviada. Esperá la confirmación del creador.');
      fetchMatchDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No te pudiste anotar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmInscription(inscripcionId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('inscripciones')
        .update({ estado: 'confirmado' })
        .eq('id', inscripcionId);
      if (error) throw error;
      fetchMatchDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo confirmar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelInscription() {
    if (!myInscription) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', myInscription.id);
      if (error) throw error;
      Alert.alert('Cancelado', 'Te diste de baja del partido');
      fetchMatchDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cancelar');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !partido) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const fecha = new Date(partido.fecha_hora);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{partido.titulo}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Faltan {spotsLeft} jugadores
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detalles</Text>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.detailText}>
            {format(fecha, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.detailText}>{partido.cancha || 'Ubicación a coordinar'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>⚽</Text>
          <Text style={styles.detailText}>Fútbol {partido.tipo_cancha}</Text>
        </View>
        {partido.notas ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notas:</Text>
            <Text style={styles.notesText}>{partido.notas}</Text>
          </View>
        ) : null}
        <View style={styles.creatorContainer}>
          <Text style={styles.creatorText}>
            Organizado por: <Text style={styles.creatorName}>{partido.creador?.nombre}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Jugadores ({partido.jugadores_confirmados}/{partido.jugadores_necesarios})</Text>
        {inscripciones.length === 0 ? (
          <Text style={styles.emptyText}>Nadie se anotó todavía.</Text>
        ) : (
          inscripciones.map((ins) => (
            <View key={ins.id} style={styles.playerRow}>
              <View>
                <Text style={styles.playerName}>{ins.usuario?.nombre}</Text>
                <Text style={styles.playerStatus}>
                  {ins.estado === 'confirmado' ? '✅ Confirmado' : '⏳ Pendiente'}
                </Text>
              </View>
              {isCreator && ins.estado === 'pendiente' && (
                <Button
                  title="Confirmar"
                  onPress={() => handleConfirmInscription(ins.id)}
                  style={styles.confirmButton}
                  textStyle={styles.confirmButtonText}
                  disabled={actionLoading || isFull}
                />
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        {!isCreator && !myInscription && (
          <Button
            title={isFull ? 'Partido Completo' : 'Anotarme al Partido'}
            onPress={handleJoin}
            loading={actionLoading}
            disabled={isFull}
          />
        )}
        
        {!isCreator && myInscription && (
          <Button
            title="Darme de baja"
            variant="outline"
            onPress={handleCancelInscription}
            loading={actionLoading}
          />
        )}

        {isCreator && (
          <Text style={styles.creatorMessage}>Sos el organizador de este partido.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notesText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  creatorContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  creatorText: {
    color: Colors.textSecondary,
  },
  creatorName: {
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  playerStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  confirmButton: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
  },
  footer: {
    marginTop: 8,
  },
  creatorMessage: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
