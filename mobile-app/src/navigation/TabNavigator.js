import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Pantallas
import DashboardScreen from '../screens/mobile/DashboardScreen';
import RoutinesScreen from '../screens/mobile/RoutinesScreen';
import ProgressScreen from '../screens/mobile/ProgressScreen';
import ProfileScreen from '../screens/mobile/ProfileScreen';
import PhysicalProfileScreen from '../screens/mobile/PhysicalProfileScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e293b',
        },
        headerTintColor: '#fff',
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          headerShown: false,
          title: 'Perfil'
        }}
      />
      <ProfileStack.Screen 
        name="PhysicalProfile" 
        component={PhysicalProfileScreen}
        options={{ 
          title: 'Perfil Físico',
          headerBackTitle: 'Atrás'
        }}
      />
    </ProfileStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Rutinas') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Progreso') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Inicio', headerShown: true, headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />
      <Tab.Screen name="Rutinas" component={RoutinesScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />
      <Tab.Screen name="Progreso" component={ProgressScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />
      <Tab.Screen name="Perfil" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}