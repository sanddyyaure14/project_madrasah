/**
 * ProfileScreen.js
 * Profil guru — tampil data dari backend + navigasi ke Edit Profil
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, API_URL } from '../lib/auth';
import { useNotifications } from '../lib/notifications';
import { C, S } from '../lib/theme';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

function MenuItem({ icon, label, onPress, danger, value }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: '#fee2e2' }]}>
        <Ionicons name={icon} size={18} color={danger ? C.danger : C.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={14} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{display}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const isSuper = user?.role === 'superadmin';

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(!isSuper);

  // Reload profil setiap kali screen difokuskan (setelah edit)
  useFocusEffect(
    useCallback(() => {
      if (!isSuper) fetchData();
    }, [token, isSuper])
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [resProfile, resSummary] = await Promise.allSettled([
        fetch(`${API_URL}/guru/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/guru/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resProfile.status === 'fulfilled') {
        const json = await resProfile.value.json();
        if (json.success) setProfile(json.data);
      }
      if (resSummary.status === 'fulfilled') {
        const json = await resSummary.value.json();
        if (json.success) setSummary(json.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari MadrasahAI?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  }

  const displayName = profile?.nama_lengkap || user?.name || '-';
  const displayEmail = profile?.email || user?.email || '-';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Avatar & nama ── */}
      <View style={[styles.profileCard, S.shadow]}>
        <View style={[styles.avatar, isSuper ? styles.avatarGold : styles.avatarEmerald]}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          }
        </View>
        <View style={[styles.roleBadge, isSuper ? styles.roleBadgeGold : styles.roleBadgeGreen]}>
          <Ionicons name={isSuper ? 'shield-checkmark' : 'school'} size={12} color={isSuper ? C.goldFg : C.primaryFg} />
          <Text style={[styles.roleBadgeText, { color: isSuper ? C.goldFg : C.primaryFg }]}>
            {isSuper ? 'Kepala Madrasah' : 'Guru'}
          </Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{displayEmail}</Text>
        {profile?.nama_instansi ? (
          <View style={styles.instansiBadge}>
            <Ionicons name="school-outline" size={12} color={C.muted} />
            <Text style={styles.instansiText}>{profile.nama_instansi}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Info profil detail (guru saja) ── */}
      {!isSuper && profile && (
        <View style={[styles.section, S.shadow]}>
          <Text style={styles.sectionTitle}>Informasi Profil</Text>
          <InfoRow icon="card-outline" label="NIP" value={profile.nip} />
          <InfoRow icon="book-outline" label="Mata Pelajaran" value={profile.mata_pelajaran} />
          <InfoRow icon="layers-outline" label="Jenjang" value={profile.jenjang} />
          <InfoRow icon="document-text-outline" label="Kurikulum" value={profile.kurikulum} />
          <InfoRow icon="call-outline" label="No. HP" value={profile.no_hp} />
          {!profile.nip && !profile.jenjang && !profile.no_hp ? (
            <Text style={styles.emptyInfo}>Lengkapi profil kamu agar lebih informatif →</Text>
          ) : null}
        </View>
      )}

      {/* ── Statistik (guru saja) ── */}
      {!isSuper && (
        <View style={[styles.section, S.shadow]}>
          <Text style={styles.sectionTitle}>Statistik Saya</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>
                {summary ? `${summary.kuota.digunakan}/${summary.kuota.limit_bulanan}` : (loading ? '...' : '-')}
              </Text>
              <Text style={styles.statBoxLabel}>Generate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>
                {summary ? summary.dokumen_tersimpan : (loading ? '...' : '-')}
              </Text>
              <Text style={styles.statBoxLabel}>Dokumen</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>
                {summary ? `${summary.kuota.tersedia}` : (loading ? '...' : '-')}
              </Text>
              <Text style={styles.statBoxLabel}>Sisa Kuota</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Menu Akun ── */}
      <View style={[styles.section, S.shadow]}>
        <Text style={styles.sectionTitle}>Akun</Text>
        {!isSuper && (
          <MenuItem
            icon="person"
            label="Edit Profil"
            onPress={() => navigation.navigate('EditProfile')}
          />
        )}
        <MenuItem
          icon="lock-closed"
          label="Ubah Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <MenuItem
          icon="notifications"
          label="Notifikasi"
          value={unreadCount > 0 ? `${unreadCount} baru` : null}
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      {/* ── Menu Aplikasi ── */}
      <View style={[styles.section, S.shadow]}>
        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <MenuItem
          icon="help-circle"
          label="Bantuan & FAQ"
          onPress={() => Alert.alert('Bantuan', 'Hubungi: admin@madrasahai.id')}
        />
        <MenuItem
          icon="information-circle"
          label="Tentang MadrasahAI"
          onPress={() => Alert.alert('MadrasahAI', 'Versi 1.0.0 · Barakallahu fiikum')}
        />
      </View>

      {/* ── Logout ── */}
      <View style={[styles.section, S.shadow]}>
        <MenuItem icon="log-out" label="Keluar" onPress={handleLogout} danger />
      </View>

      <Text style={styles.footer}>MadrasahAI v1.0 · Barakallahu fiikum</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14, alignItems: 'stretch' },

  profileCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarGold: { backgroundColor: C.gold },
  avatarEmerald: { backgroundColor: C.primary },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  roleBadgeGold: { backgroundColor: C.gold },
  roleBadgeGreen: { backgroundColor: C.primary },
  roleBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center' },
  profileEmail: { fontSize: 13, color: C.muted },
  instansiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  instansiText: { fontSize: 12, color: C.muted },

  section: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyInfo: { fontSize: 12, color: C.primary, fontStyle: 'italic', paddingVertical: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.separator },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  infoLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: C.ink, fontWeight: '500', marginTop: 2 },

  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statBoxValue: { fontSize: 22, fontWeight: '700', color: C.ink },
  statBoxLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.separator },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: C.ink, fontWeight: '500' },
  menuValue: { fontSize: 12, color: C.muted, marginRight: 4 },

  footer: { textAlign: 'center', fontSize: 12, color: C.mutedLight },
});
