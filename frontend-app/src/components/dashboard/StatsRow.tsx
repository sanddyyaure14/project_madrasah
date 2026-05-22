import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type StatCardProps = {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
};

function StatCard({ label, value, icon, iconBg, iconColor }: StatCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconText, { color: iconColor }]}>{icon}</Text>
      </View>
      <View>
        <Text style={[styles.label, { color: theme.textLight }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function StatsRow() {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <StatCard
        label="GENERATE BULAN INI"
        value="12 / 20"
        icon="✦"
        iconBg={theme.greenLight}
        iconColor={theme.greenAccent}
      />
      <StatCard
        label="DOKUMEN TERSIMPAN"
        value="47"
        icon="🗒"
        iconBg={theme.goldBg}
        iconColor={theme.gold}
      />
      <StatCard
        label="WAKTU DIHEMAT"
        value="≈ 9 jam"
        icon="⏱"
        iconBg="#e6f5f3"
        iconColor="#2a9d8f"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  iconBox: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  label: { fontSize: 9, letterSpacing: 1.2, fontWeight: '500', marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
});
