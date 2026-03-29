import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as ScreenCapture from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const MEAL_ICONS = {
  desayuno: '🌅',
  media_manana: '☕',
  colacion_1: '☕',
  almuerzo: '🍽️',
  comida: '🍽️',
  merienda: '🥗',
  colacion_2: '🥗',
  cena: '🌙',
};

const MEAL_LABELS = {
  desayuno: 'Desayuno',
  media_manana: 'Colación 1',
  colacion_1: 'Colación 1',
  almuerzo: 'Comida',
  comida: 'Comida',
  merienda: 'Colación 2',
  colacion_2: 'Colación 2',
  cena: 'Cena',
};

// Paleta fija para el PDF (siempre fondo blanco — impresión limpia)
const PDF = {
  bg: '#ffffff',
  surface: '#f8f9fb',
  card: '#ffffff',
  header: '#1a2744',       // azul marino oscuro
  headerSub: '#3d5a99',    // azul medio
  text: '#1a1f2e',
  textSec: '#5a6275',
  textMuted: '#9399a6',
  border: '#e8eaf0',
  accent: '#2d5be3',       // azul refinado (reemplaza verde fosforescente)
  prot: '#2563eb',         // azul proteínas
  carb: '#c2410c',         // naranja quemado carbos
  fat: '#92400e',          // ámbar oscuro grasas
  kcal: '#1a2744',
  tip: '#0f4c75',
};

function buildHTML(plan) {
  const { bg, surface, card, header, headerSub, text, textSec, textMuted, border, accent, prot, carb, fat, kcal, tip } = PDF;

  const fecha = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

  const macroBar = (val, total, color) => {
    const pct = total > 0 ? Math.min((val / total) * 100, 100).toFixed(1) : 0;
    return `<div style="height:5px;background:#e8eaf0;border-radius:3px;overflow:hidden;margin-top:5px;">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;"></div>
    </div>`;
  };
  const totalCal = plan.caloriasDiarias || 1;

  const comidasHTML = (plan.comidas || []).map((comida, idx) => {
    const tipo = comida.tipo || '';
    const icon = MEAL_ICONS[tipo] || '🍴';
    const label = MEAL_LABELS[tipo] || comida.nombre || tipo;
    const alimentosHTML = (comida.alimentos || []).map(a => {
      const str = typeof a === 'string' ? a : (a.nombre || String(a));
      return `<tr>
        <td style="padding:5px 0;color:${textSec};font-size:12.5px;line-height:1.5;border-bottom:1px solid ${border};">
          <span style="color:${accent};margin-right:6px;">—</span>${str}
        </td>
      </tr>`;
    }).join('');

    return `
    <div style="background:${card};border-radius:12px;padding:22px 24px;margin-bottom:16px;border:1px solid ${border};page-break-inside:avoid;">
      <!-- Meal header -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:10px;background:${surface};display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid ${border};">${icon}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:${text};letter-spacing:-0.2px;">${label}</div>
            ${comida.hora ? `<div style="font-size:11.5px;color:${textMuted};margin-top:1px;">${comida.hora}</div>` : ''}
          </div>
        </div>
        ${comida.calorias ? `<div style="text-align:right;">
          <div style="font-size:18px;font-weight:800;color:${kcal};">${comida.calorias}</div>
          <div style="font-size:10px;color:${textMuted};text-transform:uppercase;letter-spacing:0.5px;">kcal</div>
        </div>` : ''}
      </div>

      <!-- Macros row -->
      ${(comida.proteinas || comida.carbohidratos || comida.grasas) ? `
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        ${comida.proteinas ? `<div style="flex:1;background:${surface};border-radius:8px;padding:8px 10px;border-left:3px solid ${prot};">
          <div style="font-size:13px;font-weight:700;color:${prot};">${Math.round(comida.proteinas)}g</div>
          <div style="font-size:10px;color:${textMuted};margin-top:1px;">Proteínas</div>
        </div>` : ''}
        ${comida.carbohidratos ? `<div style="flex:1;background:${surface};border-radius:8px;padding:8px 10px;border-left:3px solid ${carb};">
          <div style="font-size:13px;font-weight:700;color:${carb};">${Math.round(comida.carbohidratos)}g</div>
          <div style="font-size:10px;color:${textMuted};margin-top:1px;">Carbos</div>
        </div>` : ''}
        ${comida.grasas ? `<div style="flex:1;background:${surface};border-radius:8px;padding:8px 10px;border-left:3px solid ${fat};">
          <div style="font-size:13px;font-weight:700;color:${fat};">${Math.round(comida.grasas)}g</div>
          <div style="font-size:10px;color:${textMuted};margin-top:1px;">Grasas</div>
        </div>` : ''}
      </div>` : ''}

      <!-- Alimentos -->
      ${alimentosHTML ? `<table style="width:100%;border-collapse:collapse;">${alimentosHTML}</table>` : ''}

      ${comida.notas ? `
      <div style="margin-top:12px;padding:10px 12px;background:${surface};border-radius:8px;border:1px solid ${border};">
        <span style="font-size:11px;color:${textMuted};font-style:italic;">${comida.notas}</span>
      </div>` : ''}
    </div>`;
  }).join('');

  const consejosHTML = (plan.consejos || []).map((c, i) =>
    `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid ${border};">
      <div style="width:22px;height:22px;border-radius:50%;background:${accent}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:${accent};">${i + 1}</div>
      <div style="font-size:13px;color:${textSec};line-height:1.6;">${c}</div>
    </div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Arial, sans-serif;
      background: ${bg};
      color: ${text};
      max-width: 680px;
      margin: 0 auto;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }
    @media print {
      body { padding: 0; }
      .no-break { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- ═══ PORTADA / HEADER ═══ -->
  <div style="background:${header};padding:36px 32px 28px;margin-bottom:0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:2px;color:${headerSub};text-transform:uppercase;margin-bottom:6px;">Plan Nutricional Personalizado</div>
        <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;max-width:360px;">${plan.nombre || 'Plan Nutricional'}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#8899bb;margin-bottom:4px;">Generado el</div>
        <div style="font-size:12px;font-weight:600;color:#ccd6f0;">${fecha}</div>
      </div>
    </div>
    <div style="font-size:12px;color:#8899bb;">Generado con inteligencia artificial · Uso personal exclusivo</div>
  </div>

  <!-- ═══ RESUMEN CALÓRICO ═══ -->
  <div style="background:${surface};padding:28px 32px;border-bottom:1px solid ${border};">
    <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">

      <!-- Calorías grandes -->
      <div style="text-align:center;min-width:90px;">
        <div style="font-size:40px;font-weight:800;color:${kcal};letter-spacing:-2px;">${plan.caloriasDiarias || 0}</div>
        <div style="font-size:11px;color:${textMuted};text-transform:uppercase;letter-spacing:1px;margin-top:2px;">kcal / día</div>
      </div>

      <!-- Divisor -->
      <div style="width:1px;height:60px;background:${border};"></div>

      <!-- Macros con barras -->
      <div style="flex:1;display:flex;gap:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:80px;">
          <div style="font-size:20px;font-weight:800;color:${prot};">${plan.proteinas || 0}g</div>
          <div style="font-size:11px;color:${textMuted};margin-bottom:4px;">Proteínas</div>
          ${macroBar(plan.proteinas * 4, totalCal, prot)}
        </div>
        <div style="flex:1;min-width:80px;">
          <div style="font-size:20px;font-weight:800;color:${carb};">${plan.carbohidratos || 0}g</div>
          <div style="font-size:11px;color:${textMuted};margin-bottom:4px;">Carbohidratos</div>
          ${macroBar(plan.carbohidratos * 4, totalCal, carb)}
        </div>
        <div style="flex:1;min-width:80px;">
          <div style="font-size:20px;font-weight:800;color:${fat};">${plan.grasas || 0}g</div>
          <div style="font-size:11px;color:${textMuted};margin-bottom:4px;">Grasas</div>
          ${macroBar(plan.grasas * 9, totalCal, fat)}
        </div>
      </div>
    </div>

    ${plan.hidratacion ? `
    <div style="margin-top:18px;padding:10px 14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">💧</span>
      <span style="font-size:12.5px;color:#1e40af;">${plan.hidratacion}</span>
    </div>` : ''}
  </div>

  <!-- ═══ PLAN DE COMIDAS ═══ -->
  <div style="padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <div style="width:4px;height:22px;background:${accent};border-radius:2px;"></div>
      <div style="font-size:17px;font-weight:800;color:${text};letter-spacing:-0.3px;">Plan de comidas</div>
    </div>
    ${comidasHTML}
  </div>

  ${plan.consejos?.length ? `
  <!-- ═══ CONSEJOS ═══ -->
  <div style="padding:0 32px 32px;">
    <div style="background:${surface};border-radius:12px;padding:22px 24px;border:1px solid ${border};">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:4px;height:20px;background:${tip};border-radius:2px;"></div>
        <div style="font-size:15px;font-weight:700;color:${text};">Consejos personalizados</div>
      </div>
      ${consejosHTML}
    </div>
  </div>` : ''}

  <!-- ═══ FOOTER ═══ -->
  <div style="background:${surface};border-top:1px solid ${border};padding:16px 32px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:12px;font-weight:700;color:${textSec};">Gym IA</div>
    <div style="font-size:11px;color:${textMuted};">Este plan no sustituye asesoramiento médico profesional.</div>
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
      const html = buildHTML(plan);
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
