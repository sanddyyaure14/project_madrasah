import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { ToolsGrid } from '@/components/dashboard/ToolsGrid';
import { Topbar } from '@/components/dashboard/Topbar';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const theme = useTheme();
  const [activeNav, setActiveNav] = useState('dashboard');

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.cream }]} edges={['top']}>
      <View style={styles.layout}>
        {/* Sidebar — visible on web, hidden on mobile (slide-in could be added) */}
        {isWeb && (
          <Sidebar active={activeNav} onSelect={setActiveNav} />
        )}

        {/* Main content */}
        <View style={styles.main}>
          <Topbar />
          <ScrollView
            style={[styles.scroll, { backgroundColor: theme.cream }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <HeroBanner />
            <StatsRow />
            <ToolsGrid onToolPress={key => setActiveNav(key)} />
            <View style={styles.bottomPad} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  layout: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, flexDirection: 'column' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  bottomPad: { height: 20 },
});
