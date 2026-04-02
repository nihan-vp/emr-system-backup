import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';

/**
 * Login UI used inside ClinicDashboardPage when not using root App.js auth.
 */
export default function EmbeddedLoginScreen({ onLogin, theme, layout, showToast, styles }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    }, [fadeAnim, pulseAnim]);

    const handleLoginPress = () => {
        if (!email || !password) {
            Alert.alert('Missing Info', 'Please enter both Email and Password.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onLogin();
            showToast('Welcome Back', 'Logged in successfully', 'success');
        }, 1500);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1, justifyContent: 'center', padding: layout.gutter }}>
                        <View style={[styles.glowTop, { backgroundColor: theme.primary, opacity: 0.1 }]} />
                        <View style={[styles.glowBottom, { backgroundColor: '#10b981', opacity: 0.1 }]} />

                        <View style={{ width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center' }}>
                            <Animated.View style={{ alignItems: 'center', marginBottom: 50, opacity: fadeAnim }}>
                                <Animated.View style={{ width: 100, height: 100, borderRadius: 30, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: [{ scale: pulseAnim }], borderWidth: 1, borderColor: theme.border }}>
                                    <Activity size={50} color={theme.primary} />
                                </Animated.View>
                                <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>Suhaim Soft</Text>
                                <Text style={{ fontSize: 16, color: theme.textDim, marginTop: 5, textAlign: 'center' }}>Doctor&apos;s Portal v2.0</Text>
                            </Animated.View>

                            <Animated.View style={{ gap: 20, width: '100%', opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Email Address</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                                        <Mail size={20} color={theme.textDim} />
                                        <TextInput style={[styles.textInput, { color: theme.text }]} placeholder="doctor@hospital.com" placeholderTextColor={theme.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                    </View>
                                </View>

                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Password</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                                        <Lock size={20} color={theme.textDim} />
                                        <TextInput style={[styles.textInput, { color: theme.text }]} placeholder="Enter your password" placeholderTextColor={theme.textDim} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={20} color={theme.textDim} /> : <Eye size={20} color={theme.textDim} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleLoginPress} style={{ marginTop: 20 }} activeOpacity={0.8}>
                                    <LinearGradient colors={theme.mode === 'dark' ? [theme.primary, theme.primaryDark] : ['#3b82f6', '#2563eb']} style={styles.loginBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Login Securely</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                            <View style={{ marginTop: 50, alignItems: 'center' }}>
                                <Text style={{ color: theme.textDim, fontSize: 12, textAlign: 'center' }}>Protected by Suhaim Soft Security</Text>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}
