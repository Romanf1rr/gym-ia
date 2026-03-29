import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const formatDuracion = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function WorkoutSummaryScreen({ route, navigation }) {
  const { rutina, diaIndex, ejerciciosLog, duracion } = route.params;
  const { theme } = useTheme();
  const dia = rutina.ejercicios[diaIndex];

  const totalSeries = ejerciciosLog.reduce(
    (acc, ej) => acc + (ej.seriesCompletadas?.filter(s => s.completada)?.length || 0), 0
  );
  const totalVolumen = ejerciciosLog.reduce((acc, ej) => {
    return acc + (ej.seriesCompletadas?.reduce(
      (a, s) => a + (s.completada ? (s.peso || 0) * (s.reps || 0) : 0), 0
    ) || 0);
  }, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Trophy header */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="trophy" size={44} color={theme.primary} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text }}>¡Sesión completada!</Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary, marginTop: 6 }}>{dia.nombreDia}</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          {[
            { icon: 'time-outline', label: 'Duración', value: formatDuracion(duracion) },
            { icon: 'barbell-outline', label: 'Series', value: String(totalSeries) },
            { icon: 'trending-up', label: 'Volumen', value: totalVolumen > 0 ? `${totalVolumen}kg` : '—' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <Ionicons name={item.icon} size={22} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 6 }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Exercise detail */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Detalle por ejercicio</Text>
        {ejerciciosLog.map((ej, i) => {
          const completadas = ej.seriesCompletadas?.filter(s => s.completada) || [];
          return (
            <View key={i} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 8 }}>{ej.nombre}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {completadas.length > 0 ? completadas.map((s, si) => (
                  <View key={si} style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>
                      #{s.serie} {s.peso > 0 ? `${s.peso}kg × ` : ''}{s.reps} reps
                    </Text>
                  </View>
                )) : (
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Sin series completadas</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Back button */}
        <TouchableOpacity
          style={{ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, marginBottom: 32 }}
          onPress={() => navigation.navigate('RoutinesMain')}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Volver a mis rutinas</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
