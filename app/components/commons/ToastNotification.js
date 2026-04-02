import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, BellRing, CheckCircle2, X } from 'lucide-react-native';

export default function ToastNotification({ visible, title, message, type = 'success', onHide, styles }) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -150, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => {
            if (onHide) onHide();
        });
    }, [onHide, opacity, translateY]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: insets.top + 10, useNativeDriver: true, damping: 15, stiffness: 120 }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible, insets.top, opacity, translateY, hideToast]);

    if (!visible) return null;

    const configMap = {
        success: { colors: ['#059669', '#34d399'], icon: CheckCircle2, shadow: '#059669' },
        error: { colors: ['#dc2626', '#f87171'], icon: AlertCircle, shadow: '#dc2626' },
        warning: { colors: ['#d97706', '#fbbf24'], icon: AlertCircle, shadow: '#d97706' },
        info: { colors: ['#2563eb', '#60a5fa'], icon: BellRing, shadow: '#2563eb' }
    };
    const config = configMap[type] || configMap.success;
    const Icon = config.icon;

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], opacity, shadowColor: config.shadow }]}>
            <LinearGradient colors={config.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.toastGradient}>
                <View style={styles.toastIconBox}>
                    <Icon color="white" size={24} strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.toastTitle}>{title}</Text>
                    <Text style={styles.toastMessage}>{message}</Text>
                </View>
                <TouchableOpacity onPress={hideToast} style={{ padding: 5 }}>
                    <X color="rgba(255,255,255,0.8)" size={18} />
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
}