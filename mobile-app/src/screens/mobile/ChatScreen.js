import React, { useState, useRef, useCallback, memo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api/api.service';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const MensajeBurbuja = memo(({ item, theme }) => {
  const esUsuario = item.rol === 'user';
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 8,
      justifyContent: esUsuario ? 'flex-end' : 'flex-start',
      gap: esUsuario ? 0 : 8,
    }}>
      {!esUsuario && (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View style={{
        maxWidth: width * 0.75,
        padding: 12,
        borderRadius: 16,
        backgroundColor: esUsuario ? theme.primary : theme.card,
        borderBottomRightRadius: esUsuario ? 4 : 16,
        borderBottomLeftRadius: esUsuario ? 16 : 4,
        borderWidth: esUsuario ? 0 : 1,
        borderColor: theme.border,
      }}>
        <Text style={{ fontSize: 14, lineHeight: 20, color: esUsuario ? '#fff' : theme.text }}>
          {item.contenido}
        </Text>
      </View>
    </View>
  );
});

export default function ChatScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);
  const flatListRef = useRef(null);

  const loadHistorial = async () => {
    try {
      const [histRes, usageRes] = await Promise.all([
        api.get('/chat/history'),
        api.get('/users/usage').catch(() => null),
      ]);
      setMensajes(histRes.data || []);
      setUsageInfo(usageRes?.data || null);
    } catch {
      setMensajes([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadHistorial(); }, []));

  const enviarMensaje = async () => {
    const texto = input.trim();
    if (!texto || enviando) return;

    const mensajeTemporal = {
      id: `temp_${Date.now()}`,
      rol: 'user',
      contenido: texto,
      createdAt: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeTemporal]);
    setInput('');
    setEnviando(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post('/chat', { mensaje: texto });
      const respuestaIA = {
        id: res.data.id,
        rol: 'assistant',
        contenido: res.data.mensaje,
        createdAt: res.data.createdAt,
      };
      setMensajes((prev) => [...prev, respuestaIA]);
      setUsageInfo((prev) =>
        prev?.limites?.chat
          ? { ...prev, limites: { ...prev.limites, chat: { ...prev.limites.chat, usado: prev.limites.chat.usado + 1 } } }
          : prev
      );
    } catch (err) {
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeTemporal.id));
      const esLimite = err.response?.data?.limite;
      const mensaje = err.response?.data?.message || err.message || 'No se pudo enviar el mensaje';
      Alert.alert(
        esLimite ? 'Límite semanal alcanzado' : 'Error',
        mensaje,
        esLimite ? [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => navigation.navigate('Premium') },
        ] : [{ text: 'OK' }]
      );
    } finally {
      setEnviando(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const renderMensaje = useCallback(({ item }) => (
    <MensajeBurbuja item={item} theme={theme} width={width} />
  ), [theme]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const chatRestante = usageInfo?.limites?.chat
    ? usageInfo.limites.chat.maximo - usageInfo.limites.chat.usado
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={18} color="#fff" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>Chris</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Tu coach personal · Gym IA</Text>
            </View>
          </View>
          {chatRestante !== null && (
            <View style={{ backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>{chatRestante} msgs restantes</Text>
            </View>
          )}
        </View>

        {/* Mensajes */}
        {mensajes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <Ionicons name="chatbubbles-outline" size={56} color={theme.border} />
            <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.text, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
              ¡Hola! Soy Chris, tu coach de Gym IA
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Preguntame sobre entrenamiento, nutrición, técnica o motivación
            </Text>
            <View style={{ width: '100%', gap: 8 }}>
              {['¿Cómo mejorar mi técnica de sentadilla?', '¿Qué comer antes de entrenar?', 'Dame motivación para hoy'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={{ backgroundColor: theme.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
                  onPress={() => setInput(s)}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensajes}
            keyExtractor={keyExtractor}
            renderItem={renderMensaje}
            contentContainerStyle={{ padding: 16, gap: 4 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews
            keyboardDismissMode="interactive"
          />
        )}

        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
          <TextInput
            style={{ flex: 1, backgroundColor: theme.card, color: theme.text, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: theme.border }}
            value={input}
            onChangeText={setInput}
            placeholder="Escribí tu pregunta..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: (!input.trim() || enviando) ? theme.border : theme.primary, justifyContent: 'center', alignItems: 'center' }}
            onPress={enviarMensaje}
            disabled={!input.trim() || enviando}
          >
            {enviando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
