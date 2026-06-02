/**
 * MyDocsScreen.js
 * Dokumen Saya — list semua writing feedback yang tersimpan
 * CRUD: Read (list) | Detail | Edit | Delete
 * Download: export sebagai teks ke clipboard
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onGenerate }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>Belum ada dokumen</Text>
      <Text style={styles.emptySub}>
        Generate writing feedback dan simpan hasilnya untuk muncul di sini.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onGenerate}>
        <Ionicons name="sparkles" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Buat Writing Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document card
// ---------------------------------------------------------------------------
function DocCard({ item, onPress, onDelete }) {
  const color = scoreColor(item.skor_total);
  const score = parseFloat(item.skor_total || 0).toFixed(0);

  return (
    <TouchableOpacity style={[styles.docCard, S.shadow]} onPress={onPress} activeOpacity={0.85}>
      {/* Left accent bar */}
      <View style={[styles.docAccent, { backgroundColor: color }]} />

      <View style={styles.docBody}>
        {/* Top row */}
        <View style={styles.docTop}>
          <View style={styles.docTypeBadge}>
            <Ionicons name="create-outline" size={11} color={C.primary} />
            <Text style={styles.docTypeText}>Writing Feedback</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: color + '20', borderColor: color }]}>
            <Text style={[styles.scorePillText, { color }]}>{score}</Text>
          </View>
        </View>

        {/* Nama siswa */}
        <Text style={styles.docTitle} numberOfLines={1}>
          {item.nama_siswa || 'Siswa Anonim'}
        </Text>

        {/* Meta */}
        <View style={styles.docMeta}>
          <View style={styles.docMetaItem}>
            <Ionicons name="school-outline" size={12} color={C.muted} />
            <Text style={styles.docMetaText}>Kelas {item.tingkat_kelas}</Text>
          </View>
          <View style={styles.docMetaItem}>
            <Ionicons name="document-text-outline" size={12} color={C.muted} />
            <Text style={styles.docMetaText}>Teks {capitalize(item.jenis_tulisan)}</Text>
          </View>
          <View style={[styles.docMetaItem, { marginLeft: 'auto' }]}>
            <Text style={[styles.scoreLabel, { color }]}>{scoreLabel(item.skor_total)}</Text>
          </View>
        </View>

        {/* Ringkasan preview */}
        {item.ringkasan ? (
          <Text style={styles.docPreview} numberOfLines={2}>{item.ringkasan}</Text>
        ) : null}
      </View>

      {/* Delete button */}
      <TouchableOpacity style={styles.docDelete} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={18} color={C.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MyDocsScreen({ navigation }) {
  const { token } = useAuth();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Load data setiap kali screen difokuskan
  useFocusEffect(
    useCallback(() => {
      fetchDocs();
    }, [token])
  );

  async function fetchDocs(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocs(data.data ?? []);
      } else {
        setError(data.message || 'Gagal memuat dokumen.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(id, nama) {
    Alert.alert(
      'Hapus Dokumen',
      `Hapus feedback untuk "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/feedback/delete/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.success) {
                setDocs(prev => prev.filter(d => d.id !== id));
                Alert.alert('Terhapus', 'Dokumen berhasil dihapus.');
              } else {
                Alert.alert('Gagal', data.message || 'Tidak dapat menghapus dokumen.');
              }
            } catch {
              Alert.alert('Error', 'Tidak dapat terhubung ke server.');
            }
          },
        },
      ]
    );
  }

  // Filter by search
  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    return (
      (d.nama_siswa || '').toLowerCase().includes(q) ||
      (d.jenis_tulisan || '').toLowerCase().includes(q) ||
      (d.tingkat_kelas || '').toLowerCase().includes(q)
    );
  });

  // ---------- Render ----------
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
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.muted} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama siswa, jenis, kelas..."
          placeholderTextColor={C.mutedLight}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Counter */}
      {docs.length > 0 && (
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            {filtered.length} dari {docs.length} dokumen
          </Text>
          <TouchableOpacity onPress={() => fetchDocs(true)}>
            <Ionicons name="refresh" size={16} color={C.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchDocs()}>
            <Text style={styles.retryText}>Coba lagi</Text>
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
              onPress={() => navigation.navigate('FeedbackDetail', { id: item.id })}
              onDelete={() => handleDelete(item.id, item.nama_siswa || 'Siswa Anonim')}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, margin: 12, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: C.ink },

  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 4,
  },
  counterText: { fontSize: 12, color: C.muted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, backgroundColor: '#fef2f2', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },
  retryText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  list: { padding: 12, gap: 10, paddingBottom: 32 },

  // DocCard
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

  scorePill: {
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2,
  },
  scorePillText: { fontSize: 12, fontWeight: '700' },

  docTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  docMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docMetaText: { fontSize: 11, color: C.muted },
  scoreLabel: { fontSize: 11, fontWeight: '700' },
  docPreview: { fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 2 },

  // Empty
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
