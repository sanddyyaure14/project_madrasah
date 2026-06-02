/**
 * WritingFeedbackScreen.js
 * Full-featured Writing Feedback screen — form + AI result display
 * Integrated with backend POST /api/generate/writing-feedback
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generateWritingFeedback } from '../lib/api';
import { useAuth } from '../lib/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const JENIS_OPTIONS = [
  'Narasi',
  'Deskripsi',
  'Eksposisi',
  'Argumentasi',
  'Persuasi',
  'Laporan',
  'Esai',
];

const FOKUS_OPTIONS = [
  'Isi & Ide',
  'Struktur',
  'Kosakata',
  'Tata Bahasa',
  'Ejaan (EYD)',
  'Kohesi & Koherensi',
];

const BAHASA_OPTIONS = ['Indonesia', 'English', 'Arab'];

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------
function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function ChipGroup({ options, selected, onSelect, multi = false }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = multi ? selected.includes(opt) : selected === opt;
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

function InputField({ label, children, required }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Score circle
// ---------------------------------------------------------------------------
function ScoreCircle({ score }) {
  const num = parseFloat(score) || 0;
  let color = C.danger;
  if (num >= 80) color = C.success;
  else if (num >= 65) color = C.warning;

  return (
    <View style={[styles.scoreCircle, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{num.toFixed(0)}</Text>
      <Text style={[styles.scoreMax, { color }]}>/100</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Aspek card
// ---------------------------------------------------------------------------
function AspekCard({ aspek, index }) {
  const [expanded, setExpanded] = useState(true);
  const num = parseFloat(aspek.skor) || 0;
  let barColor = C.danger;
  if (num >= 80) barColor = C.success;
  else if (num >= 65) barColor = C.warning;

  return (
    <View style={styles.aspekCard}>
      {/* Header */}
      <TouchableOpacity
        style={styles.aspekHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.aspekIndexBadge}>
          <Text style={styles.aspekIndexText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aspekName}>{aspek.nama_aspek || aspek.nama}</Text>
          {/* Score bar */}
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, { width: `${Math.min(num, 100)}%`, backgroundColor: barColor }]} />
          </View>
        </View>
        <Text style={[styles.aspekScore, { color: barColor }]}>{num.toFixed(0)}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={C.muted}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View style={styles.aspekBody}>
          {aspek.komentar ? (
            <View style={styles.aspekSection}>
              <View style={styles.aspekSectionTitle}>
                <Ionicons name="chatbubble-ellipses" size={13} color={C.primary} />
                <Text style={styles.aspekSectionTitleText}>Komentar</Text>
              </View>
              <Text style={styles.aspekContent}>{aspek.komentar}</Text>
            </View>
          ) : null}
          {aspek.saran ? (
            <View style={styles.aspekSection}>
              <View style={styles.aspekSectionTitle}>
                <Ionicons name="bulb" size={13} color={C.gold} />
                <Text style={[styles.aspekSectionTitleText, { color: C.goldFg }]}>Saran Perbaikan</Text>
              </View>
              <Text style={styles.aspekContent}>{aspek.saran}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Result panel
// ---------------------------------------------------------------------------
function ResultPanel({ data, onShare, onReset }) {
  return (
    <View style={styles.resultPanel}>
      {/* Header */}
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>Hasil Umpan Balik ✍️</Text>
          {data.nama_siswa && data.nama_siswa !== 'Siswa Anonim' && (
            <Text style={styles.resultSubtitle}>
              {data.nama_siswa} · Kelas {data.tingkat_kelas}
            </Text>
          )}
          {data.jenis_tulisan && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>
                Teks {data.jenis_tulisan.charAt(0).toUpperCase() + data.jenis_tulisan.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <ScoreCircle score={data.skor_total} />
      </View>

      {/* Ringkasan */}
      {data.ringkasan ? (
        <View style={styles.ringkasanBox}>
          <View style={styles.ringkasanTitleRow}>
            <Ionicons name="document-text" size={14} color={C.primary} />
            <Text style={styles.ringkasanTitle}>Ringkasan</Text>
          </View>
          <Text style={styles.ringkasanText}>{data.ringkasan}</Text>
        </View>
      ) : null}

      {/* Aspek */}
      {data.aspek && data.aspek.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.aspekGroupTitle}>Detail Per Aspek</Text>
          {data.aspek.map((asp, i) => (
            <AspekCard key={i} aspek={asp} index={i} />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.btnShare} onPress={onShare} activeOpacity={0.8}>
          <Ionicons name="share-social" size={16} color={C.primary} />
          <Text style={styles.btnShareText}>Bagikan ke Siswa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReset} onPress={onReset} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.btnResetText}>Buat Baru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function WritingFeedbackScreen({ navigation }) {
  const { user } = useAuth();

  // Form state
  const [tulisan, setTulisan] = useState('');
  const [jenis, setJenis] = useState('Narasi');
  const [kelas, setKelas] = useState('VII');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [fokusSelected, setFokusSelected] = useState([]);
  const [bahasa, setBahasa] = useState('Indonesia');

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  // Multi-select toggle for fokus
  function toggleFokus(opt) {
    setFokusSelected((prev) =>
      prev.includes(opt) ? prev.filter((f) => f !== opt) : [...prev, opt]
    );
  }

  async function handleGenerate() {
    if (!tulisan.trim()) {
      setError('Teks karangan siswa wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        tulisan_siswa: tulisan.trim(),
        jenis_tulisan: jenis.toLowerCase(),
        tingkat_kelas: kelas,
        nama_siswa: namaSiswa.trim() || 'Siswa Anonim',
        bahasa_output: bahasa,
        ...(fokusSelected.length > 0 && {
          fokus_feedback: fokusSelected.join(', '),
        }),
        userId: user?.id,
      };

      const res = await generateWritingFeedback(payload);

      if (res.success && res.data) {
        setResult(res.data);
        // Scroll to result
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        setError(res.message || 'Gagal mendapatkan feedback dari server.');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Pastikan server backend berjalan.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError('');
    setTulisan('');
    setNamaSiswa('');
    setFokusSelected([]);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleShare() {
    if (!result) return;
    Alert.alert(
      'Bagikan Hasil',
      'Fitur share WhatsApp tersedia. Salin teks di bawah ini:\n\n' +
        `Nama: ${result.nama_siswa}\nSkor: ${result.skor_total}\nRingkasan: ${result.ringkasan}`,
      [{ text: 'OK' }]
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color={C.muted} />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="create" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>ASESMEN</Text>
          <Text style={styles.heroTitle}>Writing Feedback</Text>
          <Text style={styles.heroDesc}>
            Analisis dan umpan balik tulisan siswa secara komprehensif dan konstruktif
          </Text>
        </View>
      </View>

      {/* ---- FORM ---- */}
      {!result && (
        <View style={[styles.card, S.shadow]}>
          {/* Teks Karangan */}
          <InputField label="Teks Tulisan Siswa" required>
            <TextInput
              style={[styles.textArea, error && !tulisan ? styles.inputError : null]}
              value={tulisan}
              onChangeText={(t) => { setTulisan(t); if (error) setError(''); }}
              placeholder="Tempel atau ketik teks karangan siswa di sini..."
              placeholderTextColor={C.mutedLight}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{tulisan.length} karakter</Text>
          </InputField>

          {/* Jenis Tulisan */}
          <InputField label="Jenis Tulisan" required>
            <ChipGroup options={JENIS_OPTIONS} selected={jenis} onSelect={setJenis} />
          </InputField>

          {/* Kelas */}
          <InputField label="Kelas" required>
            <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} />
          </InputField>

          {/* Nama Siswa */}
          <InputField label="Nama Siswa">
            <TextInput
              style={styles.inputSingle}
              value={namaSiswa}
              onChangeText={setNamaSiswa}
              placeholder="cth. Ahmad Fauzi (opsional)"
              placeholderTextColor={C.mutedLight}
            />
          </InputField>

          {/* Fokus Aspek */}
          <InputField label="Fokus Aspek (bisa pilih lebih dari satu)">
            <ChipGroup
              options={FOKUS_OPTIONS}
              selected={fokusSelected}
              onSelect={toggleFokus}
              multi
            />
            {fokusSelected.length > 0 && (
              <Text style={styles.selectedHint}>
                Terpilih: {fokusSelected.join(', ')}
              </Text>
            )}
          </InputField>

          {/* Bahasa Output */}
          <InputField label="Bahasa Output">
            <ChipGroup options={BAHASA_OPTIONS} selected={bahasa} onSelect={setBahasa} />
          </InputField>

          {/* Error */}
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
                <Text style={styles.generateBtnText}>Generate Feedback</Text>
              </>
            )}
          </TouchableOpacity>

          {loading && (
            <Text style={styles.loadingHint}>
              ✨ AI sedang menganalisis tulisan siswa... harap tunggu
            </Text>
          )}
        </View>
      )}

      {/* ---- RESULT ---- */}
      {result && (
        <ResultPanel data={result} onShare={handleShare} onReset={handleReset} />
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

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },

  hero: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroSub: {
    fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 18,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.ink,
    minHeight: 160,
    backgroundColor: C.bg,
  },
  inputSingle: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.ink,
    backgroundColor: C.bg,
  },
  inputError: { borderColor: C.danger },
  charCount: { fontSize: 11, color: C.mutedLight, textAlign: 'right', marginTop: 4 },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  selectedHint: { fontSize: 11, color: C.primary, marginTop: 4, fontStyle: 'italic' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // ---------- Result Panel ----------
  resultPanel: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16,
    ...S.shadow,
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  resultSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  resultBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  resultBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  scoreCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scoreNumber: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  scoreMax: { fontSize: 10, fontWeight: '600', marginTop: -2 },

  ringkasanBox: {
    backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  ringkasanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasanTitle: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringkasanText: { fontSize: 14, color: C.ink, lineHeight: 21 },

  aspekGroupTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  aspekCard: {
    backgroundColor: C.bg, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  aspekHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14,
  },
  aspekIndexBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  aspekIndexText: { fontSize: 12, fontWeight: '700', color: C.primary },
  aspekName: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 6 },
  scoreBarBg: {
    height: 5, backgroundColor: C.border, borderRadius: 3,
  },
  scoreBarFill: { height: 5, borderRadius: 3 },
  aspekScore: { fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'right' },

  aspekBody: {
    borderTopWidth: 1, borderTopColor: C.separator,
    paddingHorizontal: 14, paddingBottom: 14, gap: 12,
  },
  aspekSection: { gap: 6, marginTop: 10 },
  aspekSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aspekSectionTitleText: {
    fontSize: 11, fontWeight: '700', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  aspekContent: { fontSize: 13, color: C.ink, lineHeight: 20 },

  resultActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
});
