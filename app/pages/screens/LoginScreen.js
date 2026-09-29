import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  Eye, EyeOff, Lock, Stethoscope,
  User, ArrowRight, ShieldCheck, FlaskConical,
  Pill, Activity,
} from 'lucide-react-native';
import SplashScreen from '../../components/loaders/SplashScreen';
import { ROLE_ROUTES, validateRoleLogin } from '../../auth/roleAuth';

const { width, height } = Dimensions.get('window');

const ROLES = [
  {
    key: ROLE_ROUTES.DOCTOR,
    label: 'Doctor',
    icon: Stethoscope,
    gradient: ['#6366f1', '#8b5cf6'],
    accent: '#6366f1',
    hint: 'doctor / 1234',
  },
  {
    key: ROLE_ROUTES.NURSE,
    label: 'Nurse',
    icon: Activity,
    gradient: ['#0ea5e9', '#06b6d4'],
    accent: '#0ea5e9',
    hint: 'nurse / 1234',
  },
  {
    key: ROLE_ROUTES.LAB,
    label: 'Lab',
    icon: FlaskConical,
    gradient: ['#10b981', '#059669'],
    accent: '#10b981',
    hint: 'lab / 1234',
  },
  {
    key: ROLE_ROUTES.PHARMACY,
    label: 'Pharmacy',
    icon: Pill,
    gradient: ['#f59e0b', '#ef4444'],
    accent: '#f59e0b',
    hint: 'pharmacy / 1234',
  },
];

/* ─── Floating Orb ──────────────────────────────────────────────────────── */
function FloatingOrb({ color, size, startX, startY, duration, delay }) {
  const posY = useRef(new Animated.Value(0)).current;
  const posX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(posY, { toValue: -30, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(posX, { toValue: 15, duration: duration * 0.7, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.15, duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(posY, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(posX, { toValue: 0, duration: duration * 0.7, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.15, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration, useNativeDriver: true }),
        ]),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, [delay, duration, opacity, posX, posY, scale]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: posY }, { translateX: posX }, { scale }],
      }}
    />
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function LoginScreen() {
  const navigation = useNavigation();
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const role = ROLES[selectedRoleIdx];
  const RoleIcon = role.icon;

  // Pulse animation for the icon
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const handleRoleChange = (idx) => {
    setSelectedRoleIdx(idx);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const result = validateRoleLogin(username, password, role.key);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigation.replace(result.routeName);
  };

  if (showSplash) {
    return (
      <SplashScreen
        theme={{ mode: 'dark', primary: '#6366f1', text: '#f1f5f9', textDim: '#64748b' }}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* ── Background ── */}
      <LinearGradient colors={['#0a0e1a', '#0f1629', '#0a0e1a']} style={StyleSheet.absoluteFill} />

      {/* Floating Orbs */}
      <FloatingOrb color={role.accent} size={300} startX={-80}  startY={-80}  duration={4000} delay={0}    />
      <FloatingOrb color="#8b5cf6"   size={200} startX={width * 0.6} startY={-60}  duration={5000} delay={800}  />
      <FloatingOrb color="#06b6d4"   size={160} startX={-40}   startY={height * 0.55} duration={3800} delay={400} />
      <FloatingOrb color={role.accent} size={120} startX={width * 0.7} startY={height * 0.7} duration={4500} delay={1200} />

      {/* Grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Header ── */}
            <MotiView
              from={{ opacity: 0, translateY: -40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 700 }}
              style={styles.header}
            >
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <LinearGradient colors={role.gradient} style={styles.logoRing}>
                  <View style={styles.logoInner}>
                    <RoleIcon size={30} color="#fff" strokeWidth={2} />
                  </View>
                </LinearGradient>
              </Animated.View>

              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 200 }}
              >
                <Text style={styles.brandText}>
                  Suhaim<Text style={{ color: role.accent }}>Soft</Text>
                </Text>
              </MotiView>
              <Text style={styles.brandSub}>Healthcare Intelligence Portal</Text>
            </MotiView>

            {/* ── Role Tabs ── */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.rolesRow}
            >
              {ROLES.map((r, idx) => {
                const Icon = r.icon;
                const active = idx === selectedRoleIdx;
                return (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => handleRoleChange(idx)}
                    activeOpacity={0.8}
                    style={[styles.roleTab, active && { borderColor: r.accent, borderWidth: 1.5 }]}
                  >
                    {active && (
                      <LinearGradient
                        colors={[r.gradient[0] + '33', r.gradient[1] + '22']}
                        style={StyleSheet.absoluteFill}
                        borderRadius={14}
                      />
                    )}
                    <Icon size={18} color={active ? r.accent : '#475569'} strokeWidth={2} />
                    <Text style={[styles.roleTabText, active && { color: r.accent }]}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </MotiView>

            {/* ── Card ── */}
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 700, delay: 300 }}
              style={styles.card}
            >
              {/* Glass border shimmer */}
              <LinearGradient
                colors={[role.accent + '40', 'transparent', '#ffffff10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
                pointerEvents="none"
              />

              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSub}>
                {`Welcome back, ${role.label}`}
              </Text>

              {/* Username */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <View style={[styles.inputRow, focusedInput === 'user' && { borderColor: role.accent, backgroundColor: role.accent + '12' }]}>
                  <User size={18} color={focusedInput === 'user' ? role.accent : '#475569'} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={`${role.key.toLowerCase()}`}
                    placeholderTextColor="#334155"
                    value={username}
                    onChangeText={(t) => { setUsername(t); setError(''); }}
                    onFocus={() => setFocusedInput('user')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={[styles.inputRow, focusedInput === 'pass' && { borderColor: role.accent, backgroundColor: role.accent + '12' }]}>
                  <Lock size={18} color={focusedInput === 'pass' ? role.accent : '#475569'} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#334155"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    onFocus={() => setFocusedInput('pass')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                    {showPassword
                      ? <EyeOff size={18} color="#475569" />
                      : <Eye size={18} color={role.accent} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hint */}
              <View style={styles.hintRow}>
                <ShieldCheck size={13} color="#334155" />
                <Text style={styles.hintText}>Demo: {role.hint}</Text>
              </View>

              {/* Error */}
              {!!error && (
                <MotiView
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring' }}
                  style={styles.errorBox}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </MotiView>
              )}

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.loginBtnWrap, loading && { opacity: 0.7 }]}
              >
                <LinearGradient
                  colors={role.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={styles.btnText}>Secure Login</Text>
                      <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>

            {/* Footer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 800, duration: 600 }}
              style={styles.footer}
            >
              <Text style={styles.footerText}>🔒  Enterprise-grade Security  •  EMR v2.0</Text>
            </MotiView>

          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_PADDING = 24;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },

  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  /* Header */
  header: { alignItems: 'center', marginBottom: 32 },
  logoRing: {
    width: 78, height: 78, borderRadius: 24,
    padding: 3,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  logoInner: {
    width: '100%', height: '100%', borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  brandText: { fontSize: 32, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.5 },
  brandSub: { fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 4, letterSpacing: 0.3 },

  /* Role tabs */
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    gap: 4,
    overflow: 'hidden',
  },
  roleTabText: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.2 },

  /* Card */
  card: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute', inset: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#64748b', marginBottom: 24, fontWeight: '500' },

  /* Fields */
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#475569',
    letterSpacing: 1, marginBottom: 8, marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16, height: 56,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1, borderColor: '#1e293b',
  },
  textInput: {
    flex: 1, color: '#f1f5f9',
    fontSize: 16, fontWeight: '600',
  },

  /* Hint */
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, marginLeft: 2 },
  hintText: { fontSize: 12, color: '#334155', fontWeight: '500' },

  /* Error */
  errorBox: {
    backgroundColor: '#ef444420',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  errorText: { color: '#f87171', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  /* Login button */
  loginBtnWrap: { marginTop: 20, borderRadius: 18, overflow: 'hidden' },
  loginBtn: { height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  /* Footer */
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 12, color: '#1e293b', fontWeight: '700', letterSpacing: 0.5 },
});