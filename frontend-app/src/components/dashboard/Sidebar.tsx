import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type NavItem = {
  label: string;
  icon: string;
  key: string;
};

const ASESMEN_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '⊞', key: 'dashboard' },
  { label: 'Multiple Choice', icon: '☑', key: 'multiple-choice' },
  { label: 'Rubric Generator', icon: '≡', key: 'rubric' },
  { label: 'Writing Feedback', icon: '✍', key: 'writing' },
  { label: 'Worksheet Generator', icon: '📄', key: 'worksheet' },
];

const KONTEN_ITEMS: NavItem[] = [
  { label: 'Presentation Generator', icon: '🖥', key: 'presentation' },
  { label: 'Syllabus Generator', icon: '📚', key: 'syllabus' },
  { label: 'Unit Plan / RPP', icon: '📅', key: 'rpp' },
  { label: 'Academic Content', icon: '🎓', key: 'academic' },
];

const SAYA_ITEMS: NavItem[] = [
  { label: 'Dokumen Saya', icon: '🗂', key: 'dokumen' },
];

type Props = {
  active?: string;
  onSelect?: (key: string) => void;
};

export function Sidebar({ active = 'dashboard', onSelect }: Props) {
  const theme = useTheme();

  const renderSection = (label: string, items: NavItem[]) => (
    <>
      <Text style={[styles.sectionLabel, { color: 'rgba(255,255,255,0.3)' }]}>{label}</Text>
      {items.map(item => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onSelect?.(item.key)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, { color: isActive ? '#fff' : 'rgba(255,255,255,0.65)' }]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.activeBar} />}
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.greenDark }]}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={[styles.logoIcon, { backgroundColor: theme.gold }]}>
          <Text style={[styles.logoArabic, { color: theme.greenDark }]}>م</Text>
        </View>
        <View>
          <Text style={styles.logoName}>MadrasahAI</Text>
          <Text style={styles.logoTagline}>GURU CERDAS · BERKAH</Text>
        </View>
      </View>

      {/* Role badge */}
      <View style={styles.roleBadge}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>GURU</Text>
      </View>

      {/* Nav */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {renderSection('ASESMEN', ASESMEN_ITEMS)}
        {renderSection('KONTEN', KONTEN_ITEMS)}
        {renderSection('SAYA', SAYA_ITEMS)}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={styles.userRow}>
          <View style={[styles.userAvatar, { backgroundColor: theme.greenAccent }]}>
            <Text style={styles.userInitials}>UA</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Ust. Ahmad Fauzi, S.Pd.I.</Text>
            <Text style={styles.userRole}>Guru Fiqih & Akidah</Text>
          </View>
        </View>
        <View style={styles.footerActions}>
          <Pressable style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>⚙ Pengaturan</Text>
          </Pressable>
          <Pressable style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>→ Keluar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: Platform.OS === 'web' ? 230 : 220,
    flexShrink: 0,
    flexDirection: 'column',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logoIcon: {
    width: 38, height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArabic: { fontSize: 20, fontWeight: '700' },
  logoName: { color: '#fff', fontWeight: '500', fontSize: 14 },
  logoTagline: { color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: 1.5 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 14,
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7ecfa0' },
  roleText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  nav: { flex: 1, paddingTop: 8 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 1.8, fontWeight: '500',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 8, gap: 10,
    position: 'relative',
  },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  activeBar: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: '#f5d98b', borderRadius: 2,
  },
  navIcon: { fontSize: 14, width: 18, textAlign: 'center' },
  navLabel: { fontSize: 13, fontWeight: '400', flex: 1 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  userInitials: { color: '#fff', fontSize: 11, fontWeight: '500' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 12, fontWeight: '500' },
  userRole: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  footerActions: { flexDirection: 'row', gap: 8 },
  footerBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center',
  },
  footerBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
});
