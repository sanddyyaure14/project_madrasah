/**
 * TeachersScreen.js
 * Daftar guru – terhubung ke backend (CRUD penuh)
 * Kepsek bisa: lihat daftar, edit profil guru, reset password, ubah plan, hapus
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

// ─── helpers ────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

const PLAN_CONFIG = {
  free:    { label: 'Free',    color: C.muted,    bg: '#f3f4f6', limit: 100 },
  basic:   { label: 'Basic',   color: '#d97706',  bg: '#fef3c7', limit: 150 },
  premium: { label: 'Premium', color: C.primary,  bg: C.primaryLight, limit: 200 },
};

const MAPEL_OPTIONS = [
  'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis",
  'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu',
  'Bahasa Indonesia', 'PKn', 'IPS', 'Bahasa Inggris',
];
const JENJANG_OPTIONS = ['MTs', 'MA'];
const KURIKULUM_OPTIONS = [
  { label: 'Merdeka Belajar', value: 'Merdeka' },
  { label: 'Kurikulum 2013', value: 'K13' },
];

// ─── sub-components ─────────────────────────────────────────────────────────
function PlanBadge({ plan }) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  return (
    <View style={[styles.planBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.planBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function ChipGroup({ options, selected, onSelect, multi = false }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => {
        const val   = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const active = multi
          ? (Array.isArray(selected) ? selected.includes(val) : false)
          : selected === val;
        return (
          <TouchableOpacity
            key={val}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(val)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Field({ label, children, hint }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function PassTip({ ok, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? '#16a34a' : C.mutedLight} />
      <Text style={{ fontSize: 12, color: ok ? '#16a34a' : C.mutedLight }}>{text}</Text>
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────
export default function TeachersScreen() {
  const { token } = useAuth();

  // data
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // search & filter
  const [q, setQ]               = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // modal state
  const [editModal,  setEditModal]  = useState(false);
  const [planModal,  setPlanModal]  = useState(false);
  const [passModal,  setPassModal]  = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  const [selected, setSelected]   = useState(null); // guru yang sedang diedit
  const [saving,   setSaving]     = useState(false);

  // form edit
  const [fNama,      setFNama]      = useState('');
  const [fEmail,     setFEmail]     = useState('');
  const [fNip,       setFNip]       = useState('');
  const [fMapel,     setFMapel]     = useState([]);
  const [fJenjang,   setFJenjang]   = useState('');
  const [fKurikulum, setFKurikulum] = useState('');
  const [fNoHp,      setFNoHp]      = useState('');

  // form password
  const [fPassword,     setFPassword]     = useState('');
  const [fPasswordConf, setFPasswordConf] = useState('');
  const [showFPass,     setShowFPass]     = useState(false);
  const [showFPassConf, setShowFPassConf] = useState(false);

  // form plan
  const [fPlan,      setFPlan]      = useState('free');

  // ── fetch ─────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => { fetchTeachers(); }, [token])
  );

  async function fetchTeachers() {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/guru`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setTeachers(json.data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchTeachers();
  }

  // ── open modals ───────────────────────────────────────────────────────────
  function openEdit(guru) {
    setSelected(guru);
    setFNama(guru.nama_lengkap ?? '');
    setFEmail(guru.email ?? '');
    setFNip(guru.nip ?? '');
    const m = guru.mata_pelajaran;
    setFMapel(Array.isArray(m) ? m : (m ? [m] : []));
    setFJenjang(guru.jenjang ?? '');
    setFKurikulum(guru.kurikulum ?? '');
    setFNoHp(guru.no_hp ?? '');
    setEditModal(true);
  }

  function openPlan(guru) {
    setSelected(guru);
    setFPlan(guru.plan_type ?? 'free');
    setPlanModal(true);
  }

  function openPass(guru) {
    setSelected(guru);
    setFPassword('');
    setFPasswordConf('');
    setShowFPass(false);
    setShowFPassConf(false);
    setPassModal(true);
  }

  function openDetail(guru) {
    setSelected(guru);
    setDetailModal(true);
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function handleSaveEdit() {
    if (!fNama.trim()) { Alert.alert('Validasi', 'Nama lengkap tidak boleh kosong.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/guru/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nama_lengkap: fNama.trim(),
          email:        fEmail.trim() || null,
          nip:          fNip.trim()   || null,
          mata_pelajaran: fMapel.length > 0 ? fMapel : null,
          jenjang:      fJenjang      || null,
          kurikulum:    fKurikulum    || null,
          no_hp:        fNoHp.trim()  || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTeachers(prev => prev.map(t => t.id === selected.id ? { ...t, ...json.data } : t));
        setEditModal(false);
        Alert.alert('Berhasil ✅', 'Data guru berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', json.message);
      }
    } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
    finally { setSaving(false); }
  }

  async function handleSavePlan() {
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/kepsek/guru/${selected.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_type: fPlan }),
      });
      const json = await res.json();
      if (json.success) {
        setTeachers(prev => prev.map(t =>
          t.id === selected.id
            ? { ...t, plan_type: fPlan, monthly_limit: PLAN_CONFIG[fPlan].limit }
            : t
        ));
        setPlanModal(false);
        Alert.alert('Berhasil ✅', json.message);
      } else {
        Alert.alert('Gagal', json.message);
      }
    } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
    finally { setSaving(false); }
  }

  async function handleSavePass() {
    if (!fPassword || fPassword.length < 6) {
      Alert.alert('Validasi', 'Password minimal 6 karakter.');
      return;
    }
    if (fPassword !== fPasswordConf) {
      Alert.alert('Validasi', 'Konfirmasi password tidak cocok.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Yakin reset password ${selected.nama_lengkap}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const res  = await fetch(`${API_URL}/kepsek/guru/${selected.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password_baru: fPassword }),
              });
              const json = await res.json();
              if (json.success) {
                setPassModal(false);
                Alert.alert('Berhasil ✅', json.message);
              } else {
                Alert.alert('Gagal', json.message);
              }
            } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
            finally { setSaving(false); }
          },
        },
      ]
    );
  }

  function handleDelete(guru) {
    Alert.alert(
      'Hapus Guru',
      `Yakin hapus ${guru.nama_lengkap}? Semua data guru ini akan dihapus permanen.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res  = await fetch(`${API_URL}/kepsek/guru/${guru.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();
              if (json.success) {
                setTeachers(prev => prev.filter(t => t.id !== guru.id));
                Alert.alert('Berhasil ✅', json.message);
              } else {
                Alert.alert('Gagal', json.message);
              }
            } catch { Alert.alert('Error', 'Tidak dapat terhubung ke server.'); }
          },
        },
      ]
    );
  }

  // ── filter & search ───────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    teachers.filter(t => {
      const q2 = q.toLowerCase();
      const matchSearch = !q2 || [t.nama_lengkap, t.email, t.nip,
        Array.isArray(t.mata_pelajaran) ? t.mata_pelajaran.join(' ') : t.mata_pelajaran
      ].some(s => s && s.toLowerCase().includes(q2));
      const matchPlan = planFilter === 'all' || (t.plan_type ?? 'free') === planFilter;
      return matchSearch && matchPlan;
    }),
    [teachers, q, planFilter]
  );

  const stats = useMemo(() => ({
    total:   teachers.length,
    free:    teachers.filter(t => (t.plan_type ?? 'free') === 'free').length,
    basic:   teachers.filter(t => t.plan_type === 'basic').length,
    premium: teachers.filter(t => t.plan_type === 'premium').length,
  }), [teachers]);

  // ── render item ───────────────────────────────────────────────────────────
  function renderGuru({ item: t }) {
    const mapelStr = Array.isArray(t.mata_pelajaran)
      ? t.mata_pelajaran.join(', ')
      : (t.mata_pelajaran ?? '-');

    return (
      <TouchableOpacity
        style={[styles.teacherCard, S.shadow]}
        onPress={() => openDetail(t)}
        activeOpacity={0.85}
      >
        {/* Avatar + info */}
        <View style={styles.teacherAvatar}>
          <Text style={styles.teacherAvatarText}>{getInitials(t.nama_lengkap)}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.teacherName} numberOfLines={1}>{t.nama_lengkap}</Text>
          <Text style={styles.teacherSub} numberOfLines={1}>{t.email}</Text>
          <Text style={styles.teacherSub} numberOfLines={1}>{mapelStr} · {t.jenjang ?? '-'}</Text>
          <View style={styles.teacherMeta}>
            <PlanBadge plan={t.plan_type ?? 'free'} />
            <Text style={styles.teacherGen}>
              {t.total_generate_bulan_ini ?? 0}/{t.monthly_limit ?? 10} generate
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.teacherActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(t)}>
            <Ionicons name="pencil" size={15} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openPlan(t)}>
            <Ionicons name="layers" size={15} color={C.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { borderColor: '#fca5a5' }]} onPress={() => handleDelete(t)}>
            <Ionicons name="trash" size={15} color={C.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Stats bar */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total',   value: stats.total,   color: C.ink },
          { label: 'Free',    value: stats.free,    color: C.muted },
          { label: 'Basic',   value: stats.basic,   color: '#d97706' },
          { label: 'Premium', value: stats.premium, color: C.primary },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statBoxValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statBoxLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, NIP, mapel..."
            placeholderTextColor={C.mutedLight}
            value={q}
            onChangeText={setQ}
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={16} color={C.mutedLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter plan */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {['all', 'free', 'basic', 'premium'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, planFilter === f && styles.filterPillActive]}
            onPress={() => setPlanFilter(f)}
          >
            <Text style={[styles.filterPillText, planFilter === f && { color: '#fff' }]}>
              {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Memuat data guru...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={renderGuru}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={C.mutedLight} />
              <Text style={styles.emptyText}>
                {q ? 'Tidak ada guru yang cocok.' : 'Belum ada guru di madrasah ini.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── MODAL: Detail Guru ─────────────────────────────────────────── */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Guru</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>
          {selected && (
            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Avatar */}
              <View style={styles.detailAvatarWrap}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{getInitials(selected.nama_lengkap)}</Text>
                </View>
                <PlanBadge plan={selected.plan_type ?? 'free'} />
              </View>

              <Text style={styles.detailName}>{selected.nama_lengkap}</Text>
              <Text style={styles.detailEmail}>{selected.email}</Text>

              {/* Info rows */}
              {[
                { icon: 'card-outline', label: 'NIP', value: selected.nip },
                { icon: 'book-outline', label: 'Mata Pelajaran', value: Array.isArray(selected.mata_pelajaran) ? selected.mata_pelajaran.join(', ') : selected.mata_pelajaran },
                { icon: 'layers-outline', label: 'Jenjang', value: selected.jenjang },
                { icon: 'document-text-outline', label: 'Kurikulum', value: selected.kurikulum },
                { icon: 'call-outline', label: 'No. HP', value: selected.no_hp },
                { icon: 'sparkles-outline', label: 'Generate Bulan Ini', value: `${selected.total_generate_bulan_ini ?? 0} / ${selected.monthly_limit ?? 10}` },
              ].map((row, i) => row.value ? (
                <View key={i} style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={row.icon} size={14} color={C.primary} />
                  </View>
                  <View>
                    <Text style={styles.detailRowLabel}>{row.label}</Text>
                    <Text style={styles.detailRowValue}>{row.value}</Text>
                  </View>
                </View>
              ) : null)}

              {/* Aksi */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  onPress={() => { setDetailModal(false); openEdit(selected); }}
                >
                  <Ionicons name="pencil" size={16} color={C.primary} />
                  <Text style={[styles.detailActionText, { color: C.primary }]}>Edit Profil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  onPress={() => { setDetailModal(false); openPlan(selected); }}
                >
                  <Ionicons name="layers" size={16} color={C.gold} />
                  <Text style={[styles.detailActionText, { color: C.gold }]}>Ubah Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  onPress={() => { setDetailModal(false); openPass(selected); }}
                >
                  <Ionicons name="lock-closed" size={16} color={C.muted} />
                  <Text style={[styles.detailActionText, { color: C.muted }]}>Reset Password</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── MODAL: Edit Profil Guru ────────────────────────────────────── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Guru</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">

            <Field label="Nama Lengkap *">
              <TextInput
                style={styles.input}
                value={fNama}
                onChangeText={setFNama}
                placeholder="Nama lengkap..."
                placeholderTextColor={C.mutedLight}
              />
            </Field>

            <Field label="Email">
              <TextInput
                style={styles.input}
                value={fEmail}
                onChangeText={setFEmail}
                placeholder="email@madrasah.id"
                placeholderTextColor={C.mutedLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>

            <Field label="NIP" hint="Nomor Induk Pegawai (opsional)">
              <TextInput
                style={styles.input}
                value={fNip}
                onChangeText={setFNip}
                placeholder="cth. 198506012010011001"
                placeholderTextColor={C.mutedLight}
                keyboardType="numeric"
              />
            </Field>

            <Field label="No. HP / WhatsApp">
              <TextInput
                style={styles.input}
                value={fNoHp}
                onChangeText={setFNoHp}
                placeholder="cth. 08123456789"
                placeholderTextColor={C.mutedLight}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Mata Pelajaran" hint="Bisa pilih lebih dari satu">
              <ChipGroup
                options={MAPEL_OPTIONS}
                selected={fMapel}
                onSelect={val => setFMapel(prev =>
                  prev.includes(val) ? prev.filter(m => m !== val) : [...prev, val]
                )}
                multi
              />
              {fMapel.length > 0 && (
                <Text style={styles.selectedHint}>Terpilih: {fMapel.join(', ')}</Text>
              )}
            </Field>

            <Field label="Jenjang">
              <ChipGroup options={JENJANG_OPTIONS} selected={fJenjang} onSelect={setFJenjang} />
            </Field>

            <Field label="Kurikulum">
              <ChipGroup options={KURIKULUM_OPTIONS} selected={fKurikulum} onSelect={setFKurikulum} />
            </Field>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveEdit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="checkmark-circle" size={18} color="#fff" />
                   <Text style={styles.saveBtnText}>Simpan Perubahan</Text></>
              }
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>

      {/* ── MODAL: Ubah Plan ──────────────────────────────────────────── */}
      <Modal visible={planModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ubah Plan Guru</Text>
            <TouchableOpacity onPress={() => setPlanModal(false)}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {selected && (
              <View style={styles.planTargetInfo}>
                <Text style={styles.planTargetName}>{selected.nama_lengkap}</Text>
                <Text style={styles.planTargetEmail}>{selected.email}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Pilih Plan</Text>
            <View style={styles.planOptions}>
              {[
                { key: 'free',    label: 'Free',    desc: '100 generate/bulan', icon: 'leaf-outline' },
                { key: 'basic',   label: 'Basic',   desc: '150 generate/bulan', icon: 'star-outline' },
                { key: 'premium', label: 'Premium', desc: '200 generate/bulan', icon: 'diamond-outline' },
              ].map(p => {
                const cfg = PLAN_CONFIG[p.key];
                const active = fPlan === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.planOption, active && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                    onPress={() => setFPlan(p.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={p.icon} size={24} color={active ? cfg.color : C.muted} />
                    <Text style={[styles.planOptionLabel, active && { color: cfg.color }]}>{p.label}</Text>
                    <Text style={styles.planOptionDesc}>{p.desc}</Text>
                    {active && (
                      <View style={[styles.planCheck, { backgroundColor: cfg.color }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSavePlan}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="layers" size={18} color="#fff" />
                   <Text style={styles.saveBtnText}>Terapkan Plan</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── MODAL: Reset Password ────────────────────────────────────── */}
      <Modal visible={passModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reset Password Guru</Text>
            <TouchableOpacity onPress={() => setPassModal(false)}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {selected && (
              <View style={styles.planTargetInfo}>
                <Text style={styles.planTargetName}>{selected.nama_lengkap}</Text>
                <Text style={styles.planTargetEmail}>{selected.email}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="warning" size={16} color={C.warning} />
              <Text style={styles.infoText}>
                Password baru akan langsung aktif. Beritahu guru tersebut setelah reset.
              </Text>
            </View>

            {/* Password Baru */}
            <Field label="Password Baru">
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={fPassword}
                  onChangeText={setFPassword}
                  placeholder="Min. 6 karakter..."
                  placeholderTextColor={C.mutedLight}
                  secureTextEntry={!showFPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowFPass(v => !v)}>
                  <Ionicons name={showFPass ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>

              {/* Indikator kekuatan */}
              {fPassword.length > 0 && (() => {
                let k;
                if (fPassword.length < 6)      k = { label: 'Terlalu pendek', color: C.danger,   width: '20%' };
                else if (fPassword.length < 8)  k = { label: 'Lemah',         color: '#f59e0b',  width: '50%' };
                else if (/[A-Z]/.test(fPassword) && /[0-9]/.test(fPassword))
                                                 k = { label: 'Kuat',          color: '#16a34a',  width: '100%' };
                else                             k = { label: 'Cukup',         color: '#d97706',  width: '75%' };
                return (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, { width: k.width, backgroundColor: k.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: k.color }]}>{k.label}</Text>
                  </View>
                );
              })()}

              {/* Tips checklist */}
              {fPassword.length > 0 && (
                <View style={styles.tipsList}>
                  <PassTip ok={fPassword.length >= 6}            text="Minimal 6 karakter" />
                  <PassTip ok={fPassword.length >= 8}            text="Lebih baik 8+ karakter" />
                  <PassTip ok={/[A-Z]/.test(fPassword)}          text="Mengandung huruf besar" />
                  <PassTip ok={/[0-9]/.test(fPassword)}          text="Mengandung angka" />
                </View>
              )}
            </Field>

            {/* Konfirmasi Password */}
            <Field label="Konfirmasi Password Baru">
              <View style={[
                styles.pwWrap,
                fPasswordConf.length > 0 && fPassword !== fPasswordConf ? styles.pwWrapError : null,
                fPasswordConf.length > 0 && fPassword === fPasswordConf ? styles.pwWrapSuccess : null,
              ]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={fPasswordConf}
                  onChangeText={setFPasswordConf}
                  placeholder="Ulangi password baru..."
                  placeholderTextColor={C.mutedLight}
                  secureTextEntry={!showFPassConf}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowFPassConf(v => !v)}>
                  {fPasswordConf.length > 0
                    ? <Ionicons
                        name={fPassword === fPasswordConf ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={fPassword === fPasswordConf ? '#16a34a' : C.danger}
                      />
                    : <Ionicons name={showFPassConf ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                  }
                </TouchableOpacity>
              </View>
            </Field>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.danger }, saving && { opacity: 0.7 }]}
              onPress={handleSavePass}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="lock-closed" size={18} color="#fff" />
                   <Text style={styles.saveBtnText}>Reset Password</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText: { fontSize: 14, color: C.muted },

  // Stats bar
  statsRow: {
    flexDirection: 'row', backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBoxValue: { fontSize: 20, fontWeight: '700' },
  statBoxLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: 'uppercase' },

  // Toolbar
  toolbar: { paddingHorizontal: 16, paddingVertical: 10 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink },

  // Filter
  filterScroll: { maxHeight: 44 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  filterPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterPillText: { fontSize: 13, color: C.muted, fontWeight: '600' },

  // Teacher card
  teacherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
  },
  teacherAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  teacherAvatarText: { fontSize: 13, fontWeight: '700', color: C.primary },
  teacherName: { fontSize: 14, fontWeight: '700', color: C.ink },
  teacherSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  teacherMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  teacherGen: { fontSize: 11, color: C.muted },
  teacherActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  planBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  planBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  modalBody: { padding: 20, gap: 16 },

  // Detail modal
  detailAvatarWrap: { alignItems: 'center', gap: 10 },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  detailAvatarText: { fontSize: 24, fontWeight: '700', color: C.primary },
  detailName: { fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center', marginTop: 4 },
  detailEmail: { fontSize: 13, color: C.muted, textAlign: 'center' },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.separator,
  },
  detailIconWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  detailRowLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRowValue: { fontSize: 14, color: C.ink, fontWeight: '500', marginTop: 2 },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  detailActionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  detailActionText: { fontSize: 11, fontWeight: '600' },

  // Form
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  fieldHint: { fontSize: 11, color: C.mutedLight, marginTop: -4 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
    backgroundColor: C.card,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  selectedHint: { fontSize: 11, color: C.primary, fontStyle: 'italic' },

  // Plan selector
  planTargetInfo: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 4,
  },
  planTargetName: { fontSize: 15, fontWeight: '700', color: C.ink },
  planTargetEmail: { fontSize: 12, color: C.muted, marginTop: 2 },
  planOptions: { flexDirection: 'row', gap: 10 },
  planOption: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16,
    borderRadius: 14, borderWidth: 2, borderColor: C.border,
    backgroundColor: C.card, position: 'relative',
  },
  planOptionLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  planOptionDesc: { fontSize: 10, color: C.muted, textAlign: 'center' },
  planCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // Info box
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#fef9ec', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#fde68a',
  },
  infoText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Password field
  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.card,
  },
  pwWrapError:   { borderColor: C.danger },
  pwWrapSuccess: { borderColor: '#16a34a' },
  eyeBtn: { padding: 12 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  strengthBar: { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 3 },
  strengthFill: { height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 80 },
  tipsList: { gap: 4, marginTop: 4 },
});
