import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { C } from '../lib/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import TeachersScreen from '../screens/TeachersScreen';
import ApprovalsScreen from '../screens/ApprovalsScreen';
import ToolPageScreen from '../screens/ToolPageScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PresentationFormScreen from '../screens/PresentationFormScreen';
import PresentationPreviewScreen from '../screens/PresentationPreviewScreen';
import UnitPlanFormScreen from '../screens/UnitPlanFormScreen';
import UnitPlanPreviewScreen from '../screens/UnitPlanPreviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SuperAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = { Dashboard: 'grid', Guru: 'people', Persetujuan: 'clipboard', Profil: 'person' };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { borderTopColor: C.border },
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ headerShown: false }} />
      <Tab.Screen name="Guru" component={TeachersScreen} options={{ title: 'Daftar Guru' }} />
      <Tab.Screen name="Persetujuan" component={ApprovalsScreen} options={{ title: 'Persetujuan' }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
    </Tab.Navigator>
  );
}

function GuruTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = { Dashboard: 'grid', Dokumen: 'document-text', Profil: 'person' };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { borderTopColor: C.border },
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ headerShown: false }} />
      <Tab.Screen name="Dokumen" component={MyDocsPlaceholder} options={{ title: 'Dokumen Saya' }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
    </Tab.Navigator>
  );
}

function MyDocsPlaceholder() {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>📄</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>Dokumen Saya</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Fitur segera hadir</Text>
    </View>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{ title: 'MadrasahAI' }}
      />
      <Stack.Screen
        name="PresentationForm"
        component={PresentationFormScreen}
        options={{ title: 'Generator Presentasi' }}
      />
      <Stack.Screen
        name="PresentationPreview"
        component={PresentationPreviewScreen}
        options={{ title: 'Preview Presentasi' }}
      />
      <Stack.Screen
        name="UnitPlanForm"
        component={UnitPlanFormScreen}
        options={{ title: 'Generator RPP' }}
      />
      <Stack.Screen
        name="UnitPlanPreview"
        component={UnitPlanPreviewScreen}
        options={{ title: 'Preview RPP' }}
      />
      <Stack.Screen
        name="ToolPage"
        component={ToolPageScreen}
        options={({ route }) => ({
          title: route.params?.slug?.replace(/-/g, ' ') ?? 'Tool',
        })}
      />
      <Stack.Screen name="Teachers" component={TeachersScreen} options={{ title: 'Daftar Guru' }} />
      <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Persetujuan' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const { user } = useAuth();
  if (!user) return <AuthStack />;
  return user.role === 'superadmin' ? <SuperAdminTabs /> : <GuruTabs />;
}
