import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../store/authStore';
import { api } from '../../services/api/api.service';

const TIPO_CONFIG = {
  entrenamientos: { icon: 'barbell-outline', label: 'Entrenamientos', color: '#2563eb' },
  volumen:        { icon: 'trending-up-outline', label: 'Volumen levantado', color: '#7c3aed' },
  calorias:       { icon: 'flame-outline', label: 'Calorías quemadas', color: '#ea580c' },
  pasos_libres:   { icon: 'walk-outline', label: 'Actividad libre', color: '#0891b2' },
};

function diasRestantesLabel(dias) {
  if (dias === 0) return 'Último día';
  if (dias === 1) return '1 día restante';
  return `${dias} días restantes`;
}

function ProgressBar({ progreso, meta, color, theme }) {
  const pct = Math.min((progreso / (meta || 1)) * 100, 100);
  return (
    <View style={{ height: 7, backgroundColor: theme.bg, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, marginTop: 6 }}>
      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export default function RetosScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [retos, setRetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uniendose, setUniendose] = useState(null);

  // Modal actualizar progreso
  const [modalProgreso, setModalProgreso] = useState(null);
  const [nuevoProgreso, setNuevoProgreso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const loadRetos = async () => {
    try {
      const res = await api.get('/retos');
      setRetos(res.data || []);
    } catch {
      setRetos([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadRetos(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRetos();
    setRefreshing(false);
  };

  const unirse = async (retoId) => {
    setUniendose(retoId);
    try {
      await api.post(`/retos/${retoId}/unirse`);
      await loadRetos();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo unir al reto');
    } finally {
      setUniendose(null);
    }
  };

  const guardarProgreso = async () => {
    if (!nuevoProgreso || isNaN(parseFloat(nuevoProgreso))) {
      Alert.alert('Error', 'Ingresá un valor válido');
      return;
    }
    setGuardando(true);
    try {
      await api.patch(`/retos/${modalProgreso.id}/progreso`, {
        progreso: parseFloat(nuevoProgreso),
      });
      setModalProgreso(null);
      setNuevoProgreso('');
      await loadRetos();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo actualizar el progreso');
    } finally {
      setGuardando(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>Retos</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>
            Competí, superá tu límite y ganá premios
          </Text>
        </View>

        {retos.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Ionicons name="trophy-outline" size={64} color={theme.border} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16 }}>
              Sin retos activos
            </Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              Pronto habrá nuevos desafíos disponibles. ¡Volvé más tarde!
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {retos.map((reto) => {
              const config = TIPO_CONFIG[reto.tipo] || TIPO_CONFIG.pasos_libres;
              const participo = !!reto.miParticipacion;
              const progreso = reto.miParticipacion?.progreso || 0;
              const completado = reto.miParticipacion?.completado || false;
              const pct = Math.min(Math.round((progreso / reto.meta) * 100), 100);

              return (
                <View key={reto.id} style={{ backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: completado ? config.color + '60' : theme.border, overflow: 'hidden' }}>
                  {/* Accent top bar */}
                  <View style={{ height: 4, backgroundColor: config.color }} />

                  <View style={{ padding: 18 }}>
                    {/* Título + badge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, lineHeight: 22 }}>{reto.titulo}</Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{reto.descripcion}</Text>
                      </View>
                      {completado ? (
                        <View style={{ backgroundColor: config.color + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: config.color }}>✓ Completado</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: theme.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted }}>{diasRestantesLabel(reto.diasRestantes)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Stats row */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: config.color + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                        <Ionicons name={config.icon} size={13} color={config.color} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: config.color }}>
                          Meta: {reto.meta} {reto.unidad}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                        <Ionicons name="people-outline" size={13} color={theme.textMuted} />
                        <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600' }}>{reto.participantes} participantes</Text>
                      </View>
                    </View>

                    {/* Premio */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14 }}>
                      <Text style={{ fontSize: 16 }}>🏆</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400e', flex: 1 }}>{reto.premio}</Text>
                    </View>

                    {/* Progreso (si participa) */}
                    {participo && (
                      <View style={{ marginBottom: 14 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>Tu progreso</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: config.color }}>
                            {progreso} / {reto.meta} {reto.unidad} ({pct}%)
                          </Text>
                        </View>
                        <ProgressBar progreso={progreso} meta={reto.meta} color={config.color} theme={theme} />
                      </View>
                    )}

                    {/* Acciones */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {!participo ? (
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: config.color, paddingVertical: 13, borderRadius: 12 }}
                          onPress={() => unirse(reto.id)}
                          disabled={uniendose === reto.id}
                        >
                          {uniendose === reto.id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <>
                                <Ionicons name="flag-outline" size={16} color="#fff" />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Unirse al reto</Text>
                              </>
                          }
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.primary, paddingVertical: 12, borderRadius: 12 }}
                            onPress={() => { setModalProgreso(reto); setNuevoProgreso(String(progreso)); }}
                          >
                            <Ionicons name="add-circle-outline" size={16} color="#fff" />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Actualizar progreso</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}
                            onPress={() => navigation.navigate('RetoLeaderboard', { retoId: reto.id, titulo: reto.titulo })}
                          >
                            <Ionicons name="podium-outline" size={16} color={theme.primary} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>Ranking</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal actualizar progreso */}
      <Modal visible={!!modalProgreso} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 12, marginBottom: 6 }}>
              Actualizar progreso
            </Text>
            {modalProgreso && (
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>
                {modalProgreso.titulo} · Meta: {modalProgreso.meta} {modalProgreso.unidad}
              </Text>
            )}
            <TextInput
              style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 14, padding: 16, fontSize: 22, fontWeight: '800', textAlign: 'center', borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}
              keyboardType="decimal-pad"
              value={nuevoProgreso}
              onChangeText={setNuevoProgreso}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            {modalProgreso && (
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginBottom: 20 }}>
                {modalProgreso.unidad}
              </Text>
            )}
            <TouchableOpacity
              style={{ backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}
              onPress={guardarProgreso}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Guardar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center' }}
              onPress={() => { setModalProgreso(null); setNuevoProgreso(''); }}
            >
              <Text style={{ fontSize: 14, color: theme.textMuted }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
