/**
 * KepsekEditProfileScreen.js
 * Edit profil Kepala Madrasah — tampilan sama persis dengan EditProfileScreen guru
 * Backend: GET/PUT /api/kepsek/profile
 */

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import { useNotifications } from '../lib/notifications';

const JENJANG_OPTIONS = ['MI', 'MTs', 'MA'];
const KURIKULUM_OPTIONS = [
  { label: 'Merdeka Belajar', value: 'Merdeka' },
  { label: 'Kurikulum 2013', value: 'K13' },
];

function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const val   = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const active = selected === val;
        return (
          <TouchableOpacity
            key={val}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(val)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Field({ label, children, hint }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export default function KepsekEditProfileScreen({ navigation }) {
  const { user, token, setUser } = useAuth();
  const { addNotification } = useNotifications();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [nip,         setNip]         = useState('');
  const [noHp,        setNoHp]        = useState('');
  const [jenjang,     setJenjang]     = useState('');
  const [kurikulum,   setKurikulum]   = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    setLoadingProfile(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setNamaLengkap(p.nama_lengkap ?? '');
        setNip(p.nip ?? '');
        setNoHp(p.no_hp ?? '');
        setJenjang(p.jenjang ?? '');
        setKurikulum(p.kurikulum ?? '');
      } else {
        // Fallback ke data auth context
        setNamaLengkap(user?.name ?? '');
      }
    } catch {
      setNamaLengkap(user?.name ?? '');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSave() {
    if (!namaLengkap.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap: namaLengkap.trim(),
          nip:          nip.trim()  || null,
          no_hp:        noHp.trim() || null,
          jenjang:      jenjang     || null,
          kurikulum:    kurikulum   || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        if (setUser) setUser(prev => ({ ...prev, name: namaLengkap.trim() }));
        addNotification?.({
          title: 'Profil Diperbarui ✅',
          message: 'Data profil berhasil disimpan.',
          type: 'success',
          icon: 'person-circle',
        });
        Alert.alert('Berhasil ✅', 'Profil berhasil diperbarui.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setError(json.message || 'Gagal menyimpan perubahan.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info email tidak bisa diedit */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={C.primary} />
        <Text style={styles.infoText}>
          Email dan password tidak bisa diubah dari sini. Hubungi admin untuk perubahan tersebut.
        </Text>
      </View>

      {/* Email readonly */}
      <View style={styles.readonlyField}>
        <Text style={styles.readonlyLabel}>EMAIL</Text>
        <View style={styles.readonlyValue}>
          <Ionicons name="lock-closed" size={13} color={C.mutedLight} />
          <Text style={styles.readonlyText}>{user?.email}</Text>
        </View>
      </View>

      {/* Form */}
      <View style={[styles.card, S.shadow]}>

        <Field label="Nama Lengkap *">
          <TextInput
            style={[styles.input, error && !namaLengkap.trim() ? styles.inputError : null]}
            value={namaLengkap}
            onChangeText={t => { setNamaLengkap(t); if (error) setError(''); }}
            placeholder="Nama lengkap beserta gelar..."
            placeholderTextColor={C.mutedLight}
          />
        </Field>

        <Field label="NIP" hint="Nomor Induk Pegawai (opsional)">
          <TextInput
            style={styles.input}
            value={nip}
            onChangeText={setNip}
            placeholder="cth. 198506012010011001"
            placeholderTextColor={C.mutedLight}
            keyboardType="numeric"
          />
        </Field>

        <Field label="No. HP / WhatsApp">
          <TextInput
            style={styles.input}
            value={noHp}
            onChangeText={setNoHp}
            placeholder="cth. 08123456789"
            placeholderTextColor={C.mutedLight}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Jenjang Madrasah">
          <ChipGroup options={JENJANG_OPTIONS} selected={jenjang} onSelect={setJenjang} />
        </Field>

        <Field label="Kurikulum">
          <ChipGroup options={KURIKULUM_OPTIONS} selected={kurikulum} onSelect={setKurikulum} />
        </Field>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}>Simpan Perubahan</Text></>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.primaryLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 18 },

  readonlyField: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 4,
  },
  readonlyLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  readonlyValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readonlyText: { fontSize: 14, color: C.mutedLight },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  fieldHint: { fontSize: 11, color: C.mutedLight, marginTop: -4 },

  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    backgroundColor: C.bg,
  },
  inputError: { borderColor: C.danger },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
