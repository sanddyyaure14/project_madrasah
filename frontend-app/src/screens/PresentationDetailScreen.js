import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, Clipboard, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';
import { downloadPresentationPPT } from '../lib/api';
import FeedbackRating from '../components/FeedbackRating';

const AUDIENS_OPTIONS = ['Siswa MTs', 'Siswa MA', 'Guru', 'Orang Tua', 'Umum'];

function SlideCard({ slide, index }) {
  const title = slide.title || slide.judul || `Slide ${index + 1}`;
  const points = Array.isArray(slide.content)
    ? slide.content
    : slide.poin || (typeof slide.content === 'string' ? [slide.content] : []);
  const notes = slide.catatan || slide.notes || '';

  return (
    <View style={styles.slideCard}>
      <View style={styles.slideHeader}>
        <Ionicons name="easel" size={16} color="#fff" />
        <Text style={styles.slideNumberText}>
          SLIDE {slide.slide_number || index + 1}
        </Text>
      </View>
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

export default function PresentationDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const [editTopik, setEditTopik] = useState('');
  const [editTujuan, setEditTujuan] = useState('');
  const [editAudiens, setEditAudiens] = useState('');
  const [editSlides, setEditSlides] = useState([]);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/presentation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setEditTopik(json.data.topik || '');
        setEditTujuan(json.data.tujuan || '');
        setEditAudiens(json.data.audiens || 'Siswa MTs');
        
        let parsedSlides = [];
        if (json.data.slides_json) {
           try {
             parsedSlides = typeof json.data.slides_json === 'string' ? JSON.parse(json.data.slides_json) : json.data.slides_json;
           } catch {
             parsedSlides = [];
           }
        }
        setEditSlides(parsedSlides);
      } else {
        Alert.alert('Error', json.message || 'Data presentasi tidak ditemukan');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editTopik.trim()) {
      Alert.alert('Validasi', 'Topik wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/presentation/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topik: editTopik.trim(),
          tujuan: editTujuan.trim() || null,
          audiens: editAudiens,
          slides_json: editSlides,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({
          ...prev,
          topik: editTopik.trim(),
          tujuan: editTujuan.trim(),
          audiens: editAudiens,
          slides_json: editSlides,
        }));
        setEditVisible(false);
        Alert.alert('Berhasil', 'Presentasi berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', json.message || 'Gagal memperbarui data.');
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Hapus Presentasi', 'Apakah Anda yakin ingin menghapus presentasi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/presentation/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Berhasil', 'Presentasi berhasil dihapus.');
              navigation.goBack();
            } else {
              Alert.alert('Gagal', json.message);
            }
          } catch {
            Alert.alert('Error', 'Tidak dapat menghapus.');
          }
        },
      },
    ]);
  }

  function handleCopy() {
    if (!data) return;
    let slides = data.slides_json || [];
    if (typeof slides === 'string') {
      try { slides = JSON.parse(slides); } catch { slides = []; }
    }

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
  }

  async function handleShare() {
    if (!data) return;
    let slides = data.slides_json || [];
    if (typeof slides === 'string') {
      try { slides = JSON.parse(slides); } catch { slides = []; }
    }

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

    try {
      await Share.share({
        message: `*Presentasi: ${data.topik}*\n\n${text}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }

  async function handleDownloadPPT() {
    setDownloading(true);
    try {
      await downloadPresentationPPT(id);
      Alert.alert('Berhasil', 'Proses unduhan PPTX berhasil dimulai.');
    } catch (err) {
      Alert.alert('Gagal', err.message || 'Tidak dapat mengunduh PPT.');
    } finally {
      setDownloading(false);
    }
  }

  function handleUpdateSlide(idx, field, value) {
    setEditSlides(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (field === 'title') {
        copy[idx].title = value;
      } else if (field === 'catatan') {
        copy[idx].catatan = value;
      }
      return copy;
    });
  }

  function handleUpdateSlidePoint(slideIdx, pointIdx, value) {
    setEditSlides(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const content = Array.isArray(copy[slideIdx].content) ? copy[slideIdx].content : [];
      content[pointIdx] = value;
      copy[slideIdx].content = content;
      return copy;
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat presentasi...</Text>
      </View>
    );
  }

  let slides = data?.slides_json || [];
  if (typeof slides === 'string') {
    try { slides = JSON.parse(slides); } catch { slides = []; }
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Result Panel */}
        <View style={[styles.resultPanel, S.shadow]}>
          {/* Header */}
          <View style={styles.resultHeader}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="easel" size={28} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>{data.topik}</Text>
              <Text style={styles.resultSubtitle}>PRESENTASI</Text>
              <View style={styles.badgeRow}>
                {data.audiens && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data.audiens}</Text>
                  </View>
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{slides.length} Slide</Text>
                </View>
              </View>
            </View>
          </View>

          {data.tujuan ? (
            <View style={styles.tujuanBox}>
              <Text style={styles.tujuanLabel}>Tujuan Presentasi:</Text>
              <Text style={styles.tujuanText}>{data.tujuan}</Text>
            </View>
          ) : null}

          {/* Slides List */}
          {slides.length > 0 && (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={styles.sectionGroupTitle}>Daftar Slide</Text>
              {slides.map((slide, index) => (
                <SlideCard key={index} slide={slide} index={index} />
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.btnEdit} onPress={() => setEditVisible(true)} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={C.primary} />
              <Text style={styles.btnEditText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCopy} onPress={handleCopy} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={16} color={C.primary} />
              <Text style={styles.btnCopyText}>Salin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color={C.danger} />
              <Text style={styles.btnDeleteText}>Hapus</Text>
            </TouchableOpacity>
          </View>

          {/* Export PPT */}
          <TouchableOpacity
            style={[styles.exportBtn, downloading && { opacity: 0.5 }]}
            onPress={handleDownloadPPT}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color={C.primary} />
                <Text style={styles.exportBtnText}>Export PPTX (PowerPoint)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Rating & Feedback AI */}
          {data && data.request_id && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionGroupTitle}>Nilai Hasil Generate</Text>
              <FeedbackRating 
                requestId={data.request_id}
                endpoint="presentation"
                featureLabel="Slide Presentasi" 
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal - Consistent with Syllabus Detail Modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Presentasi</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 8 }}>
                <Text style={styles.editLabel}>Topik Presentasi</Text>
                <TextInput
                  style={styles.editInput}
                  value={editTopik}
                  onChangeText={setEditTopik}
                  placeholder="Topik presentasi"
                  placeholderTextColor={C.mutedLight}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.editLabel}>Tujuan Presentasi</Text>
                <TextInput
                  style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={editTujuan}
                  onChangeText={setEditTujuan}
                  placeholder="Tujuan presentasi"
                  placeholderTextColor={C.mutedLight}
                  multiline
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.editLabel}>Target Audiens</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {AUDIENS_OPTIONS.map(opt => {
                    const active = editAudiens === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setEditAudiens(opt)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
              <Text style={[styles.editLabel, { fontSize: 15 }]}>Edit Slide Content</Text>

              {editSlides.map((slide, slideIdx) => {
                 const points = Array.isArray(slide.content) ? slide.content : [];
                 return (
                   <View key={slideIdx} style={styles.slideCard}>
                     <View style={[styles.slideHeader, { backgroundColor: C.primaryLight }]}>
                       <Text style={[styles.slideNumberText, { color: C.primary }]}>SLIDE {slideIdx + 1}</Text>
                     </View>
                     <View style={styles.slideBody}>
                       <Text style={styles.editLabel}>Judul Slide</Text>
                       <TextInput
                         style={styles.editInput}
                         value={slide.title || slide.judul || ''}
                         onChangeText={v => handleUpdateSlide(slideIdx, 'title', v)}
                         placeholder="Judul Slide"
                       />
                       <Text style={[styles.editLabel, { marginTop: 8 }]}>Poin Materi</Text>
                       {points.map((pt, ptIdx) => (
                         <View key={ptIdx} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                           <Text style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>•</Text>
                           <TextInput
                             style={[styles.editInput, { flex: 1, minHeight: 60, textAlignVertical: 'top' }]}
                             value={pt}
                             onChangeText={v => handleUpdateSlidePoint(slideIdx, ptIdx, v)}
                             placeholder={`Poin ${ptIdx + 1}`}
                             multiline
                           />
                         </View>
                       ))}
                       <Text style={[styles.editLabel, { marginTop: 8 }]}>Catatan Presenter</Text>
                       <TextInput
                         style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                         value={slide.catatan || slide.notes || ''}
                         onChangeText={v => handleUpdateSlide(slideIdx, 'catatan', v)}
                         placeholder="Catatan opsional"
                         multiline
                       />
                     </View>
                   </View>
                 );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setEditVisible(false)}>
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },

  resultPanel: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  resultIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  resultSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  sectionGroupTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  tujuanBox: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  tujuanLabel: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tujuanText: { fontSize: 13, color: C.ink, lineHeight: 20 },

  slideCard: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  slideHeader: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  slideNumberText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  slideBody: { padding: 14, gap: 12 },
  slideTitleText: { fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 20 },
  slidePointsList: { gap: 6 },
  pointRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletPoint: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary, marginTop: 8, flexShrink: 0 },
  pointText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 19 },

  notesBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 4, gap: 4 },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesTitleText: { fontSize: 11, fontWeight: '700', color: C.warning, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesContentText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  resultActions: { flexDirection: 'row', gap: 10 },
  btnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  btnEditText: { fontSize: 14, fontWeight: '600', color: C.primary },
  btnCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  btnCopyText: { fontSize: 14, fontWeight: '600', color: C.primary },
  btnDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 12, paddingVertical: 12 },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: C.danger },

  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, backgroundColor: C.bg },
  exportBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  editLabel: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: -4 },
  editInput: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: C.bg },
  
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
  btnSave: { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
