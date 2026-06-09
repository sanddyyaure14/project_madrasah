/**
 * KepsekGenerateStatsScreen.js
 * Statistik generate bulan ini — semua guru & kepsek (kepsek view)
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

const FEATURE_META = {
  multiple_choice:  { label: 'Multiple Choice',  icon: 'clipboard',     color: '#3b82f6' },
  writing:          { label: 'Writing Feedback', icon: 'create',        color: '#8b5cf6' },
  rubric:           { label: 'Rubric Generator', icon: 'layers',        color: '#f59e0b' },
  worksheet:        { label: 'Worksheet',        icon: 'document-text', color: '#10b981' },
  syllabus:         { label: 'Silabus',          icon: 'book',          color: '#ef4444' },
  unit_plan:        { label: 'Unit Plan / RPP',  icon: 'bookmark',      color: '#06b6d4' },
  presentation:     { label: 'Presentasi',       icon: 'easel',         color: '#ec4899' },
  academic_content: { label: 'Konten Akademik',  icon: 'school',        color: '#84cc16' },
};

const ROLE_LABEL = { guru: 'Guru', superadmin: 'Kepala Madrasah', kepala_sekolah: 'Kepala Madrasah' };

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function KepsekGenerateStatsScreen() {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/kepsek/stats/generate`, {
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
        <Text style={styles.loadingText}>Memuat statistik...</Text>
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

  const total     = data?.total_bulan_ini ?? 0;
  const breakdown = data?.breakdown       ?? [];
  const topUsers  = data?.top_users       ?? [];
  const maxBreak  = Math.max(...breakdown.map(b => b.total), 1);
  const maxUser   = Math.max(...topUsers.map(u => u.total), 1);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Total Banner ──────────────────────────── */}
      <View style={[styles.totalCard, S.shadow]}>
        <View style={styles.totalIcon}>
          <Ionicons name="sparkles" size={26} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalLabel}>Total Generate Bulan Ini</Text>
          <Text style={styles.totalSub}>Semua guru & kepala madrasah</Text>
        </View>
        <Text style={styles.totalBig}>{total}</Text>
      </View>

      {/* ── Breakdown per Fitur ──────────────────── */}
      <Text style={styles.sectionTitle}>Per Fitur AI</Text>

      {breakdown.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bar-chart-outline" size={40} color={C.mutedLight} />
          <Text style={styles.emptyText}>Belum ada generate bulan ini</Text>
        </View>
      ) : (
        breakdown.map((item, idx) => {
          const meta    = FEATURE_META[item.feature_type] ?? { label: item.feature_type, icon: 'sparkles', color: C.primary };
          const barPct  = Math.round((item.total / maxBreak) * 100);
          return (
            <View key={idx} style={[styles.featureCard, S.shadow]}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{meta.label}</Text>
                  <View style={styles.pills}>
                    <View style={styles.pillGreen}>
                      <Ionicons name="checkmark-circle" size={11} color={C.success} />
                      <Text style={[styles.pillText, { color: C.success }]}>{item.berhasil} berhasil</Text>
                    </View>
                    {item.gagal > 0 && (
                      <View style={styles.pillRed}>
                        <Ionicons name="close-circle" size={11} color={C.danger} />
                        <Text style={[styles.pillText, { color: C.danger }]}>{item.gagal} gagal</Text>
                      </View>
                    )}
                    {item.avg_ms > 0 && (
                      <Text style={styles.avgMs}>~{(item.avg_ms / 1000).toFixed(1)}s</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.featureTotal, { color: meta.color }]}>{item.total}x</Text>
              </View>
              <View style={styles.miniBg}>
                <View style={[styles.miniFill, { width: `${barPct}%`, backgroundColor: meta.color }]} />
              </View>
            </View>
          );
        })
      )}

      {/* ── Top Users ────────────────────────────── */}
      {topUsers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pengguna Paling Aktif</Text>
          <View style={[styles.usersCard, S.shadow]}>
            {topUsers.map((u, idx) => {
              const barPct = Math.round((u.total / maxUser) * 100);
              const isKepsek = u.role !== 'guru';
              return (
                <View key={idx} style={[styles.userRow, idx > 0 && styles.userRowBorder]}>
                  <View style={[styles.userAvatar, isKepsek && styles.userAvatarKepsek]}>
                    <Text style={[styles.userAvatarText, isKepsek && styles.userAvatarTextKepsek]}>
                      {getInitials(u.nama_lengkap)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.userMeta}>
                      <Text style={styles.userName} numberOfLines={1}>{u.nama_lengkap}</Text>
                      <View style={[styles.roleBadge, isKepsek && styles.roleBadgeKepsek]}>
                        <Text style={[styles.roleBadgeText, isKepsek && styles.roleBadgeTextKepsek]}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.userBarBg}>
                      <View style={[styles.userBarFill, { width: `${barPct}%` }, isKepsek && styles.userBarKepsek]} />
                    </View>
                  </View>
                  <Text style={[styles.userTotal, isKepsek && styles.userTotalKepsek]}>{u.total}x</Text>
                </View>
              );
            })}
          </View>
        </>
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

  totalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  totalIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  totalSub:   { fontSize: 11, color: C.muted, marginTop: 2 },
  totalBig:   { fontSize: 36, fontWeight: '800', color: C.primary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 4 },

  emptyBox: {
    backgroundColor: C.card, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border,
  },
  emptyText: { fontSize: 14, color: C.muted },

  featureCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureLabel:{ fontSize: 14, fontWeight: '700', color: C.ink },
  pills:       { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  pillGreen:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  pillRed:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef2f2', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  pillText:    { fontSize: 11, fontWeight: '600' },
  avgMs:       { fontSize: 11, color: C.muted },
  featureTotal:{ fontSize: 22, fontWeight: '800' },
  miniBg:      { height: 4, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  miniFill:    { height: 4, borderRadius: 999 },

  usersCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 0,
    borderWidth: 1, borderColor: C.border,
  },
  userRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  userRowBorder: { borderTopWidth: 1, borderTopColor: C.separator },
  userAvatar:    {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarKepsek:     { backgroundColor: C.goldLight },
  userAvatarText:       { fontSize: 12, fontWeight: '700', color: C.primary },
  userAvatarTextKepsek: { color: C.goldFg ?? '#854d0e' },
  userMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName:    { fontSize: 13, fontWeight: '600', color: C.ink, flex: 1 },
  roleBadge:   { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  roleBadgeKepsek: { backgroundColor: C.goldLight },
  roleBadgeText:   { fontSize: 9, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  roleBadgeTextKepsek: { color: C.goldFg ?? '#854d0e' },
  userBarBg:   { height: 5, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  userBarFill: { height: 5, backgroundColor: C.primary, borderRadius: 999, minWidth: 2 },
  userBarKepsek: { backgroundColor: C.gold ?? '#c9a227' },
  userTotal:   { fontSize: 16, fontWeight: '800', color: C.primary, minWidth: 32, textAlign: 'right' },
  userTotalKepsek: { color: C.goldFg ?? '#854d0e' },
});
