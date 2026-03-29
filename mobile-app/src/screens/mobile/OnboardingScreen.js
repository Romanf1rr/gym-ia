import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Animated, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api/api.service';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;

// ─── Opciones de configuración ────────────────────────────────────────────────
const OBJETIVOS = [
  { key: 'perder_peso', label: 'Perder peso', icon: 'trending-down-outline', color: '#ef4444' },
  { key: 'ganar_musculo', label: 'Ganar músculo', icon: 'barbell-outline', color: '#8b5cf6' },
  { key: 'mantener_peso', label: 'Mantenerme', icon: 'checkmark-circle-outline', color: '#22c55e' },
  { key: 'mejorar_resistencia', label: 'Mejorar resistencia', icon: 'pulse-outline', color: '#f59e0b' },
  { key: 'mejorar_salud', label: 'Mejorar salud general', icon: 'heart-outline', color: '#ec4899' },
  { key: 'definicion', label: 'Definición / tonificación', icon: 'body-outline', color: '#06b6d4' },
];

const ACTIVIDAD = [
  { key: 'sedentario', label: 'Sedentario', desc: 'Poco o nada de ejercicio' },
  { key: 'ligero', label: 'Ligero', desc: '1-3 días/semana' },
  { key: 'moderado', label: 'Moderado', desc: '3-5 días/semana' },
  { key: 'activo', label: 'Activo', desc: '6-7 días/semana' },
  { key: 'muy_activo', label: 'Muy activo', desc: 'Doble turno / trabajo físico' },
];

const EXPERIENCIA = [
  { key: 'principiante', label: 'Principiante', desc: 'Menos de 1 año entrenando' },
  { key: 'intermedio', label: 'Intermedio', desc: '1-3 años entrenando' },
  { key: 'avanzado', label: 'Avanzado', desc: 'Más de 3 años entrenando' },
];

const DIAS = [3, 4, 5, 6];

// ─── Componente chips de selección ────────────────────────────────────────────
function OptionChip({ item, selected, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.key)}
      style={{
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 12, marginBottom: 10,
        backgroundColor: selected ? theme.primary + '20' : theme.card,
        borderWidth: 1.5,
        borderColor: selected ? theme.primary : theme.border,
      }}
    >
      {item.icon && (
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: (item.color || theme.primary) + '20',
          justifyContent: 'center', alignItems: 'center', marginRight: 12
        }}>
          <Ionicons name={item.icon} size={18} color={item.color || theme.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{item.label}</Text>
        {item.desc && <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{item.desc}</Text>}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
    </TouchableOpacity>
  );
}

// ─── Input de campo ────────────────────────────────────────────────────────────
function FieldInput({ label, value, onChangeText, keyboardType = 'default', suffix, theme }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.card, borderRadius: 12,
        borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14,
      }}>
        <TextInput
          style={{ flex: 1, paddingVertical: 13, fontSize: 16, color: theme.text }}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={theme.textMuted}
          placeholder="—"
        />
        {suffix && <Text style={{ fontSize: 14, color: theme.textMuted, marginLeft: 4 }}>{suffix}</Text>}
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);

  // Datos objetivo
  const [objetivo, setObjetivo] = useState('');
  const [actividad, setActividad] = useState('');
  const [diasSemana, setDiasSemana] = useState(4);
  const [experiencia, setExperiencia] = useState('');
  const [pesoObjetivo, setPesoObjetivo] = useState('');

  // Datos físicos
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');

  // Estado global
  const [saving, setSaving] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animación de progreso
  const progressAnim = useRef(new Animated.Value(1)).current;

  const animateToStep = (nextStep) => {
    Animated.timing(progressAnim, {
      toValue: nextStep,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setStep(nextStep);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [1, TOTAL_STEPS],
    outputRange: ['0%', '100%'],
  });

  // ── Guardar objetivo ─────────────────────────────────────────────────────────
  const guardarObjetivo = async () => {
    if (!objetivo || !actividad || !experiencia) {
      setErrorMsg('Completá todos los campos antes de continuar.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      await api.post('/objectives', {
        objetivoPrincipal: objetivo,
        nivelActividad: actividad,
        diasSemana,
        nivelExperiencia: experiencia,
        pesoObjetivo: pesoObjetivo ? parseFloat(pesoObjetivo) : null,
        limitaciones: '',
        preferencias: '',
      });
      animateToStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar objetivos.');
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar perfil físico ────────────────────────────────────────────────────
  const guardarPerfil = async () => {
    if (!altura || !peso) {
      setErrorMsg('Ingresá tu altura y peso para continuar.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      await api.post('/physical-profiles', {
        altura: parseFloat(altura),
        peso: parseFloat(peso),
      });
      animateToStep(4);
      generarRutina();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar perfil físico.');
      setSaving(false);
    }
  };

  // ── Generar rutina con IA ────────────────────────────────────────────────────
  const generarRutina = async () => {
    setGenerando(true);
    try {
      await api.post('/routines/generate');
      animateToStep(5);
    } catch (err) {
      // Si ya tiene rutina o hay error, igual pasamos al último paso
      animateToStep(5);
    } finally {
      setGenerando(false);
      setSaving(false);
    }
  };

  // ── Finalizar onboarding ─────────────────────────────────────────────────────
  const finalizar = async () => {
    try {
      await api.post('/users/me/complete-onboarding');
      updateUser({ onboardingCompleted: true });
    } catch {
      updateUser({ onboardingCompleted: true });
    }
  };

  // ─── Render steps ────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24
      }}>
        <Ionicons name="barbell-outline" size={44} color={theme.primary} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 12 }}>
        ¡Hola, {user?.nombre}!
      </Text>
      <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 8 }}>
        Soy <Text style={{ color: theme.primary, fontWeight: '700' }}>Chris</Text>, tu coach personal de Gym IA.
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
        En 3 pasos rápidos voy a crear tu plan de entrenamiento personalizado con inteligencia artificial.
      </Text>
      <View style={{ width: '100%', gap: 10 }}>
        {[
          { icon: 'flag-outline', text: 'Definir tus objetivos fitness' },
          { icon: 'body-outline', text: 'Registrar tu perfil físico' },
          { icon: 'sparkles-outline', text: 'Generar tu rutina con IA' },
        ].map((item) => (
          <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={item.icon} size={18} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 14, color: theme.text }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 6 }}>Tu objetivo</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 20 }}>¿Qué querés lograr con tu entrenamiento?</Text>

      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.8 }}>
        Objetivo principal
      </Text>
      {OBJETIVOS.map((o) => (
        <OptionChip key={o.key} item={o} selected={objetivo === o.key} onPress={setObjetivo} theme={theme} />
      ))}

      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.8 }}>
        Nivel de actividad
      </Text>
      {ACTIVIDAD.map((a) => (
        <OptionChip key={a.key} item={a} selected={actividad === a.key} onPress={setActividad} theme={theme} />
      ))}

      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.8 }}>
        Experiencia
      </Text>
      {EXPERIENCIA.map((e) => (
        <OptionChip key={e.key} item={e} selected={experiencia === e.key} onPress={setExperiencia} theme={theme} />
      ))}

      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.8 }}>
        Días de entrenamiento por semana
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {DIAS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDiasSemana(d)}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
              backgroundColor: diasSemana === d ? theme.primary + '20' : theme.card,
              borderWidth: 1.5, borderColor: diasSemana === d ? theme.primary : theme.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: diasSemana === d ? theme.primary : theme.text }}>{d}</Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>días</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FieldInput
        label="Peso objetivo (opcional)"
        value={pesoObjetivo}
        onChangeText={setPesoObjetivo}
        keyboardType="decimal-pad"
        suffix="kg"
        theme={theme}
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 6 }}>Tu perfil físico</Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24, lineHeight: 20 }}>
          Estos datos permiten que la IA calcule tu rutina y plan nutricional de forma precisa.
        </Text>

        <FieldInput label="Altura" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" suffix="cm" theme={theme} />
        <FieldInput label="Peso actual" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" suffix="kg" theme={theme} />

        <View style={{
          flexDirection: 'row', backgroundColor: theme.primary + '10',
          padding: 14, borderRadius: 12, marginTop: 8, gap: 10, alignItems: 'flex-start'
        }}>
          <Ionicons name="information-circle-outline" size={18} color={theme.primary} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
            Podés agregar más medidas (cintura, brazos, etc.) desde tu perfil físico en cualquier momento.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 28
      }}>
        {generando
          ? <ActivityIndicator size="large" color={theme.primary} />
          : <Ionicons name="sparkles" size={40} color={theme.primary} />
        }
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 12 }}>
        {generando ? 'Generando tu rutina...' : 'Rutina creada'}
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 }}>
        {generando
          ? 'Chris está analizando tu perfil y diseñando tu plan de entrenamiento personalizado con IA.'
          : '¡Tu rutina está lista! Chris la personalizó especialmente para vos.'}
      </Text>
      {generando && (
        <View style={{ marginTop: 32, gap: 8 }}>
          {['Analizando objetivos...', 'Calculando volumen óptimo...', 'Seleccionando ejercicios...'].map((txt, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={theme.primary + '80'} />
              <Text style={{ fontSize: 13, color: theme.textMuted }}>{txt}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep5 = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#22c55e20', justifyContent: 'center', alignItems: 'center', marginBottom: 24
      }}>
        <Ionicons name="trophy-outline" size={48} color="#22c55e" />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 12 }}>
        ¡Todo listo!
      </Text>
      <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
        Tu plan de entrenamiento personalizado ya está listo. Es hora de empezar a transformarte.
      </Text>
      <View style={{ width: '100%', gap: 12, marginBottom: 8 }}>
        {[
          { icon: 'barbell-outline', text: 'Rutina de entrenamiento generada' },
          { icon: 'chatbubbles-outline', text: 'Chris disponible 24/7 para guiarte' },
          { icon: 'stats-chart-outline', text: 'Seguimiento de progreso activado' },
        ].map((item) => (
          <View key={item.text} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: theme.card, padding: 14, borderRadius: 12,
            borderWidth: 1, borderColor: theme.border,
          }}>
            <Ionicons name={item.icon} size={22} color={theme.primary} />
            <Text style={{ fontSize: 14, color: theme.text, flex: 1 }}>{item.text}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          </View>
        ))}
      </View>
    </View>
  );

  // ─── Navegación entre pasos ──────────────────────────────────────────────────
  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) animateToStep(2);
    else if (step === 2) guardarObjetivo();
    else if (step === 3) guardarPerfil();
    else if (step === 5) finalizar();
  };

  const handleBack = () => {
    if (step > 1 && step < 4) {
      setErrorMsg('');
      animateToStep(step - 1);
    }
  };

  const canGoNext = () => {
    if (step === 2) return objetivo && actividad && experiencia;
    if (step === 3) return altura && peso;
    return true;
  };

  // ─── Render principal ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Progress bar */}
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {step > 1 && step < 4 ? (
            <TouchableOpacity onPress={handleBack} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 30 }} />
          )}
          <Text style={{ fontSize: 13, color: theme.textMuted }}>Paso {step} de {TOTAL_STEPS}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View style={{ height: 4, backgroundColor: theme.primary, borderRadius: 2, width: progressWidth }} />
        </View>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </View>

      {/* Footer */}
      {(step !== 4) && (
        <View style={{ padding: 24, paddingTop: 12 }}>
          {errorMsg ? (
            <Text style={{ fontSize: 13, color: theme.red, textAlign: 'center', marginBottom: 10 }}>{errorMsg}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handleNext}
            disabled={saving || !canGoNext()}
            style={{
              backgroundColor: canGoNext() ? theme.primary : theme.border,
              paddingVertical: 16, borderRadius: 14, alignItems: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {step === 1 ? 'Empezar' : step === 5 ? '¡Comenzar a entrenar!' : 'Continuar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
