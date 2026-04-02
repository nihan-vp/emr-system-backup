import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, HeartPulse } from 'lucide-react-native';

/**
 * Nurse dashboard placeholder — wire real features here later.
 */
export default function NurseDashboard({ navigation }) {
  const handleLogout = () => {
    // Return to login and clear stack so user cannot go "back" into the app
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <HeartPulse size={28} color="#0d9488" />
        <Text style={styles.title}>Nurse Station</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.subtitle}>Patient care & ward workflows</Text>
        <Text style={styles.hint}>This is a placeholder dashboard. Add nurse-specific screens as needed.</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdfa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1',
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0f766e' },
  body: { flex: 1, padding: 24 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#134e4a', marginBottom: 8 },
  hint: { fontSize: 15, color: '#64748b', lineHeight: 22 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0d9488',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
