import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../services/api/api.service';

const TIPOS = [
  { key: 'entrenamientos', label: 'Entrenamientos', icon: 'barbell-outline' },
  { key: 'volumen', label: 'Volumen (kg)', icon: 'trending-up-outline' },
  { key: 'calorias', label: 'Calorías', icon: 'flame-outline' },
  { key: 'pasos_libres', label: 'Actividad libre', icon: 'walk-outline' },
];

const UNIDADES = {
  entrenamientos: 'entrenamientos',
  volumen: 'kg',
  calorias: 'kcal',
  pasos_libres: 'días activos',
};

export default function AdminRetosScreen({ navigation }) {
  const { theme } = useTheme();
  const [retos, setRetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    titulo: '', descripcion: '', tipo: 'entrenamientos',
    meta: '', premio: '', fechaInicio: '', fechaFin: '',
  });

  const loadRetos = async () => {
    try {
      const res = await api.get('/retos/admin/todos');
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

  const crearReto = async () => {
    const { titulo, descripcion, tipo, meta, premio, fechaInicio, fechaFin } = form;
    if (!titulo || !descripcion || !meta || !premio || !fechaInicio || !fechaFin) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/retos', {
        titulo, descripcion, tipo,
        meta: parseFloat(meta),
        unidad: UNIDADES[tipo],
        premio, fechaInicio, fechaFin,
      });
      setShowModal(false);
      setForm({ titulo: '', descripcion: '', tipo: 'entrenamientos', meta: '', premio: '', fechaInicio: '', fechaFin: '' });
      await loadRetos();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo crear el reto');
    } finally {
      setGuardando(false);
    }
  };

  const toggleReto = async (reto) => {
    try {
      await api.patch(`/retos/${reto.id}/toggle`);
      await loadRetos();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el reto');
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
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>Retos</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 }}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Nuevo reto</Text>
          </TouchableOpacity>
        </View>

        {retos.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="trophy-outline" size={56} color={theme.border} />
            <Text style={{ fontSize: 16, color: theme.textMuted, marginTop: 16 }}>Sin retos creados</Text>
          </View>
        ) : (
          retos.map((reto) => (
            <View key={reto.id} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: reto.activo ? theme.border : theme.border + '60', opacity: reto.activo ? 1 : 0.6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.text, marginRight: 10 }}>{reto.titulo}</Text>
                <View style={{ backgroundColor: reto.activo ? theme.primary + '20' : theme.border + '40', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: reto.activo ? theme.primary : theme.textMuted }}>
                    {reto.activo ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10 }}>{reto.descripcion}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: theme.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Meta: {reto.meta} {reto.unidad}</Text>
                </View>
                <View style={{ backgroundColor: theme.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                    {new Date(reto.fechaInicio).toLocaleDateString('es')} → {new Date(reto.fechaFin).toLocaleDateString('es')}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, color: '#92400e' }}>🏆 {reto.premio}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: reto.activo ? theme.red + '60' : theme.primary + '60', backgroundColor: reto.activo ? theme.red + '10' : theme.primary + '10' }}
                onPress={() => toggleReto(reto)}
              >
                <Ionicons name={reto.activo ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={reto.activo ? theme.red : theme.primary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: reto.activo ? theme.red : theme.primary }}>
                  {reto.activo ? 'Desactivar' : 'Activar'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal crear reto */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Nuevo reto</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Título', key: 'titulo', placeholder: 'Ej: Reto 30 días de entreno' },
                { label: 'Descripción', key: 'descripcion', placeholder: 'Descripción breve del reto' },
                { label: 'Meta (número)', key: 'meta', placeholder: 'Ej: 20', keyboard: 'decimal-pad' },
                { label: 'Premio', key: 'premio', placeholder: 'Ej: 1kg de proteína whey' },
                { label: 'Fecha inicio (YYYY-MM-DD)', key: 'fechaInicio', placeholder: '2026-04-01' },
                { label: 'Fecha fin (YYYY-MM-DD)', key: 'fechaFin', placeholder: '2026-04-30' },
              ].map((f) => (
                <View key={f.key} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 6 }}>{f.label}</Text>
                  <TextInput
                    style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: theme.border }}
                    placeholder={f.placeholder}
                    placeholderTextColor={theme.textMuted}
                    keyboardType={f.keyboard || 'default'}
                    value={form[f.key]}
                    onChangeText={(v) => setForm(p => ({ ...p, [f.key]: v }))}
                  />
                </View>
              ))}

              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 10 }}>Tipo de reto</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: form.tipo === t.key ? theme.primary : theme.card, borderWidth: 1, borderColor: form.tipo === t.key ? theme.primary : theme.border }}
                    onPress={() => setForm(p => ({ ...p, tipo: t.key }))}
                  >
                    <Ionicons name={t.icon} size={14} color={form.tipo === t.key ? '#fff' : theme.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: form.tipo === t.key ? '#fff' : theme.textSecondary }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{ backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 8 }}
                onPress={crearReto}
                disabled={guardando}
              >
                {guardando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Crear reto</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
