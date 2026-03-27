import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Modo día: fondo blanco/perla, tarjetas blancas, toques verdes
const LIGHT = {
  bg: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryLight: '#22c55e',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  tabBar: '#ffffff',
  tabBorder: '#e2e8f0',
  orange: '#ea580c',
  red: '#dc2626',
  yellow: '#d97706',
  inputBg: '#f1f5f9',
  shadow: 'rgba(0,0,0,0.06)',
  isDark: false,
};

// Modo noche: pizarra oscura sobria, sin fondos verdes, toques verdes
const DARK = {
  bg: '#0f172a',
  surface: '#1e293b',
  card: '#1e293b',
  border: '#334155',
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#4ade80',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  tabBar: '#0f172a',
  tabBorder: '#1e293b',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#f59e0b',
  inputBg: '#1e293b',
  shadow: 'rgba(0,0,0,0.4)',
  isDark: true,
};

const ThemeContext = createContext({ theme: DARK, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((val) => {
      if (val === 'light') setIsDark(false);
      else if (val === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('themeMode', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { DARK, LIGHT };
