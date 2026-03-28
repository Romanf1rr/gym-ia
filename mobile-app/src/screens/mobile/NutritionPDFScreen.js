import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as ScreenCapture from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const MACRO_COLORS = {
  proteinas: '#22c55e',
  carbohidratos: '#f97316',
  grasas: '#eab308',
};

const MEAL_ICONS = {
  desayuno: '🌅',
  media_manana: '☕',
  almuerzo: '🍽️',
  merienda: '🥗',
  cena: '🌙',
};

const MEAL_LABELS = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

function buildHTML(plan, theme) {
  const isDark = theme.bg === '#0f172a' || theme.bg?.startsWith('#0') || theme.bg?.startsWith('#1');
  const bg = isDark ? '#0f172a' : '#ffffff';
  const surface = isDark ? '#1e293b' : '#f8fafc';
  const card = isDark ? '#334155' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#475569' : '#e2e8f0';
  const primary = '#22c55e';

  const comidasHTML = (plan.comidas || []).map((comida) => {
    const tipo = comida.tipo || '';
    const icon = MEAL_ICONS[tipo] || '🍴';
    const label = MEAL_LABELS[tipo] || comida.nombre || tipo;
    const alimentosHTML = (comida.alimentos || []).map(a =>
      `<li style="color:${textSec};font-size:13px;margin-bottom:4px;">${a}</li>`
    ).join('');

    return `
    <div style="background:${card};border-radius:12px;padding:16px;margin-bottom:14px;border:1px solid ${border};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:18px;margin-bottom:2px;">${icon} <span style="font-size:15px;font-weight:700;color:${text};">${label}</span></div>
          <div style="font-size:12px;color:${textSec};">${comida.hora || ''} &nbsp;•&nbsp; ${comida.nombre || ''}</div>
        </div>
        <div style="background:${primary}22;padding:4px 10px;border-radius:8px;">
          <span style="font-size:13px;font-weight:700;color:${primary};">${comida.calorias || 0} kcal</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        <span style="font-size:12px;font-weight:700;color:#22c55e;">P: ${comida.proteinas || 0}g</span>
        <span style="font-size:12px;font-weight:700;color:#f97316;">C: ${comida.carbohidratos || 0}g</span>
        <span style="font-size:12px;font-weight:700;color:#eab308;">G: ${comida.grasas || 0}g</span>
      </div>
      <ul style="margin:0;padding-left:16px;">${alimentosHTML}</ul>
      ${comida.notas ? `<div style="margin-top:10px;padding:8px;background:${surface};border-radius:8px;border:1px solid ${border};font-size:12px;color:${textSec};font-style:italic;">${comida.notas}</div>` : ''}
    </div>`;
  }).join('');

  const consejosHTML = (plan.consejos || []).map(c =>
    `<li style="color:${textSec};font-size:13px;margin-bottom:8px;line-height:1.5;">${c}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${bg}; color: ${text}; padding: 20px; max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">🥗</div>
    <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:4px;">${plan.nombre || 'Plan Nutricional'}</div>
    <div style="font-size:13px;color:#dcfce7;opacity:0.9;">Plan personalizado generado con IA</div>
  </div>

  <!-- Macros totales -->
  <div style="background:${surface};border-radius:14px;padding:20px;margin-bottom:20px;border:1px solid ${border};">
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:36px;font-weight:800;color:${primary};">${plan.caloriasDiarias || 0}</div>
      <div style="font-size:13px;color:${textSec};">calorías diarias</div>
    </div>
    <div style="display:flex;justify-content:space-around;text-align:center;">
      <div>
        <div style="font-size:22px;font-weight:800;color:#22c55e;">${plan.proteinas || 0}g</div>
        <div style="font-size:11px;color:${textSec};">Proteínas</div>
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#f97316;">${plan.carbohidratos || 0}g</div>
        <div style="font-size:11px;color:${textSec};">Carbohidratos</div>
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#eab308;">${plan.grasas || 0}g</div>
        <div style="font-size:11px;color:${textSec};">Grasas</div>
      </div>
    </div>
    ${plan.hidratacion ? `<div style="margin-top:14px;text-align:center;font-size:12px;color:${textSec};">💧 ${plan.hidratacion}</div>` : ''}
  </div>

  <!-- Comidas -->
  <div style="font-size:17px;font-weight:700;color:${text};margin-bottom:14px;">Plan de comidas</div>
  ${comidasHTML}

  ${plan.consejos?.length ? `
  <!-- Consejos -->
  <div style="background:${surface};border-radius:14px;padding:18px;margin-top:8px;border:1px solid ${border};">
    <div style="font-size:15px;font-weight:700;color:${text};margin-bottom:12px;">💡 Consejos personalizados</div>
    <ul style="padding-left:16px;">${consejosHTML}</ul>
  </div>` : ''}

  <div style="text-align:center;margin-top:24px;font-size:11px;color:${textSec};opacity:0.6;">
    Plan generado por Gym IA • Uso personal exclusivo
  </div>
</body>
</html>`;
}

export default function NutritionPDFScreen({ route, navigation }) {
  const { plan } = route.params;
  const { theme } = useTheme();
  const [pdfUri, setPdfUri] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bloquear capturas de pantalla
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Advertencia en iOS cuando detecta captura
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const sub = ScreenCapture.addScreenshotListener(() => {
        Alert.alert(
          'Captura detectada',
          'Este contenido es privado y no puede ser compartido.',
          [{ text: 'Entendido' }]
        );
      });
      return () => sub.remove();
    }
  }, []);

  useEffect(() => {
    generatePDF();
  }, []);

  const generatePDF = async () => {
    try {
      const html = buildHTML(plan, theme);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      setPdfUri(uri);
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: theme.text }}>Plan Nutricional PDF</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <Ionicons name="shield-checkmark" size={13} color={theme.primary} />
          <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>Protegido</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Generando PDF...</Text>
        </View>
      ) : pdfUri ? (
        <WebView
          source={{ uri: pdfUri }}
          style={{ flex: 1 }}
          onError={() => Alert.alert('Error', 'No se pudo mostrar el PDF')}
          allowsInlineMediaPlayback={false}
          javaScriptEnabled={false}
          allowFileAccess={true}
          originWhitelist={['file://*']}
        />
      ) : null}
    </SafeAreaView>
  );
}
