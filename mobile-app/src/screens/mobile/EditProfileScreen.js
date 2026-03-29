import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api/api.service';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const GENERO_OPCIONES = [
  { key: 'masculino', label: 'Masculino' },
  { key: 'femenino', label: 'Femenino' },
  { key: 'otro', label: 'Otro' },
];

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || '',
    genero: user?.genero || '',
    fechaNac: user?.fechaNac
      ? new Date(user.fechaNac).toISOString().split('T')[0]
      : '',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        genero: form.genero || undefined,
        fechaNac: form.fechaNac || undefined,
      };
      const res = await api.put('/users/me', payload);
      updateUser(res.data);
      Alert.alert('¡Guardado!', 'Tu perfil fue actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder, keyboardType = 'default', hint }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: theme.card, borderRadius: 12, padding: 14, fontSize: 15, color: theme.text, borderWidth: 1, borderColor: theme.border }}
        value={form[field]}
        onChangeText={v => set(field, v)}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={field === 'telefono' ? 'none' : 'words'}
      />
      {hint && <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{hint}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: theme.border }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 }}>Editar Perfil</Text>
          <TouchableOpacity
            onPress={handleGuardar}
            disabled={loading}
            style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          {/* Email (no editable) */}
          <View style={{ marginBottom: 16, backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>Email (no editable)</Text>
              <Text style={{ fontSize: 15, color: theme.textSecondary, marginTop: 2 }}>{user?.email}</Text>
            </View>
          </View>

          <Field label="Nombre *" field="nombre" placeholder="Tu nombre" />
          <Field label="Apellido" field="apellido" placeholder="Tu apellido" />
          <Field label="Teléfono" field="telefono" placeholder="+54 11 1234 5678" keyboardType="phone-pad" />
          <Field
            label="Fecha de nacimiento"
            field="fechaNac"
            placeholder="YYYY-MM-DD"
            hint="Formato: 1995-08-25"
          />

          {/* Género */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: 10 }}>Género</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {GENERO_OPCIONES.map(op => (
                <TouchableOpacity
                  key={op.key}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: form.genero === op.key ? theme.primary : theme.card, borderWidth: 1, borderColor: form.genero === op.key ? theme.primary : theme.border, alignItems: 'center' }}
                  onPress={() => set('genero', op.key)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: form.genero === op.key ? '#fff' : theme.textSecondary }}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botón guardar (también al final del scroll) */}
          <TouchableOpacity
            style={{ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 32 }}
            onPress={handleGuardar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Guardar cambios</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
