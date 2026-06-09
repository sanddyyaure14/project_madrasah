/**
 * SyllabusDetailScreen.js
 * Detail Silabus dari Riwayat Dokumen — view + edit + delete + export
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import FeedbackRating from '../components/FeedbackRating';

const MAPEL_OPTIONS = ['Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu'];
const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
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

// ---------------------------------------------------------------------------
// Week card — expandable, sama dengan SyllabusPreviewScreen
// ---------------------------------------------------------------------------
function WeekCard({ weekData, index }) {
  const [expanded, setExpanded] = useState(false);
  const rows = [
    { label: 'Kompetensi Dasar', icon: 'star-outline', value: weekData.kompetensi_dasar },
    { label: 'Kegiatan Pembelajaran', icon: 'school-outline', value: weekData.kegiatan_pembelajaran },
    { label: 'Indikator', icon: 'checkmark-circle-outline', value: weekData.indikator },
    { label: 'Penilaian', icon: 'clipboard-outline', value: weekData.penilaian },
    { label: 'Alokasi Waktu', icon: 'time-outline', value: weekData.alokasi_waktu },
    { label: 'Sumber Belajar', icon: 'book-outline', value: weekData.sumber_belajar },
  ].filter(r => r.value);

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>{weekData.minggu_ke || index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekLabel}>Minggu ke-{weekData.minggu_ke || index + 1}</Text>
          <Text style={styles.weekMaterial} numberOfLines={expanded ? 0 : 2}>{weekData.materi_pokok || '-'}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekBody}>
          {rows.map((r, i) => (
            <View key={i} style={styles.weekSection}>
              <View style={styles.weekSectionTitle}>
                <Ionicons name={r.icon} size={13} color={C.primary} />
                <Text style={styles.weekSectionTitleText}>{r.label}</Text>
              </View>
              <Text style={styles.weekSectionContent}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function SyllabusDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit state
  const [editMapel, setEditMapel] = useState('');
  const [editKelas, setEditKelas] = useState('');
  const [editTahun, setEditTahun] = useState('');

  useEffect(() => { fetchDetail(); }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/syllabus/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setEditMapel(json.data.mata_pelajaran || '');
        setEditKelas(json.data.tingkat_kelas || '');
        setEditTahun(json.data.tahun_ajaran || '');
      } else {
        Alert.alert('Error', json.message || 'Data tidak ditemukan');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editMapel.trim() || !editKelas.trim() || !editTahun.trim()) {
      Alert.alert('Validasi', 'Semua field wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/syllabus/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mata_pelajaran: editMapel.trim(),
          tingkat_kelas: editKelas.trim(),
          tahun_ajaran: editTahun.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({ ...prev, mata_pelajaran: editMapel, tingkat_kelas: editKelas, tahun_ajaran: editTahun }));
        setEditVisible(false);
        Alert.alert('Berhasil', 'Silabus berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', json.message);
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Hapus Silabus', 'Hapus silabus ini? Tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/syllabus/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Terhapus', 'Silabus berhasil dihapus.');
              navigation.goBack();
            } else {
              Alert.alert('Gagal', json.message);
            }
          } catch {
            Alert.alert('Error', 'Tidak dapat menghapus.');
          }
        },
      },
    ]);
  }

  function handleExportPDF() {
    Linking.openURL(`${API_URL}/syllabus/download/${id}/pdf?token=${encodeURIComponent(token || '')}`);
  }

  function handleExportDocx() {
    Linking.openURL(`${API_URL}/syllabus/download/${id}/docx?token=${encodeURIComponent(token || '')}`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat silabus...</Text>
      </View>
    );
  }

  const syllabusJson = data?.silabus_json || (typeof data?.silabus_json === 'string' ? JSON.parse(data.silabus_json) : {});
  const tabelSilabus = syllabusJson?.tabel_silabus || [];
  const kompetensiInti = syllabusJson?.kompetensi_inti || [];

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Result Panel */}
        <View style={[styles.resultPanel, S.shadow]}>
          {/* Header */}
          <View style={styles.resultHeader}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="bookmark" size={28} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>{data.mata_pelajaran}</Text>
              <Text style={styles.resultSubtitle}>{data.kurikulum} · {data.jenjang}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>Kelas {data.tingkat_kelas}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>Sem. {data.semester}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>{data.tahun_ajaran}</Text></View>
              </View>
            </View>
          </View>

          {/* Kompetensi Inti */}
          {kompetensiInti.length > 0 && (
            <View style={styles.kiBox}>
              <View style={styles.kiTitleRow}>
                <Ionicons name="document-text" size={14} color={C.primary} />
                <Text style={styles.kiTitle}>Kompetensi Inti</Text>
              </View>
              {kompetensiInti.map((ki, idx) => (
                <View key={idx} style={styles.kiItem}>
                  <View style={styles.kiIndexBadge}><Text style={styles.kiIndexText}>{idx + 1}</Text></View>
                  <Text style={styles.kiText}>{ki}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tabel Silabus */}
          {tabelSilabus.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={styles.sectionGroupTitle}>Tabel Silabus Per Minggu</Text>
              {tabelSilabus.map((week, idx) => (
                <WeekCard key={idx} weekData={week} index={idx} />
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('SyllabusEdit', { id, currentData: data })} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={C.primary} />
              <Text style={styles.btnEditText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color={C.danger} />
              <Text style={styles.btnDeleteText}>Hapus</Text>
            </TouchableOpacity>
          </View>

          {/* Export buttons */}
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} activeOpacity={0.8}>
              <Ionicons name="document-text-outline" size={16} color={C.primary} />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportDocx} activeOpacity={0.8}>
              <Ionicons name="document-outline" size={16} color={C.primary} />
              <Text style={styles.exportBtnText}>Export DOCX</Text>
            </TouchableOpacity>
          </View>

          {/* Rating & Feedback AI */}
          <Text style={[styles.sectionGroupTitle, { marginTop: 16 }]}>Nilai Hasil Generate</Text>
          <FeedbackRating
            requestId={data?.request_id}
            endpoint="syllabus"
          />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Silabus</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editLabel}>Mata Pelajaran</Text>
            <ChipGroup options={MAPEL_OPTIONS} selected={editMapel} onSelect={setEditMapel} />

            <Text style={styles.editLabel}>Kelas</Text>
            <ChipGroup options={KELAS_OPTIONS} selected={editKelas} onSelect={setEditKelas} />

            <Text style={styles.editLabel}>Tahun Ajaran</Text>
            <TextInput
              style={styles.editInput}
              value={editTahun}
              onChangeText={setEditTahun}
              placeholder="cth. 2024/2025"
              placeholderTextColor={C.mutedLight}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setEditVisible(false)}>
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },
  resultPanel: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  resultIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  resultSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
  kiBox: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  kiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kiTitle: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  kiItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  kiIndexBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  kiIndexText: { fontSize: 11, fontWeight: '700', color: C.primary },
  kiText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },
  sectionGroupTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  weekCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  weekBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  weekBadgeText: { fontSize: 13, fontWeight: '700', color: C.primary },
  weekLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  weekMaterial: { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20 },
  weekBody: { borderTopWidth: 1, borderTopColor: C.separator, paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  weekSection: { gap: 4, marginTop: 10 },
  weekSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekSectionTitleText: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  weekSectionContent: { fontSize: 13, color: C.ink, lineHeight: 20 },
  resultActions: { flexDirection: 'row', gap: 10 },
  btnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  btnEditText: { fontSize: 14, fontWeight: '600', color: C.primary },
  btnDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 12, paddingVertical: 12 },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: C.danger },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, backgroundColor: C.bg },
  exportBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  editLabel: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: -4 },
  editInput: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
  btnSave: { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
