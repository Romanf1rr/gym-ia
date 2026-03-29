import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api/api.service';
import cache from '../../services/api/cache.service';

const { width } = Dimensions.get('window');

const getSaludo = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const FRASES_CHRIS = [
  { frase: 'No pares cuando estés cansado. Para cuando hayas terminado.', emoji: '🔥' },
  { frase: 'Cada rep cuenta. Cada kilo importa. Cada día te acerca.', emoji: '💪' },
  { frase: 'El dolor de hoy es la fuerza de mañana.', emoji: '⚡' },
  { frase: 'Tu cuerpo puede más de lo que tu mente cree.', emoji: '🧠' },
  { frase: 'Consistencia > intensidad. Aparece todos los días.', emoji: '📅' },
  { frase: 'No compares tu capítulo 1 con el capítulo 20 de otro.', emoji: '🎯' },
  { frase: 'Sé la versión de ti que necesitabas hace un año.', emoji: '🚀' },
  { frase: 'Un entreno malo es mejor que ningún entreno.', emoji: '✅' },
  { frase: 'Transforma el esfuerzo de hoy en resultados de mañana.', emoji: '💎' },
  { frase: 'La disciplina es elegir entre lo que quieres ahora y lo que querés más.', emoji: '🏆' },
  { frase: 'Pequeñas victorias diarias = grandes cambios con el tiempo.', emoji: '📈' },
  { frase: 'No se trata de ser perfecto. Se trata de ser mejor que ayer.', emoji: '⬆️' },
  { frase: 'La motivación te arranca, el hábito te mantiene.', emoji: '🔄' },
  { frase: 'Cada vez que querés parar, recordá por qué empezaste.', emoji: '💭' },
  { frase: 'La fuerza no viene del cuerpo. Viene de la voluntad.', emoji: '🦁' },
  { frase: 'El único mal entreno es el que no hiciste.', emoji: '🏋️' },
  { frase: 'Construite todos los días, ladrillo a ladrillo.', emoji: '🧱' },
  { frase: 'El sudor de hoy es el brillo de mañana.', emoji: '✨' },
  { frase: 'Confía en el proceso. Los resultados llegan.', emoji: '⏱️' },
  { frase: 'Sos más fuerte de lo que creés. Siempre.', emoji: '💯' },
];

const TIPS_DIA = [
  { tip: 'Hidratate antes, durante y después del entreno. La deshidratación baja la fuerza hasta un 15%.', icon: 'water-outline' },
  { tip: 'Dormir 7-9 horas es cuando el músculo crece. El gym lo rompe, el sueño lo construye.', icon: 'moon-outline' },
  { tip: 'La proteína post-entreno en los primeros 30-60 minutos maximiza la síntesis muscular.', icon: 'restaurant-outline' },
  { tip: 'El calentamiento no es opcional. Reduce lesiones y mejora el rendimiento en un 20%.', icon: 'flame-outline' },
  { tip: 'Los músculos necesitan 48-72 hs de descanso para recuperarse completamente.', icon: 'time-outline' },
  { tip: 'Más peso, menos reps = fuerza. Menos peso, más reps = resistencia. Sabé qué buscás.', icon: 'barbell-outline' },
  { tip: 'Comer cada 3-4 horas mantiene el metabolismo activo y estable la glucosa.', icon: 'nutrition-outline' },
  { tip: 'La respiración importa: exhalá en el esfuerzo, inhalá en la vuelta.', icon: 'body-outline' },
  { tip: 'Las grasas saludables (palta, nueces, aceite de oliva) son esenciales para las hormonas.', icon: 'leaf-outline' },
  { tip: 'El estrés eleva el cortisol, que destruye músculo. Manejarlo también es parte del entreno.', icon: 'heart-outline' },
  { tip: 'Registrar los pesos usados te ayuda a progresar semana a semana. ¡Anotalos!', icon: 'pencil-outline' },
  { tip: 'La creatina monohidratada es el suplemento con más evidencia científica. Segura y efectiva.', icon: 'flask-outline' },
  { tip: 'Calentar con el 50% del peso de trabajo hace más eficientes los sets principales.', icon: 'trending-up-outline' },
  { tip: 'Los carbohidratos no son el enemigo. Son el combustible preferido del músculo.', icon: 'sunny-outline' },
  { tip: 'La conexión mente-músculo importa. Sentí el músculo que trabajás en cada rep.', icon: 'bulb-outline' },
];

const getDayIndex = (arr) => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((new Date() - start) / 86400000);
  return day % arr.length;
};

function BannerChris({ theme }) {
  const { frase, emoji } = FRASES_CHRIS[getDayIndex(FRASES_CHRIS)];
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.primary + '15', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.primary + '30' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary + '25', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chris dice hoy</Text>
      </View>
      <Text style={{ fontSize: 14, color: theme.text, lineHeight: 21, fontStyle: 'italic' }}>
        {emoji}  "{frase}"
      </Text>
    </View>
  );
}

function TipDelDia({ theme }) {
  const { tip, icon } = TIPS_DIA[getDayIndex(TIPS_DIA)];
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#7C3AED20', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <Ionicons name={icon} size={18} color="#7C3AED" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tip del día</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>{tip}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [calorias, setCalorias] = useState({ consumidas: 0, meta: 2000 });
  const [peso, setPeso] = useState(null);

  const loadData = async (force = false) => {
    if (force) {
      cache.invalidate('dashboard:stats');
      cache.invalidate('dashboard:nutrition');
      cache.invalidate('dashboard:profile');
    }
    try {
      const [statsData, nutritionData, profileData] = await Promise.all([
        cache.fetch('dashboard:stats', () => api.get('/routines/workout/stats').then(r => r.data).catch(() => null), 60),
        cache.fetch('dashboard:nutrition', () => api.get('/nutrition/today').then(r => r.data).catch(() => null), 30),
        cache.fetch('dashboard:profile', () => api.get('/physical-profiles/latest').then(r => r.data).catch(() => null), 120),
      ]);

      setStats(statsData || null);
      setCalorias({
        consumidas: nutritionData?.totales?.calorias || 0,
        meta: 2000,
      });
      setPeso(profileData?.peso || null);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true); // force = true: bypass cache on manual pull-to-refresh
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const racha = stats?.rachaActual || 0;
  const entrenamientosSemana = stats?.entrenamientosEstaSemana || 0;
  const duracionSemana = stats?.duracionSemana || 0;
  const diasSemana = stats?.diasSemana || [];
  const proximoDia = stats?.proximoDia || null;
  const progresoCalorias = Math.min((calorias.consumidas / calorias.meta) * 100, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 2 }}>{getSaludo()}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text }}>{user?.nombre} 👋</Text>
          </View>
          {racha > 0 && (
            <View style={{ backgroundColor: theme.orange + '20', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.orange + '40' }}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.orange }}>{racha} días</Text>
            </View>
          )}
        </View>

        {/* Banner Chris */}
        <BannerChris theme={theme} />

        {/* Semana en curso */}
        <View style={{ marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Esta semana</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {diasSemana.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: d.esHoy ? theme.primary : theme.textMuted }}>{d.label}</Text>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: d.entrenado ? theme.primary : d.esHoy ? theme.primary + '20' : theme.bg,
                  borderWidth: d.esHoy && !d.entrenado ? 2 : 0,
                  borderColor: theme.primary,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {d.entrenado
                    ? <Ionicons name="checkmark" size={16} color="#fff" />
                    : d.esHoy
                    ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
                    : null
                  }
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 }}>
          {[
            { icon: 'barbell-outline', value: String(entrenamientosSemana), label: 'Entrenos', color: theme.primary },
            { icon: 'time-outline', value: duracionSemana > 0 ? `${duracionSemana}m` : '—', label: 'Minutos', color: theme.primaryLight },
            { icon: 'flame', value: racha > 0 ? `${racha}🔥` : '—', label: 'Racha', color: theme.orange },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
              <Ionicons name={item.icon} size={20} color={item.color} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 6 }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Próximo entrenamiento */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 10 }}>Próximo entrenamiento</Text>
          {proximoDia ? (
            <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="barbell" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{proximoDia.nombreDia}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>{proximoDia.cantidadEjercicios} ejercicios</Text>
                </View>
              </View>
              {proximoDia.musculos?.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {proximoDia.musculos.map(m => (
                    <View key={m} style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                      <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600', textTransform: 'capitalize' }}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={{ backgroundColor: theme.primary, paddingVertical: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onPress={() => navigation.navigate('Rutinas')}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Ir a entrenar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}
              onPress={() => navigation.navigate('Rutinas')}
            >
              <Ionicons name="add-circle-outline" size={32} color={theme.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary, marginTop: 8 }}>Generar mi rutina con IA</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Personalizada según tus objetivos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Calorías hoy */}
        <View style={{ marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flame" size={18} color={theme.orange} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Calorías hoy</Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              <Text style={{ fontWeight: '800', color: theme.text }}>{Math.round(calorias.consumidas)}</Text>
              {' / '}{calorias.meta} kcal
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: theme.bg, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
            <View style={{ height: '100%', width: `${progresoCalorias}%`, backgroundColor: theme.orange, borderRadius: 4 }} />
          </View>
          {calorias.consumidas === 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Nutrición')} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: theme.primary }}>Registrar comidas →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tip del día */}
        <TipDelDia theme={theme} />

        {/* Acciones rápidas */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Acciones rápidas</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: 'restaurant-outline', label: 'Mi dieta', color: theme.orange, dest: 'Nutrición' },
              { icon: 'trending-up-outline', label: 'Mi progreso', color: theme.primaryLight, dest: 'Progress' },
              { icon: 'flag-outline', label: 'Objetivos', color: theme.primary, dest: 'Objetivos' },
              { icon: 'chatbubble-ellipses-outline', label: 'Hablar con Chris', color: '#7C3AED', dest: 'Chat' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={{ width: (width - 50) / 2, backgroundColor: theme.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                onPress={() => navigation.navigate(item.dest)}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, flex: 1 }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Peso actual */}
        {peso && (
          <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: theme.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="body-outline" size={20} color={theme.primaryLight} />
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Peso actual: <Text style={{ fontWeight: '800', color: theme.text }}>{peso} kg</Text></Text>
            <TouchableOpacity onPress={() => navigation.navigate('PhysicalProfile')} style={{ marginLeft: 'auto' }}>
              <Text style={{ fontSize: 12, color: theme.primary }}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
