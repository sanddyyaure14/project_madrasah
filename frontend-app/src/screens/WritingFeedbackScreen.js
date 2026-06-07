/**
 * WritingFeedbackScreen.js
 * Writing Feedback — form + AI result
 * Aksi: Preview | Copy | Simpan | Kirim ke Siswa
 * Terintegrasi dengan POST /api/generate/writing-feedback
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Clipboard, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import { useNotifications } from '../lib/notifications';
import FeedbackRating from '../components/FeedbackRating';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const JENIS_OPTIONS = ['Narasi', 'Deskripsi', 'Eksposisi', 'Argumentasi', 'Persuasi', 'Laporan', 'Esai'];
const FOKUS_OPTIONS = ['Isi & Ide', 'Struktur', 'Kosakata', 'Tata Bahasa', 'Ejaan (EYD)', 'Kohesi & Koherensi'];
const BAHASA_OPTIONS = ['Indonesia', 'English', 'Arab'];

// ---------------------------------------------------------------------------
// Shared UI components
// ---------------------------------------------------------------------------
function ChipGroup({ options, selected, onSelect, multi = false }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((opt) => {
        const active = multi ? selected.includes(opt) : selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function InputField({ label, required, children }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={{ color: C.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Score circle — warna berdasarkan nilai
// ---------------------------------------------------------------------------
function ScoreCircle({ score }) {
  const num = parseFloat(score) || 0;
  const color = num >= 80 ? C.success : num >= 65 ? C.warning : C.danger;
  return (
    <View style={[styles.scoreCircle, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{num.toFixed(0)}</Text>
      <Text style={[styles.scoreMax, { color }]}>/100</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Aspek card — collapsible
// ---------------------------------------------------------------------------
function AspekCard({ aspek, index }) {
  const [open, setOpen] = useState(true);
  const num = parseFloat(aspek.skor) || 0;
  const barColor = num >= 80 ? C.success : num >= 65 ? C.warning : C.danger;

  return (
    <View style={styles.aspekCard}>
      <TouchableOpacity style={styles.aspekHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <View style={styles.aspekBadge}>
          <Text style={styles.aspekBadgeText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aspekName}>{aspek.nama_aspek || aspek.nama}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(num, 100)}%`, backgroundColor: barColor }]} />
          </View>
        </View>
        <Text style={[styles.aspekScore, { color: barColor }]}>{num.toFixed(0)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {open && (
        <View style={styles.aspekBody}>
          {aspek.komentar ? (
            <View style={styles.aspekSection}>
              <View style={styles.aspekSectionRow}>
                <Ionicons name="chatbubble-ellipses" size={13} color={C.primary} />
                <Text style={styles.aspekSectionLabel}>Komentar</Text>
              </View>
              <Text style={styles.aspekText}>{aspek.komentar}</Text>
            </View>
          ) : null}
          {aspek.saran ? (
            <View style={styles.aspekSection}>
              <View style={styles.aspekSectionRow}>
                <Ionicons name="bulb" size={13} color={C.gold} />
                <Text style={[styles.aspekSectionLabel, { color: '#92400e' }]}>Saran Perbaikan</Text>
              </View>
              <Text style={styles.aspekText}>{aspek.saran}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Build share text (untuk copy / kirim ke siswa)
// ---------------------------------------------------------------------------
function buildShareText(data) {
  let text = `*LAPORAN UMPAN BALIK TULISAN SISWA*\n`;
  text += `=====================================\n`;
  text += `Nama   : ${data.nama_siswa || 'Siswa Anonim'}\n`;
  text += `Kelas  : ${data.tingkat_kelas}\n`;
  text += `Jenis  : Teks ${data.jenis_tulisan}\n`;
  text += `Skor   : ${parseFloat(data.skor_total).toFixed(0)} / 100\n`;
  text += `=====================================\n\n`;

  if (data.aspek?.length) {
    text += `*DETAIL PER ASPEK:*\n\n`;
    data.aspek.forEach((asp, i) => {
      const nama = asp.nama_aspek || asp.nama;
      text += `${i + 1}. *${nama}* — Skor: ${parseFloat(asp.skor).toFixed(0)}\n`;
      if (asp.komentar) text += `   Komentar: ${asp.komentar}\n`;
      if (asp.saran) text += `   Saran: ${asp.saran}\n`;
      text += `\n`;
    });
  }

  if (data.ringkasan) {
    text += `*KESIMPULAN:*\n"${data.ringkasan}"\n`;
  }

  return text;
}

// ---------------------------------------------------------------------------
// Result panel — Copy | Simpan | Kirim ke Siswa | Buat Baru
// ---------------------------------------------------------------------------
function ResultPanel({ data, requestId, onReset, onSave }) {
  function handleCopy() {
    const text = buildShareText(data);
    Clipboard.setString(text);
    Alert.alert('Tersalin!', 'Hasil feedback berhasil disalin ke clipboard.');
  }

  function handleKirim() {
    const text = buildShareText(data);
    // Encode teks untuk URL WhatsApp
    const encoded = encodeURIComponent(text);
    const waUrl = `whatsapp://send?text=${encoded}`;
    
    Linking.canOpenURL(waUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          // WhatsApp tidak terinstall — salin ke clipboard sebagai fallback
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

  return (
    <View style={[styles.resultPanel, S.shadow]}>
      {/* Header skor */}
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>Hasil Umpan Balik ✍️</Text>
          {data.nama_siswa && data.nama_siswa !== 'Siswa Anonim' && (
            <Text style={styles.resultSub}>{data.nama_siswa} · Kelas {data.tingkat_kelas}</Text>
          )}
          {data.jenis_tulisan && (
            <View style={styles.jenisBadge}>
              <Text style={styles.jenisBadgeText}>
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
      {data.aspek?.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.aspekGroupLabel}>DETAIL PER ASPEK</Text>
          {data.aspek.map((asp, i) => <AspekCard key={i} aspek={asp} index={i} />)}
        </View>
      )}

      {/* Action buttons: Copy | Simpan | Kirim ke Siswa */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCopy} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={16} color={C.primary} />
          <Text style={styles.btnOutlineText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={onSave} activeOpacity={0.8}>
          <Ionicons name="bookmark-outline" size={16} color={C.primary} />
          <Text style={styles.btnOutlineText}>Simpan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnKirim} onPress={handleKirim} activeOpacity={0.8}>
          <Ionicons name="paper-plane" size={16} color="#fff" />
          <Text style={styles.btnKirimText}>Kirim ke Siswa</Text>
        </TouchableOpacity>
      </View>

      {/* Buat baru */}
      <TouchableOpacity style={styles.btnReset} onPress={onReset} activeOpacity={0.8}>
        <Ionicons name="refresh" size={16} color={C.muted} />
        <Text style={styles.btnResetText}>Buat Feedback Baru</Text>
      </TouchableOpacity>

      {/* Rating & Feedback AI */}
      {requestId && (
        <FeedbackRating requestId={requestId} endpoint="writing" />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function WritingFeedbackScreen({ navigation }) {
  const { user, token } = useAuth();
  const { addNotification } = useNotifications();

  const [tulisan, setTulisan] = useState('');
  const [jenis, setJenis] = useState('Narasi');
  const [kelas, setKelas] = useState('VII');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [fokusSelected, setFokusSelected] = useState([]);
  const [bahasa, setBahasa] = useState('Indonesia');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  function toggleFokus(opt) {
    setFokusSelected(prev => prev.includes(opt) ? prev.filter(f => f !== opt) : [...prev, opt]);
  }

  async function handleGenerate() {
    if (!tulisan.trim()) { setError('Teks karangan siswa wajib diisi.'); return; }
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
        ...(fokusSelected.length > 0 && { fokus_feedback: fokusSelected.join(', ') }),
        userId: user?.id,
      };

      const res = await fetch(`${API_URL}/generate/writing-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
        // Notifikasi generate berhasil
        addNotification({
          title: 'Writing Feedback Selesai ✍️',
          message: `Feedback untuk ${namaSiswa.trim() || 'Siswa Anonim'} (Kelas ${kelas}) berhasil dibuat. Skor: ${parseFloat(data.data.skor_total).toFixed(0)}/100`,
          type: 'success',
          icon: 'create',
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        setError(data.message || 'Gagal mendapatkan feedback dari server.');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
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

  function handleSave() {
    addNotification({
      title: 'Feedback Tersimpan 📄',
      message: 'Writing Feedback berhasil disimpan di Dokumen Saya.',
      type: 'info',
      icon: 'bookmark',
    });
    Alert.alert(
      'Tersimpan ✅',
      'Feedback ini sudah tersimpan di Dokumen Saya. Ingin melihatnya sekarang?',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Lihat Dokumen', onPress: () => navigation.navigate('Dokumen') },
      ]
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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

      {/* FORM */}
      {!result && (
        <View style={[styles.card, S.shadow]}>

          <InputField label="Teks Tulisan Siswa" required>
            <TextInput
              style={[styles.textArea, error && !tulisan.trim() ? styles.inputError : null]}
              value={tulisan}
              onChangeText={t => { setTulisan(t); if (error) setError(''); }}
              placeholder="Tempel atau ketik teks karangan siswa di sini..."
              placeholderTextColor={C.mutedLight}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{tulisan.length} karakter</Text>
          </InputField>

          <InputField label="Jenis Tulisan" required>
            <ChipGroup options={JENIS_OPTIONS} selected={jenis} onSelect={setJenis} />
          </InputField>

          <InputField label="Kelas" required>
            <ChipGroup options={KELAS_OPTIONS} selected={kelas} onSelect={setKelas} />
          </InputField>

          <InputField label="Nama Siswa">
            <TextInput
              style={styles.inputSingle}
              value={namaSiswa}
              onChangeText={setNamaSiswa}
              placeholder="cth. Ahmad Fauzi (opsional)"
              placeholderTextColor={C.mutedLight}
            />
          </InputField>

          <InputField label="Fokus Aspek (bisa pilih lebih dari satu)">
            <ChipGroup options={FOKUS_OPTIONS} selected={fokusSelected} onSelect={toggleFokus} multi />
            {fokusSelected.length > 0 && (
              <Text style={styles.selectedHint}>Terpilih: {fokusSelected.join(', ')}</Text>
            )}
          </InputField>

          <InputField label="Bahasa Output">
            <ChipGroup options={BAHASA_OPTIONS} selected={bahasa} onSelect={setBahasa} />
          </InputField>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.generateBtn, loading && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Feedback</Text></>
            }
          </TouchableOpacity>

          {loading && (
            <Text style={styles.loadingHint}>✨ AI sedang menganalisis tulisan siswa... harap tunggu</Text>
          )}
        </View>
      )}

      {/* RESULT */}
      {result && <ResultPanel data={result} requestId={result.request_id} onReset={handleReset} onSave={handleSave} />}
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

  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 18 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    minHeight: 160, backgroundColor: C.bg,
  },
  inputSingle: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    backgroundColor: C.bg,
  },
  inputError: { borderColor: C.danger },
  charCount: { fontSize: 11, color: C.mutedLight, textAlign: 'right', marginTop: 4 },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  selectedHint: { fontSize: 11, color: C.primary, marginTop: 4, fontStyle: 'italic' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },

  // Result
  resultPanel: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  resultSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  jenisBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  jenisBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  scoreNumber: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  scoreMax: { fontSize: 10, fontWeight: '600', marginTop: -2 },

  ringkasanBox: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  ringkasanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasanTitle: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringkasanText: { fontSize: 14, color: C.ink, lineHeight: 21 },

  aspekGroupLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  aspekCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  aspekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  aspekBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  aspekBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  aspekName: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 6 },
  barBg: { height: 5, backgroundColor: C.border, borderRadius: 3 },
  barFill: { height: 5, borderRadius: 3 },
  aspekScore: { fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  aspekBody: { borderTopWidth: 1, borderTopColor: C.separator, paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  aspekSection: { gap: 4, marginTop: 8 },
  aspekSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aspekSectionLabel: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  aspekText: { fontSize: 13, color: C.ink, lineHeight: 20 },

  // Action buttons
  actionsGrid: { flexDirection: 'row', gap: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnOutlineText: { fontSize: 13, fontWeight: '600', color: C.primary },
  btnKirim: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  btnKirimText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  btnReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  btnResetText: { fontSize: 13, color: C.muted },
});
