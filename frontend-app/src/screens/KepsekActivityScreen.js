/**
 * KepsekActivityScreen.js
 * Semua aktivitas terbaru generate dari semua user (guru + kepsek)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
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

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function KepsekActivityScreen() {
  const { token } = useAuth();
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/kepsek/activity/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data ?? []);
      else setError(json.message);
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Memuat aktivitas...</Text>
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Ringkasan total */}
      <View style={[styles.totalRow, S.shadow]}>
        <View style={styles.totalItem}>
          <Text style={styles.totalNum}>{data.length}</Text>
          <Text style={styles.totalLabel}>Total Aktivitas</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={[styles.totalNum, { color: '#16a34a' }]}>
            {data.filter(a => a.status === 'completed').length}
          </Text>
          <Text style={styles.totalLabel}>Berhasil</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={[styles.totalNum, { color: C.danger }]}>
            {data.filter(a => a.status === 'failed').length}
          </Text>
          <Text style={styles.totalLabel}>Gagal</Text>
        </View>
      </View>

      {/* List aktivitas */}
      {data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={56} color={C.mutedLight} />
          <Text style={styles.emptyTitle}>Belum ada aktivitas</Text>
          <Text style={styles.emptyDesc}>Aktivitas generate akan muncul di sini.</Text>
        </View>
      ) : (
        <View style={[styles.listCard, S.shadow]}>
          {data.map((a, i) => {
            const isKepsek = a.role_user !== 'guru';
            const topik    = a.topik || a.mata_pelajaran || a.jenis_konten
              || FEATURE_LABEL[a.feature_type] || a.feature_type;
            const statusOk = a.status === 'completed';

            return (
              <View key={a.request_id ?? i} style={[styles.item, i > 0 && styles.itemBorder]}>
                {/* Avatar */}
                <View style={[styles.avatar, isKepsek && styles.avatarKepsek]}>
                  <Text style={[styles.avatarText, isKepsek && styles.avatarTextKepsek]}>
                    {getInitials(a.nama_user)}
                  </Text>
                </View>

                {/* Konten */}
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{a.nama_user}</Text>
                    <View style={[styles.rolePill, isKepsek && styles.rolePillKepsek]}>
                      <Text style={[styles.rolePillText, isKepsek && styles.rolePillTextKepsek]}>
                        {ROLE_LABEL[a.role_user] ?? a.role_user}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemFeature} numberOfLines={1}>
                    {FEATURE_LABEL[a.feature_type] ?? a.feature_type}
                    {topik && topik !== FEATURE_LABEL[a.feature_type] ? ` — ${topik}` : ''}
                  </Text>
                </View>

                {/* Kanan: status + waktu */}
                <View style={styles.itemRight}>
                  <View style={[styles.statusBadge, statusOk ? styles.statusOk : styles.statusFail]}>
                    <Ionicons
                      name={statusOk ? 'checkmark-circle' : 'close-circle'}
                      size={11}
                      color={statusOk ? '#16a34a' : C.danger}
                    />
                    <Text style={[styles.statusText, { color: statusOk ? '#16a34a' : C.danger }]}>
                      {statusOk ? 'OK' : 'Gagal'}
                    </Text>
                  </View>
                  <Text style={styles.itemWhen}>{timeAgo(a.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </View>
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

  totalRow: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  totalItem:    { flex: 1, alignItems: 'center', gap: 2 },
  totalDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  totalNum:     { fontSize: 22, fontWeight: '800', color: C.primary },
  totalLabel:   { fontSize: 11, color: C.muted, textAlign: 'center' },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: C.ink },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: 'center' },

  listCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  item:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  itemBorder: { borderTopWidth: 1, borderTopColor: C.separator },

  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarKepsek:     { backgroundColor: C.goldLight },
  avatarText:       { fontSize: 12, fontWeight: '700', color: C.primary },
  avatarTextKepsek: { color: C.goldFg ?? '#854d0e' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName:    { fontSize: 13, fontWeight: '600', color: C.ink, flexShrink: 1 },
  itemFeature: { fontSize: 11, color: C.muted },

  rolePill:    { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, flexShrink: 0 },
  rolePillKepsek:     { backgroundColor: C.goldLight },
  rolePillText:       { fontSize: 9, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  rolePillTextKepsek: { color: C.goldFg ?? '#854d0e' },

  itemRight:  { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusOk:   { backgroundColor: '#f0fdf4' },
  statusFail: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 10, fontWeight: '700' },
  itemWhen:   { fontSize: 10, color: C.mutedLight },
});
