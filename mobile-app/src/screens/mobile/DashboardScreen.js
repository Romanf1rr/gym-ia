import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [physicalProfile, setPhysicalProfile] = useState(null);
  const [calories, setCalories] = useState(0);

  const loadData = async () => {
    try {
      const [profileRes, nutritionRes] = await Promise.all([
        api.get('/physical-profiles').catch(() => ({ data: [] })),
        api.get('/nutrition/today').catch(() => ({ data: null })),
      ]);

      if (profileRes.data && profileRes.data.length > 0) {
        setPhysicalProfile(profileRes.data[0]);
      } else {
        setPhysicalProfile(null);
      }

      if (nutritionRes.data && nutritionRes.data.totales) {
        setCalories(nutritionRes.data.totales.calorias || 0);
      } else {
        setCalories(0);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={{ paddingHorizontal: width * 0.06, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: width > 400 ? 28 : 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
            ¡Hola, {user?.nombre}!
          </Text>
          <Text style={{ fontSize: width > 400 ? 16 : 14, color: theme.textSecondary }}>
            Listo para entrenar hoy
          </Text>
        </View>

        {/* Resumen rápido */}
        <View style={{ flexDirection: 'row', paddingHorizontal: width * 0.04, marginBottom: height * 0.03, gap: width * 0.03 }}>
          <View style={{ flex: 1, backgroundColor: theme.card, padding: width * 0.04, borderRadius: 12, alignItems: 'center', minHeight: 110, justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="flame" size={32} color={theme.orange} />
            <Text style={{ fontSize: width > 400 ? 24 : 20, fontWeight: 'bold', color: theme.text, marginTop: 8 }}>{Math.round(calories)}</Text>
            <Text style={{ fontSize: width > 400 ? 12 : 10, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>Calorías hoy</Text>
          </View>

          <TouchableOpacity
            style={{ flex: 1, backgroundColor: theme.card, padding: width * 0.04, borderRadius: 12, alignItems: 'center', minHeight: 110, justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('Rutinas')}
          >
            <Ionicons name="fitness" size={32} color={theme.primary} />
            <Text style={{ fontSize: width > 400 ? 14 : 12, fontWeight: '600', color: theme.primary, marginTop: 8 }}>Ver rutina</Text>
            <Text style={{ fontSize: width > 400 ? 12 : 10, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>Entrenamientos</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, backgroundColor: theme.card, padding: width * 0.04, borderRadius: 12, alignItems: 'center', minHeight: 110, justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="trending-up" size={32} color={theme.primaryLight} />
            <Text style={{ fontSize: width > 400 ? 24 : 20, fontWeight: 'bold', color: theme.text, marginTop: 8 }}>
              {physicalProfile ? `${physicalProfile.peso}kg` : '—'}
            </Text>
            <Text style={{ fontSize: width > 400 ? 12 : 10, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>Peso actual</Text>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={{ paddingHorizontal: width * 0.06, marginBottom: height * 0.03 }}>
          <Text style={{ fontSize: width > 400 ? 18 : 16, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
            Acciones rápidas
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('PhysicalProfile')}
          >
            <View style={{ width: 48, height: 48, backgroundColor: theme.primary + '33', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="camera" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: width > 400 ? 16 : 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Registrar progreso</Text>
              <Text style={{ fontSize: width > 400 ? 14 : 12, color: theme.textSecondary }}>Toma fotos y actualiza mediciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('Nutrición')}
          >
            <View style={{ width: 48, height: 48, backgroundColor: theme.orange + '33', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="restaurant" size={24} color={theme.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: width > 400 ? 16 : 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Mi Dieta</Text>
              <Text style={{ fontSize: width > 400 ? 14 : 12, color: theme.textSecondary }}>Lleva el control de tu nutrición</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('Objetivos')}
          >
            <View style={{ width: 48, height: 48, backgroundColor: theme.primaryLight + '33', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="flag" size={24} color={theme.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: width > 400 ? 16 : 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Mis Objetivos</Text>
              <Text style={{ fontSize: width > 400 ? 14 : 12, color: theme.textSecondary }}>Define y revisa tus metas fitness</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Próximo entrenamiento */}
        <View style={{ paddingHorizontal: width * 0.06, marginBottom: height * 0.03 }}>
          <Text style={{ fontSize: width > 400 ? 18 : 16, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
            Próximo entrenamiento
          </Text>
          <View style={{ backgroundColor: theme.card, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: width > 400 ? 16 : 14, fontWeight: '600', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
              No tienes rutinas asignadas
            </Text>
            <Text style={{ fontSize: width > 400 ? 14 : 12, color: theme.textSecondary, textAlign: 'center' }}>
              Visita el gimnasio para crear tu plan personalizado
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
