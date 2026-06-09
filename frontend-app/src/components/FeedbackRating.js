/**
 * FeedbackRating.js
 * Komponen rating bintang + komentar untuk hasil generate AI.
 * Dipakai di MCDetailScreen dan RubricDetailScreen.
 *
 * Props:
 *   requestId  — ID generation_request (untuk FK ke user_feedback)
 *   endpoint   — 'mc' | 'rubric'
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

export default function FeedbackRating({ requestId, endpoint }) {
  const { token } = useAuth();

  const [rating,     setRating]     = useState(0);       // 1–5, 0 = belum pilih
  const [komentar,   setKomentar]   = useState('');
  const [isHelpful,  setIsHelpful]  = useState(null);    // true | false | null
  const [submitted,  setSubmitted]  = useState(false);   // sudah pernah submit?
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  // Ambil feedback yang sudah ada (jika pernah submit sebelumnya)
  useEffect(() => {
    if (!requestId) { setLoading(false); return; }
    fetchExisting();
  }, [requestId]);

  async function fetchExisting() {
    try {
      let url = `${API_URL}/feedback/${requestId}`;
      if (endpoint === 'unit-plan' || endpoint === 'presentation') {
        url = `${API_URL}/feedback/${endpoint}/${requestId}`;
      }
      
      const res  = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRating(json.data.rating ?? 0);
        setKomentar(json.data.komentar ?? '');
        setIsHelpful(json.data.is_helpful ?? null);
        setSubmitted(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Pilih bintang', 'Berikan rating bintang terlebih dahulu.');
      return;
    }
    setSaving(true);
    try {
      let url = `${API_URL}/feedback`;
      let reqBody = { rating, komentar: komentar.trim() || null, is_helpful: isHelpful };

      // Backend hanya punya spesifik route untuk unit-plan dan presentation
      if (endpoint === 'unit-plan' || endpoint === 'presentation') {
        url = `${API_URL}/feedback/${endpoint}/${requestId}`;
      } else {
        // Route general mewajibkan request_id di body
        reqBody.request_id = requestId;
      }

      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reqBody),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        Alert.alert('Terima kasih! 🙏', json.message);
      } else {
        Alert.alert('Gagal', json.message);
      }
    } catch {
      Alert.alert('Error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null; // jangan tampilkan apapun saat loading awal

  return (
    <View style={styles.container}>
      {/* Judul */}
      <View style={styles.titleRow}>
        <Ionicons name="star" size={16} color={C.gold} />
        <Text style={styles.title}>Nilai Hasil Generate</Text>
        {submitted && (
          <View style={styles.submittedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={C.primary} />
            <Text style={styles.submittedText}>Sudah dinilai</Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>Bantu kami meningkatkan kualitas AI dengan memberikan penilaian.</Text>

      {/* Bintang */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={36}
              color={star <= rating ? C.gold : C.mutedLight}
            />
          </TouchableOpacity>
        ))}
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
        )}
      </View>

      {/* Apakah berguna? */}
      <View style={styles.helpfulRow}>
        <Text style={styles.helpfulLabel}>Apakah hasil ini berguna?</Text>
        <View style={styles.helpfulBtns}>
          <TouchableOpacity
            style={[styles.helpfulBtn, isHelpful === true && styles.helpfulBtnActive]}
            onPress={() => setIsHelpful(prev => prev === true ? null : true)}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={15} color={isHelpful === true ? '#fff' : C.primary} />
            <Text style={[styles.helpfulBtnText, isHelpful === true && { color: '#fff' }]}>Ya</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.helpfulBtn, isHelpful === false && styles.helpfulBtnDanger]}
            onPress={() => setIsHelpful(prev => prev === false ? null : false)}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-down" size={15} color={isHelpful === false ? '#fff' : C.muted} />
            <Text style={[styles.helpfulBtnText, isHelpful === false && { color: '#fff' }]}>Tidak</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Komentar */}
      <TextInput
        style={styles.commentInput}
        value={komentar}
        onChangeText={setKomentar}
        placeholder="Tambahkan komentar (opsional)..."
        placeholderTextColor={C.mutedLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Tombol kirim */}
      <TouchableOpacity
        style={[styles.submitBtn, (saving || rating === 0) && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={saving || rating === 0}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <>
              <Ionicons name={submitted ? 'refresh' : 'send'} size={16} color="#fff" />
              <Text style={styles.submitBtnText}>{submitted ? 'Perbarui Penilaian' : 'Kirim Penilaian'}</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

const RATING_LABELS = {
  1: 'Sangat Buruk',
  2: 'Kurang Baik',
  3: 'Cukup',
  4: 'Bagus',
  5: 'Sangat Bagus!',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    ...S.shadow,
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: C.ink, flex: 1 },
  subtitle: { fontSize: 12, color: C.muted, marginTop: -4, lineHeight: 17 },

  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  submittedText: { fontSize: 10, fontWeight: '700', color: C.primary },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingLabel: { fontSize: 13, color: C.gold, fontWeight: '700', marginLeft: 4 },

  helpfulRow: { gap: 8 },
  helpfulLabel: { fontSize: 12, fontWeight: '600', color: C.ink },
  helpfulBtns: { flexDirection: 'row', gap: 8 },
  helpfulBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  helpfulBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  helpfulBtnDanger: { backgroundColor: C.danger, borderColor: C.danger },
  helpfulBtnText: { fontSize: 13, fontWeight: '600', color: C.ink },

  commentInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.ink, backgroundColor: C.bg,
    minHeight: 80,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.gold, borderRadius: 12, paddingVertical: 13,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: C.goldFg },
});
