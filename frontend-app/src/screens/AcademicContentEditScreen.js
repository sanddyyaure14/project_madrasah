/**
 * AcademicContentEditScreen.js
 * Edit konten akademik — tampilan identik dengan AcademicContentFormScreen
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

const JENIS_OPTIONS = [
  'Materi Pembelajaran', 'Ringkasan', 'Contoh Soal', 'Kamus Istilah', 'Artikel',
];
const MAPEL_OPTIONS = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab', 'SKI',
  'Matematika', 'IPA Terpadu', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu',
];
const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const PANJANG_OPTIONS = ['Singkat', 'Sedang', 'Panjang'];

// Map DB value ke label
const JENIS_TO_LABEL = {
  penjelasan: 'Materi Pembelajaran', ringkasan: 'Ringkasan',
  contoh_soal: 'Contoh Soal', kamus: 'Kamus Istilah', artikel: 'Artikel',
};

function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
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

export default function AcademicContentEditScreen({ route, navigation }) {
  const { id, currentData } = route.params;
  const { token } = useAuth();

  // Map DB jenis_konten ke label untuk chip
  const initJenis = JENIS_TO_LABEL[currentData.jenis_konten] || currentData.jenis_konten || '';
  const initPanjang = currentData.panjang_konten
    ? currentData.panjang_konten.charAt(0).toUpperCase() + currentData.panjang_konten.slice(1)
    : 'Sedang';

  const [jenisKonten, setJenisKonten] = useState(initJenis);
  const [topik, setTopik] = useState(currentData.topik || '');
  const [mapel, setMapel] = useState(currentData.mata_pelajaran || '');
  const [kelas, setKelas] = useState(currentData.tingkat_kelas || '');
  const [panjang, setPanjang] = useState(initPanjang);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isValid = jenisKonten && topik.trim();

  async function handleSave() {
    if (!isValid) { setError('Jenis konten dan topik wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/academic-content/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis_konten: jenisKonten,
          topik: topik.trim(),
          mata_pelajaran: mapel || null,
          tingkat_kelas: kelas || null,
          panjang_konten: panjang.toLowerCase(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Berhasil', 'Konten akademik berhasil diperbarui.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setError(json.message || 'Gagal menyimpan.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Edit Konten Akademik</Text>
          <Text style={styles.heroDesc}>Ubah data konten akademik sesuai kebutuhan</Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={[styles.card, S.shadow]}>
        <InputField label="Jenis Konten" required>
          <ChipGroup options={JENIS_OPTIONS} selected={jenisKonten} onSelect={setJenisKonten} />
        </InputField>

        <InputField label="Topik" required>
          <TextInput
            style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
            value={topik}
            onChangeText={t => { setTopik(t); if (error) setError(''); }}
            placeholder="cth. Fotosintesis dll."
            placeholderTextColor={C.mutedLight}
          />
        </InputField>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OPSIONAL</Text>
          <View style={styles.divider} />
        </View>

        <InputField label="Mata Pelajaran" optional>
          <ChipGroup options={MAPEL_OPTIONS} selected={mapel} onSelect={setMapel} />
        </InputField>

        <InputField label="Kelas" optional>
          <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} />
        </InputField>

        <InputField label="Panjang Konten" optional>
          <ChipGroup options={PANJANG_OPTIONS} selected={panjang} onSelect={setPanjang} />
        </InputField>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 18 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  inputSingle: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  inputError: { borderColor: C.danger },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: -4 },
  divider: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 10, fontWeight: '700', color: C.mutedLight, letterSpacing: 1.2 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
