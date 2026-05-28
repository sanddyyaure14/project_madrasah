import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PENDING } from '../lib/mockSchool';
import { C, S } from '../lib/theme';

const PENDING_TEACHERS_INIT = [
  {
    id: 't-1', name: 'Ust. Farid Hidayat', email: 'farid@madrasah.id',
    madrasah: 'MTs Negeri 1 Jakarta', subject: 'Bahasa Arab',
    nip: '198901234567', emailVerified: true, submittedAt: 'Hari ini, 10:20',
  },
  {
    id: 't-2', name: 'Ustz. Nurul Hikmah', email: 'nurul@madrasah.id',
    madrasah: 'MA Negeri 2 Surabaya', subject: 'Fiqih',
    nip: '199512348901', emailVerified: false, submittedAt: 'Kemarin, 15:40',
  },
];

function getInitials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('');
}

export default function ApprovalsScreen() {
  const [tab, setTab] = useState('akun');
  const [docs, setDocs] = useState(PENDING);
  const [pendingTeachers, setPendingTeachers] = useState(PENDING_TEACHERS_INIT);

  function approveTeacher(id) {
    setPendingTeachers(prev => prev.filter(t => t.id !== id));
  }
  function rejectTeacher(id) {
    setPendingTeachers(prev => prev.filter(t => t.id !== id));
  }
  function actDoc(id, approve) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Pusat Persetujuan</Text>
        <Text style={styles.pageSub}>Verifikasi akun guru baru dan tinjau dokumen sebelum dipublikasikan.</Text>
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

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'akun' && (
          <>
            {pendingTeachers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyArabic}>لا توجد طلبات</Text>
                <Text style={styles.emptyText}>Tidak ada pendaftaran guru yang menunggu verifikasi.</Text>
              </View>
            ) : (
              pendingTeachers.map(t => (
                <View key={t.id} style={[styles.card, S.shadow]}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(t.name)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{t.name}</Text>
                        {t.emailVerified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={10} color={C.primary} />
                            <Text style={styles.verifiedText}>Email terverifikasi</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardSub} numberOfLines={1}>{t.email}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    {[
                      { icon: 'business', text: t.madrasah },
                      { icon: 'book', text: t.subject },
                      { icon: 'card', text: `NIP: ${t.nip}` },
                      { icon: 'time', text: t.submittedAt },
                    ].map((d, i) => (
                      <View key={i} style={styles.detailRow}>
                        <Ionicons name={d.icon} size={13} color={C.muted} />
                        <Text style={styles.detailText}>{d.text}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.btnReject} onPress={() => rejectTeacher(t.id)}>
                      <Ionicons name="close" size={14} color={C.danger} />
                      <Text style={styles.btnRejectText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnApprove} onPress={() => approveTeacher(t.id)}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.btnApproveText}>Setujui</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

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
                    <TouchableOpacity style={styles.btnReject} onPress={() => actDoc(d.id, false)}>
                      <Ionicons name="close" size={14} color={C.danger} />
                      <Text style={styles.btnRejectText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnApprove} onPress={() => actDoc(d.id, true)}>
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
  tabRow: {
    flexDirection: 'row', backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.primary },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.goldLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.goldFg },
  docIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  typeBadge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: C.ink, textTransform: 'uppercase' },
  docTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginTop: 4 },
  docMeta: { fontSize: 12, color: C.muted, marginTop: 4 },
  cardDetails: { gap: 6, borderTopWidth: 1, borderTopColor: C.separator, paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.ink },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.separator, paddingTop: 12 },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
  },
  btnRejectText: { fontSize: 13, fontWeight: '700', color: C.danger },
  btnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary,
  },
  btnApproveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyArabic: { fontSize: 32, color: C.muted },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
