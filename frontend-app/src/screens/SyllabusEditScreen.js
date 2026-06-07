/**
 * SyllabusEditScreen.js
 * Edit HASIL GENERATE silabus saja — form parameter (mapel, jenjang, dll) READ-ONLY.
 * Yang bisa diedit: Kompetensi Inti + Tabel Silabus per minggu (silabus_json)
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// ─────────────────────────────────────────────
// Info row read-only (parameter generate — tidak bisa diedit)
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
// WeekEditor — edit satu minggu (expand/collapse)
// ─────────────────────────────────────────────
function WeekEditor({ week, index, onChange }) {
  const [expanded, setExpanded] = useState(index === 0);

  const fields = [
    { key: 'judul',               label: 'Judul Minggu',          multiline: false },
    { key: 'materi_pokok',        label: 'Materi Pokok',          multiline: false },
    { key: 'kompetensi_dasar',    label: 'Kompetensi Dasar',      multiline: true  },
    { key: 'kegiatan_pembelajaran', label: 'Kegiatan Pembelajaran', multiline: true  },
    { key: 'penilaian',           label: 'Penilaian',             multiline: false },
    { key: 'alokasi_waktu',       label: 'Alokasi Waktu',         multiline: false },
    { key: 'sumber_belajar',      label: 'Sumber Belajar',        multiline: false },
  ];

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>{week.minggu_ke || index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekSubLabel}>Minggu ke-{week.minggu_ke || index + 1}</Text>
          <Text style={styles.weekMaterial} numberOfLines={1}>{week.materi_pokok || '—'}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.weekBody}>
          {fields.map(f => (
            <View key={f.key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={[styles.input, f.multiline && styles.inputMulti]}
                value={week[f.key] || ''}
                onChangeText={val => onChange(index, f.key, val)}
                placeholder={`${f.label}...`}
                placeholderTextColor={C.mutedLight}
                multiline={f.multiline}
                textAlignVertical={f.multiline ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function SyllabusEditScreen({ route, navigation }) {
  const { id, currentData } = route.params;
  const { token } = useAuth();

  // Parse silabus_json dari data
  let syllabusJson = currentData?.silabus_json || {};
  if (typeof syllabusJson === 'string') {
    try { syllabusJson = JSON.parse(syllabusJson); } catch { syllabusJson = {}; }
  }

  // State — hanya untuk hasil generate (bukan form param)
  const [tabelSilabus, setTabelSilabus] = useState(
    (syllabusJson.tabel_silabus || []).map(w => ({ ...w }))
  );
  const [kompetensiInti, setKompetensiInti] = useState(
    syllabusJson.kompetensi_inti || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleWeekChange(weekIndex, field, value) {
    setTabelSilabus(prev => {
      const updated = [...prev];
      updated[weekIndex] = { ...updated[weekIndex], [field]: value };
      return updated;
    });
  }

  function handleKIChange(kiIndex, value) {
    setKompetensiInti(prev => {
      const updated = [...prev];
      updated[kiIndex] = value;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updatedJson = { ...syllabusJson, tabel_silabus: tabelSilabus, kompetensi_inti: kompetensiInti };
      const res = await fetch(`${API_URL}/syllabus/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ silabus_json: updatedJson }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Berhasil', 'Silabus berhasil diperbarui.', [
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="create" size={26} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>EDIT SILABUS</Text>
          <Text style={styles.heroTitle}>{currentData.mata_pelajaran || 'Silabus'}</Text>
          <Text style={styles.heroDesc}>Edit isi silabus yang dihasilkan AI</Text>
        </View>
      </View>

      {/* ── Parameter Generate — READ-ONLY ── */}
      <View style={[styles.card, S.shadow]}>
        <View style={styles.readOnlyHeader}>
          <Ionicons name="lock-closed-outline" size={13} color={C.muted} />
          <Text style={styles.readOnlyTitle}>Parameter Generate (tidak dapat diubah)</Text>
        </View>
        <InfoRow label="Mata Pelajaran"  value={currentData.mata_pelajaran} />
        <InfoRow label="Jenjang"         value={currentData.jenjang} />
        <InfoRow label="Kelas"           value={currentData.tingkat_kelas} />
        <InfoRow label="Kurikulum"       value={currentData.kurikulum} />
        <InfoRow label="Semester"        value={currentData.semester} />
        <InfoRow label="Tahun Ajaran"    value={currentData.tahun_ajaran} />
      </View>

      {/* ── Kompetensi Inti — EDITABLE ── */}
      {kompetensiInti.length > 0 && (
        <View style={[styles.card, S.shadow]}>
          <Text style={styles.sectionTitle}>✏️ Kompetensi Inti</Text>
          {kompetensiInti.map((ki, idx) => (
            <View key={idx} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>KI {idx + 1}</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={ki}
                onChangeText={val => handleKIChange(idx, val)}
                placeholder={`Kompetensi Inti ${idx + 1}...`}
                placeholderTextColor={C.mutedLight}
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}
        </View>
      )}

      {/* ── Tabel Silabus Per Minggu — EDITABLE ── */}
      {tabelSilabus.length > 0 && (
        <View style={[styles.card, S.shadow]}>
          <Text style={styles.sectionTitle}>✏️ Tabel Silabus Per Minggu</Text>
          <Text style={styles.hint}>Ketuk minggu untuk expand dan edit.</Text>
          {tabelSilabus.map((week, idx) => (
            <WeekEditor key={idx} week={week} index={idx} onChange={handleWeekChange} />
          ))}
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

  // Read-only info
  readOnlyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.separator },
  readOnlyTitle: { fontSize: 12, fontWeight: '600', color: C.muted },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 12, color: C.muted, width: 110 },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.ink, flex: 1 },

  // Editable fields
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  inputMulti: { height: 90, textAlignVertical: 'top' },

  // Week card
  weekCard: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  weekBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  weekBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  weekSubLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  weekMaterial: { fontSize: 13, fontWeight: '600', color: C.ink, marginTop: 2 },
  weekBody: { borderTopWidth: 1, borderTopColor: C.separator, padding: 14, gap: 14 },

  // Error & save
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
