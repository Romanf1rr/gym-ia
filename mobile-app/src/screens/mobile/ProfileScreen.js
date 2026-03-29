import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const isPremium = user?.plan === 'premium';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Header con info del usuario */}
        <View style={{ alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: theme.border, position: 'relative' }}>
          {/* Toggle theme button */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ position: 'absolute', top: 16, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name={theme.isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={{ width: 96, height: 96, backgroundColor: theme.card, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: theme.primary }}>
            <Ionicons name="person" size={48} color={theme.primary} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
              {user?.nombre} {user?.apellido}
            </Text>
            <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: isPremium ? theme.yellow + '33' : theme.border }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isPremium ? theme.yellow : theme.textSecondary }}>
                {isPremium ? 'PREMIUM' : 'FREE'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>{user?.email}</Text>
        </View>

        {/* Información Personal */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
            Información Personal
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, color: theme.text, marginLeft: 12 }}>Editar Perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('PhysicalProfile')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="body-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, color: theme.text, marginLeft: 12 }}>Perfil Físico</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
            onPress={() => navigation.navigate('Objetivos')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flag-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, color: theme.text, marginLeft: 12 }}>Objetivos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Configuración */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
            Configuración
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, color: theme.text, marginLeft: 12 }}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, color: theme.text, marginLeft: 12 }}>Privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.red }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.red} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.red, marginLeft: 8 }}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
