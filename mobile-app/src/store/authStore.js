import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api/api.service';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Registro
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authAPI.register(userData);
      await AsyncStorage.setItem('accessToken', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al registrarse';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authAPI.login(email, password);
      await AsyncStorage.setItem('accessToken', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.log('Error al hacer logout:', error);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  // Restaurar sesión al abrir la app
  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const user = await authAPI.getProfile();
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('accessToken');
      set({ isLoading: false });
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),
}));

// Exportar tanto por defecto como nombrado
export const useAuth = useAuthStore;
export default useAuthStore;