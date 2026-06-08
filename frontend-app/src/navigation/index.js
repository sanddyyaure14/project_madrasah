import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { C } from '../lib/theme';

// Custom header title dengan logo
function HeaderLogo() {
  return (
    <View style={headerStyles.row}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={headerStyles.logo}
        resizeMode="contain"
      />
      <Text style={headerStyles.title}>MadrasahAI</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 36, height: 36, borderRadius: 8 },
  title: { fontSize: 17, fontWeight: '700', color: C.ink },
});

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
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import KepsekEditProfileScreen from '../screens/KepsekEditProfileScreen';
import { useNotifications, usePendingApprovals } from '../lib/notifications';
import { API_URL } from '../lib/auth';
import MCDetailScreen from '../screens/MCDetailScreen';
import RubricDetailScreen from '../screens/RubricDetailScreen';
import KepsekGenerateStatsScreen from '../screens/KepsekGenerateStatsScreen';
import KepsekFeedbackStatsScreen from '../screens/KepsekFeedbackStatsScreen';
import KepsekActivityScreen from '../screens/KepsekActivityScreen';
import SplashScreen from '../screens/SplashScreen';
import SyllabusFormScreen from '../screens/SyllabusFormScreen';
import SyllabusPreviewScreen from '../screens/SyllabusPreviewScreen';
import AcademicContentFormScreen from '../screens/AcademicContentFormScreen';
import AcademicContentPreviewScreen from '../screens/AcademicContentPreviewScreen';
import SyllabusDetailScreen from '../screens/SyllabusDetailScreen';
import AcademicContentDetailScreen from '../screens/AcademicContentDetailScreen';
import SyllabusEditScreen from '../screens/SyllabusEditScreen';
import AcademicContentEditScreen from '../screens/AcademicContentEditScreen';
import PresentationFormScreen from '../screens/PresentationFormScreen';
import PresentationPreviewScreen from '../screens/PresentationPreviewScreen';
import PresentationDetailScreen from '../screens/PresentationDetailScreen';
import GenerateStatsScreen from '../screens/GenerateStatsScreen';
import UsageStatsScreen from '../screens/UsageStatsScreen';
import FeedbackStatsScreen from '../screens/FeedbackStatsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SuperAdminTabs() {
  const { token } = useAuth();
  const { unreadCount } = useNotifications();
  const { pendingCount } = usePendingApprovals({ token, apiUrl: API_URL, enabled: true });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = { Dashboard: 'grid', Guru: 'people', Persetujuan: 'clipboard', Dokumen: 'document-text', Profil: 'person' };
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
      <Tab.Screen name="Guru" component={GuruStack} options={{ headerShown: false }} />
      <Tab.Screen
        name="Persetujuan"
        component={ApprovalsScreen}
        options={{
          title: 'Persetujuan',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#dc2626', fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profil"
        component={KepsekProfilStack}
        options={{
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#dc2626', fontSize: 10 },
        }}
      />
    </Tab.Navigator>
  );
}

function GuruTabs() {
  const { unreadCount } = useNotifications();
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
      <Tab.Screen
        name="Profil"
        component={ProfilStack}
        options={{
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#dc2626', fontSize: 10 },
        }}
      />
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
      <Stack.Screen name="MyDocsList" component={MyDocsScreen} options={{ title: 'Dokumen Saya' }} />
      <Stack.Screen name="FeedbackDetail" component={FeedbackDetailScreen} options={{ title: 'Detail Feedback' }} />
      <Stack.Screen name="WorksheetDetail" component={WorksheetDetailScreen} options={{ title: 'Detail Worksheet' }} />
      <Stack.Screen name="MCDetail" component={MCDetailScreen} options={{ title: 'Detail Soal PG' }} />
      <Stack.Screen name="RubricDetail" component={RubricDetailScreen} options={{ title: 'Detail Rubrik' }} />
      <Stack.Screen name="SyllabusDetail" component={SyllabusDetailScreen} options={{ title: 'Detail Silabus' }} />
      <Stack.Screen name="SyllabusEdit" component={SyllabusEditScreen} options={{ title: 'Edit Silabus' }} />
      <Stack.Screen name="AcademicContentDetail" component={AcademicContentDetailScreen} options={{ title: 'Detail Konten Akademik' }} />
      <Stack.Screen name="AcademicContentEdit" component={AcademicContentEditScreen} options={{ title: 'Edit Konten Akademik' }} />
      <Stack.Screen name="PresentationDetail" component={PresentationDetailScreen} options={{ title: 'Detail Presentasi' }} />
    </Stack.Navigator>
  );
}

function GuruStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen name="TeachersList" component={TeachersScreen} options={{ title: 'Daftar Guru' }} />
    </Stack.Navigator>
  );
}

function KepsekProfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
      <Stack.Screen name="EditProfile" component={KepsekEditProfileScreen} options={{ title: 'Edit Profil' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Ubah Password' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifikasi' }} />
    </Stack.Navigator>
  );
}

function ProfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: C.ink },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profil' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Ubah Password' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifikasi' }} />
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
      <Stack.Screen name="DashboardHome" component={DashboardHomeScreen} options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen
        name="ToolPage"
        component={ToolPageScreen}
        options={({ route }) => ({
          title: route.params?.slug?.replace(/-/g, ' ') ?? 'Tool',
        })}
      />
      <Stack.Screen name="WritingFeedback" component={WritingFeedbackScreen} options={{ title: 'Writing Feedback' }} />
      <Stack.Screen name="FeedbackDetail" component={FeedbackDetailScreen} options={{ title: 'Detail Feedback' }} />
      <Stack.Screen name="Worksheet" component={WorksheetScreen} options={{ title: 'Worksheet Generator' }} />
      <Stack.Screen name="WorksheetDetail" component={WorksheetDetailScreen} options={{ title: 'Detail Worksheet' }} />
      <Stack.Screen name="MCDetail" component={MCDetailScreen} options={{ title: 'Detail Soal PG' }} />
      <Stack.Screen name="RubricDetail" component={RubricDetailScreen} options={{ title: 'Detail Rubrik' }} />
      <Stack.Screen name="SyllabusDetail" component={SyllabusDetailScreen} options={{ title: 'Detail Silabus' }} />
      <Stack.Screen name="SyllabusEdit" component={SyllabusEditScreen} options={{ title: 'Edit Silabus' }} />
      <Stack.Screen name="AcademicContentDetail" component={AcademicContentDetailScreen} options={{ title: 'Detail Konten Akademik' }} />
      <Stack.Screen name="AcademicContentEdit" component={AcademicContentEditScreen} options={{ title: 'Edit Konten Akademik' }} />
      <Stack.Screen name="SyllabusForm" component={SyllabusFormScreen} options={{ title: 'Buat Silabus' }} />
      <Stack.Screen name="SyllabusPreview" component={SyllabusPreviewScreen} options={{ title: 'Preview Silabus' }} />
      <Stack.Screen name="AcademicContentForm" component={AcademicContentFormScreen} options={{ title: 'Buat Konten Akademik' }} />
      <Stack.Screen name="AcademicContentPreview" component={AcademicContentPreviewScreen} options={{ title: 'Preview Konten Akademik' }} />
      <Stack.Screen name="PresentationForm" component={PresentationFormScreen} options={{ title: 'Buat Presentasi' }} />
      <Stack.Screen name="PresentationPreview" component={PresentationPreviewScreen} options={{ title: 'Preview Presentasi' }} />
      <Stack.Screen name="PresentationDetail" component={PresentationDetailScreen} options={{ title: 'Detail Presentasi' }} />
      <Stack.Screen name="Teachers" component={TeachersScreen} options={{ title: 'Daftar Guru' }} />
      <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Persetujuan' }} />
      <Stack.Screen name="GenerateStats" component={GenerateStatsScreen} options={{ title: 'Statistik Generate' }} />
      <Stack.Screen name="UsageStats" component={UsageStatsScreen} options={{ title: 'Waktu Penggunaan' }} />
      <Stack.Screen name="FeedbackStats" component={FeedbackStatsScreen} options={{ title: 'Rating Feedback' }} />
      <Stack.Screen name="KepsekGenerateStats" component={KepsekGenerateStatsScreen} options={{ title: 'Statistik Generate' }} />
      <Stack.Screen name="KepsekFeedbackStats" component={KepsekFeedbackStatsScreen} options={{ title: 'Rating Feedback' }} />
      <Stack.Screen name="KepsekActivity" component={KepsekActivityScreen} options={{ title: 'Semua Aktivitas' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const { user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (!user) return <AuthStack />;
  return user.role === 'superadmin' ? <SuperAdminTabs /> : <GuruTabs />;
}
