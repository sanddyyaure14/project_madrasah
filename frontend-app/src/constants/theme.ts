import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1c1c1a',
    background: '#f5f3ee',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e8f0ea',
    textSecondary: '#6b6b60',
    // MadrasahAI brand
    greenDark: '#1a3d2b',
    greenMid: '#2d5e3f',
    greenAccent: '#3a7d52',
    greenLight: '#e8f5ed',
    gold: '#c8981a',
    goldLight: '#f5d98b',
    goldBg: '#fff8e6',
    cream: '#f5f3ee',
    border: 'rgba(0,0,0,0.08)',
    white: '#ffffff',
    textLight: '#9b9b8e',
  },
  dark: {
    text: '#f0ede6',
    background: '#111210',
    backgroundElement: '#1e1f1b',
    backgroundSelected: '#2a2b26',
    textSecondary: '#9b9b8e',
    greenDark: '#1a3d2b',
    greenMid: '#2d5e3f',
    greenAccent: '#5aad74',
    greenLight: '#1a3022',
    gold: '#d4a827',
    goldLight: '#f5d98b',
    goldBg: '#2a2210',
    cream: '#111210',
    border: 'rgba(255,255,255,0.08)',
    white: '#1e1f1b',
    textLight: '#6b6b60',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
