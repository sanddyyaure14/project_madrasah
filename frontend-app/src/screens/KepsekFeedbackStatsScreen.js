/**
 * KepsekFeedbackStatsScreen.js
 * Semua feedback dari semua user — rating bintang + komentar + nama pemberi
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

const FEATURE_LABEL = {
  multiple_choice:  'Multiple Choice',
  writing:          'Writing Feedback',
  rubric:           'Rubric Generator',
  worksheet:        'Worksheet',
  syllabus:         'Silabus',
  unit_plan:        'Unit Plan / RPP',
  presentation:     'Presentasi',
  academic_content: 'Konten Akademik',
};

const ROLE_LABEL = { guru: 'Guru', superadmin: 'Kepsek', kepala_sekolah: 'Kepsek' };

function Stars({ rating, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? '#f59e0b' : C.border}
        />
      ))}
    </View>
  );
}

function BigRating({ rata }) {
  if (rata == null) return null;
  const full    = Math.floor(rata);
  const hasHalf = rata - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= full ? 'star' : (i === full + 1 && hasHalf ? 'star-half' : 'star-outline')}
          size={28}
          color={(i <= full || (i === full + 1 && hasHalf)) ? '#f59e0b' : C.border}
        />
      ))}
    </View>
  );
}

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTopik(item) {
  return item.topik || item.mata_pelajaran || item.jenis_konten || FEATURE_LABEL[item.feature_type] || item.feature_type;
}

export default function KepsekFeedbackStatsScreen() {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/kepsek/stats/feedback`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.message);
      } catch {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat feedback...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const list  = data?.list  ?? [];
  const rata  = data?.rata_rata;
  const total = data?.total ?? 0;

  // Distribusi bintang 1–5
  const dist = [1, 2, 3, 4, 5].map(n => ({
    bintang: n,
    count:   list.filter(f => f.rating === n).length,
  }));
  const maxDist = Math.max(...dist.map(d => d.count), 1);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Header Rating ─────────────────────────── */}
      <View style={[styles.headerCard, S.shadow]}>
        <View style={styles.headerLeft}>
          <Text style={styles.rataBig}>{rata != null ? Number(rata).toFixed(1) : '-'}</Text>
          <BigRating rata={rata} />
          <Text style={styles.rataLabel}>dari {total} ulasan</Text>
        </View>

        <View style={styles.distCol}>
          {[5, 4, 3, 2, 1].map(n => {
            const item = dist.find(d => d.bintang === n);
            const pct  = Math.round((item.count / maxDist) * 100);
            return (
              <View key={n} style={styles.distRow}>
                <Text style={styles.distNum}>{n}</Text>
                <Ionicons name="star" size={11} color="#f59e0b" />
                <View style={styles.distBarBg}>
                  <View style={[styles.distBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.distCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── List Feedback ─────────────────────────── */}
      <Text style={styles.sectionTitle}>Semua Ulasan</Text>

      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="star-outline" size={44} color={C.mutedLight} />
          <Text style={styles.emptyTitle}>Belum ada feedback</Text>
          <Text style={styles.emptyDesc}>Feedback akan muncul setelah guru memberikan rating.</Text>
        </View>
      ) : (
        list.map((item, idx) => {
          const isKepsek = item.role_pemberi !== 'guru';
          return (
            <View key={item.id ?? idx} style={[styles.feedbackCard, S.shadow]}>
              {/* Pemberi feedback */}
              <View style={styles.pemberiRow}>
                <View style={[styles.avatar, isKepsek && styles.avatarKepsek]}>
                  <Text style={[styles.avatarText, isKepsek && styles.avatarTextKepsek]}>
                    {getInitials(item.nama_pemberi)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pemberiName} numberOfLines={1}>{item.nama_pemberi}</Text>
                  <View style={styles.pemberiMeta}>
                    <View style={[styles.rolePill, isKepsek && styles.rolePillKepsek]}>
                      <Text style={[styles.rolePillText, isKepsek && styles.rolePillTextKepsek]}>
                        {ROLE_LABEL[item.role_pemberi] ?? item.role_pemberi}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                <Stars rating={item.rating} size={15} />
              </View>

              {/* Fitur & topik */}
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>
                  {FEATURE_LABEL[item.feature_type] ?? item.feature_type}
                </Text>
                {getTopik(item) && (
                  <Text style={styles.topikText} numberOfLines={1}> · {getTopik(item)}</Text>
                )}
              </View>

              {/* Helpful badge */}
              {item.is_helpful != null && (
                <View style={[styles.helpfulBadge, item.is_helpful ? styles.helpfulYes : styles.helpfulNo]}>
                  <Ionicons
                    name={item.is_helpful ? 'thumbs-up' : 'thumbs-down'}
                    size={11}
                    color={item.is_helpful ? C.success : C.danger}
                  />
                  <Text style={[styles.helpfulText, { color: item.is_helpful ? C.success : C.danger }]}>
                    {item.is_helpful ? 'Berguna' : 'Tidak berguna'}
                  </Text>
                </View>
              )}

              {/* Komentar */}
              {item.komentar ? (
                <Text style={styles.komentar}>"{item.komentar}"</Text>
              ) : (
                <Text style={styles.noKomentar}>Tidak ada komentar</Text>
              )}
            </View>
          );
        })
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted },
  errorText:   { fontSize: 14, color: C.danger, textAlign: 'center', paddingHorizontal: 32 },

  headerCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    flexDirection: 'row', gap: 20,
    borderWidth: 1, borderColor: C.border,
  },
  headerLeft: { alignItems: 'center', gap: 6, minWidth: 80 },
  rataBig:    { fontSize: 44, fontWeight: '800', color: C.ink, lineHeight: 50 },
  rataLabel:  { fontSize: 12, color: C.muted },

  distCol:     { flex: 1, gap: 6, justifyContent: 'center' },
  distRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distNum:     { fontSize: 12, fontWeight: '700', color: C.ink, width: 10 },
  distBarBg:   { flex: 1, height: 6, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  distBarFill: { height: 6, backgroundColor: '#f59e0b', borderRadius: 999, minWidth: 2 },
  distCount:   { fontSize: 11, color: C.muted, width: 20, textAlign: 'right' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 4 },

  emptyBox:  { backgroundColor: C.card, borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border },
  emptyTitle:{ fontSize: 15, fontWeight: '700', color: C.ink },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },

  feedbackCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },

  pemberiRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarKepsek:     { backgroundColor: C.goldLight },
  avatarText:       { fontSize: 13, fontWeight: '700', color: C.primary },
  avatarTextKepsek: { color: C.goldFg ?? '#854d0e' },
  pemberiName: { fontSize: 13, fontWeight: '700', color: C.ink },
  pemberiMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rolePill:    { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  rolePillKepsek:   { backgroundColor: C.goldLight },
  rolePillText:     { fontSize: 9, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  rolePillTextKepsek: { color: C.goldFg ?? '#854d0e' },
  dateText: { fontSize: 11, color: C.mutedLight },

  featureRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  featureLabel:{ fontSize: 12, fontWeight: '700', color: C.ink },
  topikText:   { fontSize: 12, color: C.muted, flex: 1 },

  helpfulBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  helpfulYes:   { backgroundColor: '#f0fdf4' },
  helpfulNo:    { backgroundColor: '#fef2f2' },
  helpfulText:  { fontSize: 11, fontWeight: '600' },

  komentar:   { fontSize: 13, color: C.ink, fontStyle: 'italic', lineHeight: 20 },
  noKomentar: { fontSize: 12, color: C.mutedLight, fontStyle: 'italic' },
});
