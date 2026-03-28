import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';

// Pantallas cliente
import DashboardScreen from '../screens/mobile/DashboardScreen';
import RoutinesScreen from '../screens/mobile/RoutinesScreen';
import NutritionScreen from '../screens/mobile/NutritionScreen';
import ChatScreen from '../screens/mobile/ChatScreen';
import ProgressScreen from '../screens/mobile/ProgressScreen';
import ProfileScreen from '../screens/mobile/ProfileScreen';
import PhysicalProfileScreen from '../screens/mobile/PhysicalProfileScreen';
import ObjetivosScreen from '../screens/mobile/ObjetivosScreen';

// Pantallas admin
import AdminDashboardScreen from '../screens/mobile/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/mobile/admin/AdminUsersScreen';
import AdminModerationScreen from '../screens/mobile/admin/AdminModerationScreen';
import MiAppHomeScreen from '../screens/mobile/admin/MiAppHomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function useTabBarStyle() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return {
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.textMuted,
    tabBarStyle: {
      backgroundColor: theme.tabBar,
      borderTopColor: theme.tabBorder,
      borderTopWidth: 1,
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom + 2,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    headerShown: false,
  };
}

function useStackOptions() {
  const { theme } = useTheme();
  return {
    headerStyle: { backgroundColor: theme.surface },
    headerTintColor: theme.text,
    headerTitleStyle: { fontWeight: 'bold' },
  };
}

function DashboardStack() {
  const stackOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PhysicalProfile" component={PhysicalProfileScreen} options={{ title: 'Perfil Físico' }} />
      <Stack.Screen name="Objetivos" component={ObjetivosScreen} options={{ title: 'Mis Objetivos' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const stackOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PhysicalProfile" component={PhysicalProfileScreen} options={{ title: 'Perfil Físico' }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Mi Progreso' }} />
      <Stack.Screen name="Objetivos" component={ObjetivosScreen} options={{ title: 'Mis Objetivos' }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  const stackOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AdminMain" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Usuarios' }} />
      <Stack.Screen name="AdminModeration" component={AdminModerationScreen} options={{ title: 'Moderación' }} />
    </Stack.Navigator>
  );
}

// Stack de Mi App para admin — incluye todas las pantallas cliente
function MiAppStack() {
  const stackOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MiAppHome" component={MiAppHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MiDashboard" component={DashboardScreen} options={{ title: 'Inicio' }} />
      <Stack.Screen name="Rutinas" component={RoutinesScreen} options={{ title: 'Rutinas' }} />
      <Stack.Screen name="Nutrición" component={NutritionScreen} options={{ title: 'Nutrición' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat IA' }} />
      <Stack.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
      <Stack.Screen name="PhysicalProfile" component={PhysicalProfileScreen} options={{ title: 'Perfil Físico' }} />
      <Stack.Screen name="Objetivos" component={ObjetivosScreen} options={{ title: 'Mis Objetivos' }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Mi Progreso' }} />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  const stackOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProgressMain" component={ProgressScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ClientTabs() {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabBarStyle,
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          Inicio: focused ? 'home' : 'home-outline',
          Rutinas: focused ? 'barbell' : 'barbell-outline',
          Progreso: focused ? 'trending-up' : 'trending-up-outline',
          Nutrición: focused ? 'restaurant' : 'restaurant-outline',
          Perfil: focused ? 'person' : 'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Rutinas" component={RoutinesScreen} />
      <Tab.Screen name="Progreso" component={ProgressStack} />
      <Tab.Screen name="Nutrición" component={NutritionScreen} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const tabBarStyle = useTabBarStyle();
  const { theme } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabBarStyle,
      tabBarActiveTintColor: theme.red,
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          Admin: focused ? 'speedometer' : 'speedometer-outline',
          Usuarios: focused ? 'people' : 'people-outline',
          Moderación: focused ? 'shield-checkmark' : 'shield-checkmark-outline',
          'Mi App': focused ? 'phone-portrait' : 'phone-portrait-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Admin" component={AdminStack} />
      <Tab.Screen name="Usuarios" component={AdminUsersScreen} />
      <Tab.Screen name="Moderación" component={AdminModerationScreen} />
      <Tab.Screen name="Mi App" component={MiAppStack} />
    </Tab.Navigator>
  );
}

export default function TabNavigator() {
  const { user } = useAuth();
  return user?.rol === 'admin' ? <AdminTabs /> : <ClientTabs />;
}
