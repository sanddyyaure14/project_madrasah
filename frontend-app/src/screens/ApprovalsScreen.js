import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { API_URL } from '../lib/auth';
import { PENDING } from '../lib/mockSchool';
import { C, S } from '../lib/theme';

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function ApprovalsScreen() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('akun');
  const [docs, setDocs] = useState(PENDING);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id guru yang sedang diproses
  const [refreshing, setRefreshing] = useState(false);

  // Ambil daftar guru pending dari backend
  const fetchPendingTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/kepsek/pending-teachers`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPendingTeachers(data.data ?? []);
      }
    } catch (error) {
      console.error('Fetch pending teachers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'akun') fetchPendingTeachers();
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingTeachers();
  };

  // Approve atau Reject guru
  async function reviewTeacher(targetUserId, action, namaGuru) {
    Alert.alert(
      action === 'approve' ? 'Setujui Guru?' : 'Tolak Guru?',
      action === 'approve'
        ? `Akun ${namaGuru} akan diaktifkan dan bisa login.`
        : `Pendaftaran ${namaGuru} akan ditolak dan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action === 'approve' ? 'Setujui' : 'Tolak',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(targetUserId);
            try {
              const res = await fetch(`${API_URL}/kepsek/review-teacher`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ targetUserId, action }),
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert('Berhasil', data.message);
                // Hapus dari list lokal
                setPendingTeachers(prev => prev.filter(t => t.id !== targetUserId));
              } else {
                Alert.alert('Gagal', data.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Tidak dapat terhubung ke server.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  function actDoc(id) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Pusat Persetujuan</Text>
        <Text style={styles.pageSub}>Verifikasi akun guru baru dan tinjau dokumen.</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'akun' && styles.tabActive]}
          onPress={() => setTab('akun')}
        >
          <Ionicons name="person-add" size={15} color={tab === 'akun' ? C.primary : C.muted} />
          <Text style={[styles.tabText, tab === 'akun' && styles.tabTextActive]}>
            Akun Guru {pendingTeachers.length > 0 && `(${pendingTeachers.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'dokumen' && styles.tabActive]}
          onPress={() => setTab('dokumen')}
        >
          <Ionicons name="document-text" size={15} color={tab === 'dokumen' ? C.primary : C.muted} />
          <Text style={[styles.tabText, tab === 'dokumen' && styles.tabTextActive]}>
            Dokumen {docs.length > 0 && `(${docs.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Tab Akun Guru */}
        {tab === 'akun' && (
          <>
            {loading ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
            ) : pendingTeachers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyArabic}>لا توجد طلبات</Text>
                <Text style={styles.emptyText}>Tidak ada pendaftaran guru yang menunggu verifikasi.</Text>
              </View>
            ) : (
              pendingTeachers.map(t => (
                <View key={t.id} style={[styles.card, S.shadow]}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(t.nama_lengkap)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardName} numberOfLines={1}>{t.nama_lengkap}</Text>
                      <Text style={styles.cardSub} numberOfLines={1}>{t.email}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    {[
                      { icon: 'business', text: `Madrasah: ${t.nama_instansi ?? '-'}` },
                      { icon: 'card', text: `NIP: ${t.nip ?? '-'}` },
                      { icon: 'book', text: `Mapel: ${Array.isArray(t.mata_pelajaran) ? t.mata_pelajaran.join(', ') : (t.mata_pelajaran ?? '-')}` },
                      { icon: 'school', text: `Jenjang: ${t.jenjang ?? '-'}` },
                      { icon: 'time', text: `Daftar: ${t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}` },
                    ].map((d, i) => (
                      <View key={i} style={styles.detailRow}>
                        <Ionicons name={d.icon} size={13} color={C.muted} />
                        <Text style={styles.detailText}>{d.text}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.btnReject}
                      onPress={() => reviewTeacher(t.id, 'reject', t.nama_lengkap)}
                      disabled={actionLoading === t.id}
                    >
                      {actionLoading === t.id
                        ? <ActivityIndicator size="small" color={C.danger} />
                        : <>
                            <Ionicons name="close" size={14} color={C.danger} />
                            <Text style={styles.btnRejectText}>Tolak</Text>
                          </>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnApprove}
                      onPress={() => reviewTeacher(t.id, 'approve', t.nama_lengkap)}
                      disabled={actionLoading === t.id}
                    >
                      {actionLoading === t.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                            <Text style={styles.btnApproveText}>Setujui</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Tab Dokumen */}
        {tab === 'dokumen' && (
          <>
            {docs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyArabic}>لا توجد مستندات</Text>
                <Text style={styles.emptyText}>Tidak ada dokumen yang menunggu persetujuan.</Text>
              </View>
            ) : (
              docs.map(d => (
                <View key={d.id} style={[styles.card, S.shadow]}>
                  <View style={styles.cardTop}>
                    <View style={styles.docIcon}>
                      <Ionicons name="document-text" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.nameRow}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{d.type}</Text>
                        </View>
                      </View>
                      <Text style={styles.docTitle} numberOfLines={2}>{d.title}</Text>
                      <Text style={styles.docMeta}>{d.teacher} · {d.submitted}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.btnReject} onPress={() => actDoc(d.id)}>
                      <Ionicons name="close" size={14} color={C.danger} />
                      <Text style={styles.btnRejectText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnApprove} onPress={() => actDoc(d.id)}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.btnApproveText}>Setujui</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  pageHeader: { padding: 20, paddingBottom: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  pageTitle: { fontSize: 24, fontWeight: '700', color: C.ink },
  pageSub: { fontSize: 13, color: C.muted, marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.primary },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.goldLight ?? '#fef9c3',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.goldFg ?? '#854d0e' },
  docIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: C.primaryLight ?? '#eff6ff',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: C.ink },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  typeBadge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: C.ink, textTransform: 'uppercase' },
  docTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginTop: 4 },
  docMeta: { fontSize: 12, color: C.muted, marginTop: 4 },
  cardDetails: { gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.ink },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
  },
  btnRejectText: { fontSize: 13, fontWeight: '700', color: C.danger ?? '#dc2626' },
  btnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary,
  },
  btnApproveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyArabic: { fontSize: 32, color: C.muted },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
