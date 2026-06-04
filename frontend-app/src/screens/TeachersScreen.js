import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEACHERS } from '../lib/mockSchool';
import { C, S } from '../lib/theme';

function getInitials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('');
}

function StatusPill({ status }) {
  const map = {
    Aktif: { bg: C.primaryLight, fg: C.primary },
    Pending: { bg: '#fef3c7', fg: '#92400e' },
    Nonaktif: { bg: '#fee2e2', fg: C.danger },
  };
  const s = map[status] ?? map['Aktif'];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{status}</Text>
    </View>
  );
}

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState(TEACHERS);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', email: '', status: 'Aktif' });

  const filtered = useMemo(() =>
    teachers.filter(t => {
      const match = [t.name, t.subject, t.email].some(s => s.toLowerCase().includes(q.toLowerCase()));
      const statusOk = statusFilter === 'all' || t.status === statusFilter;
      return match && statusOk;
    }),
    [teachers, q, statusFilter]
  );

  const stats = useMemo(() => ({
    total: teachers.length,
    aktif: teachers.filter(r => r.status === 'Aktif').length,
    pending: teachers.filter(r => r.status === 'Pending').length,
    nonaktif: teachers.filter(r => r.status === 'Nonaktif').length,
  }), [teachers]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', subject: '', email: '', status: 'Aktif' });
    setModalVisible(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject, email: t.email, status: t.status });
    setModalVisible(true);
  }

  function handleSave() {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Nama dan email wajib diisi.');
      return;
    }
    if (editing) {
      setTeachers(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
    } else {
      const newT = { id: `u-${Date.now()}`, generates: 0, lastActive: 'Baru', ...form };
      setTeachers(prev => [...prev, newT]);
    }
    setModalVisible(false);
  }

  function handleDelete(id) {
    Alert.alert('Hapus Guru', 'Yakin ingin menghapus guru ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => setTeachers(prev => prev.filter(t => t.id !== id)) },
    ]);
  }

  const STATUS_FILTERS = ['all', 'Aktif', 'Pending', 'Nonaktif'];

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Aktif', value: stats.aktif },
          { label: 'Pending', value: stats.pending },
          { label: 'Nonaktif', value: stats.nonaktif },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={styles.statBoxValue}>{s.value}</Text>
            <Text style={styles.statBoxLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search & add */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, mapel, email..."
            placeholderTextColor={C.mutedLight}
            value={q}
            onChangeText={setQ}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterPillText, statusFilter === f && { color: '#fff' }]}>
              {f === 'all' ? 'Semua' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {filtered.map(t => (
          <View key={t.id} style={[styles.teacherCard, S.shadow]}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.teacherAvatarText}>{getInitials(t.name)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.teacherName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.teacherSub} numberOfLines={1}>{t.subject} · {t.email}</Text>
              <View style={styles.teacherMeta}>
                <StatusPill status={t.status} />
                <Text style={styles.teacherGen}>{t.generates} generate · {t.lastActive}</Text>
              </View>
            </View>
            <View style={styles.teacherActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(t)}>
                <Ionicons name="pencil" size={16} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(t.id)}>
                <Ionicons name="trash" size={16} color={C.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Tidak ada guru ditemukan.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Guru' : 'Tambah Guru Baru'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {[
              { key: 'name', label: 'Nama Lengkap', placeholder: 'Ust. Ahmad Fauzi, S.Pd.I.' },
              { key: 'subject', label: 'Mata Pelajaran', placeholder: 'Fiqih' },
              { key: 'email', label: 'Email', placeholder: 'guru@madrasah.id', keyboard: 'email-address' },
            ].map(field => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[field.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.mutedLight}
                  keyboardType={field.keyboard ?? 'default'}
                  autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'sentences'}
                />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusRow}>
                {['Aktif', 'Pending', 'Nonaktif'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusOpt, form.status === s && styles.statusOptActive]}
                    onPress={() => setForm(prev => ({ ...prev, status: s }))}
                  >
                    <Text style={[styles.statusOptText, form.status === s && { color: C.primary, fontWeight: '700' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editing ? 'Simpan Perubahan' : 'Tambah Guru'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  statsRow: {
    flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBoxValue: { fontSize: 22, fontWeight: '700', color: C.ink },
  statBoxLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink },
  addBtn: { backgroundColor: C.primary, borderRadius: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { maxHeight: 44 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  filterPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterPillText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  list: { flex: 1 },
  teacherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
  },
  teacherAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  teacherAvatarText: { fontSize: 13, fontWeight: '700', color: C.primary },
  teacherName: { fontSize: 14, fontWeight: '700', color: C.ink },
  teacherSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  teacherMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  teacherGen: { fontSize: 11, color: C.muted },
  teacherActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.muted, fontSize: 14 },
  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  modalBody: { padding: 20, gap: 16 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  fieldInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.ink, backgroundColor: C.card,
  },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusOpt: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  statusOptActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  statusOptText: { fontSize: 13, color: C.muted },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
