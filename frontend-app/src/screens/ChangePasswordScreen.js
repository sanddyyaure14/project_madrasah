/**
 * ChangePasswordScreen.js
 * Ubah password guru — verifikasi password lama dulu
 * Backend: PUT /api/guru/change-password
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import { useNotifications } from '../lib/notifications';

export default function ChangePasswordScreen({ navigation }) {
  const { token, logout } = useAuth();
  const { addNotification } = useNotifications();

  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validasi kekuatan password
  const kekuatan = (() => {
    if (passwordBaru.length === 0) return null;
    if (passwordBaru.length < 6) return { label: 'Terlalu pendek', color: C.danger, width: '20%' };
    if (passwordBaru.length < 8) return { label: 'Lemah', color: C.warning, width: '50%' };
    if (/[A-Z]/.test(passwordBaru) && /[0-9]/.test(passwordBaru)) return { label: 'Kuat', color: C.success, width: '100%' };
    return { label: 'Cukup', color: C.gold, width: '75%' };
  })();

  async function handleSubmit() {
    setError('');

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (passwordBaru.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (passwordBaru === passwordLama) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/guru/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_lama: passwordLama,
          password_baru: passwordBaru,
          konfirmasi_password: konfirmasi,
        }),
      });

      const json = await res.json();

      if (json.success) {
        addNotification({
          title: 'Password Berhasil Diubah 🔐',
          message: 'Password kamu berhasil diperbarui. Silakan login ulang.',
          type: 'success',
          icon: 'lock-closed',
        });
        Alert.alert(
          'Password Berhasil Diubah ✅',
          'Silakan login ulang dengan password baru kamu.',
          [{ text: 'Login Ulang', onPress: () => logout() }]
        );
      } else {
        setError(json.message || 'Gagal mengubah password.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={16} color={C.primary} />
        <Text style={styles.infoText}>
          Masukkan password lama untuk verifikasi, lalu buat password baru yang kuat.
        </Text>
      </View>

      <View style={[styles.card, S.shadow]}>

        {/* Password Lama */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password Lama *</Text>
          <View style={styles.pwWrap}>
            <TextInput
              style={styles.pwInput}
              value={passwordLama}
              onChangeText={t => { setPasswordLama(t); if (error) setError(''); }}
              secureTextEntry={!showLama}
              placeholder="Masukkan password lama..."
              placeholderTextColor={C.mutedLight}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowLama(v => !v)}>
              <Ionicons name={showLama ? 'eye-off' : 'eye'} size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Password Baru */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password Baru *</Text>
          <View style={styles.pwWrap}>
            <TextInput
              style={styles.pwInput}
              value={passwordBaru}
              onChangeText={t => { setPasswordBaru(t); if (error) setError(''); }}
              secureTextEntry={!showBaru}
              placeholder="Minimal 6 karakter..."
              placeholderTextColor={C.mutedLight}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowBaru(v => !v)}>
              <Ionicons name={showBaru ? 'eye-off' : 'eye'} size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Indikator kekuatan */}
          {kekuatan && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: kekuatan.width, backgroundColor: kekuatan.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: kekuatan.color }]}>{kekuatan.label}</Text>
            </View>
          )}

          {/* Tips */}
          {passwordBaru.length > 0 && (
            <View style={styles.tipsList}>
              <TipRow ok={passwordBaru.length >= 6} text="Minimal 6 karakter" />
              <TipRow ok={passwordBaru.length >= 8} text="Lebih baik 8+ karakter" />
              <TipRow ok={/[A-Z]/.test(passwordBaru)} text="Mengandung huruf besar" />
              <TipRow ok={/[0-9]/.test(passwordBaru)} text="Mengandung angka" />
            </View>
          )}
        </View>

        {/* Konfirmasi */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Konfirmasi Password Baru *</Text>
          <View style={[styles.pwWrap,
            konfirmasi.length > 0 && passwordBaru !== konfirmasi ? styles.inputError : null,
            konfirmasi.length > 0 && passwordBaru === konfirmasi ? styles.inputSuccess : null,
          ]}>
            <TextInput
              style={styles.pwInput}
              value={konfirmasi}
              onChangeText={t => { setKonfirmasi(t); if (error) setError(''); }}
              secureTextEntry={!showKonfirmasi}
              placeholder="Ulangi password baru..."
              placeholderTextColor={C.mutedLight}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKonfirmasi(v => !v)}>
              {konfirmasi.length > 0
                ? <Ionicons name={passwordBaru === konfirmasi ? 'checkmark-circle' : 'close-circle'} size={18} color={passwordBaru === konfirmasi ? C.success : C.danger} />
                : <Ionicons name={showKonfirmasi ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="lock-closed" size={18} color="#fff" /><Text style={styles.submitBtnText}>Ubah Password</Text></>
          }
        </TouchableOpacity>

      </View>

      <Text style={styles.note}>
        ⚠️ Setelah password berubah, kamu akan otomatis keluar dan perlu login ulang.
      </Text>
    </ScrollView>
  );
}

function TipRow({ ok, text }) {
  return (
    <View style={styles.tipRow}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? C.success : C.mutedLight} />
      <Text style={[styles.tipText, { color: ok ? C.success : C.mutedLight }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.primaryLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 18 },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    backgroundColor: C.bg,
  },
  pwInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.ink,
  },
  eyeBtn: { padding: 12 },
  inputError: { borderColor: C.danger },
  inputSuccess: { borderColor: C.success },

  divider: { height: 1, backgroundColor: C.separator },

  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  strengthBar: { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 3 },
  strengthFill: { height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 60 },

  tipsList: { gap: 4, marginTop: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipText: { fontSize: 12 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  note: { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 },
});
