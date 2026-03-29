import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../../services/api/api.service';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const acciones = [
    { label: 'Usuarios', icon: 'people', color: theme.primary, screen: 'AdminUsers' },
    { label: 'Moderación', icon: 'shield-checkmark', color: theme.red, screen: 'AdminModeration' },
    { label: 'Retos', icon: 'trophy', color: '#92400e', screen: 'AdminRetos' },
  ];

  const statItems = [
    { label: 'Total usuarios', value: stats?.totalUsuarios ?? '—', icon: 'people', color: theme.primary },
    { label: 'Premium', value: stats?.usuariosPremium ?? '—', icon: 'star', color: theme.yellow },
    { label: 'Activos hoy', value: stats?.activosHoy ?? '—', icon: 'pulse', color: theme.primary },
    { label: 'Llamadas IA hoy', value: stats?.llamadasIA ?? '—', icon: 'sparkles', color: theme.orange },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Panel Admin</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: theme.red }}>
            <Ionicons name="shield" size={12} color={theme.red} />
            <Text style={{ fontSize: 10, color: theme.red, fontWeight: 'bold' }}>ADMIN</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 24 }}>
          {statItems.map((s) => (
            <View key={s.label} style={{ width: (width - 44) / 2, backgroundColor: theme.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: theme.border }}>
              <Ionicons name={s.icon} size={22} color={s.color} />
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: theme.text }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Gestión */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 14 }}>Gestión</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {acciones.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={{ flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border }}
                onPress={() => navigation.navigate(a.screen)}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: a.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={a.icon} size={28} color={a.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, textAlign: 'center' }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Costo estimado IA */}
        {stats?.costoEstimadoHoy !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 32, backgroundColor: theme.card, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: theme.yellow, borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="card-outline" size={20} color={theme.yellow} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Costo estimado IA hoy</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.yellow, marginTop: 2 }}>${stats.costoEstimadoHoy?.toFixed(4)} USD</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
