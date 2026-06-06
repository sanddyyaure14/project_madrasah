/**
 * PresentationPreviewScreen.js
 * Halaman pratinjau hasil generate slide presentasi.
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
import { downloadPresentationPPT } from '../lib/api';

// ---------------------------------------------------------------------------
// Slide Card Component
// ---------------------------------------------------------------------------
function SlideCard({ slide, index }) {
  const title = slide.title || slide.judul || `Slide ${index + 1}`;
  const points = Array.isArray(slide.content)
    ? slide.content
    : slide.poin || (typeof slide.content === 'string' ? [slide.content] : []);
  const notes = slide.catatan || slide.notes || '';

  return (
    <View style={styles.slideCard}>
      {/* Header Slide */}
      <View style={styles.slideHeader}>
        <Ionicons name="easel" size={16} color="#fff" />
        <Text style={styles.slideNumberText}>
          SLIDE {slide.slide_number || index + 1}
        </Text>
      </View>

      {/* Body Slide */}
      <View style={styles.slideBody}>
        <Text style={styles.slideTitleText}>{title}</Text>
        
        <View style={styles.slidePointsList}>
          {points.map((pt, i) => (
            <View key={i} style={styles.pointRow}>
              <View style={styles.bulletPoint} />
              <Text style={styles.pointText}>{pt}</Text>
            </View>
          ))}
        </View>

        {/* Presenter Notes */}
        {notes ? (
          <View style={styles.notesBox}>
            <View style={styles.notesTitleRow}>
              <Ionicons name="chatbox-ellipses" size={14} color={C.warning} />
              <Text style={styles.notesTitleText}>Catatan Presenter</Text>
            </View>
            <Text style={styles.notesContentText}>{notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function PresentationPreviewScreen({ route, navigation }) {
  const { presentationId, presentationData } = route.params;
  const [downloading, setDownloading] = useState(false);

  // Parse slides_json
  let slides = presentationData?.slides_json || [];
  if (typeof slides === 'string') {
    try {
      slides = JSON.parse(slides);
    } catch {
      slides = [];
    }
  }

  const topik = presentationData?.topik || 'Presentasi';
  const audiens = presentationData?.audiens || '';
  const jumlahSlide = slides.length || presentationData?.jumlah_slide || 0;

  async function handleCopy() {
    try {
      const text = slides
        .map((s, idx) => {
          const slideNum = s.slide_number || idx + 1;
          const slideTitle = s.title || s.judul || `Slide ${slideNum}`;
          const points = Array.isArray(s.content)
            ? s.content.map(p => `• ${p}`).join('\n')
            : s.content || '';
          const notes = s.catatan ? `\nCatatan Presenter: ${s.catatan}` : '';
          return `[Slide ${slideNum}]\nJudul: ${slideTitle}\n\n${points}${notes}`;
        })
        .join('\n\n====================\n\n');

      Clipboard.setString(text);
      Alert.alert('Tersalin!', 'Konten presentasi berhasil disalin.');
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat menyalin teks.');
    }
  }

  async function handleShare() {
    try {
      const text = slides
        .map((s, idx) => {
          const slideNum = s.slide_number || idx + 1;
          const slideTitle = s.title || s.judul || `Slide ${slideNum}`;
          const points = Array.isArray(s.content)
            ? s.content.map(p => `• ${p}`).join('\n')
            : s.content || '';
          return `[Slide ${slideNum}] ${slideTitle}\n${points}`;
        })
        .join('\n\n');

      await Share.share({
        message: `*Presentasi: ${topik}*\nTarget: ${audiens}\n\n${text}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }

  async function handleDownloadPPT() {
    setDownloading(true);
    try {
      await downloadPresentationPPT(presentationId);
      Alert.alert('Berhasil', 'Proses unduhan PPTX berhasil dimulai.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh file PowerPoint.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Panel */}
        <View style={[styles.headerPanel, S.shadow]}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="easel" size={28} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>HASIL GENERATE PRESENTASI</Text>
              <Text style={styles.titleText}>{topik}</Text>
              <View style={styles.badgeRow}>
                {audiens ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{audiens}</Text>
                  </View>
                ) : null}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{jumlahSlide} Slide</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Slides List */}
        <View style={styles.slidesContainer}>
          {slides.map((slide, index) => (
            <SlideCard key={index} slide={slide} index={index} />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={16} color={C.primary} />
            <Text style={styles.actionBtnText}>Salin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color={C.primary} />
            <Text style={styles.actionBtnText}>Bagikan</Text>
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

        {/* Export to PPT */}
        <TouchableOpacity
          style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
          onPress={handleDownloadPPT}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading ? (
            <ActivityIndicator color={C.primary} size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color={C.primary} />
              <Text style={styles.downloadBtnText}>Export PPTX (PowerPoint)</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  headerPanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: 9, fontWeight: '700', color: C.muted, trackingSpace: 1, textTransform: 'uppercase' },
  titleText: { fontSize: 18, fontWeight: '700', color: C.ink, marginTop: 2, lineHeight: 24 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badge: {
    backgroundColor: C.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Slides container
  slidesContainer: { gap: 16 },

  // Slide Card
  slideCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...S.shadow,
  },
  slideHeader: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  slideBody: {
    padding: 16,
    gap: 12,
  },
  slideTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 22,
  },
  slidePointsList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    lineHeight: 19,
  },

  // Notes Box
  notesBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesContentText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: C.card,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  btnReset: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnResetText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: C.card,
  },
  downloadBtnDisabled: { opacity: 0.5 },
  downloadBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
