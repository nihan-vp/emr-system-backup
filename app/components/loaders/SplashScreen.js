import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { Stethoscope } from 'lucide-react-native';

export default function SplashScreen({ theme, onFinish }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false, // Ensure stability across platforms
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: false,
      }),
    ]).start();

    // Call onFinish when done if provided
    if (onFinish) {
      const timer = setTimeout(onFinish, 2000);
      return () => clearTimeout(timer);
    }
  }, [opacity, scale, onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: theme?.mode === 'dark' ? '#0f172a' : '#f8fafc' }]}>
      <Animated.View style={[styles.logoBox, { opacity, transform: [{ scale }], backgroundColor: theme?.primary || '#3b82f6' }]}>
        <Stethoscope size={48} color="#fff" />
      </Animated.View>
      <Animated.Text style={[styles.brandText, { opacity, color: theme?.text || '#0f172a' }]}>
        Suhaim<Text style={{ color: theme?.primary || '#3b82f6' }}>Soft</Text>
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
  },
});
