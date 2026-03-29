import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api/api.service';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PhysicalProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await api.get('/physical-profiles/latest').catch(() => null);
        if (res?.data) {
          const d = res.data;
          setFormData({
            altura: d.altura?.toString() || '',
            peso: d.peso?.toString() || '',
            porcentajeGrasa: d.porcentajeGrasa?.toString() || '',
            masaMuscular: d.masaMuscular?.toString() || '',
            circunferenciaBrazo: d.circunferenciaBrazo?.toString() || '',
            circunferenciaPecho: d.circunferenciaPecho?.toString() || '',
            circunferenciaCintura: d.circunferenciaCintura?.toString() || '',
            circunferenciaCadera: d.circunferenciaCadera?.toString() || '',
            circunferenciaMuslo: d.circunferenciaMuslo?.toString() || '',
            notas: d.notas || '',
          });
        }
      } finally {
        setLoadingData(false);
      }
    };
    loadExisting();
  }, []);

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

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Perfil Físico</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Actualizá tus mediciones actuales</Text>
          </View>

          {/* Datos básicos */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Datos básicos *</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Altura (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 175"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.altura}
                onChangeText={(value) => handleInputChange('altura', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Peso (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 75"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.peso}
                onChangeText={(value) => handleInputChange('peso', value)}
              />
            </View>
          </View>

          {/* Composición corporal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Composición corporal (opcional)</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Porcentaje de grasa (%)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 15"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.porcentajeGrasa}
                onChangeText={(value) => handleInputChange('porcentajeGrasa', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Masa muscular (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 60"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.masaMuscular}
                onChangeText={(value) => handleInputChange('masaMuscular', value)}
              />
            </View>
          </View>

          {/* Circunferencias */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Circunferencias (cm, opcional)</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Brazo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 35"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.circunferenciaBrazo}
                onChangeText={(value) => handleInputChange('circunferenciaBrazo', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Pecho</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 100"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.circunferenciaPecho}
                onChangeText={(value) => handleInputChange('circunferenciaPecho', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Cintura</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 85"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.circunferenciaCintura}
                onChangeText={(value) => handleInputChange('circunferenciaCintura', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Cadera</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 95"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.circunferenciaCadera}
                onChangeText={(value) => handleInputChange('circunferenciaCadera', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Muslo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 55"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formData.circunferenciaMuslo}
                onChangeText={(value) => handleInputChange('circunferenciaMuslo', value)}
              />
            </View>
          </View>

          {/* Notas */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notas adicionales (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Observaciones, objetivos, etc."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              value={formData.notas}
              onChangeText={(value) => handleInputChange('notas', value)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.submitButtonDisabled]}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
  },
  section: {
    paddingHorizontal: width * 0.06,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
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
