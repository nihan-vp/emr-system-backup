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
  Pill, Activity, HeartPulse,
} from 'lucide-react-native';
import SplashScreen from '../../components/loaders/SplashScreen';
import { ROLE_ROUTES, validateRoleLogin } from '../../auth/roleAuth';

const { width, height } = Dimensions.get('window');

/* ─── Medical color theme ──────────────────────────────────────────────── */
const MED = {
  bg:       '#050d14',       // Deep navy
  surface:  '#0a1628',       // Card surface
  card:     '#0d1e33',       // Input background
  border:   '#1a3a5c',       // Subtle border
  teal:     '#14b8a6',       // Primary teal
  tealDark: '#0d9488',
  cyan:     '#06b6d4',
  green:    '#22c55e',
  blue:     '#3b82f6',
  purple:   '#8b5cf6',
  amber:    '#f59e0b',
  text:     '#e2f4f1',
  textDim:  '#4a7a8a',
  error:    '#f87171',
};

/* ─── Role definitions ─────────────────────────────────────────────────── */
const ROLES = [
  { key: ROLE_ROUTES.DOCTOR,   label: 'Doctor',   icon: Stethoscope,  gradient: [MED.teal, MED.cyan],       accent: MED.teal,   glow: '#14b8a640', hint: 'doctor / 1234' },
  { key: ROLE_ROUTES.NURSE,    label: 'Nurse',    icon: HeartPulse,   gradient: [MED.green, '#16a34a'],     accent: MED.green,  glow: '#22c55e40', hint: 'nurse / 1234' },
  { key: ROLE_ROUTES.LAB,      label: 'Lab',      icon: FlaskConical, gradient: [MED.blue, MED.purple],     accent: MED.blue,   glow: '#3b82f640', hint: 'lab / 1234' },
  { key: ROLE_ROUTES.PHARMACY, label: 'Pharmacy', icon: Pill,         gradient: [MED.amber, '#ef4444'],     accent: MED.amber,  glow: '#f59e0b40', hint: 'pharmacy / 1234' },
];

/* ─── ECG Pulse animation strip ───────────────────────────────────────── */
function PulseBar({ color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  return (
    <View style={{ height: 1.5, backgroundColor: MED.border, overflow: 'hidden', borderRadius: 2, marginVertical: 20 }}>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateX }] }}>
        <LinearGradient colors={['transparent', color, color, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

/* ─── Floating medical orb ────────────────────────────────────────────── */
function MedOrb({ color, size, x, y, duration, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const opacity    = anim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });
  const scale      = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Animated.View style={[styles.orb, {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, left: x, top: y,
      opacity, transform: [{ translateY }, { scale }],
    }]} />
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export default function LoginScreen() {
  const navigation = useNavigation();
  const [roleIdx, setRoleIdx]         = useState(0);
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [focused, setFocused]         = useState(null);
  const [showSplash, setShowSplash]   = useState(true);

  const role    = ROLES[roleIdx];
  const RoleIcon = role.icon;

  /* Splash timer */
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  /* Logo pulse */
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const changeRole = (idx) => {
    setRoleIdx(idx);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in username and password.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const result = validateRoleLogin(username, password, role.key);
    setLoading(false);
    if (!result.ok) { setError(result.message); return; }
    navigation.replace(result.routeName);
  };

  if (showSplash) {
    return (
      <SplashScreen
        theme={{ mode: 'dark', primary: MED.teal, text: MED.text, textDim: MED.textDim }}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={MED.bg} />
      <LinearGradient colors={[MED.bg, '#060f1c', MED.bg]} style={StyleSheet.absoluteFill} />

      {/* ── Medical orbs ── */}
      <MedOrb color={MED.teal}   size={280} x={-80}       y={-80}         duration={4200} delay={0}    />
      <MedOrb color={MED.cyan}   size={180} x={width*0.6} y={-50}         duration={5000} delay={700}  />
      <MedOrb color={MED.green}  size={150} x={-30}       y={height*0.5}  duration={3800} delay={300}  />
      <MedOrb color={MED.blue}   size={120} x={width*0.7} y={height*0.65} duration={4600} delay={1100} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Logo & brand ── */}
            <MotiView
              from={{ opacity: 0, translateY: -32 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 650 }}
              style={styles.header}
            >
              {/* Outer glow ring */}
              <Animated.View style={[styles.logoGlow, { backgroundColor: role.glow, transform: [{ scale: pulse }] }]} />
              <LinearGradient colors={role.gradient} style={styles.logoRing}>
                <View style={styles.logoInner}>
                  <RoleIcon size={28} color="#fff" strokeWidth={2} />
                </View>
              </LinearGradient>

              <View style={styles.brandRow}>
                <Text style={styles.brand}>Suhaim</Text>
                <Text style={[styles.brand, { color: role.accent }]}>Soft</Text>
                <View style={[styles.medBadge, { backgroundColor: role.accent + '25', borderColor: role.accent + '60' }]}>
                  <Text style={[styles.medBadgeText, { color: role.accent }]}>EMR</Text>
                </View>
              </View>
              <Text style={styles.tagline}>Healthcare Intelligence Portal</Text>
            </MotiView>

            {/* ── Role tabs ── */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 180 }}
              style={styles.tabsRow}
            >
              {ROLES.map((r, i) => {
                const Icon = r.icon;
                const active = i === roleIdx;
                return (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => changeRole(i)}
                    activeOpacity={0.75}
                    style={[styles.tab, active && { borderColor: r.accent }]}
                  >
                    {active && (
                      <LinearGradient
                        colors={[r.gradient[0] + '30', r.gradient[1] + '18']}
                        style={StyleSheet.absoluteFill}
                        borderRadius={14}
                      />
                    )}
                    <Icon size={17} color={active ? r.accent : MED.textDim} strokeWidth={2} />
                    <Text style={[styles.tabLabel, active && { color: r.accent }]}>{r.label}</Text>
                    {active && <View style={[styles.tabDot, { backgroundColor: r.accent }]} />}
                  </TouchableOpacity>
                );
              })}
            </MotiView>

            {/* ── Login card ── */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 680, delay: 260 }}
              style={styles.card}
            >
              {/* Accent top border */}
              <LinearGradient
                colors={role.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.cardTopBar}
              />

              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={[styles.cardSub, { color: role.accent }]}>{role.label} Portal</Text>
                </View>
                <View style={[styles.roleChip, { backgroundColor: role.glow, borderColor: role.accent + '50' }]}>
                  <ShieldCheck size={14} color={role.accent} />
                  <Text style={[styles.roleChipText, { color: role.accent }]}>Secure</Text>
                </View>
              </View>

              {/* ECG divider */}
              <PulseBar color={role.accent} />

              {/* Username */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: focused === 'u' ? role.accent : MED.textDim }]}>USERNAME</Text>
                <View style={[styles.inputWrap, focused === 'u' && { borderColor: role.accent, backgroundColor: role.card }]}>
                  <User size={17} color={focused === 'u' ? role.accent : MED.textDim} />
                  <TextInput
                    style={styles.input}
                    placeholder={role.key.toLowerCase()}
                    placeholderTextColor={MED.textDim}
                    value={username}
                    onChangeText={(v) => { setUsername(v); setError(''); }}
                    onFocus={() => setFocused('u')}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: focused === 'p' ? role.accent : MED.textDim }]}>PASSWORD</Text>
                <View style={[styles.inputWrap, focused === 'p' && { borderColor: role.accent, backgroundColor: role.card }]}>
                  <Lock size={17} color={focused === 'p' ? role.accent : MED.textDim} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={MED.textDim}
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    onFocus={() => setFocused('p')}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={12}>
                    {showPwd
                      ? <EyeOff size={17} color={MED.textDim} />
                      : <Eye    size={17} color={role.accent} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {/* Demo hint */}
              <View style={styles.hintRow}>
                <Activity size={12} color={MED.textDim} />
                <Text style={styles.hint}>Demo credentials: {role.hint}</Text>
              </View>

              {/* Error */}
              {!!error && (
                <MotiView
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.errorBox}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </MotiView>
              )}

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.82}
                style={[styles.btnWrap, loading && { opacity: 0.65 }]}
              >
                <LinearGradient
                  colors={role.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.btn}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : (
                      <View style={styles.btnRow}>
                        <Text style={styles.btnText}>Sign In Securely</Text>
                        <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
                      </View>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>

            {/* Footer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 700, duration: 600 }}
              style={styles.footer}
            >
              <View style={[styles.footerDot, { backgroundColor: MED.teal }]} />
              <Text style={styles.footerText}>End-to-end encrypted  ·  EMR v2.0</Text>
              <View style={[styles.footerDot, { backgroundColor: MED.teal }]} />
            </MotiView>

          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: MED.bg },

  orb: { position: 'absolute' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 36,
    justifyContent: 'center',
  },

  /* ── Header ── */
  header: { alignItems: 'center', marginBottom: 28 },
  logoGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    top: -15,
  },
  logoRing: {
    width: 80, height: 80, borderRadius: 26, padding: 3,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoInner: {
    width: '100%', height: '100%', borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center', alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  brand: { fontSize: 30, fontWeight: '900', color: MED.text, letterSpacing: -0.5 },
  medBadge: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  medBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tagline: { fontSize: 13, color: MED.textDim, fontWeight: '600', letterSpacing: 0.3 },

  /* ── Tabs ── */
  tabsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: MED.border, backgroundColor: MED.surface,
    gap: 3, overflow: 'hidden',
  },
  tabLabel: { fontSize: 10, fontWeight: '800', color: MED.textDim, letterSpacing: 0.3 },
  tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  /* ── Card ── */
  card: {
    backgroundColor: MED.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: MED.border,
    overflow: 'hidden',
    paddingBottom: 24,
  },
  cardTopBar: { height: 3, marginBottom: 20 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: MED.text, marginBottom: 2 },
  cardSub: { fontSize: 13, fontWeight: '700' },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  roleChipText: { fontSize: 11, fontWeight: '800' },

  /* ── Fields ── */
  field: { marginBottom: 14, paddingHorizontal: 22 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MED.card, borderRadius: 16, height: 54,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1.5, borderColor: MED.border,
  },
  input: { flex: 1, color: MED.text, fontSize: 15, fontWeight: '600' },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, marginBottom: 6,
  },
  hint: { fontSize: 11, color: MED.textDim, fontWeight: '500' },

  /* ── Error ── */
  errorBox: {
    marginHorizontal: 22, marginVertical: 8,
    backgroundColor: '#ef444418', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#ef444435',
  },
  errorText: { color: MED.error, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  /* ── Button ── */
  btnWrap: { marginHorizontal: 22, marginTop: 18, borderRadius: 18, overflow: 'hidden' },
  btn: { height: 58, justifyContent: 'center', alignItems: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 24,
  },
  footerDot: { width: 5, height: 5, borderRadius: 2.5 },
  footerText: { fontSize: 11, color: MED.border, fontWeight: '700', letterSpacing: 0.4 },
});