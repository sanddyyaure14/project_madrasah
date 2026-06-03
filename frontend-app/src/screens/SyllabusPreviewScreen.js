/**
 * SyllabusPreviewScreen.js
 * Preview hasil silabus — konsisten dengan WritingFeedbackScreen (ResultPanel style)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { downloadSyllabusPDF, downloadSyllabusDocx } from '../lib/api';

// ---------------------------------------------------------------------------
// Week Card — mirip AspekCard di WritingFeedbackScreen
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
      {/* Header */}
      <TouchableOpacity
        style={styles.weekHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.weekIndexBadge}>
          <Text style={styles.weekIndexText}>{weekData.minggu_ke || index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekLabel}>Minggu ke-{weekData.minggu_ke || index + 1}</Text>
          <Text style={styles.weekMaterial} numberOfLines={expanded ? 0 : 2}>
            {weekData.materi_pokok || '-'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={C.muted}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View style={styles.weekBody}>
          {rows.map((row, i) => (
            <View key={i} style={styles.weekSection}>
              <View style={styles.weekSectionTitle}>
                <Ionicons name={row.icon} size={13} color={C.primary} />
                <Text style={styles.weekSectionTitleText}>{row.label}</Text>
              </View>
              <Text style={styles.weekSectionContent}>{row.value}</Text>
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
export default function SyllabusPreviewScreen({ route, navigation }) {
  const { syllabusId, syllabusData } = route.params;

  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const syllabusJson = syllabusData?.silabus_json || {};
  const tabelSilabus = syllabusJson?.tabel_silabus || [];
  const kompetensiInti = syllabusJson?.kompetensi_inti || [];

  async function handleDownloadPDF() {
    setDownloadingPDF(true);
    try {
      await downloadSyllabusPDF(syllabusId);
      Alert.alert('Berhasil', 'Silabus PDF berhasil diunduh.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  }

  async function handleDownloadDocx() {
    setDownloadingDocx(true);
    try {
      await downloadSyllabusDocx(syllabusId);
      Alert.alert('Berhasil', 'Silabus DOCX berhasil diunduh.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh DOCX.');
    } finally {
      setDownloadingDocx(false);
    }
  }

  async function handleShare() {
    try {
      const msg =
        `Silabus ${syllabusData.mata_pelajaran}\n` +
        `${syllabusData.kurikulum} · ${syllabusData.jenjang} · Kelas ${syllabusData.tingkat_kelas}\n` +
        `Semester ${syllabusData.semester} · ${syllabusData.tahun_ajaran}`;
      await Share.share({ message: msg });
    } catch (err) {
      console.error('Share error:', err);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color={C.muted} />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      {/* Result Panel — mirip ResultPanel di WritingFeedbackScreen */}
      <View style={[styles.resultPanel, S.shadow]}>

        {/* Header */}
        <View style={styles.resultHeader}>
          <View style={styles.resultIconWrap}>
            <Ionicons name="bookmark" size={28} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle}>{syllabusData.mata_pelajaran}</Text>
            <Text style={styles.resultSubtitle}>
              {syllabusData.kurikulum} · {syllabusData.jenjang}
            </Text>
            <View style={styles.resultBadgeRow}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Kelas {syllabusData.tingkat_kelas}</Text>
              </View>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Sem. {syllabusData.semester}</Text>
              </View>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{syllabusData.tahun_ajaran}</Text>
              </View>
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
                <View style={styles.kiIndexBadge}>
                  <Text style={styles.kiIndexText}>{idx + 1}</Text>
                </View>
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

        {tabelSilabus.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="document-outline" size={32} color={C.mutedLight} />
            <Text style={styles.emptyText}>Tidak ada data tabel silabus</Text>
          </View>
        )}

        {/* Action Buttons — sama dengan resultActions di WritingFeedbackScreen */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.btnShare} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={16} color={C.primary} />
            <Text style={styles.btnShareText}>Bagikan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnReset}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.btnResetText}>Buat Baru</Text>
          </TouchableOpacity>
        </View>

        {/* Download Row */}
        <View style={styles.downloadRow}>
          <TouchableOpacity
            style={[styles.downloadBtn, downloadingPDF && styles.downloadBtnDisabled]}
            onPress={handleDownloadPDF}
            disabled={downloadingPDF}
            activeOpacity={0.8}
          >
            {downloadingPDF ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color={C.primary} />
                <Text style={styles.downloadBtnText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.downloadBtn, downloadingDocx && styles.downloadBtnDisabled]}
            onPress={handleDownloadDocx}
            disabled={downloadingDocx}
            activeOpacity={0.8}
          >
            {downloadingDocx ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="document-outline" size={16} color={C.primary} />
                <Text style={styles.downloadBtnText}>Export DOCX</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — disamakan dengan WritingFeedbackScreen
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

  // Result panel — sama dengan WritingFeedbackScreen
  resultPanel: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16,
  },

  resultHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  resultIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  resultSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  resultBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  resultBadge: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  resultBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Kompetensi Inti box — sama dengan ringkasanBox
  kiBox: {
    backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  kiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kiTitle: {
    fontSize: 12, fontWeight: '700', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  kiItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  kiIndexBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  kiIndexText: { fontSize: 11, fontWeight: '700', color: C.primary },
  kiText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },

  sectionGroupTitle: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Week cards — sama dengan aspekCard
  weekCard: {
    backgroundColor: C.bg, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14,
  },
  weekIndexBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  weekIndexText: { fontSize: 13, fontWeight: '700', color: C.primary },
  weekLabel: {
    fontSize: 10, color: C.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 4,
  },
  weekMaterial: { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20 },

  weekBody: {
    borderTopWidth: 1, borderTopColor: C.separator,
    paddingHorizontal: 14, paddingBottom: 14, gap: 12,
  },
  weekSection: { gap: 6, marginTop: 10 },
  weekSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekSectionTitleText: {
    fontSize: 11, fontWeight: '700', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  weekSectionContent: { fontSize: 13, color: C.ink, lineHeight: 20 },

  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, gap: 8,
  },
  emptyText: { fontSize: 14, color: C.mutedLight },

  // Action buttons — sama persis dengan WritingFeedbackScreen
  resultActions: { flexDirection: 'row', gap: 10 },
  btnShare: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: C.primary,
    borderRadius: 12, paddingVertical: 12,
  },
  btnShareText: { fontSize: 14, fontWeight: '600', color: C.primary },
  btnReset: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.primary,
    borderRadius: 12, paddingVertical: 12,
  },
  btnResetText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Download buttons — outlined, sama dengan btnShare tapi side by side
  downloadRow: { flexDirection: 'row', gap: 10 },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 12,
    backgroundColor: C.bg,
  },
  downloadBtnDisabled: { opacity: 0.5 },
  downloadBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
