import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { C, S } from '../lib/theme';

const STEPS = [
  { n: 1, title: 'Akun', icon: 'person' },
  { n: 2, title: 'Profil', icon: 'school' },
  { n: 3, title: 'Madrasah', icon: 'business' },
  { n: 4, title: 'Selesai', icon: 'checkmark-circle' },
];

const MAPEL = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab',
  'SKI', 'Matematika', 'IPA Terpadu', 'Bahasa Indonesia',
];

const JENJANG = ['MI', 'MTs', 'MA'];
const KURIKULUM = ['Merdeka', 'K13'];

export default function RegisterScreen({ navigation }) {
  const { register, getInstitutions } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Akun
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Step 2 - Profil Guru
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [noHp, setNoHp] = useState('');
  const [subject, setSubject] = useState(MAPEL[0]);
  const [jenjang, setJenjang] = useState(JENJANG[0]);
  const [kurikulum, setKurikulum] = useState(KURIKULUM[0]);

  // Step 3 - Madrasah
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitusi, setSelectedInstitusi] = useState(null);
  const [loadingInstitusi, setLoadingInstitusi] = useState(false);

  // Load daftar madrasah dari backend saat masuk step 3
  useEffect(() => {
    if (step === 3) {
      setLoadingInstitusi(true);
      getInstitutions().then(data => {
        setInstitutions(data);
        setLoadingInstitusi(false);
      });
    }
  }, [step]);

  function validateStep1() {
    if (!email || !password) { Alert.alert('Error', 'Isi email dan password.'); return false; }
    if (password.length < 8) { Alert.alert('Error', 'Password minimal 8 karakter.'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { Alert.alert('Error', 'Format email tidak valid.'); return false; }
    return true;
  }

  function validateStep2() {
    if (!fullName) { Alert.alert('Error', 'Nama lengkap wajib diisi.'); return false; }
    return true;
  }

  function validateStep3() {
    if (!selectedInstitusi) { Alert.alert('Error', 'Pilih madrasah terlebih dahulu.'); return false; }
    return true;
  }

  async function submitRegistrasi() {
    if (!validateStep3()) return;
    setLoading(true);

    const userData = {
      nama_lengkap: fullName,
      email,
      password,
      nip: nip || null,
      mata_pelajaran: [subject],
      jenjang,
      kurikulum,
      no_hp: noHp || null,
      instansi_id: selectedInstitusi.id,
    };

    const res = await register(userData);
    setLoading(false);

    if (!res.ok) {
      Alert.alert('Registrasi Gagal', res.error ?? 'Terjadi kesalahan.');
      return;
    }

    setStep(4);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step === 1 ? navigation.goBack() : setStep(s => s - 1)}
        >
          <Ionicons name="arrow-back" size={16} color={C.muted} />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>

        {/* Stepper */}
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
                <Text style={[styles.stepTitle, step === s.n && { color: C.primary, fontWeight: '700' }]}>
                  {s.title}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, step > s.n && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── STEP 1: Email & Password ── */}
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

            <TouchableOpacity style={styles.btn} onPress={() => validateStep1() && setStep(2)}>
              <Text style={styles.btnText}>Lanjut →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Profil Guru ── */}
        {step === 2 && (
          <View style={[styles.card, S.shadow]}>
            <Text style={styles.cardTitle}>Profil Pengajar</Text>
            <Text style={styles.cardSub}>Lengkapi data diri untuk review Kepala Madrasah.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nama Lengkap + Gelar</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ust. Ahmad Fauzi, S.Pd.I."
                placeholderTextColor={C.mutedLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NIP / NUPTK (opsional)</Text>
              <TextInput
                style={styles.input}
                value={nip}
                onChangeText={setNip}
                placeholder="198901234567890"
                placeholderTextColor={C.mutedLight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>No. HP (opsional)</Text>
              <TextInput
                style={styles.input}
                value={noHp}
                onChangeText={setNoHp}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor={C.mutedLight}
                keyboardType="phone-pad"
              />
            </View>

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
              <Text style={styles.label}>Jenjang</Text>
              <View style={styles.rowChips}>
                {JENJANG.map(j => (
                  <TouchableOpacity
                    key={j}
                    style={[styles.chip, jenjang === j && styles.chipActive]}
                    onPress={() => setJenjang(j)}
                  >
                    <Text style={[styles.chipText, jenjang === j && styles.chipTextActive]}>{j}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kurikulum</Text>
              <View style={styles.rowChips}>
                {KURIKULUM.map(k => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.chip, kurikulum === k && styles.chipActive]}
                    onPress={() => setKurikulum(k)}
                  >
                    <Text style={[styles.chipText, kurikulum === k && styles.chipTextActive]}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => validateStep2() && setStep(3)}>
              <Text style={styles.btnText}>Lanjut →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: Pilih Madrasah ── */}
        {step === 3 && (
          <View style={[styles.card, S.shadow]}>
            <Text style={styles.cardTitle}>Pilih Madrasah</Text>
            <Text style={styles.cardSub}>Pilih madrasah tempat Anda mengajar.</Text>

            {loadingInstitusi ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
            ) : institutions.length === 0 ? (
              <Text style={{ color: C.muted, textAlign: 'center', marginVertical: 20 }}>
                Tidak ada madrasah tersedia. Hubungi admin.
              </Text>
            ) : (
              institutions.map(inst => (
                <TouchableOpacity
                  key={inst.id}
                  style={[styles.madrasahOpt, selectedInstitusi?.id === inst.id && styles.madrasahOptActive]}
                  onPress={() => setSelectedInstitusi(inst)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.madrasahText, selectedInstitusi?.id === inst.id && { color: C.primary, fontWeight: '700' }]}>
                      {inst.nama}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.muted }}>{inst.jenis} • {inst.kota}</Text>
                  </View>
                  {selectedInstitusi?.id === inst.id && (
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={submitRegistrasi}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Kirim untuk Diverifikasi</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 4: Selesai ── */}
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
              <Text style={styles.infoLine}>👤 {fullName}</Text>
              <Text style={styles.infoLine}>🏫 {selectedInstitusi?.nama ?? '-'}</Text>
              <Text style={styles.infoLine}>📚 {subject} • {jenjang}</Text>
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
  stepCircleDone: { backgroundColor: C.success ?? '#22c55e', borderColor: C.success ?? '#22c55e' },
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
    backgroundColor: '#fff',
  },
  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rowChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  madrasahOpt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  madrasahOptActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  madrasahText: { fontSize: 14, color: C.ink },
  doneIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  infoBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, gap: 6, width: '100%' },
  infoLine: { fontSize: 13, color: C.ink },
});
