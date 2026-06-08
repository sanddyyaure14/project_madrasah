/**
 * notifications.js
 * In-app notification system — no database, no native modules required
 * Stored in-memory during app session (resets on app restart)
 *
 * Notifikasi di-scope per userId agar akun yang berbeda tidak tercampur.
 *
 * Notification types:
 *   success  — hijau
 *   info     — biru/primary
 *   warning  — kuning
 *   error    — merah
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './auth';

const MAX_NOTIFICATIONS = 50;

const NotificationContext = createContext(null);

// Notif default per user baru (hanya ditampilkan sekali)
function makeWelcomeNotif() {
  return {
    id: 'welcome-' + Math.random().toString(36).slice(2),
    title: 'Selamat datang di MadrasahAI 👋',
    message: 'Mulai generate soal, LKS, silabus, dan konten akademik dengan AI.',
    type: 'info',
    icon: 'sparkles',
    read: false,
    createdAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Map: userId → notif[]
  // Setiap user punya list-nya sendiri, disimpan selama session aktif
  const [store, setStore] = useState({});

  // Ambil notif milik user aktif
  const notifications = store[userId] ?? [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Saat userId berubah (login/logout/ganti akun), pastikan user baru
  // mendapat notif selamat datang jika belum pernah ada notif
  useEffect(() => {
    if (!userId) return;
    setStore(prev => {
      if (prev[userId]) return prev; // sudah ada data → tidak overwrite
      return { ...prev, [userId]: [makeWelcomeNotif()] };
    });
  }, [userId]);

  // Helper setter untuk user aktif saja
  const setNotifs = useCallback((updater) => {
    setStore(prev => ({
      ...prev,
      [userId]: typeof updater === 'function'
        ? updater(prev[userId] ?? [])
        : updater,
    }));
  }, [userId]);

  /** Tambah notifikasi baru — hanya masuk ke akun yang sedang login */
  const addNotification = useCallback(({ title, message, type = 'info', icon }) => {
    if (!userId) return;
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      message,
      type,
      icon: icon || typeIcon(type),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifs(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, [userId, setNotifs]);

  /** Tandai satu notifikasi sebagai sudah dibaca */
  const markAsRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifs]);

  /** Tandai semua sebagai sudah dibaca */
  const markAllAsRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifs]);

  /** Hapus satu notifikasi */
  const deleteNotification = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, [setNotifs]);

  /** Hapus semua notifikasi milik user aktif */
  const clearAll = useCallback(() => {
    setNotifs([]);
  }, [setNotifs]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

// ─────────────────────────────────────────────
// Hook: Pending Approvals (kepsek)
// Poll jumlah guru pending dari backend setiap 30 detik
// ─────────────────────────────────────────────
export function usePendingApprovals({ token, apiUrl, enabled = true }) {
  const [pendingCount, setPendingCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!token || !enabled) return;
    try {
      const res = await fetch(`${apiUrl}/kepsek/pending-teachers`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPendingCount((data.data ?? []).length);
      }
    } catch {
      // Silently fail — badge bukan fitur kritikal
    }
  }, [token, apiUrl, enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30000); // poll tiap 30 detik
    return () => clearInterval(intervalRef.current);
  }, [fetchCount, enabled]);

  return { pendingCount, refetch: fetchCount };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function typeIcon(type) {
  const map = {
    success: 'checkmark-circle',
    info: 'information-circle',
    warning: 'warning',
    error: 'close-circle',
  };
  return map[type] || 'notifications';
}

export function typeColor(type) {
  const map = {
    success: '#16a34a',
    info: '#1a6b3c',
    warning: '#d97706',
    error: '#dc2626',
  };
  return map[type] || '#1a6b3c';
}

export function typeBg(type) {
  const map = {
    success: '#f0fdf4',
    info: '#e8f5ee',
    warning: '#fffbeb',
    error: '#fef2f2',
  };
  return map[type] || '#e8f5ee';
}

/** Format relative time */
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
