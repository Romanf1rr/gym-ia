import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store/authStore';
import { api } from '../../services/api/api.service';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [physicalProfile, setPhysicalProfile] = useState(null);

  const loadPhysicalProfile = async () => {
    try {
      const response = await api.get('/physical-profiles');
      
      if (response.data && response.data.length > 0) {
        const latestProfile = response.data[0];
        setPhysicalProfile(latestProfile);
      } else {
        setPhysicalProfile(null);
      }
    } catch (error) {
      console.error('Error cargando perfil físico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar datos cada vez que la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      loadPhysicalProfile();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhysicalProfile();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola, {user?.nombre}!</Text>
          <Text style={styles.subtitle}>Listo para entrenar hoy</Text>
        </View>

        {/* Resumen rápido */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={32} color="#f97316" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Calorías hoy</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="fitness" size={32} color="#8b5cf6" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={32} color="#10b981" />
            <Text style={styles.statValue}>
              {physicalProfile ? `${physicalProfile.peso}kg` : '0kg'}
            </Text>
            <Text style={styles.statLabel}>Peso actual</Text>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('PhysicalProfile')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Registrar progreso</Text>
              <Text style={styles.actionSubtitle}>Toma fotos y actualiza mediciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant" size={24} color="#f97316" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Registrar comida</Text>
              <Text style={styles.actionSubtitle}>Lleva el control de tu nutrición</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles" size={24} color="#10b981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Chat con IA</Text>
              <Text style={styles.actionSubtitle}>Pregunta sobre ejercicios y nutrición</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Próximo entrenamiento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximo entrenamiento</Text>
          <View style={styles.workoutCard}>
            <Text style={styles.workoutTitle}>No tienes rutinas asignadas</Text>
            <Text style={styles.workoutSubtitle}>Visita el gimnasio para crear tu plan personalizado</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: width * 0.06,
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: width > 400 ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
    color: '#94a3b8',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.03,
    gap: width * 0.03,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: width * 0.04,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: width > 400 ? 24 : 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: width > 400 ? 12 : 10,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.03,
  },
  sectionTitle: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#8b5cf6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    opacity: 0.2,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: width > 400 ? 16 : 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: width > 400 ? 14 : 12,
    color: '#94a3b8',
  },
  workoutCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: width > 400 ? 16 : 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  workoutSubtitle: {
    fontSize: width > 400 ? 14 : 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});