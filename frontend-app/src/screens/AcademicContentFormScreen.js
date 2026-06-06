/**
 * AcademicContentFormScreen.js
 * Academic Content Generator — Form + AI Result inline (pola WorksheetScreen)
 * Setelah generate: form hilang, ResultPanel muncul
 * Contoh Soal: tampil bernomor dengan opsi A/B/C/D, jawaban hijau, pembahasan
 * Aksi hasil: Copy | Export PDF | Simpan ke Dokumen | Buat Konten Baru
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Clipboard, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generateAcademicContent } from '../lib/api';
import { useAuth, API_URL } from '../lib/auth';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const JENIS_OPTIONS = ['Materi Pembelajaran', 'Ringkasan', 'Contoh Soal', 'Kamus Istilah', 'Artikel'];
const MAPEL_OPTIONS = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab', 'SKI',
  'Matematika', 'IPA Terpadu', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu',
];
const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const PANJANG_OPTIONS = ['Singkat', 'Sedang', 'Panjang'];
const HURUF = ['A', 'B', 'C', 'D', 'E'];

// ─────────────────────────────────────────────
// ChipGroup
// ─────────────────────────────────────────────
function ChipGroup({ options, selected, onSelect, toggleable = false }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(toggleable && active ? '' : opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Field({ label, required, optional, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
        {optional && <Text style={{ color: C.muted, fontWeight: '400' }}> (opsional)</Text>}
      </Text>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────
// SoalCard — tampil soal PG dengan opsi A/B/C/D, jawaban, pembahasan
// ─────────────────────────────────────────────
function SoalCard({ soal, index }) {
  let opsiArray = [];
  if (soal.pilihan) {
    opsiArray = ['A', 'B', 'C', 'D'].map(k => soal.pilihan[k]).filter(Boolean);
  } else {
    opsiArray = soal.opsi || soal.options || [];
  }
  const jawaban = (soal.jawaban || soal.kunci_jawaban || soal.answer || '').toUpperCase();
  const pembahasan = soal.pembahasan || soal.explanation || '';

  return (
    <View style={styles.soalCard}>
      {/* Nomor + Pertanyaan */}
      <View style={styles.soalHeader}>
        <View style={styles.soalNomor}>
          <Text style={styles.soalNomorText}>{index + 1}</Text>
        </View>
        <Text style={styles.soalPertanyaan}>{soal.pertanyaan || soal.question || '-'}</Text>
      </View>

      {/* Opsi A–D */}
      {opsiArray.length > 0 && (
        <View style={styles.opsiList}>
          {opsiArray.map((o, i) => {
            const huruf = HURUF[i] || String(i + 1);
            const isBenar = jawaban === huruf;
            return (
              <View key={i} style={[styles.opsiRow, isBenar && styles.opsiRowBenar]}>
                <View style={[styles.hurufBadge, isBenar && styles.hurufBadgeBenar]}>
                  <Text style={[styles.hurufText, isBenar && styles.hurufTextBenar]}>{huruf}</Text>
                </View>
                <Text style={[styles.opsiText, isBenar && styles.opsiTextBenar]}>{o}</Text>
                {isBenar && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
              </View>
            );
          })}
        </View>
      )}

      {/* Pembahasan */}
      {pembahasan ? (
        <View style={styles.pembahasanBox}>
          <View style={styles.pembahasanTitleRow}>
            <Text style={styles.pembahasanTitle}>💡 Pembahasan</Text>
          </View>
          <Text style={styles.pembahasanText}>{pembahasan}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// renderKontenByJenis
// ─────────────────────────────────────────────
function renderKontenByJenis(data, contentJson) {
  const isContohSoal = data.jenis_konten === 'contoh_soal' || data.jenis_konten === 'Contoh Soal';
  const soalList = contentJson.soal || contentJson.questions || [];
  const konten = contentJson.konten || '';
  const ringkasan = contentJson.ringkasan || '';
  const kataKunci = contentJson.kata_kunci || [];
  const referensi = contentJson.referensi || [];

  return (
    <>
      {isContohSoal && soalList.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>SOAL PILIHAN GANDA</Text>
          {soalList.map((s, i) => <SoalCard key={i} soal={s} index={i} />)}
        </View>
      ) : (
        <>
          {konten ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>📄 Isi Konten</Text>
              <Text style={styles.infoText}>{konten}</Text>
            </View>
          ) : null}
          {ringkasan ? (
            <View style={[styles.infoBox, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
              <Text style={[styles.infoLabel, { color: '#15803d' }]}>📋 Ringkasan</Text>
              <Text style={[styles.infoText, { color: '#166534' }]}>{ringkasan}</Text>
            </View>
          ) : null}
        </>
      )}
      {kataKunci.length > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>🏷️ Kata Kunci</Text>
          <View style={styles.tagRow}>
            {kataKunci.map((k, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{k}</Text></View>
            ))}
          </View>
        </View>
      )}
      {referensi.length > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>📚 Referensi</Text>
          {referensi.map((r, i) => (
            <View key={i} style={styles.kiItem}>
              <View style={styles.kiBadge}><Text style={styles.kiBadgeText}>{i + 1}</Text></View>
              <Text style={styles.infoText}>{r}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// ResultPanel
// ─────────────────────────────────────────────
function ResultPanel({ data, contentId, token, navigation, onReset }) {
  let contentJson = data?.content_json || {};
  if (typeof contentJson === 'string') {
    try { contentJson = JSON.parse(contentJson); } catch { contentJson = {}; }
  }
  const judul = contentJson.judul || data.topik || '-';

  function handleCopy() {
    const soalList = contentJson.soal || contentJson.questions || [];
    const soalText = soalList.map((s, i) => {
      const opsi = (s.opsi || s.options || []).map((o, j) => `  ${HURUF[j]}. ${o}`).join('\n');
      return `${i + 1}. ${s.pertanyaan || s.question || ''}\n${opsi}`;
    }).join('\n\n');
    const text = `${judul}\nJenis: ${data.jenis_konten}\n\n${contentJson.konten || soalText}\n\nDibuat dengan MadrasahAI`;
    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Konten berhasil disalin ke clipboard.');
  }

  function handleExportPDF() {
    Linking.openURL(`${API_URL}/academic-content/download/${contentId}/pdf?token=${encodeURIComponent(token || '')}`);
  }

  function handleSimpan() {
    Alert.alert(
      'Tersimpan ✅',
      'Konten akademik berhasil disimpan ke dokumen kamu.',
      [
        { text: 'Nanti', style: 'cancel' },
        {
          text: 'Lihat Dokumen',
          onPress: () => navigation.navigate('AcademicContentDetail', { id: contentId }),
        },
      ]
    );
  }

  return (
    <View style={[styles.resultCard, S.shadow]}>
      {/* Header */}
      <View style={styles.lksHeader}>
        <View style={styles.lksTitleRow}>
          <Ionicons name="school" size={20} color={C.primary} />
          <Text style={styles.lksTitle} numberOfLines={3}>{judul}</Text>
        </View>
        <View style={styles.lksMeta}>
          {data.jenis_konten && <View style={styles.metaChip}><Text style={styles.metaChipText}>{data.jenis_konten}</Text></View>}
          {data.mata_pelajaran && <View style={styles.metaChip}><Text style={styles.metaChipText}>{data.mata_pelajaran}</Text></View>}
          {data.tingkat_kelas && <View style={styles.metaChip}><Text style={styles.metaChipText}>Kelas {data.tingkat_kelas}</Text></View>}
        </View>
      </View>

      {/* Konten */}
      {renderKontenByJenis(data, contentJson)}

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
        <TouchableOpacity style={styles.btnSave} onPress={handleSimpan} activeOpacity={0.8}>
          <Ionicons name="bookmark" size={15} color="#fff" />
          <Text style={styles.btnSaveText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnReset} onPress={onReset}>
        <Ionicons name="refresh" size={15} color={C.muted} />
        <Text style={styles.btnResetText}>Buat Konten Baru</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function AcademicContentFormScreen({ navigation }) {
  const { user, token } = useAuth();

  const [jenisKonten, setJenisKonten] = useState('');
  const [topik, setTopik] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [panjang, setPanjang] = useState('Sedang');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [contentId, setContentId] = useState(null);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  const isValid = jenisKonten && topik.trim();

  async function handleGenerate() {
    if (!isValid) { setError('Jenis konten dan topik wajib diisi.'); return; }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        jenis_konten: jenisKonten,
        topik: topik.trim(),
        mapel: mapel || undefined,
        kelas: kelas || undefined,
        panjang: panjang.toLowerCase(),
        userId: user?.id,
      };
      const res = await generateAcademicContent(payload);
      if (res.success && res.data) {
        setResult(res.data);
        setContentId(res.data.id);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        setError(res.message || 'Gagal generate konten akademik.');
      }
    } catch (err) {
      setError(err.message || 'Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setContentId(null);
    setError('');
    setJenisKonten('');
    setTopik('');
    setMapel('');
    setKelas('');
    setPanjang('Sedang');
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
          <Ionicons name="school" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN AKADEMIK</Text>
          <Text style={styles.heroTitle}>Academic Content</Text>
          <Text style={styles.heroDesc}>Buat konten akademik — materi, ringkasan, soal, kamus, atau artikel</Text>
        </View>
      </View>

      {/* ── FORM ── */}
      {!result && (
        <View style={[styles.card, S.shadow]}>
          <Field label="Jenis Konten" required>
            <ChipGroup options={JENIS_OPTIONS} selected={jenisKonten} onSelect={setJenisKonten} />
          </Field>
          <Field label="Topik" required>
            <TextInput
              style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
              value={topik}
              onChangeText={t => { setTopik(t); if (error) setError(''); }}
              placeholder="cth. Fotosintesis, Shalat Dhuha, Bilangan Bulat"
              placeholderTextColor={C.mutedLight}
            />
          </Field>
          <Field label="Mata Pelajaran" optional>
            <ChipGroup options={MAPEL_OPTIONS} selected={mapel} onSelect={setMapel} toggleable />
          </Field>
          <Field label="Kelas" optional>
            <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} toggleable />
          </Field>
          <Field label="Panjang Konten" optional>
            <ChipGroup options={PANJANG_OPTIONS} selected={panjang} onSelect={setPanjang} />
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
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Konten</Text></>
            }
          </TouchableOpacity>
          {loading && <Text style={styles.loadingHint}>✨ AI sedang membuat konten akademik... harap tunggu</Text>}
        </View>
      )}

      {/* ── RESULT ── */}
      {result && (
        <ResultPanel
          data={result}
          contentId={contentId}
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
  inputError: { borderColor: C.danger },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // Result
  resultCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 14 },
  lksHeader: { gap: 8 },
  lksTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lksTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1, lineHeight: 24 },
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  tagText: { fontSize: 12, color: C.ink, fontWeight: '500' },

  // Soal PG
  soalCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 },
  soalHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  soalNomor: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  soalNomorText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  soalPertanyaan: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 21 },
  opsiList: { gap: 8 },
  opsiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  opsiRowBenar: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
  hurufBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hurufBadgeBenar: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  hurufText: { fontSize: 12, fontWeight: '700', color: C.ink },
  hurufTextBenar: { color: '#fff' },
  opsiText: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
  opsiTextBenar: { color: '#15803d' },
  pembahasanBox: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a', gap: 6 },
  pembahasanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pembahasanTitle: { fontSize: 13, fontWeight: '700', color: '#b45309' },
  pembahasanText: { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 22 },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.primary },
  btnSave: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnSaveText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  btnResetText: { fontSize: 13, color: C.muted },
});
