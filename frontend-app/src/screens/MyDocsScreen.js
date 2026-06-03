/**
 * MyDocsScreen.js
 * Dokumen Saya — list Writing Feedback + Worksheet + Soal PG + Silabus + Konten Akademik
 * Tab filter: Semua | Soal PG | Writing Feedback | Worksheet | Silabus | Konten
 * CRUD: list, delete, navigate to detail
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function scoreColor(score) {
  const n = parseFloat(score) || 0;
  if (n >= 80) return C.success;
  if (n >= 65) return C.warning;
  return C.danger;
}
function scoreLabel(score) {
  const n = parseFloat(score) || 0;
  if (n >= 80) return 'Baik';
  if (n >= 65) return 'Cukup';
  return 'Perlu Perbaikan';
}
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyState({ onGenerate }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>Belum ada dokumen</Text>
      <Text style={styles.emptySub}>
        Generate Writing Feedback, Worksheet, atau Soal PG dan simpan hasilnya untuk muncul di sini.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onGenerate}>
        <Ionicons name="sparkles" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Buat Dokumen</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Document card — handle all types
// ─────────────────────────────────────────────
function DocCard({ item, onPress, onDelete }) {
  const isWorksheet = item._type === 'worksheet';
  const isMC = item._type === 'mc';
  const isSyllabus = item._type === 'syllabus';
  const isAcademic = item._type === 'academic';

  const accentColor = isMC ? '#ef4444' : isWorksheet ? C.primary : isSyllabus ? C.primary : isAcademic ? '#1d4ed8' : scoreColor(item.skor_total);
  const score = isWorksheet || isMC || isSyllabus || isAcademic ? null : parseFloat(item.skor_total || 0).toFixed(0);

  // Parse academic content_json untuk judul
  let academicTitle = 'Konten Akademik';
  if (isAcademic) {
    let cj = item.content_json || {};
    if (typeof cj === 'string') { try { cj = JSON.parse(cj); } catch { cj = {}; } }
    academicTitle = cj.judul || item.topik || 'Konten Akademik';
  }

  return (
    <TouchableOpacity style={[styles.docCard, S.shadow]} onPress={onPress} activeOpacity={0.85}>
      {/* Left accent */}
      <View style={[styles.docAccent, { backgroundColor: accentColor }]} />

      <View style={styles.docBody}>
        {/* Top row: badge + score/tipe */}
        <View style={styles.docTop}>
          {isMC ? (
            <View style={[styles.docTypeBadge, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="list-outline" size={11} color="#ef4444" />
              <Text style={[styles.docTypeText, { color: '#ef4444' }]}>Soal PG</Text>
            </View>
          ) : isWorksheet ? (
            <View style={[styles.docTypeBadge, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="document-text-outline" size={11} color={C.gold} />
              <Text style={[styles.docTypeText, { color: '#92400e' }]}>Worksheet</Text>
            </View>
          ) : isSyllabus ? (
            <View style={[styles.docTypeBadge, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="bookmark-outline" size={11} color={C.primary} />
              <Text style={[styles.docTypeText, { color: C.primary }]}>Silabus</Text>
            </View>
          ) : isAcademic ? (
            <View style={[styles.docTypeBadge, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="school-outline" size={11} color="#1d4ed8" />
              <Text style={[styles.docTypeText, { color: '#1d4ed8' }]}>Konten Akademik</Text>
            </View>
          ) : (
            <View style={styles.docTypeBadge}>
              <Ionicons name="create-outline" size={11} color={C.primary} />
              <Text style={styles.docTypeText}>Writing Feedback</Text>
            </View>
          )}

          {score !== null ? (
            <View style={[styles.scorePill, { backgroundColor: accentColor + '20', borderColor: accentColor }]}>
              <Text style={[styles.scorePillText, { color: accentColor }]}>{score}</Text>
            </View>
          ) : null}
        </View>

        {/* Judul / Nama */}
        <Text style={styles.docTitle} numberOfLines={1}>
          {isMC
            ? `${item.mata_pelajaran} \u2014 ${item.topik}`
            : isWorksheet
              ? (item.judul || 'LKS')
              : isSyllabus
                ? (item.mata_pelajaran || 'Silabus')
                : isAcademic
                  ? academicTitle
                  : (item.nama_siswa || 'Siswa Anonim')
          }
        </Text>

        {/* Meta row */}
        <View style={styles.docMeta}>
          {isMC ? (
            <>
              <View style={styles.docMetaItem}>
                <Ionicons name="layers-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>Kelas {item.tingkat_kelas}</Text>
              </View>
              <View style={styles.docMetaItem}>
                <Ionicons name="help-circle-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.jumlah_soal} soal</Text>
              </View>
              <View style={styles.docMetaItem}>
                <Ionicons name="bar-chart-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.tingkat_kesulitan}</Text>
              </View>
            </>
          ) : isWorksheet ? (
            <>
              <View style={styles.docMetaItem}>
                <Ionicons name="book-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.mata_pelajaran}</Text>
              </View>
              <View style={styles.docMetaItem}>
                <Ionicons name="layers-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.topik}</Text>
              </View>
            </>
          ) : isSyllabus ? (
            <>
              <View style={styles.docMetaItem}>
                <Ionicons name="school-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.jenjang} Kelas {item.tingkat_kelas}</Text>
              </View>
              <View style={styles.docMetaItem}>
                <Ionicons name="calendar-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>Sem. {item.semester}</Text>
              </View>
            </>
          ) : isAcademic ? (
            <>
              <View style={styles.docMetaItem}>
                <Ionicons name="list-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>{item.jenis_konten}</Text>
              </View>
              {item.mata_pelajaran ? (
                <View style={styles.docMetaItem}>
                  <Ionicons name="book-outline" size={12} color={C.muted} />
                  <Text style={styles.docMetaText}>{item.mata_pelajaran}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.docMetaItem}>
                <Ionicons name="school-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>Kelas {item.tingkat_kelas}</Text>
              </View>
              <View style={styles.docMetaItem}>
                <Ionicons name="document-text-outline" size={12} color={C.muted} />
                <Text style={styles.docMetaText}>Teks {capitalize(item.jenis_tulisan)}</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: accentColor, marginLeft: 'auto' }]}>
                {scoreLabel(item.skor_total)}
              </Text>
            </>
          )}
        </View>

        {/* Preview bawah */}
        {isSyllabus ? (
          <Text style={styles.docPreview} numberOfLines={1}>
            {item.kurikulum}{item.tahun_ajaran ? ' - ' + item.tahun_ajaran : ''}
          </Text>
        ) : isAcademic ? (
          (() => {
            let cj = item.content_json || {};
            if (typeof cj === 'string') { try { cj = JSON.parse(cj); } catch { cj = {}; } }
            return cj.ringkasan ? <Text style={styles.docPreview} numberOfLines={2}>{cj.ringkasan}</Text> : null;
          })()
        ) : item.ringkasan ? (
          <Text style={styles.docPreview} numberOfLines={2}>{item.ringkasan}</Text>
        ) : null}
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.docDelete}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={C.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function MyDocsScreen({ navigation }) {
  const { token } = useAuth();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => { fetchDocs(); }, [token])
  );

  async function fetchDocs(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    // Helper: safe fetch + parse JSON
    async function safeFetch(url) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn(`[MyDocs] HTTP ${res.status} for ${url}`);
          return [];
        }
        const json = await res.json();
        console.log(`[MyDocs] ${url} →`, json.success, 'count:', json.data?.length);
        return json.success ? (json.data ?? []) : [];
      } catch (e) {
        console.error(`[MyDocs] Fetch error ${url}:`, e.message);
        return null; // null = network error
      }
    }

    try {
      const [feedbacks, worksheets, mcDocs, syllabi, academics] = await Promise.all([
        safeFetch(`${API_URL}/feedback`),
        safeFetch(`${API_URL}/worksheet/worksheets`),
        safeFetch(`${API_URL}/assessment`),
        safeFetch(`${API_URL}/syllabus`),
        safeFetch(`${API_URL}/academic-content`),
      ]);

      if (feedbacks === null && worksheets === null && mcDocs === null && syllabi === null && academics === null) {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan dan IP sudah benar.');
        setDocs([]);
        return;
      }

      const combined = [
        ...(feedbacks ?? []).map(f => ({ ...f, _type: 'feedback' })),
        ...(worksheets ?? []).map(w => ({ ...w, _type: 'worksheet' })),
        ...(mcDocs ?? []).map(m => ({ ...m, _type: 'mc' })),
        ...(syllabi ?? []).map(s => ({ ...s, _type: 'syllabus' })),
        ...(academics ?? []).map(a => ({ ...a, _type: 'academic' })),
      ];
      console.log('[MyDocs] Total docs:', combined.length);
      setDocs(combined);

      if (combined.length === 0) {
        setError(''); // bersih, tampilkan empty state
      }
    } catch (e) {
      console.error('[MyDocs] Unexpected error:', e.message);
      setError('Terjadi kesalahan tidak terduga. Coba refresh.');
      setDocs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(id, nama, type) {
    const url = type === 'worksheet'
      ? `${API_URL}/worksheet/worksheets/${id}`
      : type === 'mc'
        ? `${API_URL}/assessment/delete/${id}`
        : type === 'syllabus'
          ? `${API_URL}/syllabus/${id}`
          : type === 'academic'
            ? `${API_URL}/academic-content/${id}`
            : `${API_URL}/feedback/delete/${id}`;

    Alert.alert('Hapus Dokumen', `Hapus "${nama}"? Tidak dapat dibatalkan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
              setDocs(prev => prev.filter(d => d.id !== id));
              Alert.alert('Terhapus', 'Dokumen berhasil dihapus.');
            } else Alert.alert('Gagal', data.message);
          } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
        },
      },
    ]);
  }

  const filtered = docs.filter(d => {
    if (activeTab === 'feedback' && d._type !== 'feedback') return false;
    if (activeTab === 'worksheet' && d._type !== 'worksheet') return false;
    if (activeTab === 'mc' && d._type !== 'mc') return false;
    if (activeTab === 'syllabus' && d._type !== 'syllabus') return false;
    if (activeTab === 'academic' && d._type !== 'academic') return false;
    const q = search.toLowerCase();
    const label = d._type === 'worksheet'
      ? `${d.judul || ''} ${d.mata_pelajaran || ''} ${d.topik || ''}`
      : d._type === 'syllabus'
        ? `${d.mata_pelajaran || ''} ${d.kurikulum || ''} ${d.jenjang || ''} ${d.tingkat_kelas || ''}`
        : d._type === 'academic'
          ? `${d.topik || ''} ${d.jenis_konten || ''} ${d.mata_pelajaran || ''}`
          : `${d.nama_siswa || ''} ${d.jenis_tulisan || ''} ${d.tingkat_kelas || ''}`;
    return label.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat dokumen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.muted} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Cari dokumen..."
          placeholderTextColor={C.mutedLight}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tab filter — scrollable karena ada 6 tab */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {[
            ['all', 'Semua'],
            ['mc', '📝 Soal PG'],
            ['feedback', '✍️ Writing Feedback'],
            ['worksheet', '📋 Worksheet'],
            ['syllabus', '📚 Silabus'],
            ['academic', '🎓 Konten'],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabBtn,
                key === 'all' && styles.tabBtnAll,
                activeTab === key && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabBtnText, activeTab === key && styles.tabBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Counter + refresh */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>{filtered.length} dari {docs.length} dokumen</Text>
        <TouchableOpacity onPress={() => fetchDocs(true)}>
          <Ionicons name="refresh" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>API: {API_URL}</Text>
          </View>
          <TouchableOpacity onPress={() => fetchDocs()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDocs(true)} colors={[C.primary]} />}
      >
        {filtered.length === 0 ? (
          <EmptyState onGenerate={() => navigation.navigate('Dashboard')} />
        ) : (
          filtered.map(item => (
            <DocCard
              key={item._type + '-' + item.id}
              item={item}
              onPress={() => item._type === 'worksheet'
                ? navigation.navigate('WorksheetDetail', { id: item.id })
                : item._type === 'mc'
                  ? navigation.navigate('MCDetail', { id: item.id })
                  : item._type === 'syllabus'
                    ? navigation.navigate('SyllabusDetail', { id: item.id })
                    : item._type === 'academic'
                      ? navigation.navigate('AcademicContentDetail', { id: item.id })
                      : navigation.navigate('FeedbackDetail', { id: item.id })
              }
              onDelete={() => handleDelete(
                item.id,
                item._type === 'worksheet'
                  ? (item.judul || 'LKS')
                  : item._type === 'mc'
                    ? `${item.mata_pelajaran} \u2014 ${item.topik}`
                    : item._type === 'syllabus'
                      ? (item.mata_pelajaran || 'Silabus')
                      : item._type === 'academic'
                        ? (item.topik || 'Konten Akademik')
                        : (item.nama_siswa || 'Siswa Anonim'),
                item._type
              )}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, margin: 12, marginBottom: 8, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: C.ink },

  tabContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  tabRow: {
    flexDirection: 'row', gap: 8,
    paddingBottom: 2, paddingRight: 4,
  },
  tabBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnAll: {
    paddingHorizontal: 24,
  },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabBtnText: { fontSize: 12, color: C.muted, fontWeight: '600', textAlign: 'center' },
  tabBtnTextActive: { color: '#fff' },

  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 6,
  },
  counterText: { fontSize: 12, color: C.muted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, backgroundColor: '#fef2f2', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },
  errorHint: { fontSize: 10, color: C.danger, opacity: 0.7, marginTop: 2 },
  retryText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  list: { padding: 12, gap: 10, paddingBottom: 32 },

  docCard: {
    backgroundColor: C.card, borderRadius: 16,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  docAccent: { width: 4, minHeight: 80 },
  docBody: { flex: 1, padding: 14, gap: 6 },
  docDelete: { padding: 14, justifyContent: 'center' },
  docTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  docTypeText: { fontSize: 10, fontWeight: '700', color: C.primary },
  scorePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  scorePillText: { fontSize: 12, fontWeight: '700' },
  docTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  docMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docMetaText: { fontSize: 11, color: C.muted },
  scoreLabel: { fontSize: 11, fontWeight: '700' },
  docPreview: { fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
