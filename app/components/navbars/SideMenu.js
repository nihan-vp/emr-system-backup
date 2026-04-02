import React, { useEffect, useRef } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, HelpCircle, LogOut, User, X } from 'lucide-react-native';

export default function SideMenu({ visible, onClose, insets, theme, layout, onNavigate, onLogout, features, styles }) {
    const animValue = useRef(new Animated.Value(0)).current;
    const avatarSize = layout.isTablet ? 40 : 36;
    const primaryIconSize = layout.isTablet ? 36 : 34;

    useEffect(() => {
        Animated.spring(animValue, {
            toValue: visible ? 1 : 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 120,
            mass: 0.8,
            overshootClamping: false
        }).start();
    }, [animValue, visible]);

    const handleLogoutPress = () => {
        Alert.alert('Logout', 'Are you sure you want to end your session?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    onClose();
                    onLogout();
                }
            }
        ]);
    };

    const translateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-layout.menuWidth, 0]
    });

    const rotateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['-90deg', '0deg']
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1]
    });

    const backdropOpacity = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5]
    });

    if (!visible && animValue.__getValue() === 0) return null;

    return (
        <View style={[styles.menuOverlay, { zIndex: 999, pointerEvents: visible ? 'auto' : 'none' }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.menuSidebar,
                    {
                        paddingTop: insets.top,
                        width: layout.menuWidth,
                        backgroundColor: theme.cardBg,
                        borderRightColor: theme.border,
                        transform: [{ perspective: 1000 }, { translateX }, { rotateY }],
                        opacity,
                        shadowColor: '#000',
                        shadowOffset: { width: 10, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 20
                    }
                ]}
            >
                <LinearGradient
                    colors={theme.mode === 'dark' ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />

                <View style={styles.menuHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, alignItems: 'center', justifyContent: 'center' }}>
                            <User color="white" size={20} />
                        </LinearGradient>
                        <View>
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>Dr. Mansoor Ali.VP</Text>
                            <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '600' }}>Cardiologist</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg, borderRadius: 18, padding: 4 }]}>
                        <X size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                    <Text style={[styles.menuSectionTitle, { color: theme.textDim, paddingLeft: 10 }]}>Management</Text>
                    {features.map((item, index) => {
                        const Icon = item.icon;
                        const itemTranslateX = animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50 * (index + 1), 0]
                        });

                        return (
                            <Animated.View key={item.id || index} style={{ transform: [{ translateX: itemTranslateX }] }}>
                                <TouchableOpacity
                                    style={[
                                        styles.menuFeatureItem,
                                        {
                                            borderBottomColor: 'transparent',
                                            backgroundColor: 'transparent',
                                            marginVertical: 2,
                                            borderRadius: 12,
                                            paddingHorizontal: 8,
                                            paddingVertical: 10,
                                        }
                                    ]}
                                    onPress={() => {
                                        onClose();
                                        onNavigate(item.action);
                                    }}
                                >
                                    <LinearGradient colors={item.color} style={{ width: primaryIconSize, height: primaryIconSize, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <Icon size={17} color="white" />
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.menuItemText, { color: theme.text, fontWeight: '700', fontSize: 14 }]}>{item.title}</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 11 }}>{item.subtitle}</Text>
                                    </View>
                                    <ChevronRight size={15} color={theme.textDim} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}

                    <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

                    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent', paddingHorizontal: 10, marginBottom: 10 }]} onPress={() => { onClose(); onNavigate('support'); }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <View style={[styles.menuFeatureIconBox, { backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }]}>
                                <HelpCircle size={18} color={theme.primary} />
                            </View>
                            <Text style={[styles.menuItemText, { color: theme.text, fontWeight: '600' }]}>Support & Help</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent', paddingHorizontal: 10 }]} onPress={handleLogoutPress}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <View style={[styles.menuFeatureIconBox, { backgroundColor: '#fee2e2', borderRadius: 12 }]}>
                                <LogOut size={18} color="#ef4444" />
                            </View>
                            <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Logout</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.menuVersion, { color: theme.textDim }]}>Suhaim Soft v2.1.0</Text>
                </ScrollView>
            </Animated.View>
        </View>
    );
}