import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, FlaskConical } from 'lucide-react-native';

/**
 * Lab dashboard placeholder — samples, results, queues, etc.
 */
export default function LabDashboard({ navigation }) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <FlaskConical size={28} color="#7c3aed" />
        <Text style={styles.title}>Laboratory</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.subtitle}>Tests & results queue</Text>
        <Text style={styles.hint}>Placeholder for lab workflows. Connect lab orders and reports here.</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f3ff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd6fe',
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#5b21b6' },
  body: { flex: 1, padding: 24 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#4c1d95', marginBottom: 8 },
  hint: { fontSize: 15, color: '#64748b', lineHeight: 22 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
