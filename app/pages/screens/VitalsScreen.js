import React, { useEffect, useState, useRef } from 'react';
import { 
    Alert, 
    ScrollView, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    Activity, AlertCircle, ArrowLeft, Droplet, HeartPulse, 
    Thermometer, Weight, Edit2, Trash2, Calendar, Clock, Save
} from 'lucide-react-native';

export default function VitalsScreen({ theme, onBack, patient, onSaveVitals, showToast, styles }) {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);

    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C'
    });

    const latestVitals = patient?.vitalsHistory?.[0] || null;

    useEffect(() => {
        if (!editId && latestVitals) {
            setForm({
                sys: latestVitals.sys || '', dia: latestVitals.dia || '', pulse: latestVitals.pulse || '',
                spo2: latestVitals.spo2 || '', weight: latestVitals.weight || '', temp: latestVitals.temp || '',
                tempUnit: latestVitals.tempUnit || 'C'
            });
        }
    }, [patient, editId]);

    const resetForm = () => {
        setForm({ sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C' });
        setEditId(null);
    };

    const handleSave = () => {
        if (!form.sys && !form.weight && !form.temp && !form.pulse && !form.spo2) {
            Alert.alert('Empty Input', 'Please enter at least one vital sign.');
            return;
        }

        if (!patient?.id) {
            Alert.alert('Patient Missing', 'The selected patient record is unavailable.');
            return;
        }

        let updatedHistory = [...(patient.vitalsHistory || [])];

        if (editId) {
            const index = updatedHistory.findIndex(v => v.id === editId);
            if (index > -1) {
                updatedHistory[index] = { ...updatedHistory[index], ...form };
            }
            showToast('Success', 'Vitals entry updated successfully', 'success');
            setEditId(null);
        } else {
            const newEntry = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...form
            };
            updatedHistory = [newEntry, ...updatedHistory];
            showToast('Success', 'New vitals recorded', 'success');
        }

        onSaveVitals(patient.id, updatedHistory);
        resetForm();
    };

    const handleEdit = (vital) => {
        setForm({
            sys: vital.sys || '', dia: vital.dia || '', pulse: vital.pulse || '',
            spo2: vital.spo2 || '', weight: vital.weight || '', temp: vital.temp || '',
            tempUnit: vital.tempUnit || 'C'
        });
        setEditId(vital.id);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Record', 'Are you sure you want to delete this vitals entry?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
                const updatedHistory = patient.vitalsHistory.filter(v => v.id !== id);
                onSaveVitals(patient.id, updatedHistory);
                showToast('Deleted', 'Vitals record removed', 'success');
                if (editId === id) resetForm();
            }}
        ]);
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Compact Full-Color Input Field
    const MedicalInput = ({ icon: Icon, label, value, onChange, unit, placeholder, color }) => (
        <View style={{ flex: 1, minWidth: '48%' }}>
            <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: value ? color + '12' : theme.inputBg,
                borderRadius: 16, height: 60, borderWidth: 2, borderColor: value ? color : 'transparent',
                paddingHorizontal: 12
            }}>
                <View style={{ backgroundColor: color + '20', padding: 8, borderRadius: 10 }}>
                    <Icon size={20} color={color} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <TextInput
                            style={{ 
                                flex: 1, 
                                color: theme.text, 
                                fontWeight: '900', 
                                fontSize: 18, 
                                padding: 0, 
                                margin: 0, 
                                height: 40, // Fixed height to prevent text cutoff
                            }}
                            value={String(value)} 
                            onChangeText={onChange} 
                            placeholder={placeholder} 
                            placeholderTextColor={theme.textDim} 
                            keyboardType="numeric"
                        />
                        {!!value && <Text style={{ color: color, fontSize: 12, fontWeight: '800', marginBottom: 2, marginLeft: 2 }}>{unit}</Text>}
                    </View>
                </View>
            </View>
        </View>
    );

    // Timeline Summary Badge
    const ColorfulBadge = ({ icon: Icon, value, unit, color, label, bg }) => {
        if (!value) return null;
        return (
            <View style={{ backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, flex: 1, minWidth: '30%', alignItems: 'center', borderWidth: 1, borderColor: color + '30' }}>
                <Icon size={16} color={color} style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: 10, color: color, textTransform: 'uppercase', fontWeight: '800', opacity: 0.8 }}>{label}</Text>
                <Text style={{ color: color, fontWeight: '900', fontSize: 15, marginTop: 2 }}>{value}<Text style={{ fontSize: 10, fontWeight: '700' }}>{unit}</Text></Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { flex: 1 }]}>
                
                {/* --- Clean Top Header (Removed Vitals Summary) --- */}
                <View style={{ paddingTop: insets.top + 10, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onBack} style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 12, marginRight: 15 }}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }} numberOfLines={1}>{patient?.name}</Text>
                        <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '600' }}>Patient Records</Text>
                    </View>
                </View>

                <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 15, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    
                    {!patient && (
                        <View style={{ backgroundColor: '#fef2f2', padding: 15, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
                            <AlertCircle size={20} color="#dc2626" />
                            <Text style={{ color: '#991b1b', fontSize: 13, flex: 1, marginLeft: 10, fontWeight: '600' }}>Patient missing. Please go back.</Text>
                        </View>
                    )}

                    {/* --- Input Form Section --- */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {editId ? 'Edit Vitals' : 'Record New Vitals'}
                        </Text>
                        {editId && (
                            <TouchableOpacity onPress={resetForm} style={{ backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                                <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '800' }}>Cancel Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: editId ? '#f59e0b' : theme.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 10 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <MedicalInput icon={Activity} label="Systolic" value={form.sys} onChange={(t) => setForm({ ...form, sys: t })} unit="mmHg" placeholder="120" color="#ef4444" />
                            <MedicalInput icon={Activity} label="Diastolic" value={form.dia} onChange={(t) => setForm({ ...form, dia: t })} unit="mmHg" placeholder="80" color="#ef4444" />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <MedicalInput icon={HeartPulse} label="Pulse" value={form.pulse} onChange={(t) => setForm({ ...form, pulse: t })} unit="bpm" placeholder="72" color="#8b5cf6" />
                            <MedicalInput icon={Droplet} label="SpO2" value={form.spo2} onChange={(t) => setForm({ ...form, spo2: t })} unit="%" placeholder="98" color="#0ea5e9" />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <MedicalInput icon={Weight} label="Weight" value={form.weight} onChange={(t) => setForm({ ...form, weight: t })} unit="kg" placeholder="65" color="#10b981" />
                            
                            {/* Custom Temperature Input */}
                            <View style={{ flex: 1, minWidth: '48%' }}>
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', backgroundColor: form.temp ? '#f59e0b12' : theme.inputBg,
                                    borderRadius: 16, height: 60, borderWidth: 2, borderColor: form.temp ? '#f59e0b' : 'transparent',
                                    paddingHorizontal: 12
                                }}>
                                    <View style={{ backgroundColor: '#f59e0b20', padding: 8, borderRadius: 10 }}>
                                        <Thermometer size={20} color="#f59e0b" strokeWidth={2.5} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '800', textTransform: 'uppercase' }}>Temp</Text>
                                            <TouchableOpacity onPress={() => setForm({ ...form, tempUnit: form.tempUnit === 'C' ? 'F' : 'C' })} style={{ backgroundColor: theme.cardBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, elevation: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '900' }}>°{form.tempUnit}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                            <TextInput
                                                style={{ 
                                                    flex: 1, 
                                                    color: theme.text, 
                                                    fontWeight: '900', 
                                                    fontSize: 18, 
                                                    padding: 0, 
                                                    margin: 0, 
                                                    height: 40, // Fixed height to prevent text cutoff
                                                }}
                                                value={String(form.temp)} 
                                                onChangeText={(t) => setForm({ ...form, temp: t })} 
                                                placeholder="36.6" 
                                                placeholderTextColor={theme.textDim} 
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>

                        </View>

                        {/* --- Vibrant Full-Width Save Button --- */}
                        <TouchableOpacity 
                            onPress={handleSave} 
                            style={{ 
                                backgroundColor: editId ? '#f59e0b' : '#10b981', // Amber for update, Emerald for save
                                flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                                borderRadius: 16, paddingVertical: 18, marginTop: 10,
                                shadowColor: editId ? '#f59e0b' : '#10b981', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 
                            }}
                        >
                            <Save size={22} color="#fff" strokeWidth={3} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {editId ? 'Update Changes' : 'Save Record'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* --- Timeline History Section --- */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25, marginBottom: 15 }}>
                        <Clock size={22} color={theme.textDim} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vitals Timeline</Text>
                    </View>

                    {(!patient?.vitalsHistory || patient.vitalsHistory.length === 0) ? (
                        <View style={{ 
                            alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, 
                            backgroundColor: theme.cardBg, borderRadius: 20, 
                            borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed'
                        }}>
                            <View style={{ backgroundColor: theme.primary + '15', padding: 15, borderRadius: 30, marginBottom: 15 }}>
                                <Activity size={35} color={theme.primary} />
                            </View>
                            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 5 }}>No Vitals Logged</Text>
                            <Text style={{ color: theme.textDim, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                                Start building {patient?.name}'s timeline by recording their first vitals check-up today.
                            </Text>
                        </View>
                    ) : (
                        <View style={{ marginTop: 5 }}>
                            {patient.vitalsHistory.map((item, index) => {
                                const { date, time } = formatDate(item.date);
                                const isEditingThis = editId === item.id;
                                const isLast = index === patient.vitalsHistory.length - 1;
                                
                                return (
                                    <View key={item.id} style={{ flexDirection: 'row' }}>
                                        
                                        {/* Left Timeline Indicator */}
                                        <View style={{ width: 30, alignItems: 'center' }}>
                                            <View style={{ 
                                                width: 14, height: 14, borderRadius: 7, 
                                                backgroundColor: isEditingThis ? '#f59e0b' : theme.primary,
                                                zIndex: 2, marginTop: 24, borderWidth: 2, borderColor: theme.bg
                                            }} />
                                            {!isLast && (
                                                <View style={{ 
                                                    position: 'absolute', top: 38, bottom: -24, 
                                                    width: 3, backgroundColor: theme.border, zIndex: 1, borderRadius: 2
                                                }} />
                                            )}
                                        </View>

                                        {/* Right Card Content */}
                                        <View style={{ flex: 1, paddingBottom: 20 }}>
                                            <View style={{ 
                                                backgroundColor: isEditingThis ? '#fef3c7' : theme.cardBg, 
                                                borderRadius: 18, padding: 15, 
                                                borderWidth: 1, borderColor: isEditingThis ? '#fcd34d' : theme.border,
                                                elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                                        <Calendar size={12} color={theme.textDim} />
                                                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginLeft: 6 }}>{date}</Text>
                                                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.textDim, marginHorizontal: 6 }}/>
                                                        <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primary }}>{time}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                                        <TouchableOpacity onPress={() => handleEdit(item)} style={{ padding: 4, backgroundColor: isEditingThis ? '#f59e0b20' : theme.inputBg, borderRadius: 6 }}>
                                                            <Edit2 size={16} color={isEditingThis ? '#d97706' : theme.textDim} strokeWidth={2.5}/>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4, backgroundColor: '#fef2f2', borderRadius: 6 }}>
                                                            <Trash2 size={16} color="#ef4444" strokeWidth={2.5}/>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                    {(item.sys || item.dia) && <ColorfulBadge bg="#fef2f2" icon={Activity} label="BP" value={`${item.sys || '-'}/${item.dia || '-'}`} unit="" color="#ef4444" />}
                                                    {item.pulse && <ColorfulBadge bg="#f5f3ff" icon={HeartPulse} label="Pulse" value={item.pulse} unit="bpm" color="#8b5cf6" />}
                                                    {item.spo2 && <ColorfulBadge bg="#eff6ff" icon={Droplet} label="SpO2" value={item.spo2} unit="%" color="#3b82f6" />}
                                                    {item.temp && <ColorfulBadge bg="#fffbeb" icon={Thermometer} label="Temp" value={item.temp} unit={`°${item.tempUnit || 'C'}`} color="#f59e0b" />}
                                                    {item.weight && <ColorfulBadge bg="#ecfdf5" icon={Weight} label="Weight" value={item.weight} unit="kg" color="#10b981" />}
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}