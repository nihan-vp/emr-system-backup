import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Eye, EyeOff, Lock, Stethoscope, User, 
  ArrowRight, ShieldCheck, Briefcase, 
  UserPlus, ChevronDown, Check
} from 'lucide-react-native';
import { ROLE_OPTIONS, ROLE_ROUTES, validateRoleLogin } from '../../auth/roleAuth';
import SplashScreen from '../../components/loaders/SplashScreen';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLE_ROUTES.DOCTOR);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const getRolePlaceholder = () => {
    switch(selectedRole) {
      case ROLE_ROUTES.DOCTOR: return "Dr. Username";
      case ROLE_ROUTES.ADMIN: return "System Administrator ID";
      case ROLE_ROUTES.NURSE: return "Nurse Username";
      case ROLE_ROUTES.PATIENT: return "Patient Username";
      case ROLE_ROUTES.LAB: return "Lab Username ";
      case ROLE_ROUTES.PHARMACY: return "Pharmacy Username";
      default: return "Enter your username";
    }
  };

  const getRoleIcon = (value, color, size = 20) => {
    const props = { size, color };
    switch(value) {
      case 'DOCTOR': return <Stethoscope {...props} />;
      case 'ADMIN': return <ShieldCheck {...props} />;
      case 'STAFF': return <UserPlus {...props} />;
      default: return <Briefcase {...props} />;
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
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

  const currentRoleObj = ROLE_OPTIONS.find(opt => opt.value === selectedRole);

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsDropdownOpen(false); }}>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        
        {/* Abstract Background */}
        <View style={[styles.aura, { backgroundColor: '#818cf8', top: -150, left: -100, opacity: 0.15 }]} />
        <View style={[styles.aura, { backgroundColor: '#c084fc', bottom: -100, right: -100, opacity: 0.1 }]} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.logoIcon}>
                <Stethoscope size={38} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandText}>Suhaim<Text style={{color: '#6366f1'}}>Soft</Text></Text>
              <Text style={styles.subTitle}>Healthcare Intelligence Portal</Text>
            </View>

            <View style={styles.mainCard}>
              
              {/* CUSTOM ROLE DROPDOWN */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Access Role</Text>
                <TouchableOpacity 
                  activeOpacity={1} 
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={[styles.dropdownHeader, isDropdownOpen && styles.dropdownHeaderActive]}
                >
                  <View style={styles.roleInfo}>
                    <View style={styles.roleIconWrapper}>
                       {getRoleIcon(selectedRole, '#6366f1')}
                    </View>
                    <Text style={styles.selectedRoleText}>{currentRoleObj?.label}</Text>
                  </View>
                  <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {ROLE_OPTIONS.map((item) => (
                      <TouchableOpacity 
                        key={item.value} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedRole(item.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <View style={styles.roleInfo}>
                          {getRoleIcon(item.value, selectedRole === item.value ? '#6366f1' : '#94a3b8', 18)}
                          <Text style={[styles.itemText, selectedRole === item.value && styles.itemTextActive]}>
                            {item.label}
                          </Text>
                        </View>
                        {selectedRole === item.value && <Check size={16} color="#6366f1" strokeWidth={3} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* FORM SECTION */}
              {!isDropdownOpen && (
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={[styles.inputField, focusedInput === 'user' && styles.inputFieldFocused]}>
                      <User size={20} color={focusedInput === 'user' ? '#6366f1' : '#94a3b8'} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={getRolePlaceholder()}
                        placeholderTextColor="#cbd5e1"
                        value={username}
                        onChangeText={setUsername}
                        onFocus={() => setFocusedInput('user')}
                        onBlur={() => setFocusedInput(null)}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={[styles.inputField, focusedInput === 'pass' && styles.inputFieldFocused]}>
                      <Lock size={20} color={focusedInput === 'pass' ? '#6366f1' : '#94a3b8'} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor="#cbd5e1"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput('pass')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#6366f1" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8} style={styles.loginBtnWrapper}>
                    <LinearGradient colors={['#6366f1', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtn}>
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

            <Text style={styles.footerNote}>Enterprise-grade Security Verified</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  aura: { position: 'absolute', width: width * 1.5, height: width * 1.5, borderRadius: width },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 60, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 75, height: 75, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15 },
  brandText: { fontSize: 34, fontWeight: '900', color: '#0f172a' },
  subTitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 4 },
  mainCard: { backgroundColor: '#fff', borderRadius: 32, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  
  // DROPDOWN STYLES
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    height: 64,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  dropdownHeaderActive: { borderColor: '#6366f1', backgroundColor: '#fff' },
  roleInfo: { flexDirection: 'row', alignItems: 'center' },
  roleIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedRoleText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  itemText: { fontSize: 15, fontWeight: '600', color: '#64748b', marginLeft: 12 },
  itemTextActive: { color: '#6366f1', fontWeight: '700' },

  // FORM STYLES
  formSection: { marginTop: 5 },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 18, paddingHorizontal: 16, height: 60, borderWidth: 1.5, borderColor: '#f1f5f9' },
  inputFieldFocused: { borderColor: '#6366f1', backgroundColor: '#fff' },
  textInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center', marginVertical: 10 },
  loginBtnWrapper: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  loginBtn: { height: 64, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginRight: 10 },
  footerNote: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 30, textTransform: 'uppercase', letterSpacing: 1 }
});