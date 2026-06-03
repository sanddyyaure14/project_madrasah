/**
 * WorksheetDetailScreen.js
 * Detail worksheet + CRUD + Cetak PDF + Copy
 * Dibuka dari: WorksheetScreen (setelah generate) atau MyDocsScreen (list)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Clipboard, Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getWs(data) {
  if (!data) return null;
  return typeof data.worksheet_json === 'string'
    ? JSON.parse(data.worksheet_json)
    : data.worksheet_json;
}

function buildCopyText(data) {
  const ws = getWs(data);
  const huruf = ['A', 'B', 'C', 'D', 'E'];
  let txt = `LEMBAR KERJA SISWA (LKS)\n${'='.repeat(50)}\n`;
  txt += `Judul          : ${ws?.judul || data.judul || '-'}\n`;
  txt += `Mata Pelajaran : ${data.mata_pelajaran || '-'}\n`;
  txt += `Topik          : ${data.topik || '-'}\n`;
  txt += `Kelas          : ${ws?.info?.kelas || '-'}\n`;
  txt += `Durasi         : ${data.durasi_menit ? data.durasi_menit + ' menit' : '-'}\n`;
  txt += `${'='.repeat(50)}\n\n`;
  if (ws?.tujuan) txt += `Tujuan:\n${ws.tujuan}\n\n`;
  if (ws?.petunjuk) txt += `Petunjuk:\n${ws.petunjuk}\n\n`;
  (ws?.aktivitas || []).forEach((akt, i) => {
    txt += `${'─'.repeat(40)}\nAKTIVITAS ${i + 1} — ${akt.tipe?.toUpperCase()}\n${akt.instruksi}\n\n`;
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
// Edit Modal — ubah judul & topik
// ─────────────────────────────────────────────
function EditModal({ visible, data, onClose, onSave }) {
  const [judul, setJudul] = useState('');
  const [topik, setTopik] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const ws = getWs(data);
      setJudul(ws?.judul || data.judul || '');
      setTopik(data.topik || '');
    }
  }, [data, visible]);

  async function handleSave() {
    if (!judul.trim()) { Alert.alert('Validasi', 'Judul tidak boleh kosong.'); return; }
    setSaving(true);
    const ws = getWs(data);
    const updatedWs = { ...ws, judul: judul.trim() };
    await onSave({
      judul: judul.trim(),
      mata_pelajaran: data.mata_pelajaran,
      topik: topik.trim() || data.topik,
      tipe_aktivitas: data.tipe_aktivitas,
      durasi_menit: data.durasi_menit,
      worksheet_json: updatedWs,
    });
    setSaving(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Worksheet</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={C.ink} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.editGroup}>
            <Text style={styles.editLabel}>Judul LKS</Text>
            <TextInput
              style={styles.editInput}
              value={judul}
              onChangeText={setJudul}
              placeholder="Judul LKS..."
              placeholderTextColor={C.mutedLight}
            />
          </View>
          <View style={styles.editGroup}>
            <Text style={styles.editLabel}>Topik</Text>
            <TextInput
              style={styles.editInput}
              value={topik}
              onChangeText={setTopik}
              placeholder="Topik..."
              placeholderTextColor={C.mutedLight}
            />
          </View>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
            <Text style={styles.btnCancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSaveModal, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.btnSaveModalText}>Simpan</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Cetak PDF Modal — info + tombol buka URL
// ─────────────────────────────────────────────
function CetakPDFModal({ visible, worksheetId, token, onClose }) {
  const [loading, setLoading] = useState(false);

  const pdfUrl = `${API_URL}/worksheet/worksheets/${worksheetId}/cetak-pdf`;

  async function handleBukaBrowser() {
    // Buka URL PDF langsung di browser device
    const urlWithToken = `${pdfUrl}?token=${token}`;
    const supported = await Linking.canOpenURL(urlWithToken);
    if (supported) {
      await Linking.openURL(urlWithToken);
    } else {
      Alert.alert('Tidak bisa membuka browser', 'Salin URL di bawah dan buka di browser manual.');
    }
  }

  function handleCopyUrl() {
    Clipboard.setString(pdfUrl);
    Alert.alert('URL Tersalin', 'Tempel di browser untuk download PDF.\n\nCatatan: Tambahkan header Authorization: Bearer <token> jika perlu.');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.pdfOverlay}>
        <View style={styles.pdfModal}>
          {/* Header */}
          <View style={styles.pdfHeader}>
            <View style={styles.pdfIconWrap}>
              <Ionicons name="document-text" size={24} color={C.primary} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.pdfClose}>
              <Ionicons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.pdfTitle}>Cetak PDF</Text>
          <Text style={styles.pdfDesc}>
            LKS ini akan diunduh sebagai file PDF. Pilih cara download:
          </Text>

          {/* URL preview */}
          <View style={styles.pdfUrlBox}>
            <Ionicons name="link-outline" size={13} color={C.muted} />
            <Text style={styles.pdfUrlText} numberOfLines={2}>{pdfUrl}</Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.pdfBtnPrimary} onPress={handleBukaBrowser} activeOpacity={0.85}>
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={styles.pdfBtnPrimaryText}>Buka di Browser</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pdfBtnSecondary} onPress={handleCopyUrl} activeOpacity={0.85}>
            <Ionicons name="copy-outline" size={18} color={C.primary} />
            <Text style={styles.pdfBtnSecondaryText}>Salin URL PDF</Text>
          </TouchableOpacity>

          <Text style={styles.pdfNote}>
            * Pastikan sudah login di browser, atau gunakan Postman dengan header Authorization Bearer.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Soal item
// ─────────────────────────────────────────────
function SoalItem({ soal, index }) {
  const huruf = ['A', 'B', 'C', 'D', 'E'];
  return (
    <View style={styles.soalItem}>
      <Text style={styles.soalText}>{index + 1}. {soal.pertanyaan}</Text>
      {Array.isArray(soal.opsi) && soal.opsi.length > 0 ? (
        <View style={styles.opsiList}>
          {soal.opsi.map((o, i) => (
            <Text key={i} style={styles.opsiText}>{huruf[i]}. {o}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.jawabanLine}>Jawaban: ___________________________________</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function WorksheetDetailScreen({ route, navigation }) {
  const { id, openPDF } = route.params;
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchDetail(); }, [id]);

  // Auto-buka PDF modal jika datang dari Worksheet Generator
  useEffect(() => {
    if (openPDF && data) setPdfVisible(true);
  }, [openPDF, data]);

  async function fetchDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/worksheet/worksheets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Data tidak ditemukan.');
    } catch { setError('Tidak dapat terhubung ke server.'); }
    finally { setLoading(false); }
  }

  async function handleSaveEdit(payload) {
    try {
      const res = await fetch(`${API_URL}/worksheet/worksheets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setEditVisible(false);
        Alert.alert('Tersimpan', 'Perubahan berhasil disimpan.');
      } else Alert.alert('Gagal', json.message || 'Tidak dapat menyimpan.');
    } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
  }

  async function handleDelete() {
    Alert.alert('Hapus Worksheet', 'Hapus LKS ini permanen?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await fetch(`${API_URL}/worksheet/worksheets/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Terhapus', 'LKS berhasil dihapus.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else Alert.alert('Gagal', json.message);
          } catch { Alert.alert('Error', 'Tidak dapat menghapus.'); }
          finally { setDeleting(false); }
        },
      },
    ]);
  }

  function handleCopy() {
    if (!data) return;
    Clipboard.setString(buildCopyText(data));
    Alert.alert('Tersalin!', 'Teks LKS lengkap berhasil disalin ke clipboard.');
  }

  // ── Loading / Error ──
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={styles.loadingText}>Memuat worksheet...</Text>
    </View>
  );

  if (error || !data) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle" size={40} color={C.danger} />
      <Text style={styles.errorMsg}>{error || 'Data tidak ditemukan.'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
        <Text style={styles.retryBtnText}>Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  );

  const ws = getWs(data);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Header card ── */}
        <View style={[styles.headerCard, S.shadow]}>
          <Text style={styles.headerJudul}>{ws?.judul || data.judul}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaBadge}>
              <Ionicons name="book-outline" size={11} color={C.primary} />
              <Text style={styles.metaBadgeText}>{data.mata_pelajaran}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={11} color={C.primary} />
              <Text style={styles.metaBadgeText}>Kelas {ws?.info?.kelas || '-'}</Text>
            </View>
            {data.durasi_menit ? (
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={11} color={C.primary} />
                <Text style={styles.metaBadgeText}>{data.durasi_menit} menit</Text>
              </View>
            ) : null}
          </View>
          {ws?.tujuan ? (
            <View style={styles.tujuanBox}>
              <Text style={styles.tujuanLabel}>🎯 Tujuan Pembelajaran</Text>
              <Text style={styles.tujuanText}>{ws.tujuan}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Action bar: Edit | Copy | Cetak PDF | Hapus ── */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={17} color={C.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={17} color={C.primary} />
            <Text style={styles.actionBtnText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPDF]} onPress={() => setPdfVisible(true)}>
            <Ionicons name="print-outline" size={17} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Cetak PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? <ActivityIndicator size="small" color={C.danger} />
              : <><Ionicons name="trash-outline" size={17} color={C.danger} /><Text style={[styles.actionBtnText, { color: C.danger }]}>Hapus</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* ── Petunjuk ── */}
        {ws?.petunjuk ? (
          <View style={[styles.petunjukBox, S.shadow]}>
            <Text style={styles.petunjukLabel}>📋 Petunjuk Umum</Text>
            <Text style={styles.petunjukText}>{ws.petunjuk}</Text>
          </View>
        ) : null}

        {/* ── Aktivitas & Soal ── */}
        {(ws?.aktivitas || []).map((akt, i) => (
          <View key={i} style={[styles.aktCard, S.shadow]}>
            <View style={styles.aktHeader}>
              <View style={styles.aktBadge}>
                <Text style={styles.aktBadgeText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aktTipe}>{akt.tipe?.toUpperCase()}</Text>
                <Text style={styles.aktCount}>{(akt.soal || []).length} soal</Text>
              </View>
            </View>
            {akt.instruksi ? (
              <View style={styles.instruksiBox}>
                <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                <Text style={styles.instruksiText}>{akt.instruksi}</Text>
              </View>
            ) : null}
            <View style={styles.soalList}>
              {(akt.soal || []).map((s, j) => <SoalItem key={j} soal={s} index={j} />)}
            </View>
          </View>
        ))}

      </ScrollView>

      {/* ── Edit Modal ── */}
      <EditModal
        visible={editVisible}
        data={data}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveEdit}
      />

      {/* ── Cetak PDF Modal ── */}
      <CetakPDFModal
        visible={pdfVisible}
        worksheetId={id}
        token={token}
        onClose={() => setPdfVisible(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },
  errorMsg: { fontSize: 15, color: C.ink, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  // Header
  headerCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, gap: 10 },
  headerJudul: { fontSize: 19, fontWeight: '700', color: C.ink },
  headerMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  metaBadgeText: { fontSize: 11, fontWeight: '600', color: C.primary },
  tujuanBox: {
    backgroundColor: C.primaryLight, borderRadius: 10, padding: 10, gap: 4,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  tujuanLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  tujuanText: { fontSize: 13, color: C.ink, lineHeight: 19 },

  // Action bar
  actionBar: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: C.card, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border, ...S.shadow,
  },
  actionBtnPDF: { backgroundColor: C.primary, borderColor: C.primary },
  actionBtnDanger: { borderColor: '#fecaca' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Petunjuk
  petunjukBox: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 6 },
  petunjukLabel: { fontSize: 11, fontWeight: '700', color: '#92400e', textTransform: 'uppercase' },
  petunjukText: { fontSize: 13, color: C.ink, lineHeight: 19 },

  // Aktivitas
  aktCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  aktHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  aktBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  aktBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  aktTipe: { fontSize: 13, fontWeight: '700', color: C.ink },
  aktCount: { fontSize: 11, color: C.muted },
  instruksiBox: {
    flexDirection: 'row', gap: 6,
    backgroundColor: C.primaryLight, margin: 12, marginBottom: 0, borderRadius: 8, padding: 10,
  },
  instruksiText: { fontSize: 13, color: C.ink, flex: 1, lineHeight: 19 },
  soalList: { padding: 12, gap: 10 },
  soalItem: { gap: 6, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.separator },
  soalText: { fontSize: 13, fontWeight: '600', color: C.ink, lineHeight: 20 },
  opsiList: { gap: 2, paddingLeft: 12 },
  opsiText: { fontSize: 13, color: C.ink },
  jawabanLine: { fontSize: 12, color: C.mutedLight, paddingLeft: 12, fontStyle: 'italic' },

  // Edit Modal
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  modalContent: { padding: 20, gap: 16 },
  editGroup: { gap: 8 },
  editLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  editInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card,
  },
  btnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
  btnSaveModal: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13,
  },
  btnSaveModalText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Cetak PDF Modal
  pdfOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  pdfModal: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, width: '100%', gap: 12,
  },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pdfIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  pdfClose: { padding: 4 },
  pdfTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  pdfDesc: { fontSize: 14, color: C.muted, lineHeight: 20 },
  pdfUrlBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.bg, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  pdfUrlText: { fontSize: 11, color: C.muted, flex: 1, lineHeight: 16 },
  pdfBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
  },
  pdfBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  pdfBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 13,
  },
  pdfBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: C.primary },
  pdfNote: { fontSize: 11, color: C.mutedLight, textAlign: 'center', lineHeight: 16 },
});
