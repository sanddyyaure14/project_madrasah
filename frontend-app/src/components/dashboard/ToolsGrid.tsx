import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Tool = {
  key: string;
  name: string;
  tag: string;
  desc: string;
  icon: string;
  iconVariant: 'green' | 'gold';
};

const TOOLS: Tool[] = [
  {
    key: 'multiple-choice',
    name: 'Multiple Choice',
    tag: 'SOAL PILIHAN GANDA',
    desc: 'Generate soal pilihan ganda otomatis sesuai kompetensi dan jenjang kelas.',
    icon: '☑',
    iconVariant: 'green',
  },
  {
    key: 'rubric',
    name: 'Rubric Generator',
    tag: 'RUBRIK PENILAIAN',
    desc: 'Buat rubrik penilaian yang detail untuk berbagai tugas dan aktivitas siswa.',
    icon: '≡',
    iconVariant: 'gold',
  },
  {
    key: 'writing',
    name: 'Writing Feedback',
    tag: 'UMPAN BALIK KARANGAN',
    desc: 'Berikan umpan balik konstruktif untuk karangan/tulisan siswa secara otomatis.',
    icon: '✍',
    iconVariant: 'green',
  },
  {
    key: 'worksheet',
    name: 'Worksheet Generator',
    tag: 'LEMBAR KERJA SISWA',
    desc: 'Buat lembar kerja siswa (LKS) yang terstruktur dan siap cetak.',
    icon: '📄',
    iconVariant: 'gold',
  },
  {
    key: 'presentation',
    name: 'Presentation Generator',
    tag: 'SLIDE PRESENTASI',
    desc: 'Generate outline dan konten presentasi slide PowerPoint-ready.',
    icon: '🖥',
    iconVariant: 'gold',
  },
  {
    key: 'syllabus',
    name: 'Syllabus Generator',
    tag: 'SILABUS KURIKULUM',
    desc: 'Buat silabus lengkap sesuai kurikulum (Merdeka/K13) dan jenjang madrasah.',
    icon: '📚',
    iconVariant: 'gold',
  },
  {
    key: 'rpp',
    name: 'Unit Plan / RPP',
    tag: 'MODUL AJAR',
    desc: 'Rencana pembelajaran unit (RPP/Modul Ajar) lengkap siap pakai.',
    icon: '📅',
    iconVariant: 'gold',
  },
  {
    key: 'academic',
    name: 'Academic Content',
    tag: 'KONTEN AKADEMIK',
    desc: 'Konten akademik custom — rangkuman, penjelasan materi, contoh soal.',
    icon: '🎓',
    iconVariant: 'gold',
  },
];

type Props = { onToolPress?: (key: string) => void };

export function ToolsGrid({ onToolPress }: Props) {
  const theme = useTheme();

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Teacher Tools</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            8 alat untuk mempercepat persiapan Anda.
          </Text>
        </View>
        <Text style={[styles.sectionTag, { color: theme.greenAccent }]}>
          ↗ Paling sering: Multiple Choice
        </Text>
      </View>

      {/* Grid — 2 columns */}
      <View style={styles.grid}>
        {TOOLS.map(tool => {
          const iconBg = tool.iconVariant === 'green' ? theme.greenLight : theme.goldBg;
          const iconColor = tool.iconVariant === 'green' ? theme.greenAccent : theme.gold;
          return (
            <Pressable
              key={tool.key}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.white, borderColor: theme.border },
                pressed && styles.cardPressed,
              ]}
              onPress={() => onToolPress?.(tool.key)}
            >
              <View style={[styles.toolIcon, { backgroundColor: iconBg }]}>
                <Text style={[styles.toolIconText, { color: iconColor }]}>{tool.icon}</Text>
              </View>
              <Text style={[styles.toolName, { color: theme.text }]}>{tool.name}</Text>
              <Text style={[styles.toolTag, { color: theme.textLight }]}>{tool.tag}</Text>
              <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>{tool.desc}</Text>
              <Text style={[styles.toolLink, { color: theme.greenAccent }]}>Buka →</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  sectionSub: { fontSize: 12, marginTop: 2 },
  sectionTag: { fontSize: 11, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardPressed: { opacity: 0.85 },
  toolIcon: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolIconText: { fontSize: 20 },
  toolName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  toolTag: { fontSize: 9, letterSpacing: 1.5, fontWeight: '500', marginBottom: 8 },
  toolDesc: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  toolLink: { fontSize: 12, fontWeight: '500' },
});
