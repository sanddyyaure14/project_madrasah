/**
 * UsageStatsScreen.js
 * Statistik penggunaan harian aplikasi — 14 hari terakhir
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

// Nama hari pendek dalam Bahasa Indonesia
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatTanggal(isoDate) {
  const d = new Date(isoDate);
  return `${d.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][d.getMonth()]}`;
}

function getDayName(isoDate) {
  return HARI[new Date(isoDate).getDay()];
}

// Buat 14 slot hari terakhir (termasuk hari ini) agar chart selalu penuh
function buildDays(rows) {
  const map = {};
  rows.forEach(r => { map[r.hari.split('T')[0]] = r; });

  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({
      key,
      label:    getDayName(key),
      tanggal:  formatTanggal(key),
      total:    map[key]?.total    ?? 0,
      berhasil: map[key]?.berhasil ?? 0,
    });
  }
  return result;
}

export default function UsageStatsScreen() {
  const { token } = useAuth();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/guru/stats/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setRows(json.data);
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

  const days      = buildDays(rows);
  const maxTotal  = Math.max(...days.map(d => d.total), 1);
  const totalAll  = days.reduce((s, d) => s + d.total, 0);
  const hariAktif = days.filter(d => d.total > 0).length;
  const rataHari  = hariAktif > 0 ? (totalAll / hariAktif).toFixed(1) : '0';
  const puncak    = days.reduce((best, d) => d.total > best.total ? d : best, days[0]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Ringkasan ────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, S.shadow]}>
          <Text style={styles.summaryValue}>{totalAll}</Text>
          <Text style={styles.summaryLabel}>Total 14 Hari</Text>
        </View>
        <View style={[styles.summaryCard, S.shadow]}>
          <Text style={styles.summaryValue}>{hariAktif}</Text>
          <Text style={styles.summaryLabel}>Hari Aktif</Text>
        </View>
        <View style={[styles.summaryCard, S.shadow]}>
          <Text style={styles.summaryValue}>{rataHari}</Text>
          <Text style={styles.summaryLabel}>Rata-rata/Hari</Text>
        </View>
      </View>

      {/* Hari puncak */}
      {puncak?.total > 0 && (
        <View style={[styles.peakCard, S.shadow]}>
          <Ionicons name="trophy" size={20} color={C.gold} />
          <View>
            <Text style={styles.peakTitle}>Hari Paling Aktif</Text>
            <Text style={styles.peakSub}>{puncak.tanggal} ({puncak.label}) — {puncak.total} generate</Text>
          </View>
        </View>
      )}

      {/* ── Bar Chart 14 Hari ────────────────────────── */}
      <View style={[styles.chartCard, S.shadow]}>
        <Text style={styles.chartTitle}>Aktivitas 14 Hari Terakhir</Text>
        <View style={styles.chartArea}>
          {days.map((d, idx) => {
            const heightPct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
            const isToday   = idx === days.length - 1;
            return (
              <View key={d.key} style={styles.barCol}>
                {d.total > 0 && (
                  <Text style={styles.barValue}>{d.total}</Text>
                )}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(heightPct, d.total > 0 ? 8 : 0)}%` },
                      isToday && styles.barFillToday,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{d.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartCaption}>Setiap batang = jumlah generate di hari tersebut</Text>
      </View>

      {/* ── Daftar Harian ────────────────────────────── */}
      <Text style={styles.sectionTitle}>Rincian Harian</Text>

      {days.filter(d => d.total > 0).length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={40} color={C.mutedLight} />
          <Text style={styles.emptyText}>Belum ada aktivitas 14 hari terakhir</Text>
        </View>
      ) : (
        [...days].reverse().filter(d => d.total > 0).map((d, idx) => (
          <View key={d.key} style={[styles.dayRow, S.shadow]}>
            <View style={styles.dayDate}>
              <Text style={styles.dayName}>{d.label}</Text>
              <Text style={styles.dayTgl}>{d.tanggal}</Text>
            </View>
            <View style={styles.dayBarWrap}>
              <View style={[styles.dayBar, { width: `${(d.total / maxTotal) * 100}%` }]} />
            </View>
            <Text style={styles.dayTotal}>{d.total}x</Text>
          </View>
        ))
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

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border,
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: C.primary },
  summaryLabel: { fontSize: 11, color: C.muted, textAlign: 'center' },

  peakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.goldLight, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fde68a',
  },
  peakTitle: { fontSize: 13, fontWeight: '700', color: C.goldFg },
  peakSub:   { fontSize: 12, color: '#78350f', marginTop: 2 },

  chartCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  chartTitle:   { fontSize: 14, fontWeight: '700', color: C.ink },
  chartArea:    { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barCol:       { flex: 1, alignItems: 'center', gap: 4 },
  barValue:     { fontSize: 9, fontWeight: '700', color: C.primary },
  barTrack:     { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: C.separator, borderRadius: 4, overflow: 'hidden' },
  barFill:      { width: '100%', backgroundColor: C.primaryLight, borderRadius: 4 },
  barFillToday: { backgroundColor: C.primary },
  barLabel:     { fontSize: 9, color: C.muted },
  barLabelToday:{ fontWeight: '700', color: C.primary },
  chartCaption: { fontSize: 11, color: C.mutedLight, textAlign: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 4 },
  emptyBox: {
    backgroundColor: C.card, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border,
  },
  emptyText: { fontSize: 14, color: C.muted },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  dayDate:    { width: 46 },
  dayName:    { fontSize: 13, fontWeight: '700', color: C.ink },
  dayTgl:     { fontSize: 10, color: C.muted, marginTop: 1 },
  dayBarWrap: { flex: 1, height: 8, backgroundColor: C.separator, borderRadius: 999, overflow: 'hidden' },
  dayBar:     { height: 8, backgroundColor: C.primary, borderRadius: 999, minWidth: 4 },
  dayTotal:   { fontSize: 14, fontWeight: '700', color: C.ink, minWidth: 28, textAlign: 'right' },
});
