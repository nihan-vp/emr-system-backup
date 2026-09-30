import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import {
  Eye, EyeOff, Lock, Stethoscope,
  User, ArrowRight, ShieldCheck, FlaskConical,
  Pill, Briefcase, Activity
} from 'lucide-react-native';
import SplashScreen from '../../components/loaders/SplashScreen';
import { ROLE_ROUTES, validateRoleLogin } from '../../auth/roleAuth';

const ROLES = [
  { key: ROLE_ROUTES.DOCTOR,   label: 'Doctor',   icon: Stethoscope,  accent: '#0ea5e9' },
  { key: ROLE_ROUTES.NURSE,    label: 'Nurse',    icon: Activity,     accent: '#10b981' },
  { key: ROLE_ROUTES.LAB,      label: 'Lab',      icon: FlaskConical, accent: '#8b5cf6' },
  { key: ROLE_ROUTES.PHARMACY, label: 'Pharmacy', icon: Pill,         accent: '#f59e0b' },
];

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

  const role = ROLES[roleIdx];
  const RoleIcon = role.icon;

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

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
      setError('Please enter your username and password.');
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
        theme={{ mode: 'light', primary: role.accent, text: '#0f172a', textDim: '#64748b' }}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={[role.accent, role.accent + '99']} style={styles.logoBox}>
                <RoleIcon size={32} color="#fff" strokeWidth={2} />
              </LinearGradient>
              <Text style={styles.brandTitle}>
                Suhaim<Text style={{ color: role.accent }}>Soft</Text>
              </Text>
              <Text style={styles.brandSubtitle}>Healthcare Intelligence Portal</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              
              {/* Role Tabs */}
              <View style={styles.tabsContainer}>
                {ROLES.map((r, i) => {
                  const Icon = r.icon;
                  const active = i === roleIdx;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => changeRole(i)}
                      style={[styles.tab, active && { backgroundColor: r.accent + '15', borderColor: r.accent }]}
                    >
                      <Icon size={16} color={active ? r.accent : '#94a3b8'} />
                      <Text style={[styles.tabText, active && { color: r.accent, fontWeight: '700' }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.loginTitle}>Sign In</Text>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <View style={[styles.inputBox, focused === 'u' && { borderColor: role.accent }]}>
                  <User size={18} color={focused === 'u' ? role.accent : '#94a3b8'} />
                  <TextInput
                    style={styles.input}
                    placeholder={`${role.key.toLowerCase()}`}
                    placeholderTextColor="#94a3b8"
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={[styles.inputBox, focused === 'p' && { borderColor: role.accent }]}>
                  <Lock size={18} color={focused === 'p' ? role.accent : '#94a3b8'} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    onFocus={() => setFocused('p')}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                    {showPwd ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color={role.accent} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Box */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={[styles.btnWrapper, loading && { opacity: 0.7 }]}
              >
                <LinearGradient colors={[role.accent, role.accent + 'ee']} style={styles.btn}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.btnText}>Secure Login</Text>
                      <ArrowRight size={20} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ShieldCheck size={14} color="#94a3b8" />
              <Text style={styles.footerText}>Enterprise Grade Security</Text>
            </View>

          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  brandTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  brandSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    elevation: 3,
  },
  
  tabsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24,
  },
  tab: {
    flex: 1, minWidth: '40%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  loginTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, marginLeft: 2 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 12, height: 52, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  input: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },

  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#fca5a5',
  },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  btnWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  btn: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32 },
  footerText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
});