import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';

export default function CreateMatchScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [cancha, setCancha] = useState('');
  const [fecha, setFecha] = useState(''); // Simplificado para MVP, idealmente usar DateTimePicker
  const [hora, setHora] = useState('');
  const [jugadores, setJugadores] = useState('');
  const [tipoCancha, setTipoCancha] = useState('5');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!titulo || !fecha || !hora || !jugadores) {
      Alert.alert('Error', 'Completá los campos obligatorios');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      // Parsear fecha y hora string (ej: "2024-05-20" y "18:30") a ISO
      // NOTA: En un caso real usar librería o picker, acá es simplificado
      const fechaHoraIso = new Date(`${fecha}T${hora}:00`).toISOString();

      const { data, error } = await supabase
        .from('partidos')
        .insert({
          creador_id: user.id,
          titulo: titulo.trim(),
          cancha: cancha.trim() || null,
          fecha_hora: fechaHoraIso,
          jugadores_necesarios: parseInt(jugadores, 10),
          tipo_cancha: tipoCancha,
          notas: notas.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Éxito', 'Partido creado correctamente');
      router.replace(`/match/${data.id}`);
    } catch (error: any) {
      Alert.alert('Error al crear', error.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Organizar Partido</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Fútbol 5 en Palermo"
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Lugar / Cancha</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Complejo El Predio"
            value={cancha}
            onChangeText={setCancha}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Fecha (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-12-01"
              value={fecha}
              onChangeText={setFecha}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Hora (HH:MM) *</Text>
            <TextInput
              style={styles.input}
              placeholder="19:00"
              value={hora}
              onChangeText={setHora}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Jugadores que faltan *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 3"
              keyboardType="number-pad"
              value={jugadores}
              onChangeText={setJugadores}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Fútbol</Text>
            <TextInput
              style={styles.input}
              placeholder="5, 7 o 11"
              keyboardType="number-pad"
              value={tipoCancha}
              onChangeText={setTipoCancha}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nivel medio, llevamos pelota..."
            multiline
            numberOfLines={3}
            value={notas}
            onChangeText={setNotas}
          />
        </View>

        <Button
          title="Crear Partido"
          onPress={handleCreate}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 10,
  },
});
