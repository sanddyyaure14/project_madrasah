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

function MenuItem({ icon, label, onPress, danger, value, badge }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && { backgroundColor: '#fee2e2' }]}>
        <Ionicons name={icon} size={18} color={danger ? C.danger : C.primary} />
        {badge > 0 ? (
          <View style={styles.badgeDot}>
            <Text style={styles.badgeDotText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const isSuper = user?.role === 'superadmin';

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reload profil setiap kali screen difokuskan (setelah edit)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [token, isSuper])
  );

  async function fetchData() {
    setLoading(true);
    try {
      if (isSuper) {
        // Kepsek: fetch dari endpoint kepsek/profile
        const resProfile = await fetch(`${API_URL}/kepsek/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await resProfile.json();
        if (json.success) setProfile(json.data);
      } else {
        // Guru: fetch profile + summary
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

      {/* ── Info profil detail (guru & kepsek) ── */}
      {profile && (
        <View style={[styles.section, S.shadow]}>
          <Text style={styles.sectionTitle}>Informasi Profil</Text>
          <InfoRow icon="card-outline" label="NIP" value={profile.nip} />
          {!isSuper && (
            <InfoRow icon="book-outline" label="Mata Pelajaran" value={profile.mata_pelajaran} />
          )}
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
        <MenuItem
          icon="person"
          label="Edit Profil"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="lock-closed"
          label="Ubah Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <MenuItem
          icon="notifications"
          label="Notifikasi"
          badge={unreadCount}
          value={unreadCount > 0 ? `${unreadCount} baru` : null}
          onPress={() => navigation.navigate('Notifications')}
        />
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
  menuValue: { fontSize: 12, color: C.muted, marginRight: 4 },
  badgeDot: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: C.danger, borderRadius: 999,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: C.card,
  },
  badgeDotText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  footer: { textAlign: 'center', fontSize: 12, color: C.mutedLight },
});
