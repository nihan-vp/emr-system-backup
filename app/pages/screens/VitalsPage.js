import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

const VitalsPage = ({ navigation }) => {
  const [vitals, setVitals] = useState({
    sys: '',
    dia: '',
    pulse: '',
    spo2: '',
    weight: '',
    temp: '',
  });
  const [vitalsHistory, setVitalsHistory] = useState([]);

  const handleChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Add new vitals to history
    setVitalsHistory((prev) => [{ ...vitals, date: new Date().toISOString() }, ...prev]);
    alert('Vitals saved!');
    setVitals({ sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Vitals Entry</Text>
      <View style={styles.row}>
        <Text style={styles.label}>BP (mmHg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Systolic"
          value={vitals.sys}
          onChangeText={(v) => handleChange('sys', v)}
        />
        <Text style={styles.slash}>/</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Diastolic"
          value={vitals.dia}
          onChangeText={(v) => handleChange('dia', v)}
        />
        {vitals.sys && vitals.dia ? (
          <Text style={{ marginLeft: 10, fontWeight: 'bold', color: '#333' }}>
            BP: {vitals.sys}/{vitals.dia}
          </Text>
        ) : null}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Pulse:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Pulse"
          value={vitals.pulse}
          onChangeText={(v) => handleChange('pulse', v)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>SpO2:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="SpO2"
          value={vitals.spo2}
          onChangeText={(v) => handleChange('spo2', v)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Weight (kg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Weight"
          value={vitals.weight}
          onChangeText={(v) => handleChange('weight', v)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Temperature (°C):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Temperature"
          value={vitals.temp}
          onChangeText={(v) => handleChange('temp', v)}
        />
      </View>
      <Button title="Save Vitals" onPress={handleSave} />
      {/* Vitals history preview */}
      {vitalsHistory.length > 0 && (
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Previous Vitals:</Text>
          {vitalsHistory.map((item, idx) => (
            <View key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff', borderRadius: 6 }}>
              <Text>Date: {new Date(item.date).toLocaleString()}</Text>
              <Text>BP: {item.sys}/{item.dia}</Text>
              <Text>Pulse: {item.pulse}</Text>
              <Text>SpO2: {item.spo2}</Text>
              <Text>Weight: {item.weight}</Text>
              <Text>Temp: {item.temp}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  label: {
    width: 110,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    width: 70,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  slash: {
    fontSize: 18,
    marginHorizontal: 2,
  },
});

export default VitalsPage;
