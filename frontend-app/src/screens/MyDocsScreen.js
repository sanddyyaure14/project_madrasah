/**
 * MyDocsScreen.js
 * Dokumen Saya — list Writing Feedback + Worksheet
 * Tab filter: Semua | Writing Feedback | Worksheet
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
// Document card — handle both types
// ─────────────────────────────────────────────
function DocCard({ item, onPress, onDelete }) {
  const isWorksheet = item._type === 'worksheet';
  const isMC = item._type === 'mc';

  const accentColor = isMC ? '#ef4444' : isWorksheet ? C.primary : scoreColor(item.skor_total);
  const score = isWorksheet || isMC ? null : parseFloat(item.skor_total || 0).toFixed(0);

  return (
    <TouchableOpacity style={[styles.docCard, S.shadow]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.docAccent, { backgroundColor: accentColor }]} />
      <View style={styles.docBody}>
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

        <Text style={styles.docTitle} numberOfLines={1}>
          {isMC
            ? `${item.mata_pelajaran} — ${item.topik}`
            : isWorksheet
              ? (item.judul || 'LKS')
              : (item.nama_siswa || 'Siswa Anonim')
          }
        </Text>

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
      </View>

      <TouchableOpacity style={styles.docDelete} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
      const [feedbacks, worksheets, mcDocs] = await Promise.all([
        safeFetch(`${API_URL}/feedback`),
        safeFetch(`${API_URL}/worksheet/worksheets`),
        safeFetch(`${API_URL}/assessment`),
      ]);

      if (feedbacks === null && worksheets === null && mcDocs === null) {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan dan IP sudah benar.');
        setDocs([]);
        return;
      }

      const combined = [
        ...(feedbacks ?? []).map(f => ({ ...f, _type: 'feedback' })),
        ...(worksheets ?? []).map(w => ({ ...w, _type: 'worksheet' })),
        ...(mcDocs ?? []).map(m => ({ ...m, _type: 'mc' })),
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
    const q = search.toLowerCase();
    const label = d._type === 'worksheet'
      ? `${d.judul || ''} ${d.mata_pelajaran || ''} ${d.topik || ''}`
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

      {/* Tab filter */}
      <View style={styles.tabRow}>
        {[['all', 'Semua'], ['mc', '📝 Soal PG'], ['feedback', '✍️ Writing Feedback'], ['worksheet', '📋 Worksheet']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, activeTab === key && styles.tabBtnActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabBtnText, activeTab === key && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
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
              key={item.id}
              item={item}
              onPress={() => item._type === 'worksheet'
                ? navigation.navigate('WorksheetDetail', { id: item.id })
                : item._type === 'mc'
                  ? navigation.navigate('MCDetail', { id: item.id })
                  : navigation.navigate('FeedbackDetail', { id: item.id })
              }
              onDelete={() => handleDelete(
                item.id,
                item._type === 'worksheet'
                  ? (item.judul || 'LKS')
                  : item._type === 'mc'
                    ? `${item.mata_pelajaran} — ${item.topik}`
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

  tabRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12,
    paddingBottom: 8, flexWrap: 'nowrap',
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabBtnText: { fontSize: 11, color: C.muted, fontWeight: '600', textAlign: 'center' },
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
