import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, API_URL } from '../lib/auth';
import { TOOLS } from '../lib/tools';
import { C, S } from '../lib/theme';

function getInitials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('');
}

function StatCard({ icon, label, value, accent, onPress }) {
  const isGold = accent === 'gold';
  const inner = (
    <>
      <View style={[styles.statIcon, isGold ? styles.statIconGold : styles.statIconEmerald]}>
        <Ionicons name={icon} size={20} color={isGold ? C.goldFg : C.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.statCard, S.shadow]} onPress={onPress} activeOpacity={0.75}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.statCard, S.shadow]}>{inner}</View>;
}

const FEATURE_LABEL_SHORT = {
  multiple_choice:  'Multiple Choice',
  writing:          'Writing Feedback',
  rubric:           'Rubric',
  worksheet:        'Worksheet',
  syllabus:         'Silabus',
  unit_plan:        'Unit Plan',
  presentation:     'Presentasi',
  academic_content: 'Konten Akademik',
};

const ROLE_LABEL = { guru: 'Guru', superadmin: 'Kepsek', kepala_sekolah: 'Kepsek' };

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function getInitialsLocal(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

function SuperAdminHome({ navigation }) {
  const { token } = useAuth();
  const assessmentTools = TOOLS.filter(t => t.module === 'assessment');
  const contentTools = TOOLS.filter(t => t.module === 'content');

  const [summary, setSummary]         = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activity, setActivity]       = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function fetchData() {
        setLoadingSummary(true);
        try {
          const [summaryRes, pendingRes, activityRes] = await Promise.all([
            fetch(`${API_URL}/kepsek/dashboard/summary`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/kepsek/pending-teachers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/kepsek/activity/recent`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const summaryJson  = await summaryRes.json();
          const pendingJson  = await pendingRes.json();
          const activityJson = await activityRes.json();
          if (active && summaryJson.success)  setSummary(summaryJson.data);
          if (active && pendingJson.success)  setPendingCount((pendingJson.data ?? []).length);
          if (active && activityJson.success) setActivity(activityJson.data ?? []);
        } catch { /* silent */ }
        finally { if (active) setLoadingSummary(false); }
      }
      fetchData();
      return () => { active = false; };
    }, [token])
  );

  const totalGuru = loadingSummary ? '...' : (summary?.card_total_guru?.total ?? '-');
  const generateBulanIni = loadingSummary ? '...' : (summary?.card_total_generate?.total ?? '-');
  const ratingValue = loadingSummary
    ? '...'
    : summary?.card_rata_rating?.rating != null
      ? `★ ${Number(summary.card_rata_rating.rating).toFixed(1)} / 5`
      : 'Belum ada';
  const pendingValue = loadingSummary ? '...' : pendingCount;

  function navigateToTool(t) {
    if (t.slug === 'syllabus') {
      navigation.navigate('SyllabusForm');
    } else if (t.slug === 'academic-content') {
      navigation.navigate('AcademicContentForm');
    } else if (t.slug === 'presentation') {
      navigation.navigate('PresentationForm');
    } else if (t.slug === 'writing-feedback') {
      navigation.navigate('WritingFeedback');
    } else if (t.slug === 'worksheet') {
      navigation.navigate('Worksheet');
    } else {
      navigation.navigate('ToolPage', { slug: t.slug });
    }
  }

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
        <Text style={styles.bannerSub}>Pantau aktivitas guru, persetujuan, dan statistik penggunaan AI.</Text>
      </View>

      {/* Stats grid — 4 card saja */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          label="Total Guru"
          value={totalGuru}
          accent="primary"
          onPress={() => navigation.navigate('Guru')}
        />
        <StatCard
          icon="sparkles"
          label="Generate Bulan Ini"
          value={generateBulanIni}
          accent="gold"
          onPress={() => navigation.navigate('KepsekGenerateStats')}
        />
        <StatCard
          icon="clipboard"
          label="Menunggu Persetujuan"
          value={pendingValue}
          accent="primary"
          onPress={() => navigation.navigate('Persetujuan')}
        />
        <StatCard
          icon="star"
          label="Rating Feedback"
          value={ratingValue}
          accent="gold"
          onPress={() => navigation.navigate('KepsekFeedbackStats')}
        />
      </View>

      {/* Aktivitas Terbaru */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
            <Text style={styles.sectionSub}>Generate terbaru dari semua pengguna.</Text>
          </View>
          {activity.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('KepsekActivity')}>
              <Text style={styles.linkText}>Lihat semua →</Text>
            </TouchableOpacity>
          )}
        </View>
        {loadingSummary ? (
          <ActivityIndicator color={C.primary} size="small" />
        ) : activity.length === 0 ? (
          <View style={styles.activityEmpty}>
            <Ionicons name="time-outline" size={32} color={C.mutedLight} />
            <Text style={styles.activityEmptyText}>Belum ada aktivitas</Text>
          </View>
        ) : (
          activity.slice(0, 4).map((a, i) => {
            const isKepsek = a.role_user !== 'guru';
            const topik = a.topik || a.mata_pelajaran || a.jenis_konten
              || FEATURE_LABEL_SHORT[a.feature_type] || a.feature_type;
            const statusOk = a.status === 'completed';
            return (
              <View key={a.request_id ?? i} style={[styles.activityItem, i > 0 && styles.activityBorder]}>
                <View style={[styles.activityAvatar, isKepsek && styles.activityAvatarKepsek]}>
                  <Text style={[styles.activityAvatarText, isKepsek && styles.activityAvatarTextKepsek]}>
                    {getInitialsLocal(a.nama_user)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {a.nama_user}
                    <Text style={styles.activityRole}> · {ROLE_LABEL[a.role_user] ?? a.role_user}</Text>
                  </Text>
                  <Text style={styles.activityWhat} numberOfLines={1}>
                    {FEATURE_LABEL_SHORT[a.feature_type] ?? a.feature_type}
                    {topik ? ` — ${topik}` : ''}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <View style={[styles.statusDot, statusOk ? styles.statusOk : styles.statusFail]} />
                  <Text style={styles.activityWhen}>{timeAgo(a.created_at)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.moduleLabel}>ASESMEN</Text>
        <View style={styles.toolsGrid}>
          {assessmentTools.map(t => (
            <ToolCard key={t.slug} tool={t} onPress={() => navigateToTool(t)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.moduleLabel}>KONTEN</Text>
        <View style={styles.toolsGrid}>
          {contentTools.map(t => (
            <ToolCard key={t.slug} tool={t} onPress={() => navigateToTool(t)} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function GuruHome({ navigation }) {
  const { user, token } = useAuth();
  const firstName = user?.name?.split(',')[0] ?? '';
  const assessmentTools = TOOLS.filter(t => t.module === 'assessment');
  const contentTools = TOOLS.filter(t => t.module === 'content');

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function fetchSummary() {
        setLoadingSummary(true);
        try {
          const res  = await fetch(`${API_URL}/guru/dashboard/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (active && json.success) setSummary(json.data);
        } catch { /* silent */ }
        finally { if (active) setLoadingSummary(false); }
      }
      fetchSummary();
      return () => { active = false; };
    }, [token])
  );

  const generateValue = loadingSummary
    ? '...'
    : summary
      ? `${summary.kuota.digunakan} / ${summary.kuota.limit_bulanan}`
      : '-';

  const dokumenValue = loadingSummary
    ? '...'
    : summary
      ? summary.dokumen_tersimpan
      : '-';

  // Format waktu penggunaan — tampilkan kapan terakhir aktif
  const waktuValue = loadingSummary
    ? '...'
    : summary?.waktu_terakhir_generate
      ? (() => {
          const d = new Date(summary.waktu_terakhir_generate);
          const now = new Date();
          const diffMs = now - d;
          const diffMnt = Math.floor(diffMs / 60000);
          const diffJam = Math.floor(diffMnt / 60);
          const diffHari = Math.floor(diffJam / 24);
          if (diffMnt < 60) return `${diffMnt} mnt lalu`;
          if (diffJam < 24) return `${diffJam} jam lalu`;
          return `${diffHari} hari lalu`;
        })()
      : 'Belum ada';

  // Format rating feedback
  const ratingValue = loadingSummary
    ? '...'
    : summary?.feedback?.rata_rata != null
      ? `★ ${Number(summary.feedback.rata_rata).toFixed(1)} / 5`
      : 'Belum ada';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerArabic}>بسم الله</Text>
        <Text style={styles.bannerTitle}>Mari mulai mempersiapkan pelajaran hari ini, {firstName}.</Text>
        <Text style={styles.bannerSub}>Pilih salah satu dari 8 alat di bawah, isi parameter, lalu biarkan MadrasahAI menyusunnya untuk Anda.</Text>
      </View>

      {/* Guru stats — 4 card dalam 2x2 grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="sparkles"
          label="Generate bulan ini"
          value={generateValue}
          accent="primary"
          onPress={() => navigation.navigate('GenerateStats')}
        />
        <StatCard
          icon="document-text"
          label="Dokumen tersimpan"
          value={dokumenValue}
          accent="gold"
          onPress={() => navigation.navigate('Dokumen')}
        />
        <StatCard
          icon="time-outline"
          label="Waktu penggunaan"
          value={waktuValue}
          accent="primary"
          onPress={() => navigation.navigate('UsageStats')}
        />
        <StatCard
          icon="star"
          label="Rating feedback"
          value={ratingValue}
          accent="gold"
          onPress={() => navigation.navigate('FeedbackStats')}
        />
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
            <ToolCard
              key={t.slug}
              tool={t}
              onPress={() => {
                if (t.slug === 'syllabus') {
                  navigation.navigate('SyllabusForm');
                } else if (t.slug === 'academic-content') {
                  navigation.navigate('AcademicContentForm');
                } else if (t.slug === 'presentation') {
                  navigation.navigate('PresentationForm');
                } else {
                  navigation.navigate('ToolPage', { slug: t.slug });
                }
              }}
            />
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
  const iconName = ICON_MAP[tool.icon] ?? 'sparkles';
  return (
    <TouchableOpacity style={[styles.toolCard, S.shadow]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.toolIcon, styles.toolIconEmerald]}>
        <Ionicons name={iconName} size={20} color={C.primary} />
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

  // Aktivitas terbaru
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  activityBorder: { borderTopWidth: 1, borderTopColor: C.separator },
  activityAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  activityAvatarKepsek:     { backgroundColor: C.goldLight },
  activityAvatarText:       { fontSize: 11, fontWeight: '700', color: C.primary },
  activityAvatarTextKepsek: { color: C.goldFg ?? '#854d0e' },
  activityName: { fontSize: 13, fontWeight: '600', color: C.ink },
  activityRole: { fontSize: 11, fontWeight: '400', color: C.muted },
  activityWhat: { fontSize: 11, color: C.muted, marginTop: 1 },
  activityRight: { alignItems: 'flex-end', gap: 3 },
  activityWhen:  { fontSize: 10, color: C.mutedLight },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusOk:    { backgroundColor: '#16a34a' },
  statusFail:  { backgroundColor: C.danger },
  activityEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  activityEmptyText: { fontSize: 13, color: C.muted },

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
