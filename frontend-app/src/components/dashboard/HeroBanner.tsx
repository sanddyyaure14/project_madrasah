import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Props = { name?: string };

export function HeroBanner({ name = 'Ust. Ahmad Fauzi' }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: theme.greenDark }]}>
      <Text style={styles.bismillah}>بسم الله</Text>
      <Text style={styles.title}>
        Mari mulai mempersiapkan pelajaran hari ini, {name}.
      </Text>
      <Text style={styles.sub}>
        Pilih salah satu dari 8 alat di bawah, isi parameter, lalu biarkan MadrasahAI menyusunnya untuk Anda.
      </Text>
      {/* Decorative Arabic letter */}
      <Text style={styles.deco} aria-hidden>ا</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bismillah: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 8,
    maxWidth: 400,
  },
  sub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 380,
  },
  deco: {
    position: 'absolute',
    right: -10, top: -10,
    fontSize: 120,
    color: 'rgba(255,255,255,0.05)',
    fontStyle: 'italic',
  },
});
