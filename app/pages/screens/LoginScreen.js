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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Eye, EyeOff, Lock, Stethoscope,
  User, ArrowRight, ShieldCheck, FlaskConical,
  Pill, Activity, ChevronDown, Check
} from 'lucide-react-native';
import SplashScreen from '../../components/loaders/SplashScreen';
import { ROLE_ROUTES, ROLE_OPTIONS, validateRoleLogin } from '../../auth/roleAuth';

const { width } = Dimensions.get('window');

const ROLES_META = {
  [ROLE_ROUTES.DOCTOR]:   { icon: Stethoscope,  accent: '#6366f1', bg: '#eef2ff', hint: 'doctor / 1234' },
  [ROLE_ROUTES.NURSE]:    { icon: Activity,     accent: '#10b981', bg: '#ecfdf5', hint: 'nurse / 1234' },
  [ROLE_ROUTES.LAB]:      { icon: FlaskConical, accent: '#8b5cf6', bg: '#f5f3ff', hint: 'lab / 1234' },
  [ROLE_ROUTES.PHARMACY]: { icon: Pill,         accent: '#f59e0b', bg: '#fffbeb', hint: 'pharmacy / 1234' },
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(ROLE_ROUTES.DOCTOR);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const result = validateRoleLogin(username, password, selectedRole);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigation.replace(result.routeName);
  };

  if (showSplash) {
    return <SplashScreen theme={{ mode: 'light', primary: '#6366f1', text: '#1e293b', textDim: '#94a3b8' }} onFinish={() => setShowSplash(false)} />;
  }

  const currentRoleMeta = ROLES_META[selectedRole];
  const CurrentIcon = currentRoleMeta.icon;
  const currentRoleObj = ROLE_OPTIONS.find(opt => opt.value === selectedRole);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Abstract Background Elements */}
      <View style={[styles.aura, { backgroundColor: '#818cf8', top: -150, left: -100, opacity: 0.15 }]} />
      <View style={[styles.aura, { backgroundColor: '#c084fc', bottom: -100, right: -100, opacity: 0.1 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); setIsDropdownOpen(false); }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.logoIcon}>
                <Stethoscope size={38} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandText}>Suhaim<Text style={{color: '#6366f1'}}>Soft</Text></Text>
              <Text style={styles.subTitle}>Healthcare Intelligence Portal</Text>
            </View>

            {/* Main Card */}
            <View style={styles.mainCard}>
              
              {/* Role Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCESS ROLE</Text>
                <TouchableOpacity 
                  activeOpacity={1} 
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={[styles.dropdownHeader, isDropdownOpen && styles.dropdownHeaderActive]}
                >
                  <View style={styles.roleInfo}>
                    <View style={[styles.roleIconWrapper, { backgroundColor: currentRoleMeta.bg }]}>
                       <CurrentIcon size={20} color={currentRoleMeta.accent} />
                    </View>
                    <Text style={styles.selectedRoleText}>{currentRoleObj?.label}</Text>
                  </View>
                  <View style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={20} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {ROLE_OPTIONS.map((item) => {
                      const meta = ROLES_META[item.value];
                      const ItemIcon = meta.icon;
                      const isSelected = selectedRole === item.value;
                      
                      return (
                        <TouchableOpacity 
                          key={item.value} 
                          style={[styles.dropdownItem, isSelected && { backgroundColor: '#f8fafc' }]}
                          onPress={() => {
                            setSelectedRole(item.value);
                            setIsDropdownOpen(false);
                            setUsername('');
                            setPassword('');
                            setError('');
                          }}
                        >
                          <View style={styles.roleInfo}>
                            <ItemIcon size={18} color={isSelected ? meta.accent : '#94a3b8'} />
                            <Text style={[styles.itemText, isSelected && { color: meta.accent, fontWeight: '700' }]}>
                              {item.label}
                            </Text>
                          </View>
                          {isSelected && <Check size={16} color={meta.accent} strokeWidth={3} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Form Section */}
              {!isDropdownOpen && (
                <View style={styles.formSection}>
                  
                  {/* Username */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>USERNAME</Text>
                    <View style={[styles.inputField, focusedInput === 'user' && { borderColor: '#6366f1', backgroundColor: '#fff' }]}>
                      <User size={18} color={focusedInput === 'user' ? '#6366f1' : '#94a3b8'} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={selectedRole.toLowerCase()}
                        placeholderTextColor="#cbd5e1"
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={[styles.inputField, focusedInput === 'pass' && { borderColor: '#6366f1', backgroundColor: '#fff' }]}>
                      <Lock size={18} color={focusedInput === 'pass' ? '#6366f1' : '#94a3b8'} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor="#cbd5e1"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setError(''); }}
                        onFocus={() => setFocusedInput('pass')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#6366f1" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Demo Hint */}
                  <View style={styles.hintRow}>
                    <ShieldCheck size={13} color="#64748b" />
                    <Text style={styles.hintText}>Demo: {currentRoleMeta.hint}</Text>
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
                    activeOpacity={0.8} 
                    style={[styles.loginBtnWrapper, loading && { opacity: 0.7 }]}
                  >
                    <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtn}>
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Text style={styles.btnText}>Login Securely</Text>
                          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.footerNote}>ENTERPRISE-GRADE SECURITY VERIFIED</Text>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  aura: { position: 'absolute', width: width * 1.5, height: width * 1.5, borderRadius: width },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 60, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 75, height: 75, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 15 },
  brandText: { fontSize: 34, fontWeight: '900', color: '#0f172a' },
  subTitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 4 },
  
  mainCard: { 
    backgroundColor: '#fff', 
    borderRadius: 32, 
    padding: 24, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  
  /* Dropdown Styles */
  dropdownHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', height: 64, borderRadius: 18, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  dropdownHeaderActive: { borderColor: '#6366f1', backgroundColor: '#fff' },
  roleInfo: { flexDirection: 'row', alignItems: 'center' },
  roleIconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedRoleText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 18, marginTop: 8, padding: 8,
    borderWidth: 1.5, borderColor: '#f1f5f9',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12,
  },
  itemText: { fontSize: 15, fontWeight: '600', color: '#64748b', marginLeft: 12 },

  /* Form Styles */
  formSection: { marginTop: 5 },
  inputField: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#f8fafc', borderRadius: 18, paddingHorizontal: 16, height: 60, 
    borderWidth: 1.5, borderColor: '#f1f5f9' 
  },
  textInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginLeft: 4 },
  hintText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  
  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  
  loginBtnWrapper: { marginTop: 10, borderRadius: 20, overflow: 'hidden' },
  loginBtn: { height: 64, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginRight: 10 },
  
  footerNote: { textAlign: 'center', color: '#cbd5e1', fontSize: 11, fontWeight: '700', marginTop: 30, letterSpacing: 1 }
});