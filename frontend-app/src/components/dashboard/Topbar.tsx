import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function Topbar() {
  const theme = useTheme();
  return (
    <View style={[styles.topbar, { backgroundColor: theme.white, borderBottomColor: theme.border }]}>
      <View style={styles.greeting}>
        <Text style={[styles.arabic, { color: theme.gold }]}>السلام عليكم</Text>
        <Text style={[styles.greetText, { color: theme.textSecondary }]}>
          {'— Selamat datang, Ust. Ahmad.'}
        </Text>
      </View>
      <View style={styles.right}>
        <Pressable style={[styles.upgradeBtn, { borderColor: theme.border }]}>
          <Text style={[styles.upgradeBtnText, { color: theme.text }]}>Upgrade ke Pro</Text>
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: theme.greenDark }]}>
          <Text style={styles.avatarText}>UA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 54,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  arabic: { fontSize: 14, fontStyle: 'italic' },
  greetText: { fontSize: 13 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upgradeBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderRadius: 7,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '500' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
