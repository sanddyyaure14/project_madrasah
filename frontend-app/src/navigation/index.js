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
import WritingFeedbackScreen from '../screens/WritingFeedbackScreen';
import MyDocsScreen from '../screens/MyDocsScreen';
import FeedbackDetailScreen from '../screens/FeedbackDetailScreen';
import WorksheetScreen from '../screens/WorksheetScreen';
import WorksheetDetailScreen from '../screens/WorksheetDetailScreen';
import MCDetailScreen from '../screens/MCDetailScreen';
import RubricDetailScreen from '../screens/RubricDetailScreen';
import SyllabusFormScreen from '../screens/SyllabusFormScreen';
import SyllabusDetailScreen from '../screens/SyllabusDetailScreen';
import SyllabusPreviewScreen from '../screens/SyllabusPreviewScreen';
import SyllabusEditScreen from '../screens/SyllabusEditScreen';
import AcademicContentFormScreen from '../screens/AcademicContentFormScreen';
import AcademicContentDetailScreen from '../screens/AcademicContentDetailScreen';
import AcademicContentPreviewScreen from '../screens/AcademicContentPreviewScreen';
import AcademicContentEditScreen from '../screens/AcademicContentEditScreen';

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
      <Tab.Screen name="Dokumen" component={DocsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
    </Tab.Navigator>
  );
}

function DocsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen
        name="MyDocsList"
        component={MyDocsScreen}
        options={{ title: 'Dokumen Saya' }}
      />
      <Stack.Screen
        name="FeedbackDetail"
        component={FeedbackDetailScreen}
        options={{ title: 'Detail Feedback' }}
      />
      <Stack.Screen
        name="WorksheetDetail"
        component={WorksheetDetailScreen}
        options={{ title: 'Detail Worksheet' }}
      />
      <Stack.Screen
        name="MCDetail"
        component={MCDetailScreen}
        options={{ title: 'Detail Soal PG' }}
      />
      <Stack.Screen
        name="RubricDetail"
        component={RubricDetailScreen}
        options={{ title: 'Detail Rubrik' }}
      />
      <Stack.Screen name="SyllabusDetail" component={SyllabusDetailScreen} options={{ title: 'Detail Silabus' }} />
      <Stack.Screen name="SyllabusPreview" component={SyllabusPreviewScreen} options={{ title: 'Preview Silabus' }} />
      <Stack.Screen name="SyllabusEdit" component={SyllabusEditScreen} options={{ title: 'Edit Silabus' }} />
      <Stack.Screen name="AcademicContentDetail" component={AcademicContentDetailScreen} options={{ title: 'Detail Konten' }} />
      <Stack.Screen name="AcademicContentPreview" component={AcademicContentPreviewScreen} options={{ title: 'Preview Konten' }} />
      <Stack.Screen name="AcademicContentEdit" component={AcademicContentEditScreen} options={{ title: 'Edit Konten' }} />
    </Stack.Navigator>
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
        name="ToolPage"
        component={ToolPageScreen}
        options={({ route }) => ({
          title: route.params?.slug?.replace(/-/g, ' ') ?? 'Tool',
        })}
      />
      <Stack.Screen
        name="WritingFeedback"
        component={WritingFeedbackScreen}
        options={{ title: 'Writing Feedback' }}
      />
      <Stack.Screen
        name="FeedbackDetail"
        component={FeedbackDetailScreen}
        options={{ title: 'Detail Feedback' }}
      />
      <Stack.Screen
        name="Worksheet"
        component={WorksheetScreen}
        options={{ title: 'Worksheet Generator' }}
      />
      <Stack.Screen
        name="WorksheetDetail"
        component={WorksheetDetailScreen}
        options={{ title: 'Detail Worksheet' }}
      />
      <Stack.Screen
        name="MCDetail"
        component={MCDetailScreen}
        options={{ title: 'Detail Soal PG' }}
      />
      <Stack.Screen
        name="RubricDetail"
        component={RubricDetailScreen}
        options={{ title: 'Detail Rubrik' }}
      />
      <Stack.Screen name="SyllabusForm" component={SyllabusFormScreen} options={{ title: 'Silabus Generator' }} />
      <Stack.Screen name="SyllabusDetail" component={SyllabusDetailScreen} options={{ title: 'Detail Silabus' }} />
      <Stack.Screen name="SyllabusPreview" component={SyllabusPreviewScreen} options={{ title: 'Preview Silabus' }} />
      <Stack.Screen name="SyllabusEdit" component={SyllabusEditScreen} options={{ title: 'Edit Silabus' }} />
      <Stack.Screen name="AcademicContentForm" component={AcademicContentFormScreen} options={{ title: 'Konten Akademik' }} />
      <Stack.Screen name="AcademicContentDetail" component={AcademicContentDetailScreen} options={{ title: 'Detail Konten' }} />
      <Stack.Screen name="AcademicContentPreview" component={AcademicContentPreviewScreen} options={{ title: 'Preview Konten' }} />
      <Stack.Screen name="AcademicContentEdit" component={AcademicContentEditScreen} options={{ title: 'Edit Konten' }} />
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
