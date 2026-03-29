import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, ActivityIndicator, Vibration, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';

// Formatea segundos como mm:ss
const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function WorkoutSessionScreen({ route, navigation }) {
  const { rutina, diaIndex, historialPrevio } = route.params;
  const { theme } = useTheme();
  const dia = rutina.ejercicios[diaIndex];

  // Cronómetro sesión
  const [sessionSecs, setSessionSecs] = useState(0);
  const sessionTimer = useRef(null);

  // Descanso entre series
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

  const updateSerie = (ejIndex, serieIndex, field, value) => {
    setSeries(prev => {
      const nuevo = { ...prev };
      nuevo[ejIndex] = nuevo[ejIndex].map((s, i) =>
        i === serieIndex ? { ...s, [field]: value } : s
      );
      return nuevo;
    });
  };

  const completarSerie = (ejIndex, serieIndex) => {
    const ej = dia.ejercicios[ejIndex];
    updateSerie(ejIndex, serieIndex, 'done', true);

    // Iniciar descanso automático
    const segs = parsearDescanso(ej.descanso);
    iniciarDescanso(segs);

    // Si completó todas las series del ejercicio, avanzar al siguiente
    const seriesEj = series[ejIndex];
    const todasDone = seriesEj.every((s, i) => i === serieIndex || s.done);
    if (todasDone && ejIndex < dia.ejercicios.length - 1) {
      setTimeout(() => setEjercicioActual(ejIndex + 1), 500);
    }
  };

  const todasCompletadas = () => {
    return dia.ejercicios.every((_, i) =>
      series[i]?.every(s => s.done)
    );
  };

  const finalizarSesion = async () => {
    if (!todasCompletadas()) {
      Alert.alert(
        'Sesión incompleta',
        '¿Querés guardar la sesión aunque no completaste todos los ejercicios?',
        [
          { text: 'Seguir entrenando', style: 'cancel' },
          { text: 'Guardar igual', onPress: () => guardarSesion() },
        ]
      );
      return;
    }
    guardarSesion();
  };

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
        rutina,
        diaIndex,
        ejerciciosLog,
        duracion: sessionSecs,
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la sesión');
      setGuardando(false);
    }
  };

  const ej = dia.ejercicios[ejercicioActual];
  const seriesEjActual = series[ejercicioActual] || [];
  const completadasEjActual = seriesEjActual.filter(s => s.done).length;
  const prevEj = historialPrevio?.find(h => h.nombre === ej?.nombre);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity onPress={() => Alert.alert('¿Salir?', 'Perderás el progreso de esta sesión.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
        ])}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{dia.nombreDia}</Text>
          <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>{formatTime(sessionSecs)}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalHistorial(true)}>
          <Ionicons name="time-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Descanso overlay */}
      {restActive && (
        <View style={{ backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="timer-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Descanso: {formatTime(restSecs)}</Text>
          </View>
          <TouchableOpacity onPress={() => setRestActive(false)}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Saltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navegación entre ejercicios */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52, borderBottomWidth: 1, borderColor: theme.border }}>
        {dia.ejercicios.map((e, i) => {
          const done = series[i]?.every(s => s.done);
          const parcial = series[i]?.some(s => s.done);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => setEjercicioActual(i)}
              style={{ paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 2, borderColor: ejercicioActual === i ? theme.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              {done
                ? <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                : parcial
                ? <Ionicons name="ellipse" size={10} color={theme.orange} />
                : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.border }} />
              }
              <Text style={{ fontSize: 12, fontWeight: ejercicioActual === i ? '700' : '400', color: ejercicioActual === i ? theme.primary : theme.textMuted }}>
                {i + 1}. {e.nombre.split(' ').slice(0, 2).join(' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* Ejercicio actual */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 4 }}>{ej.nombre}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>{ej.series} series · {ej.repeticiones} reps · {ej.descanso} descanso</Text>
          </View>
          {ej.instrucciones && (
            <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic' }}>{ej.instrucciones}</Text>
          )}
          {/* Dato del historial previo */}
          {prevEj && (
            <View style={{ marginTop: 8, backgroundColor: theme.primary + '15', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up" size={14} color={theme.primary} />
              <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
                Sesión anterior: {prevEj.seriesCompletadas?.map(s => `${s.peso}kg×${s.reps}`).join(' · ')}
              </Text>
            </View>
          )}
        </View>

        {/* Series */}
        <View style={{ backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 }}>
          {/* Header tabla */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.bg }}>
            <Text style={{ width: 40, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>SERIE</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>PESO (kg)</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>REPS</Text>
            <Text style={{ width: 50, fontSize: 12, fontWeight: '700', color: theme.textMuted, textAlign: 'center' }}>✓</Text>
          </View>

          {seriesEjActual.map((s, si) => (
            <View key={si} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: si < seriesEjActual.length - 1 ? 1 : 0, borderColor: theme.border, backgroundColor: s.done ? theme.primary + '10' : 'transparent' }}>
              <Text style={{ width: 40, fontSize: 15, fontWeight: '700', color: s.done ? theme.primary : theme.textMuted }}>#{si + 1}</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TextInput
                  style={{ backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, fontWeight: '700', color: theme.text, borderWidth: 1, borderColor: theme.border, textAlign: 'center', minWidth: 70 }}
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
                  style={{ backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, fontWeight: '700', color: theme.text, borderWidth: 1, borderColor: theme.border, textAlign: 'center', minWidth: 70 }}
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
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.done ? theme.primary : theme.bg, borderWidth: 2, borderColor: s.done ? theme.primary : theme.border, justifyContent: 'center', alignItems: 'center' }}>
                  {s.done && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Progreso del ejercicio */}
        <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 24 }}>
          {completadasEjActual} de {seriesEjActual.length} series completadas
        </Text>

        {/* Navegación ejercicios */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
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
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Sesión anterior</Text>
              <TouchableOpacity onPress={() => setModalHistorial(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {historialPrevio?.length > 0 ? historialPrevio.map((h, i) => (
                <View key={i} style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
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
