/**
 * AcademicContentEditScreen.js
 * Edit HASIL GENERATE konten akademik saja — form parameter READ-ONLY.
 * Contoh Soal: tiap soal punya 3 bagian editable: Soal, Jawaban, Pembahasan
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// Map DB value ke label
const JENIS_TO_LABEL = {
  penjelasan: 'Materi Pembelajaran', ringkasan: 'Ringkasan',
  contoh_soal: 'Contoh Soal', kamus: 'Kamus Istilah', artikel: 'Artikel',
};
const HURUF = ['A', 'B', 'C', 'D', 'E'];

// ─────────────────────────────────────────────
// Info row read-only
// ─────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// SoalEditor — edit 1 soal PG dengan 3 bagian
// ─────────────────────────────────────────────
function SoalEditor({ soal, index, onChange }) {
  const [expanded, setExpanded] = useState(index === 0);
  
  const isPilihanObj = !!soal.pilihan;
  let opsi = ['', '', '', ''];
  if (isPilihanObj) {
    opsi = ['A', 'B', 'C', 'D'].map(k => soal.pilihan[k] || '');
  } else {
    opsi = soal.opsi || soal.options || ['', '', '', ''];
  }

  function handleOpsiChange(opsiIndex, value) {
    const newOpsi = [...opsi];
    newOpsi[opsiIndex] = value;
    if (isPilihanObj) {
      const newPilihan = { A: newOpsi[0], B: newOpsi[1], C: newOpsi[2], D: newOpsi[3] };
      onChange(index, 'pilihan', newPilihan);
    } else {
      onChange(index, 'opsi', newOpsi);
    }
  }

  return (
    <View style={styles.soalCard}>
      <TouchableOpacity style={styles.soalHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={styles.soalBadge}>
          <Text style={styles.soalBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.soalPreview} numberOfLines={2}>
          {soal.pertanyaan || soal.question || `Soal ${index + 1}`}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.soalBody}>
          {/* 1. Pertanyaan / Soal */}
          <View style={styles.soalSection}>
            <View style={styles.soalSectionHeader}>
              <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>Soal</Text></View>
            </View>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={soal.pertanyaan || soal.question || ''}
              onChangeText={val => onChange(index, 'pertanyaan', val)}
              placeholder="Pertanyaan soal..."
              placeholderTextColor={C.mutedLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Opsi A–D */}
          {opsi.length > 0 && (
            <View style={styles.soalSection}>
              <Text style={styles.opsiTitle}>Pilihan Jawaban</Text>
              {opsi.map((o, i) => (
                <View key={i} style={styles.opsiRow}>
                  <View style={styles.hurufBadge}>
                    <Text style={styles.hurufText}>{HURUF[i] || i + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.opsiInput]}
                    value={o}
                    onChangeText={val => handleOpsiChange(i, val)}
                    placeholder={`Opsi ${HURUF[i] || i + 1}...`}
                    placeholderTextColor={C.mutedLight}
                  />
                </View>
              ))}
            </View>
          )}

          {/* 2. Jawaban */}
          <View style={styles.soalSection}>
            <View style={styles.soalSectionHeader}>
              <View style={[styles.sectionBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.sectionBadgeText, { color: '#15803d' }]}>Jawaban</Text>
              </View>
              <Text style={styles.soalSectionHint}>Tulis huruf kunci jawaban (A/B/C/D)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={soal.jawaban || soal.kunci_jawaban || soal.answer || ''}
              onChangeText={val => onChange(index, 'jawaban', val.toUpperCase())}
              placeholder="cth. B"
              placeholderTextColor={C.mutedLight}
              autoCapitalize="characters"
              maxLength={1}
            />
          </View>

          {/* 3. Pembahasan */}
          <View style={styles.soalSection}>
            <View style={styles.soalSectionHeader}>
              <View style={[styles.sectionBadge, { backgroundColor: '#fef9c3' }]}>
                <Text style={[styles.sectionBadgeText, { color: '#92400e' }]}>Pembahasan</Text>
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={soal.pembahasan || soal.explanation || ''}
              onChangeText={val => onChange(index, 'pembahasan', val)}
              placeholder="Penjelasan mengapa jawaban tersebut benar..."
              placeholderTextColor={C.mutedLight}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function AcademicContentEditScreen({ route, navigation }) {
  const { id, currentData } = route.params;
  const { token } = useAuth();

  // Parse content_json
  let contentJson = currentData?.content_json || {};
  if (typeof contentJson === 'string') {
    try { contentJson = JSON.parse(contentJson); } catch { contentJson = {}; }
  }

  const isContohSoal = currentData.jenis_konten === 'contoh_soal' ||
    currentData.jenis_konten === 'Contoh Soal';

  // State hasil generate — yang bisa diedit
  const [judul, setJudul] = useState(contentJson.judul || currentData.topik || '');
  const [konten, setKonten] = useState(contentJson.konten || '');
  const [ringkasan, setRingkasan] = useState(contentJson.ringkasan || '');
  const [soalList, setSoalList] = useState(
    (contentJson.soal || contentJson.questions || []).map(s => ({ ...s }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSoalChange(soalIndex, field, value) {
    setSoalList(prev => {
      const updated = [...prev];
      updated[soalIndex] = { ...updated[soalIndex], [field]: value };
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updatedJson = {
        ...contentJson,
        judul,
        ...(isContohSoal ? { soal: soalList } : { konten, ringkasan }),
      };
      const res = await fetch(`${API_URL}/academic-content/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json: updatedJson }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Berhasil', 'Konten akademik berhasil diperbarui.', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate ke Dokumen tab — MyDocs useFocusEffect auto re-fetch
              navigation.navigate('Dokumen');
            },
          },
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

  const jenisLabel = JENIS_TO_LABEL[currentData.jenis_konten] || currentData.jenis_konten || '-';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="create" size={26} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>EDIT KONTEN</Text>
          <Text style={styles.heroTitle}>{jenisLabel}</Text>
          <Text style={styles.heroDesc}>Edit isi konten yang dihasilkan AI</Text>
        </View>
      </View>

      {/* ── Parameter Generate — READ-ONLY ── */}
      <View style={[styles.card, S.shadow]}>
        <View style={styles.readOnlyHeader}>
          <Text style={styles.readOnlyTitle}>Parameter Generate</Text>
        </View>
        <InfoRow label="Jenis Konten" value={jenisLabel} />
        <InfoRow label="Mata Pelajaran" value={currentData.mata_pelajaran} />
        <InfoRow label="Kelas" value={currentData.tingkat_kelas} />
      </View>

      {/* ── Judul — EDITABLE ── */}
      <View style={[styles.card, S.shadow]}>
        <Text style={styles.sectionTitle}>Judul / Topik</Text>
        <TextInput
          style={styles.input}
          value={judul}
          onChangeText={setJudul}
          placeholder="Judul konten..."
          placeholderTextColor={C.mutedLight}
        />
      </View>

      {/* ── CONTOH SOAL — Edit per soal (3 bagian: Soal, Jawaban, Pembahasan) ── */}
      {isContohSoal && soalList.length > 0 && (
        <View style={[styles.card, S.shadow]}>
          <Text style={styles.sectionTitle}>Soal Pilihan Ganda</Text>
          <Text style={styles.hint}>Tiap soal terdiri dari 3 bagian yang dapat diedit: Soal, Jawaban, dan Pembahasan.</Text>
          {soalList.map((soal, idx) => (
            <SoalEditor key={idx} soal={soal} index={idx} onChange={handleSoalChange} />
          ))}
        </View>
      )}

      {/* ── KONTEN TEKS — Edit konten & ringkasan ── */}
      {!isContohSoal && (
        <View style={[styles.card, S.shadow]}>
          <Text style={styles.sectionTitle}>Isi Konten</Text>
          <TextInput
            style={[styles.input, { height: 180, textAlignVertical: 'top' }]}
            value={konten}
            onChangeText={setKonten}
            placeholder="Isi konten akademik..."
            placeholderTextColor={C.mutedLight}
            multiline
          />
          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Ringkasan</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={ringkasan}
            onChangeText={setRingkasan}
            placeholder="Ringkasan singkat konten..."
            placeholderTextColor={C.mutedLight}
            multiline
          />
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}>Simpan Perubahan</Text></>
        }
      </TouchableOpacity>
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
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 12, color: C.muted, marginTop: 3 },

  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.ink },
  hint: { fontSize: 12, color: C.muted, marginTop: -4 },

  // Read-only
  readOnlyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.separator },
  readOnlyTitle: { fontSize: 12, fontWeight: '600', color: C.muted },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 12, color: C.muted, width: 120 },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.ink, flex: 1 },

  // Input
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  inputMulti: { height: 90 },

  // Soal card
  soalCard: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  soalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  soalBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  soalBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  soalPreview: { flex: 1, fontSize: 13, fontWeight: '600', color: C.ink, lineHeight: 20, marginTop: 4 },
  soalBody: { borderTopWidth: 1, borderTopColor: C.separator, padding: 14, gap: 16 },

  // Soal section (Soal / Jawaban / Pembahasan)
  soalSection: { gap: 8 },
  soalSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  soalSectionHint: { fontSize: 11, color: C.muted },
  sectionBadge: { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Opsi
  opsiTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  opsiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hurufBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hurufText: { fontSize: 12, fontWeight: '700', color: C.ink },
  opsiInput: { flex: 1 },

  // Error & save
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
