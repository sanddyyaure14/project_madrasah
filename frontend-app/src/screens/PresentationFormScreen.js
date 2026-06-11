/**
 * PresentationFormScreen.js
 * Formulir input untuk membuat presentasi baru menggunakan AI.
 * Konsisten dengan desain premium dari MadrasahAI.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generatePresentation } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNotifications } from '../lib/notifications';
import FeedbackRating from '../components/FeedbackRating';
import { downloadPresentationPPT } from '../lib/api';


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AUDIENS_OPTIONS = ['Siswa MTs', 'Siswa MA', 'Guru', 'Orang Tua', 'Umum'];

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------
function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function InputField({ label, children, required, optional }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
        {optional && <Text style={{ color: C.muted, fontWeight: '400' }}> (opsional)</Text>}
      </Text>
      {children}
    </View>
  );
}

function SlideStepper({ value, onChange }) {
  const min = 4;
  const max = 20;

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <View style={styles.stepperContainer}>
      <TouchableOpacity
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        onPress={handleDecrement}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={value <= min ? C.mutedLight : '#fff'} />
      </TouchableOpacity>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValueText}>{value}</Text>
        <Text style={styles.stepperValueUnit}>slide</Text>
      </View>
      <TouchableOpacity
        style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
        onPress={handleIncrement}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={value >= max ? C.mutedLight : '#fff'} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Result Panel for Presentation
// ---------------------------------------------------------------------------
function ResultPanel({ data, presentationId, inputData, navigation, onReset }) {
  const { addNotification } = useNotifications();
  const [downloading, setDownloading] = useState(false);

  let slides = data.slides_json || [];
  if (typeof slides === 'string') {
    try { slides = JSON.parse(slides); } catch { slides = []; }
  }

  async function handleCopy() {
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
      .join('\\n\\n====================\\n\\n');

    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Konten presentasi berhasil disalin ke clipboard.');
  }

  function handleSimpan() {
    if (!presentationId) {
      Alert.alert('Info', 'Presentasi otomatis tersimpan saat di-generate.');
      return;
    }
    Alert.alert(
      'Tersimpan',
      'Hasil generate berhasil disimpan dan dapat diakses di menu Dokumen Saya (MyDocs).',
      [
        { text: 'Tutup', style: 'cancel' },
        { text: 'Lihat Detail', onPress: () => navigation.navigate('PresentationDetail', { id: presentationId }) }
      ]
    );
  }

  async function handleCetak() {
    if (!presentationId) {
      Alert.alert('Info', 'Generate presentasi terlebih dahulu.');
      return;
    }
    setDownloading(true);
    try {
      await downloadPresentationPPT(presentationId);
      Alert.alert('Berhasil', 'Proses unduhan PPTX berhasil dimulai.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh PPT.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={[styles.resultCard, S.shadow]}>
      {/* Header */}
      <View style={styles.lksHeader}>
        <View style={styles.lksTitleRow}>
          <Ionicons name="easel" size={20} color={C.primary} />
          <Text style={styles.lksTitle}>{inputData.topik}</Text>
        </View>
        <View style={styles.lksMeta}>
          {inputData.audiens && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{inputData.audiens}</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{slides.length} Slide</Text>
          </View>
        </View>
      </View>

      {/* Tujuan */}
      {inputData.tujuan ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tujuan Pembelajaran</Text>
          <Text style={styles.infoText}>{inputData.tujuan}</Text>
        </View>
      ) : null}

      {/* Slides */}
      {slides.length > 0 && (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Text style={styles.sectionLabel}>PREVIEW SLIDES</Text>
          {slides.map((slide, i) => (
            <View key={i} style={styles.slideCard}>
              <View style={styles.slideHeader}>
                <Ionicons name="easel" size={14} color="#fff" />
                <Text style={styles.slideNumberText}>
                  SLIDE {slide.slide_number || i + 1}
                </Text>
              </View>
              <View style={styles.slideBody}>
                <Text style={styles.slideTitleText}>{slide.title || slide.judul || `Slide ${i + 1}`}</Text>
                <View style={styles.slidePointsList}>
                  {(Array.isArray(slide.content) ? slide.content : [slide.content]).map((pt, j) => (
                    <View key={j} style={styles.pointRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.pointText}>{pt}</Text>
                    </View>
                  ))}
                </View>
                {slide.catatan ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesTitleText}>Catatan Presenter:</Text>
                    <Text style={styles.notesContentText}>{slide.catatan}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCopy} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={15} color={C.primary} />
          <Text style={styles.btnOutlineText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCetak} disabled={downloading} activeOpacity={0.8}>
          {downloading ? (
             <ActivityIndicator color={C.primary} size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={15} color={C.primary} />
              <Text style={styles.btnOutlineText}>Unduh PPTX</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={handleSimpan} activeOpacity={0.8}>
          <Ionicons name="bookmark" size={15} color="#fff" />
          <Text style={styles.btnSaveText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnReset} onPress={onReset}>
        <Ionicons name="refresh" size={15} color={C.muted} />
        <Text style={styles.btnResetText}>Buat Presentasi Baru</Text>
      </TouchableOpacity>

      {/* Rating & Feedback AI */}
      {data.request_id && (
        <FeedbackRating requestId={data.request_id} endpoint="presentation" featureLabel="presentasi" />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function PresentationFormScreen({ navigation }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State
  const [topik, setTopik] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [audiens, setAudiens] = useState('Siswa MTs');
  const [jumlahSlide, setJumlahSlide] = useState(8);
  const [includeCatatan, setIncludeCatatan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [presentationId, setPresentationId] = useState(null);
  const [error, setError] = useState('');

  const isValid = topik.trim().length > 0;

  async function handleGenerate() {
    if (!isValid) {
      setError('Topik presentasi wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        topik: topik.trim(),
        jumlah_slide: jumlahSlide,
        tujuan: tujuan.trim() || 'Edukasi / Penjelasan Materi',
        audiens: audiens,
        include_catatan: includeCatatan,
        userId: user?.id,
      };

      const resultData = await generatePresentation(payload);

      setLoading(false);
      setResult(resultData.data);
      setPresentationId(resultData.data.id);
      
      addNotification({
        title: 'Presentasi Berhasil Dibuat',
        message: `Presentasi "${topik.trim()}" berhasil digenerate.`,
        type: 'success',
        icon: 'easel',
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Terjadi kesalahan. Pastikan server backend berjalan.');
    }
  }

  function handleReset() {
    setResult(null);
    setPresentationId(null);
    setError('');
    setTopik('');
    setTujuan('');
    setAudiens('Siswa MTs');
    setJumlahSlide(8);
    setIncludeCatatan(false);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="easel" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Presentation Generator</Text>
          <Text style={styles.heroDesc}>
            Buat outline dan materi presentasi siap ekspor ke file PPT secara otomatis
          </Text>
        </View>
      </View>

      {/* Form Card */}
      {!result && (
      <View style={[styles.card, S.shadow]}>
        {/* Topik — WAJIB */}
        <InputField label="Topik Presentasi" required>
          <TextInput
            style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
            value={topik}
            onChangeText={(t) => {
              setTopik(t);
              if (error) setError('');
            }}
            placeholder="cth. Zakat Fitrah dan Zakat Mal"
            placeholderTextColor={C.mutedLight}
          />
        </InputField>

        {/* Tujuan — OPSIONAL */}
        <InputField label="Tujuan Presentasi" optional>
          <TextInput
            style={[styles.inputMultiline]}
            value={tujuan}
            onChangeText={setTujuan}
            placeholder="cth. Siswa memahami syarat dan rukun zakat"
            placeholderTextColor={C.mutedLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </InputField>

        {/* Target Audiens */}
        <InputField label="Target Audiens">
          <ChipGroup
            options={AUDIENS_OPTIONS}
            selected={audiens}
            onSelect={setAudiens}
          />
        </InputField>

        {/* Jumlah Slide */}
        <InputField label="Jumlah Slide">
          <SlideStepper value={jumlahSlide} onChange={setJumlahSlide} />
        </InputField>

        {/* Catatan Presenter Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchLabel}>Catatan Presenter</Text>
            <Text style={styles.switchDesc}>Sertakan teks panduan presentasi untuk setiap slide</Text>
          </View>
          <Switch
            value={includeCatatan}
            onValueChange={setIncludeCatatan}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor={includeCatatan ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Error Box */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Presentasi</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>
            ✨ AI sedang menyusun presentasi slide... harap tunggu
          </Text>
        )}
      </View>
      )}

      {/* ── RESULT ── */}
      {result && (
        <ResultPanel
          data={result}
          presentationId={presentationId}
          inputData={{ topik, tujuan, audiens, jumlahSlide, includeCatatan }}
          navigation={navigation}
          onReset={handleReset}
        />
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  inputSingle: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    backgroundColor: C.bg,
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    backgroundColor: C.bg,
    height: 80,
  },
  inputError: { borderColor: C.danger },

  // Stepper styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 4,
    width: 180,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: C.separator,
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  stepperValueUnit: {
    fontSize: 12,
    color: C.muted,
  },

  // Switch styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  switchLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  switchDesc: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 15 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // Result panel styles (identical to Worksheet)
  resultCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 14, marginTop: 16 },
  lksHeader: { gap: 8 },
  lksTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lksTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1 },
  lksMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  metaChipText: { fontSize: 11, fontWeight: '600', color: C.primary },
  infoBox: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoText: { fontSize: 13, color: C.ink, lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },

  // Slide styles
  slideCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...S.shadow },
  slideHeader: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  slideNumberText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  slideBody: { padding: 16, gap: 12 },
  slideTitleText: { fontSize: 15, fontWeight: '700', color: C.ink, lineHeight: 22 },
  slidePointsList: { gap: 8 },
  pointRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginTop: 7, flexShrink: 0 },
  pointText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 19 },
  notesBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 8, gap: 4 },
  notesTitleText: { fontSize: 11, fontWeight: '700', color: C.warning, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesContentText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.primary },
  btnSave: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnSaveText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  btnResetText: { fontSize: 13, color: C.muted },
});
