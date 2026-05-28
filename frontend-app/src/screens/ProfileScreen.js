import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { C, S } from '../lib/theme';

function getInitials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('');
}

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && { backgroundColor: '#fee2e2' }]}>
        <Ionicons name={icon} size={18} color={danger ? C.danger : C.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const isSuper = user.role === 'superadmin';

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari MadrasahAI?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, isSuper ? styles.avatarGold : styles.avatarEmerald]}>
          <Text style={[styles.avatarText, { color: isSuper ? C.goldFg : C.primaryFg }]}>
            {getInitials(user.name)}
          </Text>
        </View>
        <View style={[styles.roleBadge, isSuper ? styles.roleBadgeGold : styles.roleBadgeGreen]}>
          <Ionicons name={isSuper ? 'shield-checkmark' : 'school'} size={12} color={isSuper ? C.goldFg : C.primaryFg} />
          <Text style={[styles.roleBadgeText, { color: isSuper ? C.goldFg : C.primaryFg }]}>
            {isSuper ? 'Kepala Madrasah' : 'Guru'}
          </Text>
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileTitle}>{user.title}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>

      {/* Stats for guru */}
      {!isSuper && (
        <View style={[styles.section, S.shadow]}>
          <Text style={styles.sectionTitle}>Statistik Saya</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Generate', value: '12' },
              { label: 'Dokumen', value: '47' },
              { label: 'Jam Hemat', value: '9j' },
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statBoxValue}>{s.value}</Text>
                <Text style={styles.statBoxLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Menu items */}
      <View style={[styles.section, S.shadow]}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <MenuItem icon="person" label="Edit Profil" onPress={() => Alert.alert('Info', 'Fitur segera hadir.')} />
        <MenuItem icon="lock-closed" label="Ubah Password" onPress={() => Alert.alert('Info', 'Fitur segera hadir.')} />
        <MenuItem icon="notifications" label="Notifikasi" onPress={() => Alert.alert('Info', 'Fitur segera hadir.')} />
      </View>

      <View style={[styles.section, S.shadow]}>
        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <MenuItem icon="help-circle" label="Bantuan & FAQ" onPress={() => Alert.alert('Info', 'Hubungi admin@madrasahai.id')} />
        <MenuItem icon="information-circle" label="Tentang MadrasahAI" onPress={() => Alert.alert('MadrasahAI', 'Versi 1.0.0 · Barakallahu fiikum')} />
      </View>

      <View style={[styles.section, S.shadow]}>
        <MenuItem icon="log-out" label="Keluar" onPress={handleLogout} danger />
      </View>

      <Text style={styles.footer}>MadrasahAI v1.0 · Barakallahu fiikum</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16, alignItems: 'stretch' },
  profileCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8, ...S.shadow,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarGold: { backgroundColor: C.gold },
  avatarEmerald: { backgroundColor: C.primary },
  avatarText: { fontSize: 28, fontWeight: '700' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  roleBadgeGold: { backgroundColor: C.gold },
  roleBadgeGreen: { backgroundColor: C.primary },
  roleBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center' },
  profileTitle: { fontSize: 13, color: C.muted },
  profileEmail: { fontSize: 13, color: C.muted },
  section: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statBoxValue: { fontSize: 24, fontWeight: '700', color: C.ink },
  statBoxLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.separator,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: C.ink, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 12, color: C.mutedLight },
});
