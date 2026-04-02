import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

export default function PlaceholderScreen({ title, icon: Icon, theme, onBack, color, layout, styles }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.glowTop, { backgroundColor: color[0], opacity: 0.15 }]} />
            <View style={[styles.header, { marginTop: insets.top + 10, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.gutter }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
                <View style={{ width: 44 }} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: layout.gutter, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' }}>
                <View style={[styles.comingSoonIconContainer, { shadowColor: color[0] }]}>
                    <LinearGradient colors={color} style={styles.comingSoonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Icon size={60} color="white" />
                    </LinearGradient>
                </View>
                <Text style={[styles.comingSoonTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.comingSoonDesc, { color: theme.textDim }]}>Management for {title} will appear here.</Text>
            </View>
        </View>
    );
}
