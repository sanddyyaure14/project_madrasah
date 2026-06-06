/**
 * PresentationFormScreen.js
 * Formulir input untuk membuat presentasi baru menggunakan AI.
 * Konsisten dengan desain premium dari MadrasahAI.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../lib/theme';
import { generatePresentation } from '../lib/api';
import { useAuth } from '../lib/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AUDIENS_OPTIONS = ['Siswa MI', 'Siswa MTs', 'Siswa MA', 'Guru', 'Orang Tua', 'Umum'];

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------
function ChipGroup({ options, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function InputField({ label, children, required, optional }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={{ color: C.danger }}> *</Text>}
        {optional && <Text style={{ color: C.muted, fontWeight: '400' }}> (opsional)</Text>}
      </Text>
      {children}
    </View>
  );
}

function SlideStepper({ value, onChange }) {
  const min = 4;
  const max = 20;

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <View style={styles.stepperContainer}>
      <TouchableOpacity
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        onPress={handleDecrement}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={value <= min ? C.mutedLight : '#fff'} />
      </TouchableOpacity>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValueText}>{value}</Text>
        <Text style={styles.stepperValueUnit}>slide</Text>
      </View>
      <TouchableOpacity
        style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
        onPress={handleIncrement}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={value >= max ? C.mutedLight : '#fff'} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function PresentationFormScreen({ navigation }) {
  const { user } = useAuth();

  // State
  const [topik, setTopik] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [audiens, setAudiens] = useState('Siswa MTs');
  const [jumlahSlide, setJumlahSlide] = useState(8);
  const [includeCatatan, setIncludeCatatan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = topik.trim().length > 0;

  async function handleGenerate() {
    if (!isValid) {
      setError('Topik presentasi wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        topik: topik.trim(),
        jumlah_slide: jumlahSlide,
        tujuan: tujuan.trim() || 'Edukasi / Penjelasan Materi',
        audiens: audiens,
        include_catatan: includeCatatan,
        userId: user?.id,
      };

      const result = await generatePresentation(payload);

      setLoading(false);
      navigation.navigate('PresentationPreview', {
        presentationId: result.data.id,
        presentationData: result.data,
        inputData: { topik, jumlahSlide, tujuan, audiens, includeCatatan },
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Terjadi kesalahan. Pastikan server backend berjalan.');
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="easel" size={28} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>KONTEN</Text>
          <Text style={styles.heroTitle}>Presentation Generator</Text>
          <Text style={styles.heroDesc}>
            Buat outline dan materi presentasi siap ekspor ke file PPT secara otomatis
          </Text>
        </View>
      </View>

      {/* Form Card */}
      <View style={[styles.card, S.shadow]}>
        {/* Topik — WAJIB */}
        <InputField label="Topik Presentasi" required>
          <TextInput
            style={[styles.inputSingle, error && !topik.trim() ? styles.inputError : null]}
            value={topik}
            onChangeText={(t) => {
              setTopik(t);
              if (error) setError('');
            }}
            placeholder="cth. Zakat Fitrah dan Zakat Mal"
            placeholderTextColor={C.mutedLight}
          />
        </InputField>

        {/* Tujuan — OPSIONAL */}
        <InputField label="Tujuan Presentasi" optional>
          <TextInput
            style={[styles.inputMultiline]}
            value={tujuan}
            onChangeText={setTujuan}
            placeholder="cth. Siswa memahami syarat dan rukun zakat"
            placeholderTextColor={C.mutedLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </InputField>

        {/* Target Audiens */}
        <InputField label="Target Audiens">
          <ChipGroup
            options={AUDIENS_OPTIONS}
            selected={audiens}
            onSelect={setAudiens}
          />
        </InputField>

        {/* Jumlah Slide */}
        <InputField label="Jumlah Slide">
          <SlideStepper value={jumlahSlide} onChange={setJumlahSlide} />
        </InputField>

        {/* Catatan Presenter Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchLabel}>Catatan Presenter</Text>
            <Text style={styles.switchDesc}>Sertakan teks panduan presentasi untuk setiap slide</Text>
          </View>
          <Switch
            value={includeCatatan}
            onValueChange={setIncludeCatatan}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor={includeCatatan ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Error Box */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Presentasi</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>
            ✨ AI sedang menyusun presentasi slide... harap tunggu
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 16 },

  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.ink },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.ink },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  inputSingle: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    backgroundColor: C.bg,
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    backgroundColor: C.bg,
    height: 80,
  },
  inputError: { borderColor: C.danger },

  // Stepper styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 4,
    width: 180,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: C.separator,
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  stepperValueUnit: {
    fontSize: 12,
    color: C.muted,
  },

  // Switch styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  switchLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  switchDesc: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 15 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: -8 },
});
