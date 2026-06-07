/**
 * GenerateStatsScreen.js
 * Statistik generate bulan ini: kuota + breakdown per fitur
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

const FEATURE_LABEL = {
  multiple_choice:  { label: 'Multiple Choice',    icon: 'clipboard',        color: '#3b82f6' },
  writing:          { label: 'Writing Feedback',   icon: 'create',           color: '#8b5cf6' },
  rubric:           { label: 'Rubric Generator',   icon: 'layers',           color: '#f59e0b' },
  worksheet:        { label: 'Worksheet',          icon: 'document-text',    color: '#10b981' },
  syllabus:         { label: 'Silabus',            icon: 'book',             color: '#ef4444' },
  unit_plan:        { label: 'Unit Plan / RPP',    icon: 'bookmark',         color: '#06b6d4' },
  presentation:     { label: 'Presentasi',         icon: 'easel',            color: '#ec4899' },
  academic_content: { label: 'Konten Akademik',    icon: 'school',           color: '#84cc16' },
};

function formatResetDate(isoDate) {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GenerateStatsScreen() {
  const { token } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/guru/stats/generate`, {
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
        <Text style={styles.loadingText}>Memuat data...</Text>
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

  const kuota     = data?.kuota;
  const breakdown = data?.breakdown ?? [];
  const pct       = kuota ? Math.min(100, Math.round((kuota.digunakan / kuota.limit_bulanan) * 100)) : 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Kartu Kuota ─────────────────────────────── */}
      <View style={[styles.kuotaCard, S.shadow]}>
        <View style={styles.kuotaHeader}>
          <View style={styles.kuotaIconWrap}>
            <Ionicons name="sparkles" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kuotaTitle}>Generate Bulan Ini</Text>
            <Text style={styles.kuotaPlan}>{kuota?.plan?.toUpperCase() ?? '-'}</Text>
          </View>
          <Text style={styles.kuotaBig}>
            {kuota?.digunakan ?? 0}
            <Text style={styles.kuotaLimit}> / {kuota?.limit_bulanan ?? 0}</Text>
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pct >= 90 ? C.danger : C.primary }]} />
        </View>
        <View style={styles.kuotaFooter}>
          <Text style={styles.kuotaSisa}>Sisa: {kuota?.tersedia ?? 0} generate</Text>
          <Text style={styles.kuotaReset}>Reset: {formatResetDate(kuota?.reset_date)}</Text>
        </View>
      </View>

      {/* ── Breakdown per Fitur ──────────────────────── */}
      <Text style={styles.sectionTitle}>Penggunaan per Fitur</Text>

      {breakdown.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bar-chart-outline" size={40} color={C.mutedLight} />
          <Text style={styles.emptyText}>Belum ada generate bulan ini</Text>
        </View>
      ) : (
        breakdown.map((item, idx) => {
          const meta      = FEATURE_LABEL[item.feature_type] ?? { label: item.feature_type, icon: 'sparkles', color: C.primary };
          const itemPct   = kuota ? Math.min(100, Math.round((item.total / kuota.limit_bulanan) * 100)) : 0;
          return (
            <View key={idx} style={[styles.featureCard, S.shadow]}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{meta.label}</Text>
                  <View style={styles.featureMeta}>
                    <View style={styles.metaPill}>
                      <Ionicons name="checkmark-circle" size={12} color={C.success} />
                      <Text style={[styles.metaPillText, { color: C.success }]}>{item.berhasil} berhasil</Text>
                    </View>
                    {item.gagal > 0 && (
                      <View style={[styles.metaPill, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="close-circle" size={12} color={C.danger} />
                        <Text style={[styles.metaPillText, { color: C.danger }]}>{item.gagal} gagal</Text>
                      </View>
                    )}
                    {item.avg_ms > 0 && (
                      <Text style={styles.avgMs}>~{(item.avg_ms / 1000).toFixed(1)}s</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.featureTotal, { color: meta.color }]}>{item.total}x</Text>
              </View>
              {/* Mini bar */}
              <View style={styles.miniBg}>
                <View style={[styles.miniFill, { width: `${itemPct}%`, backgroundColor: meta.color }]} />
              </View>
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

  kuotaCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 18, gap: 12,
    borderWidth: 1, borderColor: C.border,
  },
  kuotaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kuotaIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  kuotaTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  kuotaPlan:  { fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: 0.5 },
  kuotaBig:   { fontSize: 26, fontWeight: '800', color: C.ink },
  kuotaLimit: { fontSize: 16, fontWeight: '400', color: C.muted },

  barBg:   { height: 8, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999 },

  kuotaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  kuotaSisa:   { fontSize: 12, color: C.muted },
  kuotaReset:  { fontSize: 12, color: C.muted },

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
  featureMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  metaPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  metaPillText:{ fontSize: 11, fontWeight: '600' },
  avgMs:       { fontSize: 11, color: C.muted },
  featureTotal:{ fontSize: 22, fontWeight: '800' },

  miniBg:   { height: 4, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  miniFill: { height: 4, borderRadius: 999 },
});
