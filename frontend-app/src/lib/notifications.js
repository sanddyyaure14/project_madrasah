/**
 * notifications.js
 * In-app notification system — no database, no native modules required
 * Stored in-memory during app session (resets on app restart)
 *
 * Notification types:
 *   success  — hijau
 *   info     — biru/primary
 *   warning  — kuning
 *   error    — merah
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const MAX_NOTIFICATIONS = 50;

const NotificationContext = createContext(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    // Notifikasi selamat datang default
    {
      id: 'welcome-1',
      title: 'Selamat datang di MadrasahAI 👋',
      message: 'Mulai generate soal, LKS, silabus, dan konten akademik dengan AI.',
      type: 'info',
      icon: 'sparkles',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * Tambah notifikasi baru
   */
  const addNotification = useCallback(({ title, message, type = 'info', icon }) => {
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      message,
      type,
      icon: icon || typeIcon(type),
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  /** Tandai satu notifikasi sebagai sudah dibaca */
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  /** Tandai semua sebagai sudah dibaca */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  /** Hapus satu notifikasi */
  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /** Hapus semua notifikasi */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

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
