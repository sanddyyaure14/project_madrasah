/**
 * AcademicContentPreviewScreen.js
 * Preview hasil konten akademik — konsisten dengan SyllabusPreviewScreen
 * Output: judul, konten, ringkasan, kata_kunci, referensi
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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { downloadAcademicContentPDF } from '../lib/api';

// ---------------------------------------------------------------------------
// Badge untuk jenis konten
// ---------------------------------------------------------------------------
const JENIS_LABEL = {
  penjelasan: 'Materi Pembelajaran',
  ringkasan: 'Ringkasan',
  contoh_soal: 'Contoh Soal',
  kamus: 'Kamus Istilah',
  artikel: 'Artikel',
};

const PANJANG_LABEL = {
  singkat: 'Singkat',
  sedang: 'Sedang',
  panjang: 'Panjang',
};

// ---------------------------------------------------------------------------
// Section card — untuk konten utama, ringkasan, kata kunci, referensi
// ---------------------------------------------------------------------------
function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={14} color={C.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AcademicContentPreviewScreen({ route, navigation }) {
  const { contentId, contentData, inputData } = route.params;

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Parse content_json — bisa berupa string atau object
  let contentJson = contentData?.content_json || {};
  if (typeof contentJson === 'string') {
    try { contentJson = JSON.parse(contentJson); } catch { contentJson = {}; }
  }

  const judul = contentJson.judul || contentData?.topik || '-';
  const konten = contentJson.konten || '';
  const ringkasan = contentJson.ringkasan || '';
  const kataKunci = contentJson.kata_kunci || [];
  const referensi = contentJson.referensi || [];

  const jenisLabel = JENIS_LABEL[contentData?.jenis_konten] || contentData?.jenis_konten || '-';
  const panjangLabel = PANJANG_LABEL[contentData?.panjang_konten] || contentData?.panjang_konten || '-';

  async function handleCopy() {
    const text = `${judul}\n\n${konten}${ringkasan ? '\n\nRingkasan:\n' + ringkasan : ''}`;
    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Konten berhasil disalin ke clipboard.');
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${judul}\n\n${konten.substring(0, 500)}${konten.length > 500 ? '...' : ''}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }

  async function handleDownloadPDF() {
    setDownloadingPDF(true);
    try {
      await downloadAcademicContentPDF(contentId);
      Alert.alert('Berhasil', 'Konten PDF berhasil diunduh.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{jenisLabel}</Text>
              </View>
              {contentData?.mata_pelajaran && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{contentData.mata_pelajaran}</Text>
                </View>
              )}
              {contentData?.tingkat_kelas && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Kelas {contentData.tingkat_kelas}</Text>
                </View>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{panjangLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Konten Utama */}
        {konten ? (
          <SectionCard icon="document-text" title="Isi Konten">
            <Text style={styles.kontenText}>{konten}</Text>
          </SectionCard>
        ) : null}

        {/* Ringkasan */}
        {ringkasan ? (
          <View style={styles.ringkasanBox}>
            <View style={styles.ringkasanTitleRow}>
              <Ionicons name="reader" size={14} color={C.primary} />
              <Text style={styles.ringkasanTitle}>Ringkasan</Text>
            </View>
            <Text style={styles.ringkasanText}>{ringkasan}</Text>
          </View>
        ) : null}

        {/* Kata Kunci */}
        {kataKunci.length > 0 && (
          <SectionCard icon="pricetag" title="Kata Kunci">
            <View style={styles.tagRow}>
              {kataKunci.map((k, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{k}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Referensi */}
        {referensi.length > 0 && (
          <SectionCard icon="library" title="Referensi">
            {referensi.map((r, i) => (
              <View key={i} style={styles.refItem}>
                <View style={styles.refBullet}>
                  <Text style={styles.refBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.refText}>{r}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Action Buttons — sama dengan SyllabusPreviewScreen */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.btnShare} onPress={handleCopy} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={16} color={C.primary} />
            <Text style={styles.btnShareText}>Salin</Text>
          </TouchableOpacity>
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

        {/* Download PDF */}
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

      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — identik dengan SyllabusPreviewScreen
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

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
  resultTitle: { fontSize: 17, fontWeight: '700', color: C.ink, lineHeight: 24 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Section card — mirip weekCard di Syllabus
  sectionCard: {
    backgroundColor: C.bg, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  kontenText: { fontSize: 14, color: C.ink, lineHeight: 22 },

  // Ringkasan — sama dengan SyllabusPreviewScreen kiBox
  ringkasanBox: {
    backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  ringkasanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasanTitle: {
    fontSize: 11, fontWeight: '700', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  ringkasanText: { fontSize: 14, color: C.ink, lineHeight: 21 },

  // Tags kata kunci
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: C.card, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  tagText: { fontSize: 12, color: C.ink, fontWeight: '500' },

  // Referensi
  refItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  refBullet: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  refBulletText: { fontSize: 10, fontWeight: '700', color: C.primary },
  refText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },

  // Action buttons — sama persis SyllabusPreviewScreen
  resultActions: { flexDirection: 'row', gap: 8 },
  btnShare: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: C.primary,
    borderRadius: 12, paddingVertical: 12,
  },
  btnShareText: { fontSize: 13, fontWeight: '600', color: C.primary },
  btnReset: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.primary,
    borderRadius: 12, paddingVertical: 12,
  },
  btnResetText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingVertical: 12,
    backgroundColor: C.bg,
  },
  downloadBtnDisabled: { opacity: 0.5 },
  downloadBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
