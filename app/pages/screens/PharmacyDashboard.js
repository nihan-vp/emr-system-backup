import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Pill } from 'lucide-react-native';

/**
 * Pharmacy dashboard placeholder — inventory, dispensing, etc.
 */
export default function PharmacyDashboard({ navigation }) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pill size={28} color="#c2410c" />
        <Text style={styles.title}>Pharmacy</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.subtitle}>Stock & dispensing</Text>
        <Text style={styles.hint}>Placeholder for pharmacy modules. Hook inventory and prescriptions here.</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff7ed' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#9a3412' },
  body: { flex: 1, padding: 24 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#7c2d12', marginBottom: 8 },
  hint: { fontSize: 15, color: '#64748b', lineHeight: 22 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ea580c',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
