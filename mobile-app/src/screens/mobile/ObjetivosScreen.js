import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';

const { width } = Dimensions.get('window');

const OBJETIVO_LABELS = {
  perder_peso: 'Perder Peso',
  ganar_musculo: 'Ganar Músculo',
  mantenimiento: 'Mantenimiento',
  mejorar_resistencia: 'Mejorar Resistencia',
};

const EXPERIENCIA_LABELS = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

const ACTIVIDAD_LABELS = {
  sedentario: 'Sedentario',
  ligero: 'Ligero',
  moderado: 'Moderado',
  activo: 'Activo',
  muy_activo: 'Muy Activo',
};

function OptionPicker({ label, options, value, onChange, theme }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(options).map(([key, display]) => {
          const selected = value === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onChange(key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primary + '22' : theme.card,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? theme.primary : theme.textSecondary }}>
                {display}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DaysPicker({ value, onChange, theme }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
        Días de entrenamiento por semana
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const selected = value === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onChange(day)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primary : theme.card,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? '#fff' : theme.textSecondary }}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ObjetivosScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentObjetivo, setCurrentObjetivo] = useState(null);

  const [objetivoPrincipal, setObjetivoPrincipal] = useState('ganar_musculo');
  const [nivelExperiencia, setNivelExperiencia] = useState('principiante');
  const [nivelActividad, setNivelActividad] = useState('moderado');
  const [diasSemana, setDiasSemana] = useState(3);
  const [pesoObjetivo, setPesoObjetivo] = useState('');
  const [limitaciones, setLimitaciones] = useState('');

  useEffect(() => {
    loadObjetivo();
  }, []);

  const loadObjetivo = async () => {
    try {
      const response = await api.get('/objectives/active');
      if (response.data) {
        const obj = response.data;
        setCurrentObjetivo(obj);
        setObjetivoPrincipal(obj.objetivoPrincipal || 'ganar_musculo');
        setNivelExperiencia(obj.nivelExperiencia || 'principiante');
        setNivelActividad(obj.nivelActividad || 'moderado');
        setDiasSemana(obj.diasSemana || 3);
        setPesoObjetivo(obj.pesoObjetivo ? String(obj.pesoObjetivo) : '');
        setLimitaciones(obj.limitaciones || '');
      }
    } catch (error) {
      console.error('Error cargando objetivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!objetivoPrincipal || !nivelExperiencia || !nivelActividad) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      await api.post('/objectives', {
        objetivoPrincipal,
        nivelExperiencia,
        nivelActividad,
        diasSemana,
        pesoObjetivo: pesoObjetivo || null,
        limitaciones: limitaciones || null,
      });
      Alert.alert(
        '¡Guardado!',
        'Tus objetivos han sido actualizados. ¿Querés regenerar tu rutina con los nuevos objetivos?',
        [
          { text: 'Ahora no', style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: 'Regenerar rutina',
            onPress: () => {
              navigation.goBack();
              // Pequeño delay para que la navegación termine antes de abrir el modal
              setTimeout(() => navigation.navigate('Rutinas', { abrirModal: true }), 300);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el objetivo. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Objetivo actual */}
        {currentObjetivo && (
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '22', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Ionicons name="flag" size={18} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Objetivo actual</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ backgroundColor: theme.primary + '22', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 }}>
                <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>
                  {OBJETIVO_LABELS[currentObjetivo.objetivoPrincipal] || currentObjetivo.objetivoPrincipal}
                </Text>
              </View>
              <View style={{ backgroundColor: theme.surface, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>
                  {EXPERIENCIA_LABELS[currentObjetivo.nivelExperiencia] || currentObjetivo.nivelExperiencia}
                </Text>
              </View>
              <View style={{ backgroundColor: theme.surface, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>
                  {currentObjetivo.diasSemana} días/semana
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 20 }}>
          {currentObjetivo ? 'Actualizar objetivos' : 'Definir objetivos'}
        </Text>

        {/* Form */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border }}>
          <OptionPicker
            label="Objetivo principal *"
            options={OBJETIVO_LABELS}
            value={objetivoPrincipal}
            onChange={setObjetivoPrincipal}
            theme={theme}
          />

          <OptionPicker
            label="Nivel de experiencia *"
            options={EXPERIENCIA_LABELS}
            value={nivelExperiencia}
            onChange={setNivelExperiencia}
            theme={theme}
          />

          <OptionPicker
            label="Nivel de actividad *"
            options={ACTIVIDAD_LABELS}
            value={nivelActividad}
            onChange={setNivelActividad}
            theme={theme}
          />

          <DaysPicker value={diasSemana} onChange={setDiasSemana} theme={theme} />

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
              Peso objetivo (kg) — opcional
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: theme.text,
              }}
              placeholder="Ej: 75"
              placeholderTextColor={theme.textMuted}
              value={pesoObjetivo}
              onChangeText={setPesoObjetivo}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
              Limitaciones físicas — opcional
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: theme.text,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Ej: Lesión de rodilla, dolor de espalda..."
              placeholderTextColor={theme.textMuted}
              value={limitaciones}
              onChangeText={setLimitaciones}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 32,
            opacity: saving ? 0.7 : 1,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
              {currentObjetivo ? 'Actualizar objetivo' : 'Guardar objetivo'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
