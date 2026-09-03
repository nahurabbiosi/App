import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { Partido } from '@/types/database';

type MatchCardProps = {
  partido: Partido;
  onPress: () => void;
};

export function MatchCard({ partido, onPress }: MatchCardProps) {
  const fecha = new Date(partido.fecha_hora);
  const spotsLeft = partido.jugadores_necesarios - partido.jugadores_confirmados;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {partido.titulo}
        </Text>
        <View style={[styles.badge, spotsLeft <= 2 && styles.badgeUrgent]}>
          <Text
            style={[styles.badgeText, spotsLeft <= 2 && styles.badgeTextUrgent]}
          >
            {spotsLeft > 0 ? `Faltan ${spotsLeft}` : 'Completo'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {partido.cancha ? (
          <View style={styles.row}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.detailText}>{partido.cancha}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.detailText}>
            {format(fecha, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.icon}>⚽</Text>
          <Text style={styles.detailText}>
            Fútbol {partido.tipo_cancha} ·{' '}
            {partido.jugadores_confirmados}/{partido.jugadores_necesarios}{' '}
            jugadores
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeUrgent: {
    backgroundColor: Colors.warning + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  badgeTextUrgent: {
    color: Colors.warning,
  },
  details: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
});
