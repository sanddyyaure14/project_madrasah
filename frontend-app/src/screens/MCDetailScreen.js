/**
 * MCDetailScreen.js
 * Detail soal PG dengan fitur:
 * - Preview semua soal
 * - Edit soal (teks + pilihan)
 * - Hapus dokumen
 * - Download PDF (dengan/tanpa kunci jawaban)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

// ─── Helpers ────────────────────────────────────────────────────────────────
function BadgeKesulitan({ level }) {
  const map = {
    mudah: { bg: '#dcfce7', fg: '#166534' },
    sedang: { bg: '#fef9c3', fg: '#854d0e' },
    sulit: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const s = map[level] ?? map.sedang;
  return (
    <View style={[badge.wrap, { backgroundColor: s.bg }]}>
      <Text style={[badge.text, { color: s.fg }]}>{level}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── Edit soal modal ─────────────────────────────────────────────────────────
function EditModal({ visible, question, onClose, onSave }) {
  const [soal, setSoal] = useState('');
  const [pilihan, setPilihan] = useState({});
  const [kunci, setKunci] = useState('');
  const [pembahasan, setPembahasan] = useState('');

  useEffect(() => {
    if (question) {
      setSoal(question.soal ?? '');
      setPilihan({ ...question.pilihan });
      setKunci(question.kunci ?? '');
      setPembahasan(question.pembahasan ?? '');
    }
  }, [question]);

  if (!question) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <View style={em.header}>
            <Text style={em.title}>Edit Soal #{question.no}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Teks soal */}
            <Text style={em.label}>Teks Soal</Text>
            <TextInput
              style={[em.input, { height: 90, textAlignVertical: 'top' }]}
              value={soal}
              onChangeText={setSoal}
              multiline
              placeholder="Teks pertanyaan..."
              placeholderTextColor={C.mutedLight}
            />

            {/* Pilihan */}
            {Object.keys(pilihan).map(key => (
              <View key={key}>
                <Text style={em.label}>Pilihan {key}</Text>
                <TextInput
                  style={em.input}
                  value={pilihan[key]}
                  onChangeText={v => setPilihan(p => ({ ...p, [key]: v }))}
                  placeholder={`Teks pilihan ${key}...`}
                  placeholderTextColor={C.mutedLight}
                />
              </View>
            ))}

            {/* Kunci */}
            {kunci !== undefined && kunci !== '' && (
              <>
                <Text style={em.label}>Kunci Jawaban</Text>
                <View style={em.kunciRow}>
                  {Object.keys(pilihan).map(key => (
                    <TouchableOpacity
                      key={key}
                      style={[em.kunciBtn, kunci === key && em.kunciBtnActive]}
                      onPress={() => setKunci(key)}
                    >
                      <Text style={[em.kunciText, kunci === key && { color: '#fff' }]}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Pembahasan */}
            {pembahasan !== undefined && (
              <>
                <Text style={em.label}>Pembahasan</Text>
                <TextInput
                  style={[em.input, { height: 80, textAlignVertical: 'top' }]}
                  value={pembahasan}
                  onChangeText={setPembahasan}
                  multiline
                  placeholder="Penjelasan jawaban..."
                  placeholderTextColor={C.mutedLight}
                />
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>

          <TouchableOpacity
            style={em.saveBtn}
            onPress={() => onSave({ ...question, soal, pilihan, kunci, pembahasan })}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={em.saveBtnText}>Simpan Perubahan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '92%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: C.ink },
  label: { fontSize: 12, fontWeight: '600', color: C.ink, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.ink, backgroundColor: C.bg,
  },
  kunciRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kunciBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  kunciBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  kunciText: { fontSize: 14, fontWeight: '700', color: C.ink },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, marginTop: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Download modal ──────────────────────────────────────────────────────────
function DownloadModal({ visible, onClose, onDownload, loading }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <Text style={dm.title}>📥 Download PDF</Text>
          <Text style={dm.sub}>Pilih versi PDF yang ingin diunduh:</Text>

          <TouchableOpacity
            style={[dm.btn, { backgroundColor: C.primary }]}
            onPress={() => onDownload(true)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="key" size={18} color="#fff" />
                <Text style={dm.btnText}>Dengan Kunci Jawaban</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[dm.btn, { backgroundColor: C.gold }]}
            onPress={() => onDownload(false)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={C.goldFg} /> : (
              <>
                <Ionicons name="document-outline" size={18} color={C.goldFg} />
                <Text style={[dm.btnText, { color: C.goldFg }]}>Tanpa Kunci Jawaban</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dm.cancelBtn} onPress={onClose}>
            <Text style={dm.cancelText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: C.card, borderRadius: 20, padding: 24, width: '85%', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center' },
  sub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, color: C.muted },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MCDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { fetchDetail(); }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/assessment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssessment(data.data);
        setQuestions(data.data.questions_json ?? []);
      } else {
        Alert.alert('Error', data.message);
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      navigation.goBack();
    } finally { setLoading(false); }
  }

  function handleEditSave(updatedQ) {
    setQuestions(prev => prev.map(q => q.no === updatedQ.no ? updatedQ : q));
    setEditQuestion(null);
    setHasChanges(true);
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/assessment/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Tersimpan', 'Perubahan soal berhasil disimpan.');
        setHasChanges(false);
      } else Alert.alert('Gagal', data.message);
    } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
    finally { setSaving(false); }
  }

  function handleDelete() {
    Alert.alert('Hapus Dokumen', 'Hapus semua soal ini? Tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/assessment/delete/${id}`, {
              method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) { Alert.alert('Terhapus!'); navigation.goBack(); }
            else Alert.alert('Gagal', data.message);
          } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
        },
      },
    ]);
  }

  async function handleDownload(withKunci) {
    setDownloading(true);
    try {
      // Backend endpoint untuk PDF
      const url = `${API_URL}/assessment/print/${id}`;
      // Buka di browser/external karena PDF stream dari backend
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setShowDownload(false);
      } else {
        Alert.alert('Info', `URL PDF: ${url}\n\nSalin URL ini dan buka di browser.`);
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat membuka PDF.');
    } finally { setDownloading(false); }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat soal...</Text>
      </View>
    );
  }

  if (!assessment) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color={C.muted} />
          <Text style={styles.backText}>Dokumen Saya</Text>
        </TouchableOpacity>

        {/* Header info */}
        <View style={[styles.headerCard, S.shadow]}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 24 }}>📝</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{assessment.mata_pelajaran}</Text>
              <Text style={styles.headerSub}>{assessment.topik}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={13} color={C.muted} />
              <Text style={styles.metaText}>Kelas {assessment.tingkat_kelas}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={13} color={C.muted} />
              <Text style={styles.metaText}>{assessment.jumlah_soal} soal</Text>
            </View>
            <BadgeKesulitan level={assessment.tingkat_kesulitan} />
          </View>
          {assessment.include_kunci && (
            <View style={styles.kunciBadge}>
              <Ionicons name="key" size={12} color={C.primary} />
              <Text style={styles.kunciBadgeText}>Dilengkapi kunci jawaban</Text>
            </View>
          )}
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDownload(true)}>
            <Ionicons name="download-outline" size={18} color={C.primary} />
            <Text style={styles.actionBtnText}>Download PDF</Text>
          </TouchableOpacity>
          {hasChanges && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={handleSaveAll}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="save-outline" size={18} color="#fff" />
              }
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Simpan Perubahan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={C.danger} />
            <Text style={[styles.actionBtnText, { color: C.danger }]}>Hapus</Text>
          </TouchableOpacity>
        </View>

        {/* Daftar soal */}
        <Text style={styles.sectionTitle}>Daftar Soal ({questions.length})</Text>
        {questions.map((q, idx) => (
          <View key={idx} style={[styles.qCard, S.shadow]}>
            {/* Nomor + tombol edit */}
            <View style={styles.qTop}>
              <View style={styles.noBadge}>
                <Text style={styles.noText}>{q.no}</Text>
              </View>
              <Text style={styles.soalText}>{q.soal}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditQuestion(q)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil" size={16} color={C.primary} />
              </TouchableOpacity>
            </View>

            {/* Pilihan */}
            <View style={styles.pilihanList}>
              {Object.entries(q.pilihan ?? {}).map(([key, val]) => {
                const isKunci = assessment.include_kunci && q.kunci === key;
                return (
                  <View key={key} style={[styles.pilihanRow, isKunci && styles.pilihanKunci]}>
                    <View style={[styles.pilihanKey, isKunci && styles.pilihanKeyActive]}>
                      <Text style={[styles.pilihanKeyText, isKunci && { color: '#fff' }]}>{key}</Text>
                    </View>
                    <Text style={[styles.pilihanVal, isKunci && { color: C.primary, fontWeight: '600' }]}>
                      {val}
                    </Text>
                    {isKunci && <Ionicons name="checkmark-circle" size={16} color={C.primary} />}
                  </View>
                );
              })}
            </View>

            {/* Pembahasan */}
            {assessment.include_kunci && q.pembahasan ? (
              <View style={styles.pembahasanBox}>
                <Text style={styles.pembahasanLabel}>💡 Pembahasan</Text>
                <Text style={styles.pembahasanText}>{q.pembahasan}</Text>
              </View>
            ) : null}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <EditModal
        visible={!!editQuestion}
        question={editQuestion}
        onClose={() => setEditQuestion(null)}
        onSave={handleEditSave}
      />

      {/* Download Modal */}
      <DownloadModal
        visible={showDownload}
        onClose={() => setShowDownload(false)}
        onDownload={handleDownload}
        loading={downloading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

  headerCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: C.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  headerSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.muted },
  kunciBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  kunciBadgeText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  actionBar: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.card,
  },
  actionBtnDanger: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: C.ink },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  qCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: C.border },
  qTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  noText: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  soalText: { fontSize: 14, color: C.ink, lineHeight: 21, flex: 1 },
  editBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pilihanList: { gap: 6, paddingLeft: 38 },
  pilihanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
  },
  pilihanKunci: { backgroundColor: C.primaryLight, borderColor: C.primary },
  pilihanKey: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  pilihanKeyActive: { backgroundColor: C.primary },
  pilihanKeyText: { fontSize: 11, fontWeight: '700', color: C.ink },
  pilihanVal: { fontSize: 13, color: C.ink, flex: 1 },
  pembahasanBox: {
    backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, gap: 4,
    borderLeftWidth: 3, borderLeftColor: C.gold,
  },
  pembahasanLabel: { fontSize: 11, fontWeight: '700', color: C.gold },
  pembahasanText: { fontSize: 12, color: C.ink, lineHeight: 18 },
});
