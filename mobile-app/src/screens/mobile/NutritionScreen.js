import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api/api.service';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const RESTRICCIONES_OPCIONES = [
  { key: 'ninguna', label: 'Sin restricciones' },
  { key: 'vegetariano', label: 'Vegetariano' },
  { key: 'vegano', label: 'Vegano' },
  { key: 'sin_gluten', label: 'Sin gluten' },
  { key: 'sin_lactosa', label: 'Sin lactosa' },
  { key: 'bajo_carbos', label: 'Bajo en carbos' },
];

export default function NutritionScreen() {
  const { theme } = useTheme();
  const [plan, setPlan] = useState(null);
  const [comidasHoy, setComidasHoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);

  // Modal de preferencias
  const [showModal, setShowModal] = useState(false);
  const [alergias, setAlergias] = useState('');
  const [restriccionSeleccionada, setRestriccionSeleccionada] = useState('ninguna');
  const [gustos, setGustos] = useState('');
  const [noGustos, setNoGustos] = useState('');

  const loadData = async () => {
    try {
      const [planRes, hoyRes, usageRes] = await Promise.all([
        api.get('/nutrition/active').catch(() => null),
        api.get('/nutrition/today').catch(() => null),
        api.get('/users/usage').catch(() => null),
      ]);
      setPlan(planRes?.data || null);
      setComidasHoy(hoyRes?.data || null);
      setUsageInfo(usageRes?.data || null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generarPlan = async () => {
    setShowModal(false);
    setGenerating(true);

    const partes = [];
    if (restriccionSeleccionada !== 'ninguna') partes.push(`Dieta ${restriccionSeleccionada.replace(/_/g, ' ')}`);
    if (alergias.trim()) partes.push(`Alergias: ${alergias.trim()}`);
    if (gustos.trim()) partes.push(`Me gustan: ${gustos.trim()}`);
    if (noGustos.trim()) partes.push(`No me gustan: ${noGustos.trim()}`);
    const restricciones = partes.join('. ') || null;

    try {
      const res = await api.post('/nutrition/generate', { restricciones });
      setPlan(res.data);
      await loadData();
    } catch (err) {
      const esLimite = err.response?.data?.limite;
      Alert.alert(
        esLimite ? 'Límite alcanzado' : 'Error',
        err.response?.data?.message || 'Error al generar plan',
        esLimite ? [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => {} },
        ] : [{ text: 'OK' }]
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const totalesHoy = comidasHoy?.totales || { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
  const metaCalorias = plan?.caloriasDiarias || 2000;
  const progresoCalorias = Math.min((totalesHoy.calorias / metaCalorias) * 100, 100);

  const COLORES_MACRO = {
    proteinas: theme.primary,
    carbohidratos: theme.orange,
    grasas: theme.yellow,
  };

  const iconoComida = (tipo) => {
    const iconos = {
      desayuno: 'sunny-outline', media_manana: 'cafe-outline',
      almuerzo: 'restaurant-outline', merienda: 'nutrition-outline', cena: 'moon-outline',
    };
    return iconos[tipo] || 'restaurant-outline';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Nutrición</Text>
          {plan && (
            <TouchableOpacity
              style={{ padding: 8, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
              onPress={() => setShowModal(true)}
              disabled={generating}
            >
              {generating ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="refresh" size={18} color={theme.primary} />}
            </TouchableOpacity>
          )}
        </View>

        {!plan ? (
          <View style={{ alignItems: 'center', padding: 32, marginTop: 20 }}>
            <Ionicons name="restaurant-outline" size={72} color={theme.border} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 20, marginBottom: 10 }}>
              Sin plan nutricional
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              Generá tu plan personalizado con IA. Te preguntaremos sobre tus preferencias y alergias.
            </Text>
            {usageInfo?.plan === 'free' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.card, padding: 10, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="information-circle" size={16} color={theme.orange} />
                <Text style={{ fontSize: 12, color: theme.orange }}>
                  Plan gratuito: {usageInfo.limites?.nutricion?.usado || 0}/{usageInfo.limites?.nutricion?.maximo} planes cada 15 días
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 }}
              onPress={() => setShowModal(true)}
              disabled={generating}
            >
              {generating ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Generar Plan con IA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Resumen calorías */}
            <View style={{ margin: 16, backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: theme.textSecondary, fontWeight: '600' }}>Calorías de hoy</Text>
                <Text>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>{Math.round(totalesHoy.calorias)}</Text>
                  <Text style={{ fontSize: 14, color: theme.textMuted }}> / {metaCalorias} kcal</Text>
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.bg, borderRadius: 4, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                <View style={{ height: '100%', width: `${progresoCalorias}%`, backgroundColor: theme.primary, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[
                  { label: 'Proteínas', val: totalesHoy.proteinas, meta: plan.proteinas, color: COLORES_MACRO.proteinas },
                  { label: 'Carbos', val: totalesHoy.carbohidratos, meta: plan.carbohidratos, color: COLORES_MACRO.carbohidratos },
                  { label: 'Grasas', val: totalesHoy.grasas, meta: plan.grasas, color: COLORES_MACRO.grasas },
                ].map((m) => (
                  <View key={m.label} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: m.color }}>{Math.round(m.val)}g</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{m.label}</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>/ {Math.round(m.meta)}g</Text>
                  </View>
                ))}
              </View>
            </View>

            {plan.nombre && (
              <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>{plan.nombre}</Text>
              </View>
            )}

            {/* Comidas del plan */}
            {Array.isArray(plan.comidas) && plan.comidas.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 14, marginTop: 8 }}>
                  Plan de comidas
                </Text>
                {plan.comidas.map((comida, i) => (
                  <View key={i} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name={iconoComida(comida.tipo)} size={16} color={theme.primary} />
                        </View>
                        <View>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{comida.nombre || comida.tipo}</Text>
                          {comida.hora && <Text style={{ fontSize: 11, color: theme.textMuted }}>{comida.hora}</Text>}
                        </View>
                      </View>
                      {comida.calorias && (
                        <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>{comida.calorias} kcal</Text>
                        </View>
                      )}
                    </View>

                    {(comida.proteinas || comida.carbohidratos || comida.grasas) && (
                      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 10 }}>
                        {comida.proteinas ? <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '700' }}>P: {Math.round(comida.proteinas)}g</Text> : null}
                        {comida.carbohidratos ? <Text style={{ fontSize: 11, color: theme.orange, fontWeight: '700' }}>C: {Math.round(comida.carbohidratos)}g</Text> : null}
                        {comida.grasas ? <Text style={{ fontSize: 11, color: theme.yellow, fontWeight: '700' }}>G: {Math.round(comida.grasas)}g</Text> : null}
                      </View>
                    )}

                    {Array.isArray(comida.alimentos) && comida.alimentos.map((alimento, j) => (
                      <View key={j} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                        <Text style={{ color: theme.primary, marginTop: 2 }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
                          {typeof alimento === 'string' ? alimento : alimento.nombre || String(alimento)}
                        </Text>
                      </View>
                    ))}

                    {comida.notas && (
                      <View style={{ marginTop: 8, padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>{comida.notas}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Consejos */}
            {Array.isArray(plan.consejos) && plan.consejos.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Consejos personalizados</Text>
                {plan.consejos.map((c, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={{ marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 20 }}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {comidasHoy?.registros?.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Registrado hoy</Text>
                {comidasHoy.registros.map((r) => (
                  <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, textTransform: 'capitalize' }}>{r.tipoComida}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.orange }}>{r.caloriasTotal} kcal</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de preferencias antes de generar */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Personalizar plan</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 10 }}>Tipo de dieta</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {RESTRICCIONES_OPCIONES.map((op) => (
                  <TouchableOpacity
                    key={op.key}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: restriccionSeleccionada === op.key ? theme.primary : theme.card, borderWidth: 1, borderColor: restriccionSeleccionada === op.key ? theme.primary : theme.border }}
                    onPress={() => setRestriccionSeleccionada(op.key)}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: restriccionSeleccionada === op.key ? '#fff' : theme.textSecondary }}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Alergias o intolerancias</Text>
              <TextInput
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}
                placeholder="Ej: nueces, mariscos, huevo..."
                placeholderTextColor={theme.textMuted}
                value={alergias}
                onChangeText={setAlergias}
              />

              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Alimentos que te gustan</Text>
              <TextInput
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}
                placeholder="Ej: pollo, arroz, frutas, pasta..."
                placeholderTextColor={theme.textMuted}
                value={gustos}
                onChangeText={setGustos}
              />

              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Alimentos que NO te gustan</Text>
              <TextInput
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}
                placeholder="Ej: brócoli, hígado, legumbres..."
                placeholderTextColor={theme.textMuted}
                value={noGustos}
                onChangeText={setNoGustos}
              />

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.primary, padding: 16, borderRadius: 14, marginBottom: 8 }}
                onPress={generarPlan}
              >
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Generar mi plan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
