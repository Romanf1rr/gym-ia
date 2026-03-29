import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, ActivityIndicator, Vibration, Animated, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';

const { width, height } = Dimensions.get('window');

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.65:3000/api/v1').replace('/api/v1', '');
const getGifUrl = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('http')) return value;
  return `${API_BASE}/api/v1/routines/gif/${value}`;
};

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ── Rest Timer Overlay ─────────────────────────────────────────────────────────
function RestTimerOverlay({ visible, restSecs, restTotal, nextEjNombre, onSkip, theme }) {
  const progress = restTotal > 0 ? restSecs / restTotal : 0;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && restTotal > 0) {
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: restTotal * 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, restTotal]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center', alignItems: 'center',
      }}>
        {/* Countdown circle */}
        <View style={{
          width: 200, height: 200, borderRadius: 100,
          borderWidth: 6, borderColor: theme.primary + '40',
          justifyContent: 'center', alignItems: 'center', marginBottom: 24,
          backgroundColor: theme.primary + '10',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            DESCANSO
          </Text>
          <Text style={{ fontSize: 72, fontWeight: '900', color: '#fff', lineHeight: 80 }}>
            {restSecs}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>segundos</Text>
        </View>

        {/* Progress bar */}
        <View style={{ width: width * 0.7, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
          <Animated.View style={{ height: 4, backgroundColor: theme.primary, borderRadius: 2, width: barWidth }} />
        </View>

        {/* Next exercise */}
        {nextEjNombre && (
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>SIGUIENTE EJERCICIO</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: width * 0.7 }}>
              {nextEjNombre}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={onSkip}
          style={{
            paddingHorizontal: 40, paddingVertical: 14,
            borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Saltar descanso →</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function WorkoutSessionScreen({ route, navigation }) {
  const { rutina, diaIndex, historialPrevio } = route.params;
  const { theme } = useTheme();
  const dia = rutina.ejercicios[diaIndex];

  // Cronómetro sesión
  const [sessionSecs, setSessionSecs] = useState(0);
  const sessionTimer = useRef(null);

  // Descanso
  const [restSecs, setRestSecs] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restTimer = useRef(null);
  const [restTotal, setRestTotal] = useState(0);

  // Estado por ejercicio: { [i]: [{ reps, peso, done }] }
  const [series, setSeries] = useState(() => {
    const init = {};
    dia.ejercicios.forEach((ej, i) => {
      const prevEj = historialPrevio?.find(h => h.nombre === ej.nombre);
      init[i] = Array.from({ length: ej.series }, (_, si) => ({
        reps: prevEj?.seriesCompletadas?.[si]?.reps?.toString() || ej.repeticiones?.split('-')[0] || '10',
        peso: prevEj?.seriesCompletadas?.[si]?.peso?.toString() || '',
        done: false,
      }));
    });
    return init;
  });

  const [ejercicioActual, setEjercicioActual] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);

  // Cronómetro sesión
  useEffect(() => {
    sessionTimer.current = setInterval(() => setSessionSecs(s => s + 1), 1000);
    return () => clearInterval(sessionTimer.current);
  }, []);

  // Cronómetro descanso
  useEffect(() => {
    if (restActive) {
      restTimer.current = setInterval(() => {
        setRestSecs(s => {
          if (s <= 1) {
            clearInterval(restTimer.current);
            setRestActive(false);
            Vibration.vibrate([0, 300, 100, 300]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimer.current);
    }
    return () => clearInterval(restTimer.current);
  }, [restActive]);

  const iniciarDescanso = (segundos) => {
    setRestTotal(segundos);
    setRestSecs(segundos);
    setRestActive(true);
  };

  const parsearDescanso = (descansoStr) => {
    if (!descansoStr) return 60;
    const match = descansoStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  };

  const updateSerie = useCallback((ejIndex, serieIndex, field, value) => {
    setSeries(prev => {
      const nuevo = { ...prev };
      nuevo[ejIndex] = nuevo[ejIndex].map((s, i) =>
        i === serieIndex ? { ...s, [field]: value } : s
      );
      return nuevo;
    });
  }, []);

  const completarSerie = (ejIndex, serieIndex) => {
    const ej = dia.ejercicios[ejIndex];
    updateSerie(ejIndex, serieIndex, 'done', true);

    const segs = parsearDescanso(ej.descanso);
    iniciarDescanso(segs);

    const seriesEj = series[ejIndex];
    const todasDone = seriesEj.every((s, i) => i === serieIndex || s.done);
    if (todasDone && ejIndex < dia.ejercicios.length - 1) {
      setTimeout(() => setEjercicioActual(ejIndex + 1), 300);
    }
  };

  const todasCompletadas = () =>
    dia.ejercicios.every((_, i) => series[i]?.every(s => s.done));

  const guardarSesion = async () => {
    setGuardando(true);
    clearInterval(sessionTimer.current);
    try {
      const ejerciciosLog = dia.ejercicios.map((ej, i) => ({
        nombre: ej.nombre,
        nombreEn: ej.nombreEn,
        diaIndex,
        seriesCompletadas: (series[i] || []).map((s, si) => ({
          serie: si + 1,
          reps: parseInt(s.reps) || 0,
          peso: parseFloat(s.peso) || 0,
          completada: s.done,
        })),
      }));

      await api.post('/routines/workout/log', {
        rutinaId: rutina.id,
        diaIndex,
        ejercicios: ejerciciosLog,
        duracion: Math.round(sessionSecs / 60),
        notas: `Día ${diaIndex + 1}: ${dia.nombreDia}`,
      });

      navigation.replace('WorkoutSummary', {
        rutina, diaIndex, ejerciciosLog, duracion: sessionSecs,
      });
    } catch {
      Alert.alert('Error', 'No se pudo guardar la sesión');
      setGuardando(false);
    }
  };

  const finalizarSesion = () => {
    if (!todasCompletadas()) {
      Alert.alert(
        'Sesión incompleta',
        '¿Qué querés hacer?',
        [
          { text: 'Seguir entrenando', style: 'cancel' },
          { text: 'Guardar igual', onPress: guardarSesion },
        ]
      );
      return;
    }
    guardarSesion();
  };

  const handleSalir = () => {
    Alert.alert(
      '¿Salir de la sesión?',
      'Tu progreso de esta sesión se perderá si salís sin guardar.',
      [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Guardar y salir', onPress: guardarSesion },
        { text: 'Salir sin guardar', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const ej = dia.ejercicios[ejercicioActual];
  const seriesEjActual = series[ejercicioActual] || [];
  const completadasEjActual = seriesEjActual.filter(s => s.done).length;
  const prevEj = historialPrevio?.find(h => h.nombre === ej?.nombre);
  const gifSource = getGifUrl(ej?.gifUrl || ej?.gif);
  const nextEj = dia.ejercicios[ejercicioActual + 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Rest timer fullscreen overlay */}
      <RestTimerOverlay
        visible={restActive}
        restSecs={restSecs}
        restTotal={restTotal}
        nextEjNombre={nextEj?.nombre}
        onSkip={() => setRestActive(false)}
        theme={theme}
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity onPress={handleSalir} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{dia.nombreDia}</Text>
          <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '700' }}>{formatTime(sessionSecs)}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalHistorial(true)} style={{ padding: 4 }}>
          <Ionicons name="time-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tab de ejercicios */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, borderBottomWidth: 1, borderColor: theme.border }}>
        {dia.ejercicios.map((e, i) => {
          const done = series[i]?.every(s => s.done);
          const parcial = !done && series[i]?.some(s => s.done);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => setEjercicioActual(i)}
              style={{ paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 2, borderColor: ejercicioActual === i ? theme.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              {done
                ? <Ionicons name="checkmark-circle" size={13} color={theme.primary} />
                : parcial
                ? <Ionicons name="ellipse" size={9} color={theme.orange} />
                : <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.border }} />
              }
              <Text style={{ fontSize: 12, fontWeight: ejercicioActual === i ? '700' : '400', color: ejercicioActual === i ? theme.primary : theme.textMuted }}>
                {i + 1}. {e.nombre.split(' ').slice(0, 2).join(' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

        {/* GIF + Info del ejercicio */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 16 }}>
          {gifSource ? (
            <Image
              source={{ uri: gifSource }}
              style={{ width: '100%', height: 200, backgroundColor: theme.bg }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
              <Ionicons name="barbell-outline" size={48} color={theme.border} />
            </View>
          )}
          <View style={{ padding: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 }}>{ej.nombre}</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6 }}>
              {ej.series} series · {ej.repeticiones} reps · {ej.descanso} descanso
            </Text>
            {ej.instrucciones && (
              <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', lineHeight: 18 }}>{ej.instrucciones}</Text>
            )}
          </View>
        </View>

        {/* Historial previo */}
        {prevEj && (
          <View style={{ backgroundColor: theme.primary + '12', borderRadius: 10, padding: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.primary + '30' }}>
            <Ionicons name="trending-up" size={15} color={theme.primary} />
            <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600', flex: 1 }}>
              Sesión anterior: {prevEj.seriesCompletadas?.map(s => `${s.peso}kg×${s.reps}`).join(' · ')}
            </Text>
          </View>
        )}

        {/* Tabla de series */}
        <View style={{ backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.bg }}>
            <Text style={{ width: 40, fontSize: 11, fontWeight: '700', color: theme.textMuted }}>SERIE</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>PESO (kg)</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>REPS</Text>
            <Text style={{ width: 50, fontSize: 11, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>✓</Text>
          </View>

          {seriesEjActual.map((s, si) => (
            <View key={si} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: si < seriesEjActual.length - 1 ? 1 : 0, borderColor: theme.border, backgroundColor: s.done ? theme.primary + '10' : 'transparent' }}>
              <Text style={{ width: 40, fontSize: 15, fontWeight: '700', color: s.done ? theme.primary : theme.textMuted }}>#{si + 1}</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TextInput
                  style={{ backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, fontWeight: '700', color: theme.text, borderWidth: 1, borderColor: s.done ? theme.primary + '40' : theme.border, textAlign: 'center', minWidth: 70 }}
                  value={s.peso}
                  onChangeText={v => updateSerie(ejercicioActual, si, 'peso', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  editable={!s.done}
                />
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TextInput
                  style={{ backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, fontWeight: '700', color: theme.text, borderWidth: 1, borderColor: s.done ? theme.primary + '40' : theme.border, textAlign: 'center', minWidth: 70 }}
                  value={s.reps}
                  onChangeText={v => updateSerie(ejercicioActual, si, 'reps', v)}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={theme.textMuted}
                  editable={!s.done}
                />
              </View>
              <TouchableOpacity
                style={{ width: 50, alignItems: 'center' }}
                onPress={() => !s.done && completarSerie(ejercicioActual, si)}
                disabled={s.done}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.done ? theme.primary : 'transparent', borderWidth: 2, borderColor: s.done ? theme.primary : theme.border, justifyContent: 'center', alignItems: 'center' }}>
                  {s.done && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Progreso */}
        <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 20 }}>
          {completadasEjActual} de {seriesEjActual.length} series completadas
        </Text>

        {/* Navegación entre ejercicios */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {ejercicioActual > 0 && (
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
              onPress={() => setEjercicioActual(ejercicioActual - 1)}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>← Anterior</Text>
            </TouchableOpacity>
          )}
          {ejercicioActual < dia.ejercicios.length - 1 && (
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
              onPress={() => setEjercicioActual(ejercicioActual + 1)}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>Siguiente →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón finalizar */}
        <TouchableOpacity
          style={{ backgroundColor: todasCompletadas() ? theme.primary : theme.card, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: todasCompletadas() ? theme.primary : theme.border, marginBottom: 32 }}
          onPress={finalizarSesion}
          disabled={guardando}
        >
          {guardando
            ? <ActivityIndicator color={todasCompletadas() ? '#fff' : theme.primary} />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={todasCompletadas() ? 'trophy' : 'save-outline'} size={20} color={todasCompletadas() ? '#fff' : theme.primary} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: todasCompletadas() ? '#fff' : theme.primary }}>
                  {todasCompletadas() ? '¡Finalizar sesión!' : 'Guardar y salir'}
                </Text>
              </View>
            )
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Modal historial previo */}
      <Modal visible={modalHistorial} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Sesión anterior</Text>
              <TouchableOpacity onPress={() => setModalHistorial(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {historialPrevio?.length > 0 ? historialPrevio.map((h, i) => (
                <View key={i} style={{ backgroundColor: theme.bg, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 6 }}>{h.nombre}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {h.seriesCompletadas?.map((s, si) => (
                      <View key={si} style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
                          #{s.serie}: {s.peso}kg × {s.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )) : (
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 20 }}>No hay sesiones anteriores para este día</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
