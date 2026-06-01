import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { TOOLS } from '../lib/tools';
import { TEACHERS, PENDING, SCHOOL_STATS, ACTIVITY } from '../lib/mockSchool';
import { C, S } from '../lib/theme';

function getInitials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('');
}

function StatCard({ icon, label, value, accent }) {
  const isGold = accent === 'gold';
  return (
    <View style={[styles.statCard, S.shadow]}>
      <View style={[styles.statIcon, isGold ? styles.statIconGold : styles.statIconEmerald]}>
        <Ionicons name={icon} size={20} color={isGold ? C.goldFg : C.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function StatusPill({ status }) {
  const map = {
    Aktif: { bg: C.primaryLight, fg: C.primary },
    Cuti: { bg: '#fef3c7', fg: '#92400e' },
    Nonaktif: { bg: '#fee2e2', fg: C.danger },
  };
  const s = map[status] ?? map['Aktif'];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{status}</Text>
    </View>
  );
}

function SuperAdminHome({ navigation }) {
  const stats = SCHOOL_STATS;
  const topTeachers = [...TEACHERS].sort((a, b) => b.generates - a.generates).slice(0, 5);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Ionicons name="shield-checkmark" size={12} color={C.gold} />
          <Text style={styles.bannerBadgeText}>Panel Kepala Madrasah</Text>
        </View>
        <Text style={styles.bannerArabic}>الحمد لله</Text>
        <Text style={styles.bannerTitle}>Ringkasan kinerja madrasah hari ini.</Text>
        <Text style={styles.bannerSub}>Pantau aktivitas guru, persetujuan dokumen, dan statistik penggunaan AI.</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="people" label="Total Guru" value={stats.guru} accent="primary" />
        <StatCard icon="school" label="Total Siswa" value={stats.siswa} accent="gold" />
        <StatCard icon="book" label="Kelas Aktif" value={stats.kelas} accent="primary" />
        <StatCard icon="document-text" label="Dokumen Dibuat" value={stats.dokumen} accent="gold" />
        <StatCard icon="sparkles" label="Generate Bulan Ini" value={stats.generateBulanIni} accent="primary" />
        <StatCard icon="time" label="Jam Dihemat" value={`${stats.hematJam}j`} accent="gold" />
        <StatCard icon="clipboard" label="Menunggu Persetujuan" value={PENDING.length} accent="primary" />
        <StatCard icon="trending-up" label="Tingkat Aktif" value="92%" accent="gold" />
      </View>

      {/* Pending Approvals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Menunggu Persetujuan</Text>
            <Text style={styles.sectionSub}>Dokumen yang diajukan guru untuk disetujui.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Approvals')}>
            <Text style={styles.linkText}>Lihat semua →</Text>
          </TouchableOpacity>
        </View>
        {PENDING.slice(0, 3).map((p) => (
          <View key={p.id} style={styles.pendingItem}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.pendingMeta}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{p.type}</Text>
                </View>
                <Text style={styles.pendingTeacher} numberOfLines={1}>{p.teacher} · {p.submitted}</Text>
              </View>
              <Text style={styles.pendingTitle} numberOfLines={1}>{p.title}</Text>
            </View>
            <View style={styles.pendingActions}>
              <TouchableOpacity style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Setujui</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
        </View>
        {ACTIVITY.map((a, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityAvatar}>
              <Text style={styles.activityAvatarText}>{getInitials(a.who)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText}>
                <Text style={{ fontWeight: '700' }}>{a.who}</Text> {a.what}
              </Text>
              <Text style={styles.activityWhen}>{a.when}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Top Teachers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Guru Paling Aktif</Text>
            <Text style={styles.sectionSub}>Berdasarkan jumlah dokumen bulan ini.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Teachers')}>
            <Text style={styles.linkText}>Kelola guru →</Text>
          </TouchableOpacity>
        </View>
        {topTeachers.map((t) => (
          <View key={t.id} style={styles.teacherRow}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.teacherAvatarText}>{getInitials(t.name)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.teacherName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.teacherSubject} numberOfLines={1}>{t.subject}</Text>
            </View>
            <StatusPill status={t.status} />
            <Text style={styles.teacherCount}>{t.generates}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function GuruHome({ navigation }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(',')[0] ?? '';
  const assessmentTools = TOOLS.filter(t => t.module === 'assessment');
  const contentTools = TOOLS.filter(t => t.module === 'content');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerArabic}>بسم الله</Text>
        <Text style={styles.bannerTitle}>Mari mulai mempersiapkan pelajaran hari ini, {firstName}.</Text>
        <Text style={styles.bannerSub}>Pilih salah satu dari 8 alat di bawah, isi parameter, lalu biarkan MadrasahAI menyusunnya untuk Anda.</Text>
      </View>

      {/* Guru stats */}
      <View style={styles.statsGrid}>
        <StatCard icon="sparkles" label="Generate bulan ini" value="12 / 20" accent="primary" />
        <StatCard icon="document-text" label="Dokumen tersimpan" value={47} accent="gold" />
        <StatCard icon="time" label="Waktu dihemat" value="≈ 9 jam" accent="primary" />
      </View>

      {/* Assessment tools */}
      <View style={styles.section}>
        <Text style={styles.moduleLabel}>ASESMEN</Text>
        <View style={styles.toolsGrid}>
          {assessmentTools.map(t => (
            <ToolCard key={t.slug} tool={t} onPress={() => navigation.navigate('ToolPage', { slug: t.slug })} />
          ))}
        </View>
      </View>

      {/* Content tools */}
      <View style={styles.section}>
        <Text style={styles.moduleLabel}>KONTEN</Text>
        <View style={styles.toolsGrid}>
          {contentTools.map(t => (
            <ToolCard key={t.slug} tool={t} onPress={() => navigation.navigate('ToolPage', { slug: t.slug })} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const ICON_MAP = {
  'clipboard-list': 'clipboard',
  'layers': 'layers',
  'file-edit': 'create',
  'file-text': 'document-text',
  'presentation': 'easel',
  'book-marked': 'bookmark',
  'book-open': 'book',
  'graduation-cap': 'school',
};

function ToolCard({ tool, onPress }) {
  const isGold = tool.accent === 'gold';
  const iconName = ICON_MAP[tool.icon] ?? 'sparkles';
  return (
    <TouchableOpacity style={[styles.toolCard, S.shadow]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.toolIcon, isGold ? styles.toolIconGold : styles.toolIconEmerald]}>
        <Ionicons name={iconName} size={20} color={isGold ? C.goldFg : C.primary} />
      </View>
      <Text style={styles.toolTitle}>{tool.title}</Text>
      <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
      <Text style={styles.toolDesc} numberOfLines={2}>{tool.desc}</Text>
      <Text style={styles.toolLink}>Buka →</Text>
    </TouchableOpacity>
  );
}

export default function DashboardHomeScreen({ navigation }) {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'superadmin'
    ? <SuperAdminHome navigation={navigation} />
    : <GuruHome navigation={navigation} />;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  banner: {
    backgroundColor: C.primary, borderRadius: 20, padding: 24, gap: 8,
    overflow: 'hidden',
  },
  bannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(201,162,39,0.2)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(201,162,39,0.4)',
  },
  bannerBadgeText: { fontSize: 10, fontWeight: '800', color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  bannerArabic: { fontSize: 22, color: C.gold },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 30 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    width: '47.5%', flexGrow: 0,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statIconEmerald: { backgroundColor: C.primaryLight },
  statIconGold: { backgroundColor: C.goldLight },
  statLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '700', color: C.ink },

  section: { backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 12, ...S.shadow },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  sectionSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  linkText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  moduleLabel: { fontSize: 10, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },

  pendingItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.separator },
  pendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 9, fontWeight: '700', color: C.ink, textTransform: 'uppercase' },
  pendingTeacher: { fontSize: 11, color: C.muted, flex: 1 },
  pendingTitle: { fontSize: 13, fontWeight: '600', color: C.ink },
  pendingActions: { flexDirection: 'row', gap: 6 },
  btnOutline: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnOutlineText: { fontSize: 12, color: C.ink },
  btnPrimary: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnPrimaryText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  activityAvatarText: { fontSize: 11, fontWeight: '700', color: C.primary },
  activityText: { fontSize: 13, color: C.ink, lineHeight: 18 },
  activityWhen: { fontSize: 11, color: C.muted, marginTop: 2 },

  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.separator },
  teacherAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  teacherAvatarText: { fontSize: 11, fontWeight: '700', color: C.primary },
  teacherName: { fontSize: 13, fontWeight: '600', color: C.ink },
  teacherSubject: { fontSize: 11, color: C.muted },
  teacherCount: { fontSize: 18, fontWeight: '700', color: C.ink, minWidth: 32, textAlign: 'right' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '700' },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: {
    width: '47.5%', backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 6,
  },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolIconEmerald: { backgroundColor: C.primaryLight },
  toolIconGold: { backgroundColor: C.goldLight },
  toolTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  toolSubtitle: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  toolDesc: { fontSize: 12, color: C.ink + 'aa', lineHeight: 17 },
  toolLink: { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 4 },
});
