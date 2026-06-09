import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { C, S } from '../lib/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [role, setRole] = useState('guru');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const PRESETS = {
    superadmin: { email: '', password: '' },
    guru: { email: '', password: '' },
  };

  function switchRole(r) {
    setRole(r);
    setEmail(PRESETS[r].email);
    setPassword(PRESETS[r].password);
  }

  async function handleSubmit() {
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.ok) {
      Alert.alert('Gagal Masuk', res.error ?? 'Terjadi kesalahan.');
      return;
    }

    // Validasi role yang dipilih harus sesuai dengan role di database
    const expectedRole = role === 'superadmin' ? 'superadmin' : 'guru';
    if (res.userRole !== expectedRole) {
      Alert.alert(
        'Role Tidak Sesuai',
        role === 'superadmin'
          ? 'Akun ini bukan Kepala Madrasah.'
          : 'Akun ini bukan Guru. Silakan pilih role yang sesuai.'
      );
      return;
    }
    // Navigation handled by App.js (auth state change)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header brand */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoText}>MadrasahAI</Text>
              <Text style={styles.logoSub}>Platform Pembelajaran Cerdas</Text>
            </View>
          </View>
          <Text style={styles.arabicGreet}>السلام عليكم</Text>
          <Text style={styles.title}>Masuk ke MadrasahAI</Text>
          <Text style={styles.subtitle}>Pilih peran Anda, lalu masukkan kredensial.</Text>
        </View>

        {/* Role switcher */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'superadmin' && styles.roleBtnActiveKepala]}
            onPress={() => switchRole('superadmin')}
          >
            <Ionicons name="shield-checkmark" size={16} color={role === 'superadmin' ? '#fff' : C.muted} />
            <Text style={[styles.roleBtnText, role === 'superadmin' && { color: '#fff' }]}>
              Kepala Madrasah
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'guru' && styles.roleBtnActiveGuru]}
            onPress={() => switchRole('guru')}
          >
            <Ionicons name="school" size={16} color={role === 'guru' ? C.goldFg : C.muted} />
            <Text style={[styles.roleBtnText, role === 'guru' && { color: C.goldFg }]}>
              Guru
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@madrasah.id"
              placeholderTextColor={C.mutedLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.pwWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 44 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor={C.mutedLight}
              />
              <TouchableOpacity style={styles.pwToggle} onPress={() => setShowPw(v => !v)}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              role === 'superadmin' ? { backgroundColor: C.primary } : { backgroundColor: C.gold },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={role === 'guru' ? C.goldFg : '#fff'} />
            ) : (
              <>
                <Ionicons name="log-in" size={18} color={role === 'guru' ? C.goldFg : '#fff'} />
                <Text style={[styles.submitText, { color: role === 'guru' ? C.goldFg : '#fff' }]}>
                  {' '}Masuk sebagai {role === 'superadmin' ? 'Kepala Madrasah' : 'Guru'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>
              Belum punya akun?{' '}
              <Text style={{ color: C.primary, fontWeight: '600' }}>Daftar sebagai guru</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  logoImage: { width: 100, height: 100, borderRadius: 18, backgroundColor: '#fff' },
  logoText: { fontSize: 20, fontWeight: '700', color: C.ink },
  logoSub: { fontSize: 11, color: C.muted },
  arabicGreet: { fontSize: 26, color: C.gold, marginBottom: 4, textAlign: 'left' },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.muted },
  roleRow: {
    flexDirection: 'row', gap: 8, backgroundColor: '#f3f4f6',
    borderRadius: 14, padding: 4, marginBottom: 24,
  },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  roleBtnActiveKepala: { backgroundColor: C.primary },
  roleBtnActiveGuru: { backgroundColor: C.gold },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: C.muted },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.ink },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: C.ink, backgroundColor: '#fff',
  },
  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: '#fff',
    paddingHorizontal: 14,
  },
  pwToggle: { padding: 8 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  submitText: { fontSize: 15, fontWeight: '700' },
  registerLink: { textAlign: 'center', fontSize: 13, color: C.muted },
});
