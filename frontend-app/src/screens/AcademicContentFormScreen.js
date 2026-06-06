/**
 * AcademicContentFormScreen.js
 * Form input untuk generate konten akademik — konsisten dengan SyllabusFormScreen
 * Input wajib: Jenis Konten, Topik
 * Input opsional: Mapel, Kelas, Panjang Konten
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
import { generateAcademicContent } from '../lib/api';
import { useAuth } from '../lib/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const JENIS_OPTIONS = [
  'Materi Pembelajaran',
  'Ringkasan',
  'Contoh Soal',
  'Kamus Istilah',
  'Artikel',
];

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

const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const PANJANG_OPTIONS = ['Singkat', 'Sedang', 'Panjang'];

// ---------------------------------------------------------------------------
// Reusable components — sama dengan SyllabusFormScreen & WritingFeedbackScreen
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

function InputField({ label, children, required, optional }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
        {optional && <Text style={{ color: C.muted, fontWeight: '400' }}> (opsional)</Text>}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AcademicContentFormScreen({ navigation }) {
  const { user } = useAuth();

  // Wajib
  const [jenisKonten, setJenisKonten] = useState('');
  const [topik, setTopik] = useState('');

  // Opsional
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [panjang, setPanjang] = useState('Sedang');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = jenisKonten && topik.trim();

  async function handleGenerate() {
    if (!isValid) {
      setError('Jenis konten dan topik wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        jenis_konten: jenisKonten,
        topik: topik.trim(),
        mapel: mapel || undefined,
        kelas: kelas || undefined,
        panjang: panjang.toLowerCase(),
        userId: user?.id,
      };

      const result = await generateAcademicContent(payload);

      setLoading(false);
      navigation.navigate('AcademicContentPreview', {
        contentId: result.data.id,
        contentData: result.data,
        inputData: { jenisKonten, topik, mapel, kelas, panjang },
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
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color={C.muted} />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Academic Content</Text>
          <Text style={styles.heroDesc}>
            Buat konten akademik terformat — materi, ringkasan, soal, kamus, atau artikel
          </Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={[styles.card, S.shadow]}>

        {/* Jenis Konten — WAJIB */}
        <InputField label="Jenis Konten" required>
          <ChipGroup
            options={JENIS_OPTIONS}
            selected={jenisKonten}
            onSelect={setJenisKonten}
          />
        </InputField>

        {/* Topik — WAJIB */}
        <InputField label="Topik" required>
          <TextInput
            style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
            value={topik}
            onChangeText={(t) => { setTopik(t); if (error) setError(''); }}
            placeholder="cth. Fotosintesis dll."
            placeholderTextColor={C.mutedLight}
          />
        </InputField>

        {/* Mata Pelajaran */}
        <InputField label="Mata Pelajaran" optional>
          <ChipGroup
            options={MAPEL_OPTIONS}
            selected={mapel}
            onSelect={(v) => setMapel(mapel === v ? '' : v)}
          />
        </InputField>

        {/* Kelas */}
        <InputField label="Kelas" optional>
          <ChipGroup
            options={KELAS_OPTIONS}
            selected={kelas}
            onSelect={(v) => setKelas(kelas === v ? '' : v)}
          />
        </InputField>

        {/* Panjang Konten */}
        <InputField label="Panjang Konten" optional>
          <ChipGroup
            options={PANJANG_OPTIONS}
            selected={panjang}
            onSelect={setPanjang}
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
              <Text style={styles.generateBtnText}>Generate Konten</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>
            ✨ AI sedang membuat konten akademik... harap tunggu
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — identik dengan SyllabusFormScreen
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
    fontSize: 14, color: C.ink, backgroundColor: C.bg,
  },
  inputError: { borderColor: C.danger },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginVertical: -4,
  },
  divider: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: {
    fontSize: 10, fontWeight: '700', color: C.mutedLight,
    letterSpacing: 1.2,
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
