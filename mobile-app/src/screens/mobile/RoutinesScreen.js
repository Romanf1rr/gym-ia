import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Image, Dimensions, Alert, TextInput
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Body from 'react-native-body-highlighter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api/api.service';
import cache from '../../services/api/cache.service';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.65:3000/api/v1').replace('/api/v1', '');
// Si gifUrl ya es una URL completa (Supabase) la usamos directo; si es un ID usamos el proxy
const gifUrl = (value) => {
  if (!value) return null;
  if (value.startsWith('http')) return value;
  return `${API_BASE}/api/v1/routines/gif/${value}`;
};
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const MUSCLE_MAP = {
  pectorals: 'chest', biceps: 'biceps', triceps: 'triceps',
  abs: 'abs', quadriceps: 'quadriceps', hamstrings: 'hamstring',
  glutes: 'gluteal', lats: 'upper-back', traps: 'trapezius',
  shoulders: 'deltoids', delts: 'deltoids', calves: 'calves',
  'upper-back': 'upper-back', 'lower-back': 'lower-back',
  forearms: 'forearms', adductors: 'adductors', obliques: 'obliques',
};

// Slugs que se muestran en la vista frontal del body highlighter
const FRONT_SLUGS = new Set([
  'chest', 'biceps', 'abs', 'quadriceps', 'deltoids',
  'forearms', 'adductors', 'obliques',
]);
// Slugs que se muestran en la vista posterior
const BACK_SLUGS = new Set([
  'upper-back', 'lower-back', 'gluteal', 'hamstring',
  'calves', 'triceps', 'trapezius',
]);

const mapMuscles = (musculos = [], intensity = 2) =>
  musculos
    .map((m) => MUSCLE_MAP[m?.toLowerCase()])
    .filter(Boolean)
    .map((slug) => ({ slug, intensity }));

const LUGAR_OPCIONES = ['Gym completo', 'Casa con equipo', 'Sin equipo'];
const DURACION_OPCIONES = ['30 min', '45 min', '60 min', '90 min'];
const ZONAS_OPCIONES = ['Todo el cuerpo', 'Pecho', 'Espalda', 'Piernas', 'Brazos', 'Core', 'Hombros'];

export default function RoutinesScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [tab, setTab] = useState('activa'); // 'activa' | 'mis_rutinas'
  const [rutina, setRutina] = useState(null);
  const [todasRutinas, setTodasRutinas] = useState([]);
  const [objetivo, setObjetivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [ejercicioModal, setEjercicioModal] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [renombrando, setRenombrando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [tieneBorrador, setTieneBorrador] = useState(false);

  // Modal de configuración de rutina
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [selectedLugar, setSelectedLugar] = useState('Gym completo');
  const [selectedDuracion, setSelectedDuracion] = useState('60 min');
  const [selectedZonas, setSelectedZonas] = useState(['Todo el cuerpo']);
  const [lesiones, setLesiones] = useState('');

  // Calendario
  const [calendarData, setCalendarData] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadData = async (force = false) => {
    if (force) cache.invalidatePrefix('routines:');
    try {
      const [rutinaData, usageData, objetivoData, todasData] = await Promise.all([
        cache.fetch('routines:active', () => api.get('/routines/active').then(r => r.data).catch(() => null), 30),
        cache.fetch('routines:usage', () => api.get('/users/usage').then(r => r.data).catch(() => null), 60),
        cache.fetch('routines:objetivo', () => api.get('/objectives/active').then(r => r.data).catch(() => null), 120),
        cache.fetch('routines:list', () => api.get('/routines').then(r => r.data).catch(() => null), 30),
      ]);
      setRutina(rutinaData || null);
      setUsageInfo(usageData || null);
      setObjetivo(objetivoData || null);
      setTodasRutinas(todasData || []);
    } catch {
      setRutina(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData().then(() => {
      if (route?.params?.abrirModal) {
        setShowGenerarModal(true);
      }
    });
  }, [route?.params?.abrirModal]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const loadCalendar = async (ym) => {
    const [year, month] = ym.split('-');
    setCalendarLoading(true);
    try {
      const res = await api.get(`/routines/workout/calendar?year=${year}&month=${month}`);
      setCalendarData(res.data || {});
    } catch {
      setCalendarData({});
    } finally {
      setCalendarLoading(false);
    }
  };

  const iniciarSesion = async (diaIdx) => {
    try {
      const histRes = await api.get(`/routines/workout/history/${rutina.id}`).catch(() => null);
      const historial = histRes?.data || [];
      const ultimoEste = historial.find(h =>
        h.ejercicios?.some(e => e.diaIndex === diaIdx)
      );
      const historialPrevio = ultimoEste
        ? ultimoEste.ejercicios?.filter(e => e.diaIndex === diaIdx)
        : [];
      navigation.navigate('WorkoutSession', { rutina, diaIndex: diaIdx, historialPrevio });
    } catch {
      navigation.navigate('WorkoutSession', { rutina, diaIndex: diaIdx, historialPrevio: [] });
    }
  };

  // Detectar si hay sesión pausada para el día seleccionado
  useEffect(() => {
    if (!rutina) { setTieneBorrador(false); return; }
    AsyncStorage.getItem(`workout_draft_${rutina.id}_${diaSeleccionado}`)
      .then(raw => setTieneBorrador(!!raw))
      .catch(() => setTieneBorrador(false));
  }, [rutina?.id, diaSeleccionado]);

  useEffect(() => {
    if (tab === 'calendario') {
      loadCalendar(currentMonth);
    }
  }, [tab, currentMonth]);

  const toggleZona = (zona) => {
    if (zona === 'Todo el cuerpo') {
      setSelectedZonas(['Todo el cuerpo']);
      return;
    }
    setSelectedZonas((prev) => {
      const sinTodo = prev.filter((z) => z !== 'Todo el cuerpo');
      if (sinTodo.includes(zona)) {
        const next = sinTodo.filter((z) => z !== zona);
        return next.length === 0 ? ['Todo el cuerpo'] : next;
      }
      return [...sinTodo, zona];
    });
  };

  const confirmarGeneracion = async () => {
    setShowGenerarModal(false);
    setGenerating(true);
    try {
      const res = await api.post('/routines/generate', {
        lugar: selectedLugar,
        zonasPrioritarias: selectedZonas.join(', '),
        lesiones: lesiones,
        duracionSesion: selectedDuracion,
      });
      cache.invalidatePrefix('routines:');
      cache.invalidate('dashboard:stats');
      setRutina(res.data);
      setDiaSeleccionado(0);
      setTab('activa');
      await loadData(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al generar rutina';
      const esLimite = err.response?.data?.limite;
      if (esLimite) {
        Alert.alert('Límite alcanzado', msg, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => navigation.navigate('Premium') },
        ]);
      } else {
        // Aunque haya error en la respuesta, la rutina pudo haberse creado — recargar
        const rutinaActiva = await api.get('/routines/active').catch(() => null);
        if (rutinaActiva?.data) {
          setRutina(rutinaActiva.data);
          setDiaSeleccionado(0);
          setTab('activa');
          await loadData();
        } else {
          Alert.alert('Error', msg);
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const activarRutina = async (id) => {
    try {
      const res = await api.put(`/routines/${id}/activate`);
      setRutina(res.data);
      setDiaSeleccionado(0);
      setTab('activa');
    } catch {
      Alert.alert('Error', 'No se pudo activar la rutina');
    }
  };

  const guardarNombre = async (id) => {
    if (!nuevoNombre.trim()) return;
    try {
      await api.patch(`/routines/${id}/rename`, { nombre: nuevoNombre });
      setTodasRutinas((prev) => prev.map((r) => r.id === id ? { ...r, nombre: nuevoNombre } : r));
      if (rutina?.id === id) setRutina((r) => ({ ...r, nombre: nuevoNombre }));
      setRenombrando(null);
      setNuevoNombre('');
    } catch {
      Alert.alert('Error', 'No se pudo renombrar la rutina');
    }
  };

  const eliminarRutina = (id, nombre) => {
    Alert.alert('Eliminar rutina', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/routines/${id}`);
            setTodasRutinas((prev) => prev.filter((r) => r.id !== id));
            if (rutina?.id === id) setRutina(null);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la rutina');
          }
        }
      },
    ]);
  };

  // useMemo must be before any early returns (Rules of Hooks)
  const { musculosHoy, musculosFront, musculosBack } = useMemo(() => {
    const dias = rutina?.ejercicios || [];
    const ejercicios = (dias[diaSeleccionado] || {}).ejercicios || [];
    const all = [
      ...mapMuscles(ejercicios.flatMap((e) => e.musculos || []), 2),
      ...mapMuscles(ejercicios.flatMap((e) => e.musculosSecundarios || []), 1),
    ];
    // Deduplicate by slug (keep highest intensity)
    const map = {};
    all.forEach(({ slug, intensity }) => {
      if (!map[slug] || intensity > map[slug].intensity) map[slug] = { slug, intensity };
    });
    const deduped = Object.values(map);
    return {
      musculosHoy: deduped,
      musculosFront: deduped.filter(m => FRONT_SLUGS.has(m.slug)),
      musculosBack: deduped.filter(m => BACK_SLUGS.has(m.slug)),
    };
  }, [diaSeleccionado, rutina?.id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!rutina) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <Ionicons name="barbell-outline" size={72} color={theme.border} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 20, marginBottom: 10 }}>Sin rutina activa</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            Generá tu rutina personalizada con IA basada en tus objetivos y nivel de experiencia
          </Text>
          {usageInfo?.plan === 'free' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.card, padding: 10, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
              <Ionicons name="information-circle" size={16} color={theme.orange} />
              <Text style={{ fontSize: 12, color: theme.orange }}>
                Plan gratuito: {usageInfo.limites?.rutinas?.usado || 0}/{usageInfo.limites?.rutinas?.maximo} rutinas cada 15 días
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 }}
            onPress={() => setShowGenerarModal(true)}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Generar Rutina con IA</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de configuración */}
        <GenerarRutinaModal
          visible={showGenerarModal}
          theme={theme}
          selectedLugar={selectedLugar}
          setSelectedLugar={setSelectedLugar}
          selectedDuracion={selectedDuracion}
          setSelectedDuracion={setSelectedDuracion}
          selectedZonas={selectedZonas}
          toggleZona={toggleZona}
          lesiones={lesiones}
          setLesiones={setLesiones}
          onCancel={() => setShowGenerarModal(false)}
          onConfirm={confirmarGeneracion}
        />
      </SafeAreaView>
    );
  }

  const dias = rutina.ejercicios || [];
  const diaActual = dias[diaSeleccionado] || {};
  const ejerciciosHoy = diaActual.ejercicios || [];

  // Banner: rutina desactualizada respecto al objetivo
  const rutinaDesactualizada = rutina && objetivo &&
    new Date(rutina.createdAt) < new Date(objetivo.createdAt);

  // Pantalla de carga mientras se genera
  if (generating) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 24, textAlign: 'center' }}>
          Generando tu rutina con IA...
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Esto puede tardar unos segundos
        </Text>
      </SafeAreaView>
    );
  }

  // Vista "Mis Rutinas"
  if (tab === 'mis_rutinas') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        {/* Tabs */}
        <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 6 }}>
          <TouchableOpacity onPress={() => setTab('activa')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('calendario')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Calendario</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Mis rutinas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {todasRutinas.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="barbell-outline" size={56} color={theme.border} />
              <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>No hay rutinas guardadas</Text>
            </View>
          ) : (
            todasRutinas.map((r, index) => (
              <View key={r.id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: r.activa ? theme.primary : theme.border }}>
                {/* Número de rutina */}
                <View style={{ position: 'absolute', top: 12, right: 14, backgroundColor: r.activa ? theme.primary : theme.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: r.activa ? '#fff' : theme.textMuted }}>#{todasRutinas.length - index}</Text>
                </View>
                {/* Nombre editable */}
                {renombrando === r.id ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    <TextInput
                      value={nuevoNombre}
                      onChangeText={setNuevoNombre}
                      style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.primary, padding: 10, fontSize: 14, color: theme.text }}
                      autoFocus
                      onSubmitEditing={() => guardarNombre(r.id)}
                    />
                    <TouchableOpacity onPress={() => guardarNombre(r.id)} style={{ backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRenombrando(null)} style={{ backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, justifyContent: 'center' }}>
                      <Ionicons name="close" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    {r.activa && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginRight: 8 }} />}
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.text, paddingRight: 40 }}>{r.nombre}</Text>
                    <TouchableOpacity onPress={() => { setRenombrando(r.id); setNuevoNombre(r.nombre); }} style={{ padding: 4, marginRight: 32 }}>
                      <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Info */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { icon: 'calendar-outline', text: `${r.diasSemana} días/sem` },
                    { icon: 'fitness-outline', text: r.nivelDificultad },
                    { icon: 'time-outline', text: new Date(r.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short' }) },
                  ].map((item) => (
                    <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                      <Ionicons name={item.icon} size={12} color={theme.textMuted} />
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                {/* Acciones */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {!r.activa && (
                    <TouchableOpacity onPress={() => activarRutina(r.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.primary + '18', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.primary + '40' }}>
                      <Ionicons name="play-circle-outline" size={16} color={theme.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Activar</Text>
                    </TouchableOpacity>
                  )}
                  {r.activa && (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.primary + '18', paddingVertical: 10, borderRadius: 10 }}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Activa</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => eliminarRutina(r.id, r.nombre)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, justifyContent: 'center' }}>
                    <Ionicons name="trash-outline" size={16} color={theme.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.primary, borderStyle: 'dashed', borderRadius: 16, padding: 16, marginTop: 4 }}
            onPress={() => setShowGenerarModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>Generar nueva rutina</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal generar */}
        {showGenerarModal && <GenerarRutinaModal theme={theme} selectedLugar={selectedLugar} setSelectedLugar={setSelectedLugar} selectedDuracion={selectedDuracion} setSelectedDuracion={setSelectedDuracion} selectedZonas={selectedZonas} toggleZona={toggleZona} lesiones={lesiones} setLesiones={setLesiones} onCancel={() => setShowGenerarModal(false)} onConfirm={confirmarGeneracion} />}
      </SafeAreaView>
    );
  }

  // Vista "Calendario"
  if (tab === 'calendario') {
    const markedDates = {};
    Object.keys(calendarData).forEach((fecha) => {
      markedDates[fecha] = { marked: true, dotColor: theme.primary };
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        {/* Tabs */}
        <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 6 }}>
          <TouchableOpacity onPress={() => setTab('activa')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Calendario</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('mis_rutinas')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Mis rutinas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Calendar
            key={currentMonth}
            current={currentMonth + '-01'}
            markedDates={markedDates}
            onMonthChange={(month) => {
              setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
            }}
            theme={{
              backgroundColor: theme.bg,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.textMuted,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: theme.border,
              dotColor: theme.primary,
              selectedDotColor: '#fff',
              arrowColor: theme.primary,
              monthTextColor: theme.text,
            }}
            style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}
          />

          {calendarLoading && <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary }} />
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>Día con entrenamiento completado</Text>
          </View>

          {Object.entries(calendarData).length > 0 ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>
                {new Date(currentMonth + '-15').toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
              </Text>
              {Object.entries(calendarData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([fecha, entrenos]) => (
                  <View key={fecha} style={{ backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
                      {new Date(fecha + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                    </Text>
                    {entrenos.map((e, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                          {e.duracion ? `${e.duracion} min` : 'Sesión completada'} · {e.ejercicios?.length || 0} ejercicios
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
            </View>
          ) : !calendarLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <Ionicons name="calendar-outline" size={56} color={theme.border} />
              <Text style={{ fontSize: 15, color: theme.textSecondary, marginTop: 12, textAlign: 'center' }}>
                Sin entrenamientos este mes
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 6, textAlign: 'center' }}>
                Completá una sesión para verla aquí
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Tabs */}
        <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 6 }}>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('calendario')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Calendario</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('mis_rutinas')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Mis rutinas</Text>
            {todasRutinas.length > 0 && (
              <View style={{ backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{todasRutinas.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Banner objetivo actualizado */}
        {rutinaDesactualizada && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.orange + '18', borderBottomWidth: 1, borderColor: theme.orange + '40', padding: 14, paddingHorizontal: 20 }}
            onPress={() => setShowGenerarModal(true)}
          >
            <Ionicons name="warning" size={18} color={theme.orange} />
            <Text style={{ flex: 1, fontSize: 13, color: theme.orange, fontWeight: '600' }}>
              Tus objetivos cambiaron — generá una nueva rutina para reflejarlos
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.orange} />
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, maxWidth: width * 0.75 }}>{rutina.nombre}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              {rutina.diasSemana} días/semana · {rutina.duracionSemanas} semanas · {rutina.nivelDificultad}
            </Text>
          </View>
          <TouchableOpacity
            style={{ padding: 8, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
            onPress={() => setShowGenerarModal(true)}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="refresh" size={18} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Selector de días */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          {dias.map((dia, index) => (
            <TouchableOpacity
              key={index}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: diaSeleccionado === index ? theme.primary : theme.card, marginRight: 8, borderWidth: 1, borderColor: diaSeleccionado === index ? theme.primary : theme.border }}
              onPress={() => setDiaSeleccionado(index)}
            >
              <Text style={{ fontSize: 13, color: diaSeleccionado === index ? '#fff' : theme.textSecondary, fontWeight: '600' }}>
                {dia.nombreDia || `Día ${dia.dia}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Body Highlighter */}
        {musculosHoy.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Músculos del día</Text>
            <View style={{ backgroundColor: theme.card, borderRadius: 16, paddingVertical: 12, paddingBottom: 8, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
              {/* Vista frontal — solo si hay músculos frontales */}
              {musculosFront.length > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Frente
                  </Text>
                  <Body
                    data={musculosFront}
                    gender="male"
                    side="front"
                    scale={musculosFront.length > 0 && musculosBack.length > 0 ? 0.6 : 0.85}
                    colors={['#f97316', theme.primary]}
                  />
                </View>
              )}
              {musculosBack.length > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Espalda
                  </Text>
                  <Body
                    data={musculosBack}
                    gender="male"
                    side="back"
                    scale={musculosFront.length > 0 && musculosBack.length > 0 ? 0.6 : 0.85}
                    colors={['#f97316', theme.primary]}
                  />
                </View>
              )}
              </View>
              {/* Leyenda */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary }} />
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Principal</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f97316' }} />
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Secundario</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Lista de ejercicios */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
            Ejercicios — {diaActual.nombreDia || `Día ${diaActual.dia}`}
          </Text>
          {ejerciciosHoy.map((ejercicio, index) => (
            <TouchableOpacity
              key={index}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}
              onPress={() => setEjercicioModal(ejercicio)}
            >
              {ejercicio.gifUrl ? (
                <Image source={{ uri: gifUrl(ejercicio.gifUrl) }} style={{ width: 72, height: 72 }} />
              ) : (
                <View style={{ width: 72, height: 72, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="barbell" size={28} color={theme.primary} />
                </View>
              )}
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>{ejercicio.nombre}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {[
                    { num: ejercicio.series, lbl: 'series' },
                    { num: ejercicio.repeticiones, lbl: 'reps' },
                    { num: ejercicio.descanso, lbl: 'descanso' },
                  ].map((s, i) => (
                    <React.Fragment key={s.lbl}>
                      {i > 0 && <View style={{ width: 1, height: 24, backgroundColor: theme.border, marginHorizontal: 10 }} />}
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.primary }}>{s.num}</Text>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>{s.lbl}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginRight: 8 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón empezar / retomar sesión */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}>
          {tieneBorrador && (
            <TouchableOpacity
              style={{ backgroundColor: theme.orange, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              onPress={() => iniciarSesion(diaSeleccionado)}
            >
              <Ionicons name="refresh-circle" size={22} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Retomar sesión pausada</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ backgroundColor: tieneBorrador ? theme.card : theme.primary, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: tieneBorrador ? 1 : 0, borderColor: theme.border }}
            onPress={async () => {
              if (tieneBorrador) {
                await AsyncStorage.removeItem(`workout_draft_${rutina.id}_${diaSeleccionado}`);
                setTieneBorrador(false);
              }
              iniciarSesion(diaSeleccionado);
            }}
          >
            <Ionicons name="play-circle" size={22} color={tieneBorrador ? theme.text : '#fff'} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: tieneBorrador ? theme.text : '#fff' }}>
              {tieneBorrador ? 'Empezar sesión nueva' : 'Empezar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal detalle ejercicio */}
      <Modal visible={!!ejercicioModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 4, marginBottom: 8 }} onPress={() => setEjercicioModal(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            {ejercicioModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>{ejercicioModal.nombre}</Text>
                {ejercicioModal.gifUrl && (
                  <Image
                    source={{ uri: gifUrl(ejercicioModal.gifUrl) }}
                    style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16, backgroundColor: theme.bg }}
                    resizeMode="contain"
                  />
                )}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Series', value: ejercicioModal.series },
                    { label: 'Repeticiones', value: ejercicioModal.repeticiones },
                    { label: 'Descanso', value: ejercicioModal.descanso },
                  ].map((item) => (
                    <View key={item.label} style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>{item.value}</Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                {ejercicioModal.instrucciones && (
                  <View style={{ backgroundColor: theme.bg, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 6 }}>Cómo hacerlo:</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 20 }}>{ejercicioModal.instrucciones}</Text>
                  </View>
                )}
                {ejercicioModal.notas && (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: theme.bg, padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="information-circle" size={16} color={theme.primary} />
                    <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>{ejercicioModal.notas}</Text>
                  </View>
                )}
                {ejercicioModal.equipamiento && (
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>Equipamiento: {ejercicioModal.equipamiento}</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de configuración de nueva rutina */}
      <GenerarRutinaModal
        visible={showGenerarModal}
        theme={theme}
        selectedLugar={selectedLugar}
        setSelectedLugar={setSelectedLugar}
        selectedDuracion={selectedDuracion}
        setSelectedDuracion={setSelectedDuracion}
        selectedZonas={selectedZonas}
        toggleZona={toggleZona}
        lesiones={lesiones}
        setLesiones={setLesiones}
        onCancel={() => setShowGenerarModal(false)}
        onConfirm={confirmarGeneracion}
      />
    </SafeAreaView>
  );
}

function GenerarRutinaModal({
  visible, theme,
  selectedLugar, setSelectedLugar,
  selectedDuracion, setSelectedDuracion,
  selectedZonas, toggleZona,
  lesiones, setLesiones,
  onCancel, onConfirm,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Personalizar rutina</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Lugar */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 10 }}>¿Dónde entrenás?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {LUGAR_OPCIONES.map((op) => (
                <TouchableOpacity
                  key={op}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedLugar === op ? theme.primary : theme.card, borderWidth: 1, borderColor: selectedLugar === op ? theme.primary : theme.border }}
                  onPress={() => setSelectedLugar(op)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selectedLugar === op ? '#fff' : theme.textSecondary }}>
                    {op}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duración */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 10 }}>¿Cuánto tiempo tenés por sesión?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {DURACION_OPCIONES.map((op) => (
                <TouchableOpacity
                  key={op}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedDuracion === op ? theme.primary : theme.card, borderWidth: 1, borderColor: selectedDuracion === op ? theme.primary : theme.border }}
                  onPress={() => setSelectedDuracion(op)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDuracion === op ? '#fff' : theme.textSecondary }}>
                    {op}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Zonas a priorizar */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 10 }}>¿Qué zonas querés priorizar?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {ZONAS_OPCIONES.map((op) => {
                const activo = selectedZonas.includes(op);
                return (
                  <TouchableOpacity
                    key={op}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: activo ? theme.primary : theme.card, borderWidth: 1, borderColor: activo ? theme.primary : theme.border }}
                    onPress={() => toggleZona(op)}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: activo ? '#fff' : theme.textSecondary }}>
                      {op}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lesiones */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>¿Tenés alguna lesión o limitación?</Text>
            <TextInput
              style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}
              placeholder="Ej: dolor de rodilla, lumbar..."
              placeholderTextColor={theme.textMuted}
              value={lesiones}
              onChangeText={setLesiones}
            />

            {/* Botones */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.primary, padding: 16, borderRadius: 14, marginBottom: 8 }}
              onPress={onConfirm}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Generar Rutina ✨</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
              onPress={onCancel}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
