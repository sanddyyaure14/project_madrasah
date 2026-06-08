import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { C, S } from '../lib/theme';
import { useAuth, API_URL } from '../lib/auth';

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'mc', label: '📝 Soal PG' },
  { key: 'rubric', label: '📊 Rubrik' },
  { key: 'feedback', label: '✍️ Writing' },
  { key: 'worksheet', label: '📋 Worksheet' },
  { key: 'syllabus', label: '📚 Silabus' },
  { key: 'academic', label: '🎓 Konten Akademik' },
  { key: 'presentation', label: '🖥️ Presentasi' },
  { key: 'unitplan', label: '📖 RPP' },
];

// ─── Endpoint map ────────────────────────────────────────────────────────────
const FETCH_URL = {
  feedback: '/writing-feedback',
  worksheet: '/worksheet/worksheets',
  mc: '/assessment',
  rubric: '/rubrics',
  syllabus: '/syllabus',
  academic: '/academic-content',
  presentation: '/presentation',
  unitplan: '/unit-plan',
};

const DELETE_URL = (type, id) => {
  switch (type) {
    case 'worksheet': return `/worksheet/worksheets/${id}`;
    case 'mc': return `/assessment/delete/${id}`;
    case 'rubric': return `/rubrics/${id}`;
    case 'syllabus': return `/syllabus/${id}`;
    case 'academic': return `/academic-content/${id}`;
    case 'feedback': return `/writing-feedback/delete/${id}`;
    case 'presentation': return `/presentation/${id}`;
    case 'unitplan': return `/unit-plan/${id}`;
    default: return null;
  }
};

const DETAIL_SCREEN = {
  worksheet: 'WorksheetDetail',
  mc: 'MCDetail',
  rubric: 'RubricDetail',
  syllabus: 'SyllabusDetail',
  academic: 'AcademicContentDetail',
  feedback: 'FeedbackDetail',
  presentation: 'PresentationDetail',
  unitplan: 'UnitPlanDetail',
};

// ─── Badge styles per type ───────────────────────────────────────────────────
const BADGE = {
  mc: { bg: '#fee2e2', color: C.danger },
  rubric: { bg: '#fef9c3', color: C.gold },
  worksheet: { bg: '#fef3c7', color: C.warning },
  syllabus: { bg: '#f0fdf4', color: C.success },
  academic: { bg: '#eff6ff', color: '#1d4ed8' },
  feedback: { bg: C.primaryLight, color: C.primary },
  presentation: { bg: '#fffbeb', color: C.warning },
  unitplan: { bg: '#ecfdf5', color: '#15803d' },
};

const BADGE_LABEL = {
  mc: 'Soal PG',
  rubric: 'Rubrik',
  worksheet: 'Worksheet',
  syllabus: 'Silabus',
  academic: 'Konten Akademik',
  feedback: 'Writing',
  presentation: 'Presentasi',
  unitplan: 'RPP',
};

const JENIS_LABEL = {
  materi_pembelajaran: 'Materi Pembelajaran',
  ringkasan: 'Ringkasan',
  contoh_soal: 'Contoh Soal',
  kamus_istilah: 'Kamus Istilah',
  artikel: 'Artikel',
  penjelasan: 'Penjelasan',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTitle(doc, type) {
  switch (type) {
    case 'mc': return doc.judul || doc.mata_pelajaran || 'Soal PG';
    case 'rubric': return doc.judul || doc.nama_rubrik || 'Rubrik';
    case 'worksheet': return doc.judul || doc.topik || 'Worksheet';
    case 'syllabus': return doc.nama_silabus || doc.mata_pelajaran || 'Silabus';
    case 'academic': return doc.topik || doc.judul || doc.title || 'Konten';
    case 'feedback': return doc.judul || doc.nama_siswa || 'Writing Feedback';
    case 'presentation': return doc.topik || 'Slide Presentasi';
    case 'unitplan': return doc.judul_unit || 'RPP';
    default: return 'Dokumen';
  }
}

function getMeta(doc, type) {
  switch (type) {
    case 'mc':
      return [
        doc.kelas && `Kelas ${doc.kelas}`,
        doc.jumlah_soal && `${doc.jumlah_soal} soal`,
        doc.tingkat_kesulitan && `${doc.tingkat_kesulitan}`,
      ].filter(Boolean);

    case 'rubric':
      return [
        doc.skala_nilai && `Skala ${doc.skala_nilai}`,
        doc.aspek_penilaian && `${Array.isArray(doc.aspek_penilaian) ? doc.aspek_penilaian.length : doc.aspek_penilaian} aspek`,
      ].filter(Boolean);

    case 'worksheet':
      return [
        doc.mata_pelajaran,
        doc.topik,
      ].filter(Boolean);

    case 'syllabus':
      return [
        (doc.jenjang || doc.kelas) && `${doc.jenjang ?? ''} ${doc.kelas ?? ''}`.trim(),
        doc.semester && `Semester ${doc.semester}`,
        doc.kurikulum,
      ].filter(Boolean);

    case 'academic':
      return [
        doc.jenis_konten && (JENIS_LABEL[doc.jenis_konten] || doc.jenis_konten),
      ].filter(Boolean);

    case 'feedback':
      return [
        doc.kelas && `Kelas ${doc.kelas}`,
        doc.jenis_tulisan,
        doc.skor != null && `Skor: ${doc.skor}`,
      ].filter(Boolean);

    case 'presentation':
      return [
        doc.jumlah_slide && `${doc.jumlah_slide} slide`,
        doc.audiens && `${doc.audiens}`,
      ].filter(Boolean);

    case 'unitplan':
      return [
        doc.mata_pelajaran,
        doc.tingkat_kelas,
      ].filter(Boolean);

    default:
      return [];
  }
}

function matchesSearch(doc, type, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const title = getTitle(doc, type).toLowerCase();
  if (title.includes(q)) return true;
  const meta = getMeta(doc, type).join(' ').toLowerCase();
  return meta.includes(q);
}

// ─── DocCard ─────────────────────────────────────────────────────────────────
function DocCard({ doc, type, onPress, onDelete }) {
  const badge = BADGE[type] ?? BADGE.feedback;
  const title = getTitle(doc, type);
  const meta = getMeta(doc, type);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>
            {BADGE_LABEL[type] ?? type}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={C.muted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>

      {meta.length > 0 && (
        <View style={styles.metaRow}>
          {meta.map((m, i) => (
            <View key={i} style={styles.metaChip}>
              <Text style={styles.metaText}>{m}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MyDocsScreen({ navigation }) {
  const { token } = useAuth();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // ── Fetch all document types ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const requests = Object.entries(FETCH_URL).map(([type, path]) =>
        fetch(`${API_URL}${path}`, { headers })
          .then(r => r.json())
          .then(data => {
            const list =
              data.data ??
              data.assessments ??
              data.worksheets ??
              data.rubrics ??
              data.syllabi ??
              data.feedbacks ??
              (Array.isArray(data) ? data : []);
            return list.map(d => ({ ...d, __type: type }));
          })
          .then(list => {
            if (list.length > 0) {
              const sample = list[0];
              console.log(`[MyDocs] ${type} date fields:`, {
                created_at: sample.created_at,
                completed_at: sample.completed_at,
                createdAt: sample.createdAt,
                id: sample.id,
              });
            }
            return list;
          })
          .catch(() => [])
      );

      const results = await Promise.all(requests);
      const combined = results.flat();

      console.log('=== UNITPLAN RESULT ===');
      const unitplanDocs = combined.filter(d => d.__type === 'unitplan');
      console.log('Total unitplan:', unitplanDocs.length);
      console.log(
        unitplanDocs.map(d => ({
          id: d.id,
          judul_unit: d.judul_unit,
          created_at: d.created_at,
          request_id: d.request_id,
        }))
      );

      combined.sort((a, b) => {
        const getDate = (d) => {
          const raw = d.created_at || d.completed_at || d.createdAt || d.tanggal || null;
          if (raw) return new Date(raw).getTime();
          return 0;
        };
        return getDate(b) - getDate(a);
      });

      setDocs(combined);
    } catch (err) {
      console.error('fetchAll error:', err);
    }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchAll();
    setLoading(false);
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (doc) => {
    const type = doc.__type;
    Alert.alert(
      'Hapus Dokumen',
      `Yakin ingin menghapus dokumen ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const path = DELETE_URL(type, doc.id);
            if (!path) return;
            try {
              const res = await fetch(`${API_URL}${path}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (res.ok || data.success) {
                setDocs(prev => prev.filter(d => !(d.id === doc.id && d.__type === type)));
              } else {
                Alert.alert('Gagal', data.message ?? 'Tidak dapat menghapus dokumen.');
              }
            } catch {
              Alert.alert('Error', 'Koneksi gagal. Coba lagi.');
            }
          },
        },
      ]
    );
  };

  // ── Navigate ──────────────────────────────────────────────────────────────
  const handlePress = (doc) => {
    const screen = DETAIL_SCREEN[doc.__type];
    if (screen) navigation.navigate(screen, { id: doc.id, data: doc });
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const visible = docs.filter(doc => {
    const tabOk = activeTab === 'all' || doc.__type === activeTab;
    const searchOk = matchesSearch(doc, doc.__type, search);
    return tabOk && searchOk;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari dokumen..."
          placeholderTextColor={C.mutedLight}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={C.mutedLight} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            visible.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
        >
          {visible.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={56} color={C.border} />
              <Text style={styles.emptyTitle}>Belum ada dokumen</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'Tidak ada dokumen yang cocok dengan pencarian.'
                  : 'Mulai buat dokumen pertamamu.'}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('Dashboard')}
                >
                  <Ionicons name="add" size={18} color={C.primaryFg} />
                  <Text style={styles.createBtnText}>Buat Dokumen</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            visible.map((doc, idx) => (
              <DocCard
                key={`${doc.__type}-${doc.id ?? idx}`}
                doc={doc}
                type={doc.__type}
                onPress={() => handlePress(doc)}
                onDelete={() => handleDelete(doc)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: S.r12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 44,
    ...S.shadow,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.ink },
  tabScroll: { flexGrow: 0, marginTop: 8 },
  tabContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: S.r999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },
  tabLabelActive: { color: C.primaryFg },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: C.card,
    borderRadius: S.r12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...S.shadow,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: S.r999 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  deleteBtn: { padding: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.ink, marginBottom: 8, lineHeight: 21 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { backgroundColor: C.separator, borderRadius: S.r999, paddingHorizontal: 8, paddingVertical: 3 },
  metaText: { fontSize: 12, color: C.muted, textTransform: 'capitalize' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.ink },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: S.r999 },
  createBtnText: { color: C.primaryFg, fontSize: 14, fontWeight: '600' },
});