/**
 * NotificationsScreen.js
 * In-app notification center
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { useNotifications, typeColor, typeBg, timeAgo } from '../lib/notifications';

// ─────────────────────────────────────────────
// Single notification card
// ─────────────────────────────────────────────
function NotifCard({ notif, onPress, onDelete }) {
  const color = typeColor(notif.type);
  const bg = typeBg(notif.type);

  return (
    <TouchableOpacity
      style={[styles.card, !notif.read && styles.cardUnread, S.shadow]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Unread dot */}
      {!notif.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={notif.icon || 'notifications'} size={20} color={color} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, !notif.read && styles.cardTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(notif.createdAt)}</Text>
        </View>
        <Text style={styles.cardMessage} numberOfLines={2}>{notif.message}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={C.mutedLight} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-off-outline" size={40} color={C.mutedLight} />
      </View>
      <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
      <Text style={styles.emptySub}>
        Notifikasi akan muncul saat kamu melakukan aktivitas di MadrasahAI
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function NotificationsScreen() {
  const {
    notifications, unreadCount,
    markAsRead, markAllAsRead,
    deleteNotification, clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }

  function handleClearAll() {
    Alert.alert('Hapus Semua', 'Hapus semua notifikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <View style={styles.root}>
      {/* Header actions */}
      <View style={styles.headerBar}>
        <View style={styles.filterRow}>
          {[['all', 'Semua'], ['unread', `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ''}`]].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterBtnText, filter === key && styles.filterBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionBtns}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={18} color={C.primary} />
              <Text style={styles.actionBtnText}>Baca Semua</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color={C.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} />
        }
      >
        {filtered.length === 0
          ? <EmptyState />
          : filtered.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onPress={() => markAsRead(notif.id)}
              onDelete={() => deleteNotification(notif.id)}
            />
          ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterBtnText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },

  actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  actionBtnText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  list: { padding: 12, gap: 8, paddingBottom: 32 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, position: 'relative',
  },
  cardUnread: { borderColor: C.primaryLight, backgroundColor: '#fafffe' },
  unreadDot: {
    position: 'absolute', top: 14, left: 6,
    width: 7, height: 7, borderRadius: 4,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 14, color: C.ink, flex: 1 },
  cardTitleUnread: { fontWeight: '700' },
  cardTime: { fontSize: 11, color: C.mutedLight, flexShrink: 0, marginTop: 1 },
  cardMessage: { fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 3 },
  deleteBtn: { padding: 2, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
