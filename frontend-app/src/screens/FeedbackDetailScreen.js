/**
 * FeedbackDetailScreen.js
 * Detail + Edit + Download writing feedback
 * Edit: ubah skor & ringkasan per aspek
 * Download: export teks ke clipboard
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Clipboard, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import FeedbackRating from '../components/FeedbackRating';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function scoreColor(n) {
  const v = parseFloat(n) || 0;
  if (v >= 80) return C.success;
  if (v >= 65) return C.warning;
  return C.danger;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildDownloadText(data) {
  let text = `LAPORAN UMPAN BALIK TULISAN SISWA\n`;
  text += `=====================================\n`;
  text += `Nama Siswa  : ${data.nama_siswa || 'Siswa Anonim'}\n`;
  text += `Kelas       : ${data.tingkat_kelas}\n`;
  text += `Jenis Teks  : ${capitalize(data.jenis_tulisan)}\n`;
  text += `Skor Total  : ${parseFloat(data.skor_total).toFixed(0)} / 100\n`;
  text += `=====================================\n\n`;
  text += `RINGKASAN:\n"${data.ringkasan}"\n\n`;
  text += `DETAIL PENILAIAN PER ASPEK:\n\n`;

  (data.aspek || []).forEach((asp, i) => {
    const nama = asp.nama_aspek || asp.nama || `Aspek ${i + 1}`;
    text += `${i + 1}. ${nama.toUpperCase()} — Skor: ${parseFloat(asp.skor).toFixed(0)}\n`;
    text += `   Komentar : ${asp.komentar || '-'}\n`;
    text += `   Saran    : ${asp.saran || '-'}\n\n`;
  });

  text += `\nDibuat oleh MadrasahAI`;
  return text;
}

// ---------------------------------------------------------------------------
// Score circle
// ---------------------------------------------------------------------------
function ScoreCircle({ score, size = 80 }) {
  const num = parseFloat(score) || 0;
  const color = scoreColor(num);
  return (
    <View style={[styles.scoreCircle, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.scoreNum, { color, fontSize: size * 0.30 }]}>{num.toFixed(0)}</Text>
      <Text style={[styles.scoreMax, { color }]}>/100</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Edit Modal — edit skor per aspek + ringkasan
// ---------------------------------------------------------------------------
function EditModal({ visible, data, onClose, onSave }) {
  const [editedAspek, setEditedAspek] = useState([]);
  const [editedRingkasan, setEditedRingkasan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setEditedAspek((data.aspek || []).map(a => ({ ...a })));
      setEditedRingkasan(data.ringkasan || '');
    }
  }, [data]);

  function updateSkor(idx, val) {
    setEditedAspek(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], skor: val };
      return copy;
    });
  }

  async function handleSave() {
    // Validate scores
    for (const asp of editedAspek) {
      const n = parseFloat(asp.skor);
      if (isNaN(n) || n < 0 || n > 100) {
        Alert.alert('Validasi', 'Skor setiap aspek harus antara 0–100.');
        return;
      }
    }
    const totalBaru = editedAspek.length > 0
      ? (editedAspek.reduce((s, a) => s + parseFloat(a.skor || 0), 0) / editedAspek.length).toFixed(2)
      : data.skor_total;

    setSaving(true);
    await onSave({
      skor_total: parseFloat(totalBaru),
      aspek: editedAspek,
      ringkasan: editedRingkasan,
    });
    setSaving(false);
  }

  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Feedback</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={C.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Ringkasan */}
          <View style={styles.editGroup}>
            <Text style={styles.editLabel}>Ringkasan / Kesimpulan</Text>
            <TextInput
              style={styles.editTextArea}
              value={editedRingkasan}
              onChangeText={setEditedRingkasan}
              multiline
              textAlignVertical="top"
              placeholder="Tulis ringkasan..."
              placeholderTextColor={C.mutedLight}
            />
          </View>

          {/* Aspek scores */}
          <Text style={styles.editSectionTitle}>Skor Per Aspek</Text>
          {editedAspek.map((asp, i) => (
            <View key={i} style={styles.editAspekRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.editAspekName} numberOfLines={1}>
                  {asp.nama_aspek || asp.nama || `Aspek ${i + 1}`}
                </Text>
              </View>
              <TextInput
                style={styles.editScoreInput}
                value={String(asp.skor ?? '')}
                onChangeText={v => updateSkor(i, v)}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.editScoreMax}>/100</Text>
            </View>
          ))}

          <Text style={styles.editNote}>
            * Skor total akan dihitung otomatis dari rata-rata aspek.
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalBtnCancel} onPress={onClose}>
            <Text style={styles.modalBtnCancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtnSave, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.modalBtnSaveText}>Simpan Perubahan</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function FeedbackDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/writing-feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Data tidak ditemukan.');
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(payload) {
    try {
      const res = await fetch(`${API_URL}/writing-feedback/edit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setEditVisible(false);
        Alert.alert('Tersimpan', 'Perubahan berhasil disimpan.');
      } else {
        Alert.alert('Gagal', json.message || 'Tidak dapat menyimpan perubahan.');
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Hapus Dokumen',
      'Dokumen ini akan dihapus permanen. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetch(`${API_URL}/writing-feedback/delete/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();
              if (json.success) {
                Alert.alert('Terhapus', 'Dokumen berhasil dihapus.', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Gagal', json.message);
              }
            } catch {
              Alert.alert('Error', 'Tidak dapat menghapus dokumen.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleDownload() {
    if (!data) return;
    const text = buildDownloadText(data);
    Clipboard.setString(text);
    Alert.alert(
      'Tersalin!',
      'Teks laporan lengkap telah disalin ke clipboard. Tempel di WhatsApp, email, atau dokumen.',
      [{ text: 'OK' }]
    );
  }

  function handleKirim() {
    if (!data) return;
    const text = buildDownloadText(data);
    const encoded = encodeURIComponent(text);
    const waUrl = `whatsapp://send?text=${encoded}`;

    Linking.canOpenURL(waUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          Clipboard.setString(text);
          Alert.alert(
            'WhatsApp tidak tersedia',
            'Teks laporan sudah disalin ke clipboard. Tempel di aplikasi lain untuk dikirim.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Clipboard.setString(text);
        Alert.alert('Gagal membuka WhatsApp', 'Teks sudah disalin ke clipboard.');
      });
  }

  // ---------- Loading / Error ----------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={40} color={C.danger} />
        <Text style={styles.errorMsg}>{error || 'Data tidak ditemukan.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = scoreColor(data.skor_total);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Header card */}
        <View style={[styles.headerCard, S.shadow]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{data.nama_siswa || 'Siswa Anonim'}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.metaBadge}>
                  <Ionicons name="school-outline" size={11} color={C.primary} />
                  <Text style={styles.metaBadgeText}>Kelas {data.tingkat_kelas}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="document-text-outline" size={11} color={C.primary} />
                  <Text style={styles.metaBadgeText}>Teks {capitalize(data.jenis_tulisan)}</Text>
                </View>
              </View>
            </View>
            <ScoreCircle score={data.skor_total} />
          </View>

          {/* Ringkasan */}
          {data.ringkasan ? (
            <View style={styles.ringkasanBox}>
              <View style={styles.ringkasanRow}>
                <Ionicons name="document-text" size={13} color={C.primary} />
                <Text style={styles.ringkasanTitle}>Ringkasan</Text>
              </View>
              <Text style={styles.ringkasanText}>{data.ringkasan}</Text>
            </View>
          ) : null}
        </View>

        {/* Action bar: Edit | Download | Kirim | Hapus */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={17} color={C.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
            <Ionicons name="copy-outline" size={17} color={C.primary} />
            <Text style={styles.actionBtnText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnWA]} onPress={handleKirim}>
            <Ionicons name="paper-plane" size={17} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Kirim</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={C.danger} />
              : <><Ionicons name="trash-outline" size={17} color={C.danger} /><Text style={[styles.actionBtnText, { color: C.danger }]}>Hapus</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Aspek detail */}
        {data.aspek?.length > 0 && (
          <View style={[styles.aspekSection, S.shadow]}>
            <Text style={styles.aspekSectionTitle}>Detail Per Aspek</Text>
            {data.aspek.map((asp, i) => {
              const num = parseFloat(asp.skor) || 0;
              const bc = scoreColor(num);
              return (
                <View key={i} style={styles.aspekCard}>
                  {/* Header */}
                  <View style={styles.aspekHeader}>
                    <View style={[styles.aspekBadge, { backgroundColor: bc + '20' }]}>
                      <Text style={[styles.aspekBadgeText, { color: bc }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.aspekName} numberOfLines={1}>
                      {asp.nama_aspek || asp.nama || `Aspek ${i + 1}`}
                    </Text>
                    <Text style={[styles.aspekScoreText, { color: bc }]}>{num.toFixed(0)}</Text>
                  </View>
                  {/* Bar */}
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.min(num, 100)}%`, backgroundColor: bc }]} />
                  </View>
                  {/* Komentar & saran */}
                  {asp.komentar ? (
                    <View style={styles.aspekDetail}>
                      <Text style={styles.aspekDetailLabel}>💬 Komentar</Text>
                      <Text style={styles.aspekDetailText}>{asp.komentar}</Text>
                    </View>
                  ) : null}
                  {asp.saran ? (
                    <View style={[styles.aspekDetail, { backgroundColor: C.goldLight }]}>
                      <Text style={[styles.aspekDetailLabel, { color: '#92400e' }]}>💡 Saran Perbaikan</Text>
                      <Text style={[styles.aspekDetailText, { color: '#78350f' }]}>{asp.saran}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Teks tulisan asli */}
        {data.tulisan_siswa ? (
          <View style={[styles.tulisanCard, S.shadow]}>
            <Text style={styles.tulisanTitle}>Teks Tulisan Asli</Text>
            <Text style={styles.tulisanText}>{data.tulisan_siswa}</Text>
          </View>
        ) : null}

        {/* Rating & Feedback AI */}
        <Text style={styles.tulisanTitle}>Nilai Hasil Generate</Text>
        <FeedbackRating
          requestId={data.request_id}
          endpoint="writing"
        />

      </ScrollView>

      {/* Edit Modal */}
      <EditModal
        visible={editVisible}
        data={data}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveEdit}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  errorMsg: { fontSize: 15, color: C.ink, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  // Header card
  headerCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerName: { fontSize: 20, fontWeight: '700', color: C.ink },
  headerMeta: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  metaBadgeText: { fontSize: 11, fontWeight: '600', color: C.primary },

  scoreCircle: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  scoreNum: { fontWeight: '800', lineHeight: undefined },
  scoreMax: { fontSize: 10, fontWeight: '600' },

  ringkasanBox: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  ringkasanRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasanTitle: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringkasanText: { fontSize: 14, color: C.ink, lineHeight: 21 },

  // Action bar
  actionBar: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.card, borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border, ...S.shadow,
  },
  actionBtnDanger: { borderColor: '#fecaca' },
  actionBtnWA: { backgroundColor: '#25D366', borderColor: '#25D366' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Aspek section
  aspekSection: { backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 12 },
  aspekSectionTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  aspekCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', gap: 0 },
  aspekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  aspekBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aspekBadgeText: { fontSize: 12, fontWeight: '700' },
  aspekName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  aspekScoreText: { fontSize: 20, fontWeight: '800', minWidth: 36, textAlign: 'right' },

  barBg: { height: 4, backgroundColor: C.border, marginHorizontal: 12, borderRadius: 2, marginBottom: 8 },
  barFill: { height: 4, borderRadius: 2 },

  aspekDetail: { backgroundColor: C.bg, margin: 8, marginTop: 0, borderRadius: 10, padding: 10, gap: 4 },
  aspekDetailLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  aspekDetailText: { fontSize: 13, color: C.ink, lineHeight: 19 },

  // Tulisan asli
  tulisanCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 10 },
  tulisanTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  tulisanText: { fontSize: 13, color: C.ink, lineHeight: 21 },

  // Edit Modal
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  modalContent: { padding: 20, gap: 16, paddingBottom: 40 },

  editGroup: { gap: 8 },
  editLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  editTextArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    minHeight: 100, backgroundColor: '#fff', textAlignVertical: 'top',
  },

  editSectionTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
  editAspekRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  editAspekName: { fontSize: 13, color: C.ink, fontWeight: '500' },
  editScoreInput: {
    width: 60, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 8, fontSize: 16, fontWeight: '700',
    color: C.ink, textAlign: 'center', backgroundColor: '#fff',
  },
  editScoreMax: { fontSize: 12, color: C.muted },
  editNote: { fontSize: 11, color: C.mutedLight, fontStyle: 'italic' },

  modalFooter: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card,
  },
  modalBtnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
  modalBtnSave: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13,
  },
  modalBtnSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
