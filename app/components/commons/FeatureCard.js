import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

export default function FeatureCard({ item, index, theme, onAction, fullWidth = false, styles, layout }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const IconComponent = item.icon;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 50, useNativeDriver: true }).start();
    }, [fadeAnim, index]);

    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    const cardWidth = fullWidth ? '100%' : layout?.featureCardWidth || '48%';

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                { width: cardWidth },
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
                    ]
                }
            ]}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => onAction(item.action)}
                style={[
                    styles.cardInner,
                    {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.border,
                        height: fullWidth ? 90 : 130,
                        flexDirection: fullWidth ? 'row' : 'column',
                        alignItems: fullWidth ? 'center' : 'flex-start',
                        gap: fullWidth ? 15 : 0
                    }
                ]}
            >
                <LinearGradient colors={item.color} style={styles.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <IconComponent color="#FFF" size={24} strokeWidth={2.5} />
                </LinearGradient>
                <View style={fullWidth ? { flex: 1 } : styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textDim }]} numberOfLines={2}>{item.subtitle}</Text>
                </View>
                {fullWidth && <ChevronRight color={theme.textDim} size={20} />}
            </TouchableOpacity>
        </Animated.View>
    );
}