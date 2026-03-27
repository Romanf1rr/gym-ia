import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../../services/api/api.service';
import { useTheme } from '../../../context/ThemeContext';

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const loadUsuarios = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsuarios(res.data || []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadUsuarios(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsuarios();
    setRefreshing(false);
  };

  const cambiarPlan = async (userId, planActual) => {
    const nuevoPlan = planActual === 'premium' ? 'free' : 'premium';
    Alert.alert(
      'Cambiar plan',
      `¿Cambiar a ${nuevoPlan.toUpperCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.put(`/admin/users/${userId}/plan`, { plan: nuevoPlan });
              setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, plan: nuevoPlan } : u));
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el plan');
            }
          },
        },
      ]
    );
  };

  const toggleActivo = async (userId, activo) => {
    Alert.alert(
      activo ? 'Suspender usuario' : 'Reactivar usuario',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: activo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`/admin/users/${userId}/status`, { activo: !activo });
              setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, activo: !activo } : u));
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          },
        },
      ]
    );
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const renderUsuario = ({ item }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: theme.border, opacity: item.activo ? 1 : 0.5 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>{item.nombre?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{item.nombre} {item.apellido}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: item.plan === 'premium' ? theme.yellow + '25' : theme.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: item.plan === 'premium' ? theme.yellow : theme.textMuted }}>
              {item.plan?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{item.email}</Text>
        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
          {!item.activo ? '⚠ Suspendido' : `Desde ${new Date(item.createdAt).toLocaleDateString('es')}`}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <TouchableOpacity onPress={() => cambiarPlan(item.id, item.plan)} style={{ padding: 6, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <Ionicons name="star" size={16} color={theme.yellow} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleActivo(item.id, item.activo)} style={{ padding: 6, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <Ionicons name={item.activo ? 'ban' : 'checkmark-circle'} size={16} color={item.activo ? theme.red : theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>Usuarios ({usuarios.length})</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border }}>
        <Ionicons name="search" size={16} color={theme.textMuted} />
        <TextInput
          style={{ flex: 1, color: theme.text, fontSize: 14 }}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={theme.textMuted}
        />
      </View>
      <FlatList
        data={usuariosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderUsuario}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: theme.textMuted, marginTop: 60, fontSize: 15 }}>No hay usuarios</Text>
        }
      />
    </SafeAreaView>
  );
}
