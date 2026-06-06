/**
 * SyllabusFormScreen.js
 * Form input untuk generate silabus — konsisten dengan WritingFeedbackScreen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generateSyllabus } from '../lib/api';
import { useAuth } from '../lib/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAPEL_OPTIONS = [
  'Fiqih',
  'Akidah Akhlak',
  "Al-Qur'an Hadis",
  'Bahasa Arab',
  'SKI',
  'Matematika',
  'IPA Terpadu',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPS Terpadu',
];

const JENJANG_OPTIONS = ['MI', 'MTs', 'MA'];

const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const KURIKULUM_OPTIONS = ['Merdeka Belajar', 'Kurikulum 2013'];

const SEMESTER_OPTIONS = ['Ganjil', 'Genap'];

// ---------------------------------------------------------------------------
// Reusable components — sama persis dengan WritingFeedbackScreen
// ---------------------------------------------------------------------------
function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function InputField({ label, children, required }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function SyllabusFormScreen({ navigation }) {
  const { user } = useAuth();

  const [mataPelajaran, setMataPelajaran] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [kurikulum, setKurikulum] = useState('');
  const [semester, setSemester] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = mataPelajaran && jenjang && kelas && kurikulum && semester && tahunAjaran;

  async function handleGenerate() {
    if (!isValid) {
      setError('Mohon lengkapi semua field yang diperlukan.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        mata_pelajaran: mataPelajaran,
        jenjang,
        tingkat_kelas: kelas,
        kurikulum,
        semester,
        tahun_ajaran: tahunAjaran,
        userId: user?.id,
      };

      const result = await generateSyllabus(payload);

      setLoading(false);
      navigation.navigate('SyllabusPreview', {
        syllabusId: result.data.id,
        syllabusData: result.data,
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Terjadi kesalahan. Pastikan server backend berjalan.');
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero — sama dengan ToolPageScreen */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="bookmark" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Syllabus Generator</Text>
          <Text style={styles.heroDesc}>
            Buat silabus lengkap sesuai kurikulum dan jenjang madrasah
          </Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={[styles.card, S.shadow]}>

        {/* Mata Pelajaran */}
        <InputField label="Mata Pelajaran" required>
          <ChipGroup
            options={MAPEL_OPTIONS}
            selected={mataPelajaran}
            onSelect={setMataPelajaran}
          />
        </InputField>

        {/* Jenjang */}
        <InputField label="Jenjang" required>
          <ChipGroup
            options={JENJANG_OPTIONS}
            selected={jenjang}
            onSelect={setJenjang}
          />
        </InputField>

        {/* Kelas */}
        <InputField label="Kelas" required>
          <ChipGroup
            options={KELAS_OPTIONS}
            selected={kelas}
            onSelect={setKelas}
          />
        </InputField>

        {/* Kurikulum */}
        <InputField label="Kurikulum" required>
          <ChipGroup
            options={KURIKULUM_OPTIONS}
            selected={kurikulum}
            onSelect={setKurikulum}
          />
        </InputField>

        {/* Semester */}
        <InputField label="Semester" required>
          <ChipGroup
            options={SEMESTER_OPTIONS}
            selected={semester}
            onSelect={setSemester}
          />
        </InputField>

        {/* Tahun Ajaran */}
        <InputField label="Tahun Ajaran" required>
          <TextInput
            style={styles.inputSingle}
            value={tahunAjaran}
            onChangeText={(t) => { setTahunAjaran(t); if (error) setError(''); }}
            placeholder="cth. 2024/2025"
            placeholderTextColor={C.mutedLight}
          />
        </InputField>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Silabus</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>
            ✨ AI sedang menyusun silabus... harap tunggu
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — disamakan dengan WritingFeedbackScreen & ToolPageScreen
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 18,
  },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  inputSingle: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.ink,
    backgroundColor: C.bg,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },
});
