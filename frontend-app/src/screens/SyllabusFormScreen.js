/**
 * SyllabusFormScreen.js
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Clipboard, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generateSyllabus } from '../lib/api';
import { useAuth, API_URL } from '../lib/auth';
import FeedbackRating from '../components/FeedbackRating';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAPEL_OPTIONS = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab', 'SKI',
  'Matematika', 'IPA Terpadu', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu',
];
const JENJANG_OPTIONS = ['MTs', 'MA'];
const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const KURIKULUM_OPTIONS = ['Merdeka Belajar', 'Kurikulum 2013'];
const SEMESTER_OPTIONS = ['Ganjil', 'Genap'];

// ─────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────
function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Field({ label, required, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={{ color: C.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────
// WeekCard — expandable
// ─────────────────────────────────────────────
function WeekCard({ weekData, index }) {
  const [open, setOpen] = useState(false);
  const rows = [
    { label: 'Kompetensi Dasar', icon: 'star-outline', value: weekData.kompetensi_dasar },
    { label: 'Kegiatan Pembelajaran', icon: 'school-outline', value: weekData.kegiatan_pembelajaran },
    { label: 'Indikator', icon: 'checkmark-circle-outline', value: weekData.indikator },
    { label: 'Penilaian', icon: 'clipboard-outline', value: weekData.penilaian },
    { label: 'Alokasi Waktu', icon: 'time-outline', value: weekData.alokasi_waktu },
    { label: 'Sumber Belajar', icon: 'book-outline', value: weekData.sumber_belajar },
  ].filter(r => r.value);

  return (
    <View style={styles.aktCard}>
      <TouchableOpacity style={styles.aktHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <View style={styles.aktBadge}>
          <Text style={styles.aktBadgeText}>{weekData.minggu_ke || index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aktTipe}>MINGGU KE-{weekData.minggu_ke || index + 1}</Text>
          <Text style={styles.aktSoalCount} numberOfLines={1}>{weekData.materi_pokok || '-'}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.aktBody}>
          {rows.map((r, i) => (
            <View key={i} style={styles.weekSection}>
              <View style={styles.weekSectionTitleRow}>
                <Ionicons name={r.icon} size={13} color={C.primary} />
                <Text style={styles.weekSectionTitle}>{r.label}</Text>
              </View>
              <Text style={styles.weekSectionContent}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// ResultPanel
// ─────────────────────────────────────────────
function ResultPanel({ data, syllabusId, token, navigation, onReset }) {
  let syllabusJson = data?.silabus_json || {};
  if (typeof syllabusJson === 'string') {
    try { syllabusJson = JSON.parse(syllabusJson); } catch { syllabusJson = {}; }
  }
  const tabelSilabus = syllabusJson.tabel_silabus || [];
  const kompetensiInti = syllabusJson.kompetensi_inti || [];

  function handleCopy() {
    const ki = (kompetensiInti).map((k, i) => `KI ${i + 1}: ${k}`).join('\n');
    const tabel = tabelSilabus.map(w => `Minggu ${w.minggu_ke}: ${w.materi_pokok}`).join('\n');
    const text = `SILABUS ${data.mata_pelajaran}\n${'='.repeat(40)}\nJenjang: ${data.jenjang} | Kelas: ${data.tingkat_kelas}\n\nKOMPETENSI INTI:\n${ki}\n\nTABEL SILABUS:\n${tabel}\n\nDibuat dengan MadrasahAI`;
    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Silabus berhasil disalin ke clipboard.');
  }

  function handleExportPDF() {
    Linking.openURL(`${API_URL}/syllabus/download/${syllabusId}/pdf?token=${encodeURIComponent(token || '')}`);
  }

  function handleExportDocx() {
    Linking.openURL(`${API_URL}/syllabus/download/${syllabusId}/docx?token=${encodeURIComponent(token || '')}`);
  }

  function handleSimpan() {
    Alert.alert(
      'Tersimpan ✅',
      'Silabus berhasil disimpan ke dokumen kamu.',
      [
        { text: 'Nanti', style: 'cancel' },
        {
          text: 'Lihat Dokumen',
          onPress: () => navigation.navigate('SyllabusDetail', { id: syllabusId }),
        },
      ]
    );
  }

  return (
    <View style={[styles.resultCard, S.shadow]}>
      {/* Header */}
      <View style={styles.lksHeader}>
        <View style={styles.lksTitleRow}>
          <Ionicons name="bookmark" size={20} color={C.primary} />
          <Text style={styles.lksTitle}>{data.mata_pelajaran}</Text>
        </View>
        <View style={styles.lksMeta}>
          {data.kurikulum && <View style={styles.metaChip}><Text style={styles.metaChipText}>{data.kurikulum}</Text></View>}
          {data.jenjang && <View style={styles.metaChip}><Text style={styles.metaChipText}>{data.jenjang}</Text></View>}
          {data.tingkat_kelas && <View style={styles.metaChip}><Text style={styles.metaChipText}>Kelas {data.tingkat_kelas}</Text></View>}
          {data.semester && <View style={styles.metaChip}><Text style={styles.metaChipText}>Sem. {data.semester}</Text></View>}
          {data.tahun_ajaran && <View style={styles.metaChip}><Text style={styles.metaChipText}>{data.tahun_ajaran}</Text></View>}
        </View>
      </View>

      {/* Kompetensi Inti */}
      {kompetensiInti.length > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>📘 Kompetensi Inti</Text>
          {kompetensiInti.map((ki, idx) => (
            <View key={idx} style={styles.kiItem}>
              <View style={styles.kiBadge}><Text style={styles.kiBadgeText}>{idx + 1}</Text></View>
              <Text style={styles.infoText}>{ki}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tabel Silabus */}
      {tabelSilabus.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>TABEL SILABUS PER MINGGU</Text>
          {tabelSilabus.map((week, idx) => (
            <WeekCard key={idx} weekData={week} index={idx} />
          ))}
        </View>
      )}

      {/* Action row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCopy} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={handleExportPDF} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={handleExportDocx} activeOpacity={0.8}>
          <Ionicons name="document-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>DOCX</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={handleSimpan} activeOpacity={0.8}>
          <Ionicons name="bookmark" size={15} color="#fff" />
          <Text style={styles.btnSaveText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      {/* Rating & Feedback AI */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nilai Hasil Generate</Text>
      <FeedbackRating
        requestId={data?.request_id}
        endpoint="syllabus"
      />

      <TouchableOpacity style={styles.btnReset} onPress={onReset}>
        <Ionicons name="refresh" size={15} color={C.muted} />
        <Text style={styles.btnResetText}>Buat Silabus Baru</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function SyllabusFormScreen({ navigation }) {
  const { user, token } = useAuth();

  const [mataPelajaran, setMataPelajaran] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [kurikulum, setKurikulum] = useState('');
  const [semester, setSemester] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [syllabusId, setSyllabusId] = useState(null);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  const isValid = mataPelajaran && jenjang && kelas && kurikulum && semester && tahunAjaran;

  async function handleGenerate() {
    if (!isValid) { setError('Mohon lengkapi semua field yang diperlukan.'); return; }
    setError('');
    setLoading(true);
    setResult(null);

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
      const res = await generateSyllabus(payload);
      if (res.success && res.data) {
        setResult(res.data);
        setSyllabusId(res.data.id);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        setError(res.message || 'Gagal generate silabus.');
      }
    } catch (err) {
      setError(err.message || 'Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setSyllabusId(null);
    setError('');
    setMataPelajaran('');
    setJenjang('');
    setKelas('');
    setKurikulum('');
    setSemester('');
    setTahunAjaran('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="bookmark" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Syllabus Generator</Text>
          <Text style={styles.heroDesc}>Buat silabus lengkap sesuai kurikulum dan jenjang madrasah</Text>
        </View>
      </View>

      {/* ── FORM ── */}
      {!result && (
        <View style={[styles.card, S.shadow]}>
          <Field label="Mata Pelajaran" required>
            <ChipGroup options={MAPEL_OPTIONS} selected={mataPelajaran} onSelect={setMataPelajaran} />
          </Field>
          <Field label="Jenjang" required>
            <ChipGroup options={JENJANG_OPTIONS} selected={jenjang} onSelect={setJenjang} />
          </Field>
          <Field label="Kelas" required>
            <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} />
          </Field>
          <Field label="Kurikulum" required>
            <ChipGroup options={KURIKULUM_OPTIONS} selected={kurikulum} onSelect={setKurikulum} />
          </Field>
          <Field label="Semester" required>
            <ChipGroup options={SEMESTER_OPTIONS} selected={semester} onSelect={setSemester} />
          </Field>
          <Field label="Tahun Ajaran" required>
            <TextInput
              style={styles.inputSingle}
              value={tahunAjaran}
              onChangeText={t => { setTahunAjaran(t); if (error) setError(''); }}
              placeholder="cth. 2024/2025"
              placeholderTextColor={C.mutedLight}
            />
          </Field>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.generateBtn, loading && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Silabus</Text></>
            }
          </TouchableOpacity>
          {loading && <Text style={styles.loadingHint}>✨ AI sedang menyusun silabus... harap tunggu</Text>}
        </View>
      )}

      {/* ── RESULT ── */}
      {result && (
        <ResultPanel
          data={result}
          syllabusId={syllabusId}
          token={token}
          navigation={navigation}
          onReset={handleReset}
        />
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 18 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  inputSingle: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: C.bg },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // Result
  resultCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 14 },
  lksHeader: { gap: 8 },
  lksTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lksTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1 },
  lksMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  metaChipText: { fontSize: 11, fontWeight: '600', color: C.primary },

  infoBox: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoText: { fontSize: 13, color: C.ink, lineHeight: 20, flex: 1 },
  kiItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kiBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kiBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink },

  // Week card
  aktCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  aktHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  aktBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  aktBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  aktTipe: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  aktSoalCount: { fontSize: 13, fontWeight: '600', color: C.ink, marginTop: 2 },
  aktBody: { borderTopWidth: 1, borderTopColor: C.separator, padding: 14, gap: 12 },
  weekSection: { gap: 4 },
  weekSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekSectionTitle: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  weekSectionContent: { fontSize: 13, color: C.ink, lineHeight: 20 },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.primary },
  btnSave: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnSaveText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  btnResetText: { fontSize: 13, color: C.muted },
});
