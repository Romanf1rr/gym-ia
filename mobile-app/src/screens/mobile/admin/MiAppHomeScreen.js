import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../store/authStore';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

const SECCIONES = [
  {
    name: 'MiDashboard',
    label: 'Inicio',
    descripcion: 'Resumen y acciones rápidas',
    icon: 'home',
    color: 'primary',
  },
  {
    name: 'Rutinas',
    label: 'Rutinas',
    descripcion: 'Tu plan de entrenamiento',
    icon: 'barbell',
    color: 'primary',
  },
  {
    name: 'Nutrición',
    label: 'Nutrición',
    descripcion: 'Plan de dieta personalizado',
    icon: 'restaurant',
    color: 'orange',
  },
  {
    name: 'Chat',
    label: 'Chat IA',
    descripcion: 'Asistente de fitness',
    icon: 'chatbubble-ellipses',
    color: 'primary',
  },
  {
    name: 'Perfil',
    label: 'Mi Perfil',
    descripcion: 'Datos personales y ajustes',
    icon: 'person',
    color: 'primary',
  },
  {
    name: 'Progress',
    label: 'Progreso',
    descripcion: 'Historial y métricas',
    icon: 'trending-up',
    color: 'yellow',
  },
];

export default function MiAppHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();

  const getColor = (colorKey) => {
    const map = { primary: theme.primary, orange: theme.orange, yellow: theme.yellow, red: theme.red };
    return map[colorKey] || theme.primary;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Mi App</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Hola, {user?.nombre}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: theme.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.border, marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center' }}>
              Vista de cliente — estás viendo la app como usuario
            </Text>
          </View>
        </View>

        {/* Grid de secciones */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SECCIONES.map((sec) => {
            const color = getColor(sec.color);
            return (
              <TouchableOpacity
                key={sec.name}
                style={{
                  width: CARD_SIZE,
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: theme.border,
                  gap: 10,
                }}
                onPress={() => navigation.navigate(sec.name)}
                activeOpacity={0.75}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: color + '18',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name={sec.icon} size={24} color={color} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 }}>
                    {sec.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 16 }}>
                    {sec.descripcion}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textMuted}
                  style={{ position: 'absolute', top: 18, right: 14 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
