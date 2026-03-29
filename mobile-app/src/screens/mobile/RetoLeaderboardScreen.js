import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RetoLeaderboardScreen({ route, navigation }) {
  const { retoId, titulo } = route.params;
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/retos/${retoId}/leaderboard`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [retoId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }} numberOfLines={1}>{titulo}</Text>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>Ranking</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !data ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.textMuted }}>No se pudo cargar el ranking</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Reto info */}
          <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primary }}>{data.reto.meta}</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{data.reto.unidad}</Text>
                <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>Meta</Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{data.leaderboard.length}</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>participantes</Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#92400e' }}>🏆</Text>
                <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2, textAlign: 'center' }} numberOfLines={2}>{data.reto.premio}</Text>
              </View>
            </View>
          </View>

          {/* Lista */}
          {data.leaderboard.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <Ionicons name="people-outline" size={48} color={theme.border} />
              <Text style={{ fontSize: 15, color: theme.textMuted, marginTop: 12 }}>Nadie en el ranking aún</Text>
            </View>
          ) : (
            data.leaderboard.map((p) => (
              <View
                key={p.userId}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: p.esMio ? theme.primary + '12' : theme.card,
                  borderRadius: 14, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: p.esMio ? theme.primary + '40' : theme.border,
                }}
              >
                {/* Posición */}
                <View style={{ width: 32, alignItems: 'center' }}>
                  {MEDAL[p.posicion]
                    ? <Text style={{ fontSize: 22 }}>{MEDAL[p.posicion]}</Text>
                    : <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textMuted }}>#{p.posicion}</Text>
                  }
                </View>

                {/* Nombre */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                    {p.nombre} {p.esMio ? '(Tú)' : ''}
                  </Text>
                  {p.completado && (
                    <Text style={{ fontSize: 11, color: theme.primary, marginTop: 1 }}>✓ Completado</Text>
                  )}
                </View>

                {/* Progreso */}
                <Text style={{ fontSize: 16, fontWeight: '800', color: p.completado ? theme.primary : theme.text }}>
                  {p.progreso} <Text style={{ fontSize: 11, fontWeight: '400', color: theme.textMuted }}>{data.reto.unidad}</Text>
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
