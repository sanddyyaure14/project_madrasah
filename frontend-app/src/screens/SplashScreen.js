/**
 * SplashScreen.js
 * Tampil 2.5 detik saat app pertama dibuka, lalu navigasi ke Login.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, StatusBar,
} from 'react-native';
import { C } from '../lib/theme';

export default function SplashScreen({ onDone }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;
  const dotAnim1   = useRef(new Animated.Value(0.3)).current;
  const dotAnim2   = useRef(new Animated.Value(0.3)).current;
  const dotAnim3   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
      }),
    ]).start();

    // Dot bouncing loader
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ])
    );
    dotLoop.start();

    // Selesai setelah 2.5 detik
    const timer = setTimeout(() => {
      dotLoop.stop();
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }).start(() => onDone());
    }, 2500);

    return () => {
      clearTimeout(timer);
      dotLoop.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Nama App */}
      <Text style={styles.appName}>MadrasahAI</Text>
      <Text style={styles.tagline}>Platform Pembelajaran Cerdas</Text>

      {/* Arabic */}
      <Text style={styles.arabic}>بِسْمِ اللّٰهِ</Text>

      {/* Dot loader */}
      <View style={styles.dotsRow}>
        {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2025 MadrasahAI</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 36,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 130,
    height: 130,
  },

  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  arabic: {
    fontSize: 22,
    color: '#c9a227',
    marginTop: 8,
    marginBottom: 4,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },

  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
});
