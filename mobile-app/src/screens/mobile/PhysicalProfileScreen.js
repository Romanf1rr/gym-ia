import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api/api.service';

const { width } = Dimensions.get('window');

export default function PhysicalProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    altura: '',
    peso: '',
    porcentajeGrasa: '',
    masaMuscular: '',
    circunferenciaBrazo: '',
    circunferenciaPecho: '',
    circunferenciaCintura: '',
    circunferenciaCadera: '',
    circunferenciaMuslo: '',
    notas: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.altura || !formData.peso) {
      Alert.alert('Error', 'Altura y peso son obligatorios');
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        altura: parseFloat(formData.altura),
        peso: parseFloat(formData.peso),
        porcentajeGrasa: formData.porcentajeGrasa ? parseFloat(formData.porcentajeGrasa) : null,
        masaMuscular: formData.masaMuscular ? parseFloat(formData.masaMuscular) : null,
        brazo: formData.circunferenciaBrazo ? parseFloat(formData.circunferenciaBrazo) : null,
        pecho: formData.circunferenciaPecho ? parseFloat(formData.circunferenciaPecho) : null,
        cintura: formData.circunferenciaCintura ? parseFloat(formData.circunferenciaCintura) : null,
        cadera: formData.circunferenciaCadera ? parseFloat(formData.circunferenciaCadera) : null,
        muslo: formData.circunferenciaMuslo ? parseFloat(formData.circunferenciaMuslo) : null,
        notas: formData.notas || null,
      };

      await api.post('/physical-profiles', dataToSend);

      Alert.alert(
        'Éxito',
        'Perfil físico guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil físico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Perfil Físico</Text>
            <Text style={styles.subtitle}>Registra tus mediciones actuales</Text>
          </View>

          {/* Datos básicos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos básicos *</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 175"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.altura}
                onChangeText={(value) => handleInputChange('altura', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 75"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.peso}
                onChangeText={(value) => handleInputChange('peso', value)}
              />
            </View>
          </View>

          {/* Composición corporal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Composición corporal (opcional)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Porcentaje de grasa (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 15"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.porcentajeGrasa}
                onChangeText={(value) => handleInputChange('porcentajeGrasa', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Masa muscular (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 60"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.masaMuscular}
                onChangeText={(value) => handleInputChange('masaMuscular', value)}
              />
            </View>
          </View>

          {/* Circunferencias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Circunferencias (cm, opcional)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brazo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 35"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.circunferenciaBrazo}
                onChangeText={(value) => handleInputChange('circunferenciaBrazo', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pecho</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 100"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.circunferenciaPecho}
                onChangeText={(value) => handleInputChange('circunferenciaPecho', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cintura</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 85"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.circunferenciaCintura}
                onChangeText={(value) => handleInputChange('circunferenciaCintura', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cadera</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 95"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.circunferenciaCadera}
                onChangeText={(value) => handleInputChange('circunferenciaCadera', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Muslo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 55"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.circunferenciaMuslo}
                onChangeText={(value) => handleInputChange('circunferenciaMuslo', value)}
              />
            </View>
          </View>

          {/* Notas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas adicionales (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observaciones, objetivos, etc."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={formData.notas}
              onChangeText={(value) => handleInputChange('notas', value)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: width * 0.06,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
    color: '#94a3b8',
  },
  section: {
    paddingHorizontal: width * 0.06,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '500',
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
  submitButton: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: width * 0.06,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});