import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function ApprovalsScreen() {
  const { token } = useAuth();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshing, setRefreshing]     = useState(false);

  const fetchPendingTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/pending-teachers`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPendingTeachers(data.data ?? []);
    } catch (e) {
      console.error('Fetch pending teachers error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchPendingTeachers(); }, [fetchPendingTeachers]);

  function onRefresh() {
    setRefreshing(true);
    fetchPendingTeachers();
  }

  async function reviewTeacher(targetUserId, action, namaGuru) {
    Alert.alert(
      action === 'approve' ? 'Setujui Guru?' : 'Tolak Guru?',
      action === 'approve'
        ? `Akun ${namaGuru} akan diaktifkan dan bisa login.`
        : `Pendaftaran ${namaGuru} akan ditolak dan dihapus permanen.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action === 'approve' ? 'Setujui' : 'Tolak',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(targetUserId);
            try {
              const res  = await fetch(`${API_URL}/kepsek/review-teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetUserId, action }),
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert('Berhasil ✅', data.message);
                setPendingTeachers(prev => prev.filter(t => t.id !== targetUserId));
              } else {
                Alert.alert('Gagal', data.message);
              }
            } catch {
              Alert.alert('Error', 'Tidak dapat terhubung ke server.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Verifikasi Guru</Text>
        <Text style={styles.pageSub}>
          {pendingTeachers.length > 0
            ? `${pendingTeachers.length} pendaftaran menunggu persetujuan`
            : 'Semua pendaftaran sudah ditangani'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : pendingTeachers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color={C.mutedLight} />
            <Text style={styles.emptyTitle}>Semua Beres</Text>
            <Text style={styles.emptyText}>Tidak ada pendaftaran guru yang menunggu verifikasi.</Text>
          </View>
        ) : (
          pendingTeachers.map(t => (
            <View key={t.id} style={[styles.card, S.shadow]}>
              {/* Atas: avatar + nama */}
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(t.nama_lengkap)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{t.nama_lengkap}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{t.email}</Text>
                </View>
              </View>

              {/* Detail info */}
              <View style={styles.cardDetails}>
                {[
                  { icon: 'business-outline',      text: `Madrasah: ${t.nama_instansi ?? '-'}` },
                  { icon: 'card-outline',           text: `NIP: ${t.nip ?? '-'}` },
                  { icon: 'book-outline',           text: `Mapel: ${Array.isArray(t.mata_pelajaran) ? t.mata_pelajaran.join(', ') : (t.mata_pelajaran ?? '-')}` },
                  { icon: 'school-outline',         text: `Jenjang: ${t.jenjang ?? '-'}` },
                  { icon: 'time-outline',           text: `Daftar: ${t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}` },
                ].map((d, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Ionicons name={d.icon} size={13} color={C.muted} />
                    <Text style={styles.detailText}>{d.text}</Text>
                  </View>
                ))}
              </View>

              {/* Tombol aksi */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.btnReject}
                  onPress={() => reviewTeacher(t.id, 'reject', t.nama_lengkap)}
                  disabled={actionLoading === t.id}
                  activeOpacity={0.8}
                >
                  {actionLoading === t.id
                    ? <ActivityIndicator size="small" color={C.danger} />
                    : <><Ionicons name="close" size={14} color={C.danger} /><Text style={styles.btnRejectText}>Tolak</Text></>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnApprove}
                  onPress={() => reviewTeacher(t.id, 'approve', t.nama_lengkap)}
                  disabled={actionLoading === t.id}
                  activeOpacity={0.8}
                >
                  {actionLoading === t.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={styles.btnApproveText}>Setujui</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  pageHeader: {
    padding: 20, paddingBottom: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: C.ink },
  pageSub:   { fontSize: 13, color: C.muted, marginTop: 4 },

  content: { padding: 16, gap: 12 },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.goldLight ?? '#fef9c3',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.goldFg ?? '#854d0e' },
  cardName: { fontSize: 15, fontWeight: '700', color: C.ink },
  cardSub:  { fontSize: 12, color: C.muted, marginTop: 2 },

  cardDetails: { gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.ink, flex: 1 },

  cardActions: {
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12,
  },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fee2e2',
  },
  btnRejectText:  { fontSize: 13, fontWeight: '700', color: C.danger },
  btnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary,
  },
  btnApproveText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  emptyText:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
