import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

export default function DashboardScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.statValue}>0kg</Text>
          <Text style={styles.statLabel}>Peso actual</Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        
        <TouchableOpacity style={styles.actionCard}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  workoutCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});