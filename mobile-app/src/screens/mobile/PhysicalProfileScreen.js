import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api/api.service';

export default function PhysicalProfileScreen({ navigation }) {
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [masaMuscular, setMasaMuscular] = useState('');
  const [circunferenciaBrazo, setCircunferenciaBrazo] = useState('');
  const [circunferenciaPecho, setCircunferenciaPecho] = useState('');
  const [circunferenciaCintura, setCircunferenciaCintura] = useState('');
  const [circunferenciaCadera, setCircunferenciaCadera] = useState('');
  const [circunferenciaMuslo, setCircunferenciaMuslo] = useState('');
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!altura || !peso) {
      Alert.alert('Error', 'Altura y peso son obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        altura: parseFloat(altura),
        peso: parseFloat(peso),
      };

      if (porcentajeGrasa) data.porcentajeGrasa = parseFloat(porcentajeGrasa);
      if (masaMuscular) data.masaMuscular = parseFloat(masaMuscular);
      if (circunferenciaBrazo) data.circunferenciaBrazo = parseFloat(circunferenciaBrazo);
      if (circunferenciaPecho) data.circunferenciaPecho = parseFloat(circunferenciaPecho);
      if (circunferenciaCintura) data.circunferenciaCintura = parseFloat(circunferenciaCintura);
      if (circunferenciaCadera) data.circunferenciaCadera = parseFloat(circunferenciaCadera);
      if (circunferenciaMuslo) data.circunferenciaMuslo = parseFloat(circunferenciaMuslo);
      if (notas) data.notas = notas;

      const response = await api.post('/physical-profiles', data);

      Alert.alert('Éxito', 'Perfil físico guardado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al guardar perfil físico');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil Físico</Text>
        <Text style={styles.subtitle}>Registra tus mediciones actuales</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Datos básicos *</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 175"
            placeholderTextColor="#64748b"
            value={altura}
            onChangeText={setAltura}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 75"
            placeholderTextColor="#64748b"
            value={peso}
            onChangeText={setPeso}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.sectionTitle}>Composición corporal (opcional)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Porcentaje de grasa (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 15"
            placeholderTextColor="#64748b"
            value={porcentajeGrasa}
            onChangeText={setPorcentajeGrasa}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Masa muscular (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 60"
            placeholderTextColor="#64748b"
            value={masaMuscular}
            onChangeText={setMasaMuscular}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.sectionTitle}>Circunferencias (cm, opcional)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brazo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 35"
            placeholderTextColor="#64748b"
            value={circunferenciaBrazo}
            onChangeText={setCircunferenciaBrazo}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pecho</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 95"
            placeholderTextColor="#64748b"
            value={circunferenciaPecho}
            onChangeText={setCircunferenciaPecho}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cintura</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 80"
            placeholderTextColor="#64748b"
            value={circunferenciaCintura}
            onChangeText={setCircunferenciaCintura}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cadera</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 95"
            placeholderTextColor="#64748b"
            value={circunferenciaCadera}
            onChangeText={setCircunferenciaCadera}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Muslo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 55"
            placeholderTextColor="#64748b"
            value={circunferenciaMuslo}
            onChangeText={setCircunferenciaMuslo}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Añade cualquier observación..."
            placeholderTextColor="#64748b"
            value={notas}
            onChangeText={setNotas}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Guardando...' : 'Guardar Perfil'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});