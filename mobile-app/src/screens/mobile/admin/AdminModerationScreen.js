import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../../services/api/api.service';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdminModerationScreen() {
  const { theme } = useTheme();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('frente');

  const loadFotos = async () => {
    try {
      const res = await api.get('/admin/photos');
      setFotos(res.data || []);
    } catch {
      setFotos([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadFotos(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFotos();
    setRefreshing(false);
  };

  const eliminarFoto = async (fotoId) => {
    Alert.alert('Eliminar foto', '¿Eliminar esta foto y notificar al usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/photos/${fotoId}`);
            setFotos((prev) => prev.filter((f) => f.id !== fotoId));
            setFotoSeleccionada(null);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const suspenderUsuario = async (userId) => {
    Alert.alert('Suspender usuario', '¿Suspender al usuario por contenido inapropiado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Suspender',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/admin/users/${userId}/status`, { activo: false });
            setFotoSeleccionada(null);
            Alert.alert('Listo', 'Usuario suspendido');
          } catch {
            Alert.alert('Error', 'No se pudo suspender');
          }
        },
      },
    ]);
  };

  const renderFoto = ({ item }) => (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, marginBottom: 10, overflow: 'hidden', gap: 12, borderWidth: 1, borderColor: theme.border }}
      onPress={() => { setFotoSeleccionada(item); setVistaActual('frente'); }}
    >
      <Image source={{ uri: item.fotoFrenteUrl }} style={{ width: 72, height: 72 }} />
      <View style={{ flex: 1, paddingVertical: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{item.usuario?.nombre || 'Usuario'}</Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{item.usuario?.email}</Text>
        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString('es')}</Text>
        {item.analisisIA?.flagged && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="warning" size={12} color={theme.red} />
            <Text style={{ fontSize: 11, color: theme.red }}>Contenido flaggeado</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const fotoUrl = fotoSeleccionada
    ? { frente: fotoSeleccionada.fotoFrenteUrl, lateral: fotoSeleccionada.fotoLateralUrl, espalda: fotoSeleccionada.fotoEspaldaUrl }[vistaActual]
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>Moderación ({fotos.length})</Text>
      </View>

      {fotos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark-outline" size={64} color={theme.border} />
          <Text style={{ color: theme.textMuted, fontSize: 15, marginTop: 12 }}>Sin fotos para revisar</Text>
        </View>
      ) : (
        <FlatList
          data={fotos}
          keyExtractor={(item) => item.id}
          renderItem={renderFoto}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        />
      )}

      {/* Modal de revisión */}
      <Modal visible={!!fotoSeleccionada} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Revisar fotos</Text>
              <TouchableOpacity onPress={() => setFotoSeleccionada(null)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Selector de ángulo */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {['frente', 'lateral', 'espalda'].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: vistaActual === a ? theme.primary : theme.bg, alignItems: 'center', borderWidth: 1, borderColor: vistaActual === a ? theme.primary : theme.border }}
                  onPress={() => setVistaActual(a)}
                >
                  <Text style={{ color: vistaActual === a ? '#fff' : theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {fotoUrl && (
              <Image source={{ uri: fotoUrl }} style={{ width: '100%', height: 300, borderRadius: 12, backgroundColor: theme.bg, marginBottom: 12 }} resizeMode="contain" />
            )}

            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              {fotoSeleccionada?.usuario?.nombre} — {fotoSeleccionada?.usuario?.email}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.red, padding: 14, borderRadius: 12 }}
                onPress={() => eliminarFoto(fotoSeleccionada?.id)}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Eliminar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#b91c1c', padding: 14, borderRadius: 12 }}
                onPress={() => suspenderUsuario(fotoSeleccionada?.userId)}
              >
                <Ionicons name="ban" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Suspender usuario</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
