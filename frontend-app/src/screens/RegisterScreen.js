import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';

const STEPS = [
  { n: 1, title: 'Registrasi Guru', sub: 'Input email + password', icon: 'person' },
  { n: 2, title: 'Verifikasi Email', sub: 'Kode OTP dikirim ke email', icon: 'mail' },
  { n: 3, title: 'Info Madrasah', sub: 'Detail pengajar', icon: 'school' },
  { n: 4, title: 'Selesai', sub: 'Menunggu persetujuan admin', icon: 'checkmark-circle' },
];

const MAPEL = ['Fiqih', 'Akidah Akhlak', 'Al-Qur\'an Hadis', 'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu', 'Bahasa Indonesia'];
const MADRASAH = ['MTs Negeri 1 Jakarta', 'MTs Al-Hikmah Bandung', 'MA Negeri 2 Surabaya', 'MI Darul Ulum Yogyakarta'];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState(MAPEL[0]);
  const [madrasah, setMadrasah] = useState(MADRASAH[0]);

  function submitStep1() {
    if (!email || !password) { Alert.alert('Error', 'Isi email dan password.'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password minimal 8 karakter.'); return; }
    setLoading(true);
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setLoading(false);
      Alert.alert('Kode Terkirim!', `Kode demo Anda: ${code}`);
      setStep(2);
    }, 800);
  }

  function submitStep2() {
    if (otp !== generatedOtp) { Alert.alert('Error', 'Kode OTP tidak valid.'); return; }
    setStep(3);
  }

  function submitStep3() {
    if (!fullName || !nip) { Alert.alert('Error', 'Isi semua field.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1000);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(s => s - 1)}>
          <Ionicons name="arrow-back" size={16} color={C.muted} />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>

        {/* Progress stepper */}
        <View style={styles.stepper}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= s.n && styles.stepCircleActive, step > s.n && styles.stepCircleDone]}>
                  {step > s.n
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.stepNum, step >= s.n && { color: '#fff' }]}>{s.n}</Text>
                  }
                </View>
                <Text style={[styles.stepTitle, step === s.n && { color: C.primary, fontWeight: '700' }]} numberOfLines={1}>
                  {s.title}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, step > s.n && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Step 1: Email & Password */}
        {step === 1 && (
          <View style={[styles.card, S.shadow]}>
            <Text style={styles.cardTitle}>Buat Akun Guru</Text>
            <Text style={styles.cardSub}>Isi email institusi dan buat password yang kuat.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email Institusi</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="guru@madrasah.id"
                placeholderTextColor={C.mutedLight}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholder="Min. 8 karakter"
                  placeholderTextColor={C.mutedLight}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 8 }}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={submitStep1} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Kode Verifikasi</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <View style={[styles.card, S.shadow]}>
            <Text style={styles.cardTitle}>Verifikasi Email</Text>
            <Text style={styles.cardSub}>Kode OTP 6 digit telah dikirim ke {email}.</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Kode OTP</Text>
              <TextInput
                style={[styles.input, { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: '700' }]}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={C.mutedLight}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={submitStep2}>
              <Text style={styles.btnText}>Verifikasi Kode</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Info */}
        {step === 3 && (
          <View style={[styles.card, S.shadow]}>
            <Text style={styles.cardTitle}>Informasi Pengajar</Text>
            <Text style={styles.cardSub}>Lengkapi profil untuk review oleh Kepala Madrasah.</Text>
            {[
              { label: 'Nama Lengkap + Gelar', value: fullName, set: setFullName, placeholder: 'Ust. Ahmad Fauzi, S.Pd.I.' },
              { label: 'NIP / NUPTK', value: nip, set: setNip, placeholder: '198901234567890', keyboard: 'numeric' },
            ].map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.mutedLight}
                  keyboardType={f.keyboard ?? 'default'}
                />
              </View>
            ))}
            <View style={styles.field}>
              <Text style={styles.label}>Mata Pelajaran</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {MAPEL.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, subject === m && styles.chipActive]}
                    onPress={() => setSubject(m)}
                  >
                    <Text style={[styles.chipText, subject === m && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Madrasah</Text>
              {MADRASAH.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.madrasahOpt, madrasah === m && styles.madrasahOptActive]}
                  onPress={() => setMadrasah(m)}
                >
                  <Text style={[styles.madrasahText, madrasah === m && { color: C.primary, fontWeight: '700' }]}>{m}</Text>
                  {madrasah === m && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={submitStep3} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim untuk Diverifikasi</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <View style={[styles.card, S.shadow, { alignItems: 'center', gap: 16 }]}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark-circle" size={56} color={C.primary} />
            </View>
            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Pendaftaran Terkirim!</Text>
            <Text style={[styles.cardSub, { textAlign: 'center' }]}>
              Akun Anda sedang direview oleh Kepala Madrasah. Anda akan mendapat notifikasi setelah disetujui.
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLine}>📧 {email}</Text>
              <Text style={styles.infoLine}>🏫 {madrasah}</Text>
              <Text style={styles.infoLine}>📚 {subject}</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Kembali ke Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  stepCircleActive: { backgroundColor: C.primary, borderColor: C.primary },
  stepCircleDone: { backgroundColor: C.success, borderColor: C.success },
  stepNum: { fontSize: 13, fontWeight: '700', color: C.muted },
  stepTitle: { fontSize: 9, color: C.muted, textAlign: 'center' },
  stepLine: { height: 2, flex: 0.5, backgroundColor: C.border, marginBottom: 14 },
  stepLineActive: { backgroundColor: C.primary },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: C.ink },
  cardSub: { fontSize: 13, color: C.muted, lineHeight: 19 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: C.ink },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.ink,
  },
  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14,
  },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  madrasahOpt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  madrasahOptActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  madrasahText: { fontSize: 14, color: C.ink },
  doneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, gap: 6, width: '100%' },
  infoLine: { fontSize: 13, color: C.ink },
});
