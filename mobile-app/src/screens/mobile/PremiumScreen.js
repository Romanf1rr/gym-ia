import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../store/authStore';

const { width } = Dimensions.get('window');

const FEATURES_PREMIUM = [
  { icon: 'sparkles', text: 'Rutinas IA ilimitadas', sub: 'Generá cuantas quieras, cuando quieras' },
  { icon: 'restaurant', text: 'Planes nutricionales ilimitados', sub: 'Dieta siempre actualizada a tu objetivo' },
  { icon: 'chatbubble-ellipses', text: 'Chat con Chris sin límites', sub: 'Consultas ilimitadas con tu coach IA' },
  { icon: 'camera', text: 'Análisis de fotos ilimitado', sub: 'Seguí tu progreso visual sin restricciones' },
  { icon: 'trophy', text: 'Acceso a retos fitness', sub: 'Competí y ganá premios reales' },
  { icon: 'flash', text: 'Soporte prioritario', sub: 'Atención directa con tu entrenador' },
];

const FEATURES_FREE = [
  { text: '1 rutina cada 15 días', ok: false },
  { text: '1 plan nutricional cada 15 días', ok: false },
  { text: '20 mensajes con Chris por semana', ok: false },
  { text: '1 análisis de foto por mes', ok: false },
];

export default function PremiumScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [planSeleccionado, setPlanSeleccionado] = useState('anual');

  const isPremium = user?.plan === 'premium';

  const handleSuscribirse = () => {
    Alert.alert(
      '¡Activar Premium!',
      'Para activar tu cuenta Premium contactá a tu entrenador o escribinos por WhatsApp y te lo activamos en minutos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Contactar entrenador', onPress: () => {
          Alert.alert('Contacto', 'Tu entrenador recibirá una notificación para activar tu cuenta Premium.');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        {isPremium && (
          <View style={{ marginLeft: 12, backgroundColor: theme.yellow + '25', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.yellow + '50' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.yellow }}>YA ERES PREMIUM ✓</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.yellow + '25', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: theme.yellow + '60' }}>
            <Text style={{ fontSize: 38 }}>👑</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text, textAlign: 'center' }}>
            Gym IA Premium
          </Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            Entrenamiento y nutrición sin límites,{'\n'}potenciados con IA
          </Text>
        </View>

        {/* Selector de plan */}
        {!isPremium && (
          <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 24 }}>
            <TouchableOpacity
              style={{ flex: 1, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: planSeleccionado === 'mensual' ? theme.primary : theme.border, backgroundColor: planSeleccionado === 'mensual' ? theme.primary + '10' : theme.card, alignItems: 'center' }}
              onPress={() => setPlanSeleccionado('mensual')}
            >
              <Text style={{ fontSize: 13, color: planSeleccionado === 'mensual' ? theme.primary : theme.textMuted, fontWeight: '600', marginBottom: 4 }}>MENSUAL</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: planSeleccionado === 'mensual' ? theme.primary : theme.text }}>$9.99</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>por mes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: planSeleccionado === 'anual' ? theme.yellow : theme.border, backgroundColor: planSeleccionado === 'anual' ? theme.yellow + '10' : theme.card, alignItems: 'center', position: 'relative' }}
              onPress={() => setPlanSeleccionado('anual')}
            >
              <View style={{ position: 'absolute', top: -10, backgroundColor: theme.yellow, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#000' }}>AHORRÁS 33%</Text>
              </View>
              <Text style={{ fontSize: 13, color: planSeleccionado === 'anual' ? theme.yellow : theme.textMuted, fontWeight: '600', marginBottom: 4 }}>ANUAL</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: planSeleccionado === 'anual' ? theme.yellow : theme.text }}>$79.99</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>$6.67/mes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Features Premium */}
        <View style={{ marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Todo lo que incluye</Text>
          {FEATURES_PREMIUM.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: i < FEATURES_PREMIUM.length - 1 ? 16 : 0 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={f.icon} size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{f.text}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{f.sub}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            </View>
          ))}
        </View>

        {/* Comparación Free */}
        <View style={{ marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 28 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Plan gratuito (limitado)</Text>
          {FEATURES_FREE.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < FEATURES_FREE.length - 1 ? 10 : 0 }}>
              <Ionicons name="close-circle" size={20} color={theme.red} />
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {!isPremium ? (
          <View style={{ marginHorizontal: 20 }}>
            <TouchableOpacity
              style={{ backgroundColor: planSeleccionado === 'anual' ? theme.yellow : theme.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12, shadowColor: planSeleccionado === 'anual' ? theme.yellow : theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
              onPress={handleSuscribirse}
            >
              <Text style={{ fontSize: 17, fontWeight: '900', color: planSeleccionado === 'anual' ? '#000' : '#fff' }}>
                Activar Premium {planSeleccionado === 'anual' ? '· $79.99/año' : '· $9.99/mes'}
              </Text>
              <Text style={{ fontSize: 12, color: planSeleccionado === 'anual' ? '#00000080' : '#ffffff80', marginTop: 3 }}>
                Cancelá cuando quieras
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: 13, color: theme.textMuted }}>Continuar con plan gratuito</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginHorizontal: 20, backgroundColor: theme.primary + '15', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.primary + '40', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={36} color={theme.primary} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 10 }}>¡Ya tenés Premium activo!</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>
              Disfrutá de todas las funciones sin límites
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
