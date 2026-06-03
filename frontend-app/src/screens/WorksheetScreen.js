/**
 * WorksheetScreen.js
 * Worksheet Generator — Form + AI Result + Save to Dokumen
 * Input wajib : Mapel, Topik, Tipe Aktivitas, Kelas
 * Input opsional: Durasi, TP, Header Sekolah, Petunjuk Khusus
 * Aksi hasil : Preview | Edit | Cetak PDF | Simpan
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const MAPEL_OPTIONS = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis",
  'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu',
  'Bahasa Indonesia', 'PKn', 'IPS',
];

const TIPE_OPTIONS = [
  'Pilihan Ganda', 'Isian Singkat', 'Esai',
  'Observasi', 'Praktik', 'Diskusi',
];

// ─────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────
function ChipGroup({ options, selected, onSelect, multi = false }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected === opt;
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
// Result: Soal card per aktivitas
// ─────────────────────────────────────────────
function SoalCard({ soal, index }) {
  const huruf = ['A', 'B', 'C', 'D', 'E'];
  return (
    <View style={styles.soalCard}>
      <Text style={styles.soalNomor}>{index + 1}. {soal.pertanyaan}</Text>
      {Array.isArray(soal.opsi) && soal.opsi.length > 0 ? (
        <View style={styles.opsiList}>
          {soal.opsi.map((o, i) => (
            <Text key={i} style={styles.opsiText}>{huruf[i] || i + 1}. {o}</Text>
          ))}
        </View>
      ) : (
        <View style={styles.jawabanKosong}>
          <Text style={styles.jawabanKosongText}>Jawaban: _______________________________________________</Text>
        </View>
      )}
    </View>
  );
}

function AktivitasCard({ akt, index }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.aktCard}>
      <TouchableOpacity style={styles.aktHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <View style={styles.aktBadge}>
          <Text style={styles.aktBadgeText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aktTipe}>{akt.tipe?.toUpperCase()}</Text>
          <Text style={styles.aktSoalCount}>{(akt.soal || []).length} soal</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.aktBody}>
          {akt.instruksi ? (
            <View style={styles.instruksiBox}>
              <Ionicons name="information-circle" size={13} color={C.primary} />
              <Text style={styles.instruksiText}>{akt.instruksi}</Text>
            </View>
          ) : null}
          {(akt.soal || []).map((s, i) => <SoalCard key={i} soal={s} index={i} />)}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Build download text
// ─────────────────────────────────────────────
function buildDownloadText(ws) {
  const huruf = ['A', 'B', 'C', 'D', 'E'];
  let txt = `LEMBAR KERJA SISWA (LKS)\n`;
  txt += `${'='.repeat(50)}\n`;
  txt += `Judul          : ${ws.judul || '-'}\n`;
  txt += `Mata Pelajaran : ${ws.info?.mata_pelajaran || '-'}\n`;
  txt += `Kelas          : ${ws.info?.kelas || '-'}\n`;
  txt += `Topik          : ${ws.info?.topik || '-'}\n`;
  txt += `Durasi         : ${ws.info?.durasi || '-'}\n`;
  txt += `${'='.repeat(50)}\n\n`;
  txt += `Tujuan Pembelajaran:\n${ws.tujuan || '-'}\n\n`;
  txt += `Petunjuk:\n${ws.petunjuk || '-'}\n\n`;

  (ws.aktivitas || []).forEach((akt, i) => {
    txt += `${'─'.repeat(40)}\n`;
    txt += `AKTIVITAS ${i + 1} — ${akt.tipe?.toUpperCase()}\n`;
    txt += `${akt.instruksi}\n\n`;
    (akt.soal || []).forEach(s => {
      txt += `${s.no}. ${s.pertanyaan}\n`;
      if (Array.isArray(s.opsi) && s.opsi.length > 0) {
        s.opsi.forEach((o, idx) => txt += `   ${huruf[idx]}. ${o}\n`);
      } else {
        txt += `   Jawaban: ________________________________________\n`;
      }
      txt += '\n';
    });
  });

  txt += `\nDibuat dengan MadrasahAI`;
  return txt;
}

// ─────────────────────────────────────────────
// Result Panel
// ─────────────────────────────────────────────
function ResultPanel({ data, worksheetId, navigation, onReset }) {
  const ws = data.worksheet || data;

  function handleCopy() {
    Clipboard.setString(buildDownloadText(ws));
    Alert.alert('Tersalin!', 'LKS berhasil disalin ke clipboard.');
  }

  function handleSimpan() {
    if (!worksheetId) {
      Alert.alert('Info', 'LKS sudah otomatis tersimpan saat di-generate.');
      return;
    }
    // Navigasi ke detail — LKS sudah tersimpan di DB
    navigation.navigate('WorksheetDetail', { id: worksheetId });
  }

  function handleCetakPDF() {
    if (!worksheetId) {
      Alert.alert('Info', 'Generate LKS terlebih dahulu.');
      return;
    }
    // Navigasi ke detail dan buka modal cetak PDF
    navigation.navigate('WorksheetDetail', { id: worksheetId, openPDF: true });
  }

  return (
    <View style={[styles.resultCard, S.shadow]}>
      {/* Header LKS */}
      <View style={styles.lksHeader}>
        <View style={styles.lksTitleRow}>
          <Ionicons name="document-text" size={20} color={C.primary} />
          <Text style={styles.lksTitle}>{ws.judul || 'Lembar Kerja Siswa'}</Text>
        </View>
        <View style={styles.lksMeta}>
          {ws.info?.mata_pelajaran ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{ws.info.mata_pelajaran}</Text>
            </View>
          ) : null}
          {ws.info?.kelas ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>Kelas {ws.info.kelas}</Text>
            </View>
          ) : null}
          {ws.info?.durasi ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={11} color={C.muted} />
              <Text style={styles.metaChipText}>{ws.info.durasi}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Tujuan */}
      {ws.tujuan ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>🎯 Tujuan Pembelajaran</Text>
          <Text style={styles.infoText}>{ws.tujuan}</Text>
        </View>
      ) : null}

      {/* Petunjuk */}
      {ws.petunjuk ? (
        <View style={[styles.infoBox, { backgroundColor: C.goldLight, borderColor: '#fde68a' }]}>
          <Text style={[styles.infoLabel, { color: '#92400e' }]}>📋 Petunjuk Umum</Text>
          <Text style={[styles.infoText, { color: '#78350f' }]}>{ws.petunjuk}</Text>
        </View>
      ) : null}

      {/* Aktivitas */}
      {(ws.aktivitas || []).length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>SOAL PER AKTIVITAS</Text>
          {ws.aktivitas.map((akt, i) => <AktivitasCard key={i} akt={akt} index={i} />)}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCopy} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCetakPDF} activeOpacity={0.8}>
          <Ionicons name="print-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>Cetak PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={handleSimpan} activeOpacity={0.8}>
          <Ionicons name="bookmark" size={15} color="#fff" />
          <Text style={styles.btnSaveText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnReset} onPress={onReset}>
        <Ionicons name="refresh" size={15} color={C.muted} />
        <Text style={styles.btnResetText}>Buat LKS Baru</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function WorksheetScreen({ navigation }) {
  const { user, token } = useAuth();

  // Wajib
  const [mapel, setMapel] = useState('Fiqih');
  const [topik, setTopik] = useState('');
  const [tipeSelected, setTipeSelected] = useState(['Pilihan Ganda']);
  const [kelas, setKelas] = useState('VII');

  // Opsional
  const [durasi, setDurasi] = useState('');
  const [tp, setTp] = useState('');
  const [headerSekolah, setHeaderSekolah] = useState('');
  const [petunjukKhusus, setPetunjukKhusus] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [worksheetId, setWorksheetId] = useState(null);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  function toggleTipe(opt) {
    setTipeSelected(prev =>
      prev.includes(opt) ? (prev.length > 1 ? prev.filter(t => t !== opt) : prev) : [...prev, opt]
    );
  }

  async function handleGenerate() {
    if (!topik.trim()) { setError('Topik wajib diisi.'); return; }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        mata_pelajaran: mapel,
        topik: topik.trim(),
        tipe_aktivitas: tipeSelected,
        tingkat_kelas: kelas,
        ...(durasi && { durasi_menit: parseInt(durasi) }),
        ...(tp && { tujuan_pembelajaran: tp.trim() }),
        ...(headerSekolah && { header_sekolah: headerSekolah.trim() }),
        ...(petunjukKhusus && { petunjuk_khusus: petunjukKhusus.trim() }),
      };

      const res = await fetch(`${API_URL}/worksheet/generate-worksheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Cek content-type sebelum parse — kalau HTML berarti server error/auth issue
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[Worksheet] Non-JSON response:', res.status, text.substring(0, 200));
        if (res.status === 401 || res.status === 403) {
          setError('Sesi login habis atau tidak punya akses. Silakan logout dan login ulang.');
        } else if (res.status === 404) {
          setError('Endpoint tidak ditemukan. Pastikan backend versi terbaru sudah berjalan.');
        } else {
          setError(`Server error (${res.status}). Pastikan backend berjalan dengan benar.`);
        }
        return;
      }

      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
        setWorksheetId(data.data.worksheet_id);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        setError(data.message || 'Gagal generate worksheet.');
      }
    } catch (err) {
      console.error('Worksheet error:', err);
      if (!token) {
        setError('Sesi login tidak ditemukan. Silakan logout dan login ulang.');
      } else {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan di port 3000.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setWorksheetId(null);
    setError('');
    setTopik('');
    setTipeSelected(['Pilihan Ganda']);
    setDurasi('');
    setTp('');
    setHeaderSekolah('');
    setPetunjukKhusus('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleSave() {
    Alert.alert(
      'Tersimpan ✅',
      'LKS berhasil disimpan di Dokumen Saya.',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Lihat Dokumen', onPress: () => navigation.navigate('Dokumen') },
      ]
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
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
          <Ionicons name="document-text" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>ASESMEN</Text>
          <Text style={styles.heroTitle}>Worksheet Generator</Text>
          <Text style={styles.heroDesc}>LKS siap cetak dengan berbagai tipe aktivitas pembelajaran</Text>
        </View>
      </View>

      {/* ── FORM ── */}
      {!result && (
        <View style={[styles.card, S.shadow]}>

          {/* Mata Pelajaran */}
          <Field label="Mata Pelajaran" required>
            <ChipGroup options={MAPEL_OPTIONS} selected={mapel} onSelect={setMapel} />
          </Field>

          {/* Topik */}
          <Field label="Topik / Materi" required>
            <TextInput
              style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
              value={topik}
              onChangeText={t => { setTopik(t); if (error) setError(''); }}
              placeholder="cth. Thaharah, Wudhu, Rukun Islam"
              placeholderTextColor={C.mutedLight}
            />
          </Field>

          {/* Tipe Aktivitas — multi select */}
          <Field label="Tipe Aktivitas" required>
            <ChipGroup options={TIPE_OPTIONS} selected={tipeSelected} onSelect={toggleTipe} multi />
            <Text style={styles.selectedHint}>Terpilih: {tipeSelected.join(', ')}</Text>
          </Field>

          {/* Kelas */}
          <Field label="Kelas" required>
            <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} />
          </Field>

          {/* Durasi */}
          <Field label="Durasi (menit)">
            <TextInput
              style={styles.inputSingle}
              value={durasi}
              onChangeText={setDurasi}
              placeholder="cth. 40 (opsional)"
              placeholderTextColor={C.mutedLight}
              keyboardType="numeric"
            />
          </Field>

          {/* Tujuan Pembelajaran */}
          <Field label="Tujuan Pembelajaran (TP)">
            <TextInput
              style={[styles.inputSingle, { height: 80, textAlignVertical: 'top' }]}
              value={tp}
              onChangeText={setTp}
              placeholder="cth. Siswa dapat menjelaskan pengertian thaharah... (opsional)"
              placeholderTextColor={C.mutedLight}
              multiline
            />
          </Field>

          {/* Header Sekolah */}
          <Field label="Header Sekolah">
            <TextInput
              style={styles.inputSingle}
              value={headerSekolah}
              onChangeText={setHeaderSekolah}
              placeholder="cth. MAN 1 Jakarta (opsional)"
              placeholderTextColor={C.mutedLight}
            />
          </Field>

          {/* Petunjuk Khusus */}
          <Field label="Petunjuk Khusus">
            <TextInput
              style={[styles.inputSingle, { height: 70, textAlignVertical: 'top' }]}
              value={petunjukKhusus}
              onChangeText={setPetunjukKhusus}
              placeholder="cth. Kerjakan dengan teliti... (opsional)"
              placeholderTextColor={C.mutedLight}
              multiline
            />
          </Field>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, loading && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate LKS</Text></>
            }
          </TouchableOpacity>

          {loading && (
            <Text style={styles.loadingHint}>✨ AI sedang menyusun LKS... harap tunggu</Text>
          )}
        </View>
      )}

      {/* ── RESULT ── */}
      {result && (
        <ResultPanel
          data={result}
          worksheetId={worksheetId}
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

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

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
  selectedHint: { fontSize: 11, color: C.primary, marginTop: 4, fontStyle: 'italic' },

  inputSingle: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    backgroundColor: C.bg,
  },
  inputError: { borderColor: C.danger },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // Result card
  resultCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 14 },

  lksHeader: { gap: 8 },
  lksTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lksTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1 },
  lksMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  metaChipText: { fontSize: 11, fontWeight: '600', color: C.primary },

  infoBox: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoText: { fontSize: 13, color: C.ink, lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },

  // Aktivitas card
  aktCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  aktHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  aktBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  aktBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  aktTipe: { fontSize: 13, fontWeight: '700', color: C.ink },
  aktSoalCount: { fontSize: 11, color: C.muted },
  aktBody: { borderTopWidth: 1, borderTopColor: C.separator, padding: 14, gap: 10 },

  instruksiBox: { flexDirection: 'row', gap: 6, backgroundColor: C.primaryLight, borderRadius: 8, padding: 10 },
  instruksiText: { fontSize: 13, color: C.ink, flex: 1, lineHeight: 19 },

  // Soal
  soalCard: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.separator },
  soalNomor: { fontSize: 13, fontWeight: '600', color: C.ink, lineHeight: 20 },
  opsiList: { gap: 2, paddingLeft: 12 },
  opsiText: { fontSize: 13, color: C.ink },
  jawabanKosong: { paddingLeft: 12, paddingTop: 4 },
  jawabanKosongText: { fontSize: 12, color: C.mutedLight, fontStyle: 'italic' },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.primary },
  btnSave: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnSaveText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  btnResetText: { fontSize: 13, color: C.muted },
});
