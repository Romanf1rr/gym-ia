import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Image, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Body from 'react-native-body-highlighter';
import { api } from '../../services/api/api.service';
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

const mapMuscles = (musculos = [], intensity = 2) =>
  musculos
    .map((m) => MUSCLE_MAP[m?.toLowerCase()])
    .filter(Boolean)
    .map((slug) => ({ slug, intensity }));

export default function RoutinesScreen() {
  const { theme } = useTheme();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [ejercicioModal, setEjercicioModal] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);

  const loadData = async () => {
    try {
      const [rutinaRes, usageRes] = await Promise.all([
        api.get('/routines/active').catch(() => null),
        api.get('/users/usage').catch(() => null),
      ]);
      setRutina(rutinaRes?.data || null);
      setUsageInfo(usageRes?.data || null);
    } catch {
      setRutina(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generarRutina = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/routines/generate');
      setRutina(res.data);
      setDiaSeleccionado(0);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al generar rutina';
      const esLimite = err.response?.data?.limite;
      Alert.alert(
        esLimite ? 'Límite alcanzado' : 'Error',
        msg,
        esLimite ? [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => {} },
        ] : [{ text: 'OK' }]
      );
    } finally {
      setGenerating(false);
    }
  };

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
            onPress={generarRutina}
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
      </SafeAreaView>
    );
  }

  const dias = rutina.ejercicios || [];
  const diaActual = dias[diaSeleccionado] || {};
  const ejerciciosHoy = diaActual.ejercicios || [];

  const musculosHoy = [
    ...mapMuscles(ejerciciosHoy.flatMap((e) => e.musculos || []), 2),
    ...mapMuscles(ejerciciosHoy.flatMap((e) => e.musculosSecundarios || []), 1),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
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
            onPress={generarRutina}
            disabled={generating}
          >
            <Ionicons name="refresh" size={18} color={theme.primary} />
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
            <View style={{ alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, paddingVertical: 8, borderWidth: 1, borderColor: theme.border }}>
              <Body
                data={musculosHoy}
                gender="male"
                side="both"
                scale={width < 380 ? 0.8 : 0.9}
                colors={[theme.border, theme.primary]}
              />
            </View>
          </View>
        )}

        {/* Lista de ejercicios */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
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
                <Image source={{ uri: ejercicio.gifUrl }} style={{ width: 72, height: 72 }} />
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
                    source={{ uri: ejercicioModal.gifUrl }}
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
    </SafeAreaView>
  );
}
