/**
 * RubricDetailScreen.js
 * Detail rubrik dengan CRUD + Export Excel
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

async function downloadWithToken(url, token, filename) {
  try {
    const localUri = FileSystem.documentDirectory + filename;
    const result = await FileSystem.downloadAsync(url, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.status !== 200) { Alert.alert('Gagal', 'Server menolak permintaan download.'); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Buka ${filename}`,
      });
    } else {
      Alert.alert('Selesai', `File tersimpan di: ${result.uri}`);
    }
  } catch (e) {
    Alert.alert('Error', 'Gagal download: ' + e.message);
  }
}

// ─── Badge Skala ──────────────────────────────────────────────────────────────
function BadgeSkala({ skala }) {
  return (
    <View style={styles.skalaBadge}>
      <Text style={styles.skalaText}>Skala {skala}</Text>
    </View>
  );
}

// ─── Edit Aspek Modal ─────────────────────────────────────────────────────────
function EditAspekModal({ visible, aspek, onClose, onSave }) {
  const [nama, setNama] = useState('');
  const [bobot, setBobot] = useState('');
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    if (aspek) {
      setNama(aspek.nama ?? '');
      setBobot(String(aspek.bobot ?? ''));
      setLevels(aspek.level ? aspek.level.map(l => ({ ...l })) : []);
    }
  }, [aspek]);

  if (!aspek) return null;

  function updateLevel(idx, field, value) {
    setLevels(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <View style={em.header}>
            <Text style={em.title}>Edit Aspek</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={em.label}>Nama Aspek</Text>
            <TextInput style={em.input} value={nama} onChangeText={setNama} placeholder="cth. Isi, Penyampaian..." placeholderTextColor={C.mutedLight} />

            <Text style={em.label}>Bobot (%)</Text>
            <TextInput style={em.input} value={bobot} onChangeText={setBobot} keyboardType="numeric" placeholder="25" placeholderTextColor={C.mutedLight} />

            {levels.map((level, idx) => (
              <View key={idx} style={em.levelBox}>
                <Text style={em.levelTitle}>{level.nama} (Skor: {level.skor})</Text>
                <Text style={em.label}>Deskripsi</Text>
                <TextInput
                  style={[em.input, { height: 70, textAlignVertical: 'top' }]}
                  value={level.deskripsi}
                  onChangeText={v => updateLevel(idx, 'deskripsi', v)}
                  multiline
                  placeholder="Deskripsi kriteria..."
                  placeholderTextColor={C.mutedLight}
                />
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>

          <TouchableOpacity style={em.saveBtn} onPress={() => onSave({ ...aspek, nama, bobot: parseInt(bobot) || aspek.bobot, level: levels })}>
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
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: C.ink },
  label: { fontSize: 12, fontWeight: '600', color: C.ink, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  levelBox: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: C.border },
  levelTitle: { fontSize: 13, fontWeight: '700', color: C.primary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RubricDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [rubric, setRubric] = useState(null);
  const [aspekList, setAspekList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editAspek, setEditAspek] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { fetchDetail(); }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rubrics/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRubric(data.data);
        // Parse rubric_json
        let rj = data.data.rubric_json;
        if (typeof rj === 'string') rj = JSON.parse(rj);
        // Support wrapper {rubric: {...}} atau langsung {aspek: [...]}
        const rubricData = rj?.rubric ?? rj;
        setAspekList(rubricData?.aspek ?? []);
      } else {
        Alert.alert('Error', data.message);
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      navigation.goBack();
    } finally { setLoading(false); }
  }

  function handleEditSave(updatedAspek) {
    setAspekList(prev => prev.map((a, i) => a.nama === editAspek.nama && i === aspekList.indexOf(editAspek) ? updatedAspek : a));
    setEditAspek(null);
    setHasChanges(true);
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      // Reconstruct rubric_json
      let rj = rubric.rubric_json;
      if (typeof rj === 'string') rj = JSON.parse(rj);
      let rubricData = rj?.rubric ?? rj;
      const updatedRubricJson = { ...rj, ...(rj?.rubric ? { rubric: { ...rubricData, aspek: aspekList } } : { aspek: aspekList }) };

      const res = await fetch(`${API_URL}/rubrics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_tugas: rubric.jenis_tugas,
          aspek_penilaian: rubric.aspek_penilaian,
          skala_nilai: rubric.skala_nilai,
          tujuan_pembelajaran: rubric.tujuan_pembelajaran,
          rubric_json: updatedRubricJson,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Tersimpan', 'Perubahan rubrik berhasil disimpan.');
        setHasChanges(false);
      } else Alert.alert('Gagal', data.message);
    } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
    finally { setSaving(false); }
  }

  function handleDelete() {
    Alert.alert('Hapus Rubrik', 'Hapus rubrik ini? Tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/rubrics/${id}`, {
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

  async function handleExportExcel() {
    setExporting(true);
    const filename = `Rubrik_${rubric?.jenis_tugas?.replace(/\s+/g, '_') ?? 'rubrik'}.xlsx`;
    await downloadWithToken(`${API_URL}/rubrics/${id}/export-excel`, token, filename);
    setExporting(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat rubrik...</Text>
      </View>
    );
  }

  if (!rubric) return null;

  const totalBobot = aspekList.reduce((sum, a) => sum + (parseInt(a.bobot) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color={C.muted} />
          <Text style={styles.backText}>Dokumen Saya</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={[styles.headerCard, S.shadow]}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 24 }}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{rubric.jenis_tugas}</Text>
              <Text style={styles.headerSub} numberOfLines={2}>
                {rubric.tujuan_pembelajaran || 'Rubrik Penilaian'}
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <BadgeSkala skala={rubric.skala_nilai} />
            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={13} color={C.muted} />
              <Text style={styles.metaText}>{aspekList.length} aspek</Text>
            </View>
            <View style={[styles.metaItem, totalBobot !== 100 && { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 6 }]}>
              <Ionicons name="pie-chart-outline" size={13} color={totalBobot === 100 ? C.muted : C.danger} />
              <Text style={[styles.metaText, totalBobot !== 100 && { color: C.danger, fontWeight: '700' }]}>
                Total bobot: {totalBobot}%
              </Text>
            </View>
          </View>
          {Array.isArray(rubric.aspek_penilaian) && (
            <View style={styles.aspekChips}>
              {rubric.aspek_penilaian.map((a, i) => (
                <View key={i} style={styles.aspekChip}>
                  <Text style={styles.aspekChipText}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExportExcel} disabled={exporting}>
            {exporting
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Ionicons name="download-outline" size={18} color={C.primary} />
            }
            <Text style={styles.actionBtnText}>Export Excel</Text>
          </TouchableOpacity>
          {hasChanges && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={handleSaveAll}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Simpan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={C.danger} />
            <Text style={[styles.actionBtnText, { color: C.danger }]}>Hapus</Text>
          </TouchableOpacity>
        </View>

        {/* Tabel Rubrik */}
        <Text style={styles.sectionTitle}>Tabel Rubrik ({aspekList.length} aspek)</Text>

        {aspekList.map((aspek, idx) => (
          <View key={idx} style={[styles.aspekCard, S.shadow]}>
            {/* Header aspek */}
            <View style={styles.aspekHeader}>
              <View style={styles.aspekNoBadge}>
                <Text style={styles.aspekNoText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aspekNama}>{aspek.nama}</Text>
                <Text style={styles.aspekBobot}>Bobot: {aspek.bobot}%</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditAspek(aspek)}>
                <Ionicons name="pencil" size={16} color={C.primary} />
              </TouchableOpacity>
            </View>

            {/* Level-level */}
            {(aspek.level ?? []).map((level, li) => (
              <View key={li} style={[styles.levelRow, li === 0 && styles.levelRowFirst]}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelNama}>{level.nama}</Text>
                  <View style={styles.levelSkorBadge}>
                    <Text style={styles.levelSkorText}>{level.skor}</Text>
                  </View>
                </View>
                <Text style={styles.levelDesc}>{level.deskripsi}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      <EditAspekModal
        visible={!!editAspek}
        aspek={editAspek}
        onClose={() => setEditAspek(null)}
        onSave={handleEditSave}
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
  headerIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  headerSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  metaText: { fontSize: 12, color: C.muted },
  skalaBadge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  skalaText: { fontSize: 11, fontWeight: '700', color: C.primary },
  aspekChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aspekChip: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  aspekChipText: { fontSize: 11, color: C.ink },

  actionBar: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.card },
  actionBtnDanger: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: C.ink },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  aspekCard: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  aspekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  aspekNoBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  aspekNoText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  aspekNama: { fontSize: 15, fontWeight: '700', color: C.ink },
  aspekBobot: { fontSize: 12, color: C.muted, marginTop: 2 },
  editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },

  levelRow: { borderTopWidth: 1, borderTopColor: C.border, padding: 12, gap: 6 },
  levelRowFirst: {},
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelNama: { fontSize: 13, fontWeight: '700', color: C.ink },
  levelSkorBadge: { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  levelSkorText: { fontSize: 12, fontWeight: '700', color: C.primary },
  levelDesc: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
