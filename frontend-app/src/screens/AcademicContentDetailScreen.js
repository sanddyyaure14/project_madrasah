/**
 * AcademicContentDetailScreen.js
 * Detail Konten Akademik dari Riwayat Dokumen — view + edit + delete + export PDF
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, Clipboard, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import FeedbackRating from '../components/FeedbackRating';

const JENIS_LABEL = {
  penjelasan: 'Materi Pembelajaran',
  ringkasan: 'Ringkasan',
  contoh_soal: 'Contoh Soal',
  kamus: 'Kamus Istilah',
  artikel: 'Artikel',
};

const MAPEL_OPTIONS = ['Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu'];
const KELAS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const HURUF = ['A', 'B', 'C', 'D', 'E'];

// ---------------------------------------------------------------------------
// Soal PG Card
// ---------------------------------------------------------------------------
function SoalPGCard({ soal, index }) {
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
      <View style={styles.soalHeader}>
        <View style={styles.soalNomorBadge}>
          <Text style={styles.soalNomorText}>{index + 1}</Text>
        </View>
        <Text style={styles.soalPertanyaan}>{soal.pertanyaan || soal.question || '-'}</Text>
      </View>
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

function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
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

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AcademicContentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit state
  const [editTopik, setEditTopik] = useState('');
  const [editMapel, setEditMapel] = useState('');
  const [editKelas, setEditKelas] = useState('');

  useEffect(() => { fetchDetail(); }, [id]);

  useEffect(() => {
    if (route.params?.updatedJson) {
      setData(prev => prev ? { ...prev, content_json: route.params.updatedJson } : prev);
      navigation.setParams({ updatedJson: undefined });
    }
  }, [route.params?.updatedJson]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/academic-content/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setEditTopik(json.data.topik || '');
        setEditMapel(json.data.mata_pelajaran || '');
        setEditKelas(json.data.tingkat_kelas || '');
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
    if (!editTopik.trim()) {
      Alert.alert('Validasi', 'Topik wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/academic-content/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topik: editTopik.trim(),
          mata_pelajaran: editMapel.trim() || null,
          tingkat_kelas: editKelas.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({ ...prev, topik: editTopik, mata_pelajaran: editMapel, tingkat_kelas: editKelas }));
        setEditVisible(false);
        Alert.alert('Berhasil', 'Konten akademik berhasil diperbarui.');
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
    Alert.alert('Hapus Konten', 'Hapus konten akademik ini? Tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/academic-content/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Terhapus', 'Konten berhasil dihapus.');
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

  function handleCopy() {
    const text = `${contentJson.judul || data.topik}\n\n${contentJson.konten || ''}`;
    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Konten berhasil disalin ke clipboard.');
  }

  function handleExportPDF() {
    Linking.openURL(`${API_URL}/academic-content/download/${id}/pdf?token=${encodeURIComponent(token || '')}`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat konten...</Text>
      </View>
    );
  }

  let contentJson = data?.content_json || {};
  if (typeof contentJson === 'string') {
    try { contentJson = JSON.parse(contentJson); } catch { contentJson = {}; }
  }

  const judul = contentJson.judul || data.topik || '-';
  const konten = contentJson.konten || '';
  const ringkasan = contentJson.ringkasan || '';
  const kataKunci = contentJson.kata_kunci || [];
  const referensi = contentJson.referensi || [];
  const soalList = contentJson.soal || contentJson.questions || [];
  const isContohSoal = data.jenis_konten === 'contoh_soal' || data.jenis_konten === 'Contoh Soal';
  const jenisLabel = JENIS_LABEL[data.jenis_konten] || data.jenis_konten || '-';

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Result Panel */}
        <View style={[styles.resultPanel, S.shadow]}>
          {/* Header */}
          <View style={styles.resultHeader}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="school" size={28} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle} numberOfLines={3}>{judul}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>{jenisLabel}</Text></View>
                {data.mata_pelajaran && <View style={styles.badge}><Text style={styles.badgeText}>{data.mata_pelajaran}</Text></View>}
                {data.tingkat_kelas && <View style={styles.badge}><Text style={styles.badgeText}>Kelas {data.tingkat_kelas}</Text></View>}
                {data.panjang_konten && <View style={styles.badge}><Text style={styles.badgeText}>{data.panjang_konten}</Text></View>}
              </View>
            </View>
          </View>

          {/* Soal PG — contoh_soal */}
          {isContohSoal && soalList.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.soalSectionLabel}>SOAL PILIHAN GANDA</Text>
              {soalList.map((s, i) => <SoalPGCard key={i} soal={s} index={i} />)}
            </View>
          ) : (
            <>
              {konten ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="document-text" size={14} color={C.primary} />
                    <Text style={styles.sectionTitle}>Isi Konten</Text>
                  </View>
                  <Text style={styles.kontenText}>{konten}</Text>
                </View>
              ) : null}

              {ringkasan ? (
                <View style={styles.ringkasanBox}>
                  <View style={styles.ringkasanTitleRow}>
                    <Ionicons name="reader" size={14} color={C.primary} />
                    <Text style={styles.ringkasanTitle}>Ringkasan</Text>
                  </View>
                  <Text style={styles.ringkasanText}>{ringkasan}</Text>
                </View>
              ) : null}
            </>
          )}

          {/* Kata Kunci */}
          {kataKunci.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pricetag" size={14} color={C.primary} />
                <Text style={styles.sectionTitle}>Kata Kunci</Text>
              </View>
              <View style={styles.tagRow}>
                {kataKunci.map((k, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Referensi */}
          {referensi.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="library" size={14} color={C.primary} />
                <Text style={styles.sectionTitle}>Referensi</Text>
              </View>
              {referensi.map((r, i) => (
                <View key={i} style={styles.refItem}>
                  <View style={styles.refBullet}><Text style={styles.refBulletText}>{i + 1}</Text></View>
                  <Text style={styles.refText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('AcademicContentEdit', { id, currentData: data })} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={C.primary} />
              <Text style={styles.btnEditText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCopy} onPress={handleCopy} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={16} color={C.primary} />
              <Text style={styles.btnCopyText}>Salin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color={C.danger} />
              <Text style={styles.btnDeleteText}>Hapus</Text>
            </TouchableOpacity>
          </View>

          {/* Export PDF */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={16} color={C.primary} />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>

          {/* Rating & Feedback AI */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nilai Hasil Generate</Text>
          <FeedbackRating
            requestId={data?.request_id}
            endpoint="academic"
          />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Konten Akademik</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editLabel}>Topik</Text>
            <TextInput
              style={styles.editInput}
              value={editTopik}
              onChangeText={setEditTopik}
              placeholder="Topik konten"
              placeholderTextColor={C.mutedLight}
            />

            <Text style={styles.editLabel}>Mata Pelajaran <Text style={{ color: C.muted, fontWeight: '400' }}>(opsional)</Text></Text>
            <ChipGroup options={MAPEL_OPTIONS} selected={editMapel} onSelect={setEditMapel} />

            <Text style={styles.editLabel}>Kelas <Text style={{ color: C.muted, fontWeight: '400' }}>(opsional)</Text></Text>
            <ChipGroup options={KELAS_OPTIONS} selected={editKelas} onSelect={setEditKelas} />

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
  resultTitle: { fontSize: 17, fontWeight: '700', color: C.ink, lineHeight: 24 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
  sectionCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  kontenText: { fontSize: 14, color: C.ink, lineHeight: 22 },
  ringkasanBox: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  ringkasanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasanTitle: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringkasanText: { fontSize: 14, color: C.ink, lineHeight: 21 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  tagText: { fontSize: 12, color: C.ink, fontWeight: '500' },
  refItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  refBullet: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  refBulletText: { fontSize: 10, fontWeight: '700', color: C.primary },
  refText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },
  // Soal PG
  soalSectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  soalCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 },
  soalHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  soalNomorBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
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
  resultActions: { flexDirection: 'row', gap: 8 },
  btnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  btnEditText: { fontSize: 13, fontWeight: '600', color: C.primary },
  btnCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  btnCopyText: { fontSize: 13, fontWeight: '600', color: C.primary },
  btnDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 12, paddingVertical: 12 },
  btnDeleteText: { fontSize: 13, fontWeight: '600', color: C.danger },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, backgroundColor: C.bg },
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
