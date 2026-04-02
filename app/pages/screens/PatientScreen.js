import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, ArrowLeft, Cake, Calendar, Check, ChevronDown, Clipboard, Download, Droplet, Eye, FilePlus, HeartPulse, Mail, MapPin, Pencil, Phone, Plus, Search, Share2, TestTube, Thermometer, Trash2, User, UserPlus, Weight, X } from 'lucide-react-native';
import { BLOOD_GROUPS } from '../../constants/medical';
import { getMedicalModalTheme, getMedicalTableTheme } from '../../constants/tableTheme';
import { CustomPicker, GenderSelector, InputGroup } from '../../components/commons/FormControls';
import { calculateAge } from '../../utils/patient.js';

const createEmptyVitalsDraft = () => ({
    sys: '',
    dia: '',
    pulse: '',
    spo2: '',
    weight: '',
    temp: '',
    tempUnit: 'C'
});

const createEmptyPatientDraft = () => ({
    name: '',
    mobile: '',
    email: '',
    age: '',
    dob: '',
    dobObj: new Date(),
    gender: 'M',
    blood: 'O+',
    address: '',
    vitals: createEmptyVitalsDraft()
});

const hasVitalsData = (vitals) => ['sys', 'dia', 'pulse', 'spo2', 'weight', 'temp'].some((key) => String(vitals?.[key] || '').trim().length > 0);

export default function PatientScreen({ theme, onBack, patients, setPatients, selectedPatientId, onNavigate, showToast, styles }) {
    const insets = useSafeAreaInsets();
    const tableTheme = getMedicalTableTheme(theme);
    const modalTheme = getMedicalModalTheme(theme);
    const rowLimitOptions = [
        { label: '25 rows', value: 25 },
        { label: '50 rows', value: 50 },
        { label: '100 rows', value: 100 }
    ];
    const [view, setView] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [addVisible, setAddVisible] = useState(false);
    const [newPatient, setNewPatient] = useState(createEmptyPatientDraft());
    const [pickerVisible, setPickerVisible] = useState(false);
    const [rowLimitPickerVisible, setRowLimitPickerVisible] = useState(false);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [rowLimit, setRowLimit] = useState(25);

    useEffect(() => {
        if (selectedPatientId) {
            const patient = patients.find((item) => item.id === selectedPatientId);
            if (patient) {
                setSelectedPatient(patient);
                setView('detail');
            }
        }
    }, [selectedPatientId, patients]);

    const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || patient.mobile.includes(searchQuery) || patient.id.toString().includes(searchQuery));
    const visiblePatients = filteredPatients.slice(0, rowLimit);
    const phoneRegistered = patients.filter((patient) => patient.mobile && patient.mobile.length > 0).length;

    const handleDelete = (id) => {
        Alert.alert('Delete Patient', 'This will permanently remove the patient.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setPatients(patients.filter((patient) => patient.id !== id));
                    if (view !== 'list') setView('list');
                    showToast('Deleted', 'Patient removed successfully.', 'error');
                }
            }
        ]);
    };

    const handleSaveEdit = () => {
        if (!editForm.name || !editForm.mobile) {
            Alert.alert('Error', 'Name and Mobile are required');
            return;
        }
        const updated = patients.map((patient) => (patient.id === editForm.id ? editForm : patient));
        setPatients(updated);
        showToast('Success', 'Patient Details Updated!', 'success');
        setView('list');
    };

    const handleDobChange = (_event, selectedDate) => {
        if (Platform.OS === 'android') setShowDobPicker(false);
        if (selectedDate) {
            const age = calculateAge(selectedDate);
            const dateStr = selectedDate.toISOString().split('T')[0];
            if (addVisible) {
                setNewPatient({ ...newPatient, dobObj: selectedDate, dob: dateStr, age });
            } else {
                setEditForm({ ...editForm, dob: dateStr, age });
            }
        }
    };

    const handleAddNew = () => {
        if (!newPatient.name || !newPatient.mobile) {
            Alert.alert('Required', 'Please enter Patient Name and Mobile Number.');
            return;
        }
        const timestamp = Date.now();
        const initialVitals = hasVitalsData(newPatient.vitals)
            ? [{
                id: timestamp + 1,
                date: new Date().toISOString(),
                ...newPatient.vitals
            }]
            : [];
        const createdPatient = {
            id: timestamp,
            name: newPatient.name,
            mobile: newPatient.mobile,
            email: newPatient.email,
            age: newPatient.age,
            dob: newPatient.dob,
            gender: newPatient.gender,
            blood: newPatient.blood || 'O+',
            address: newPatient.address,
            registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            vitalsHistory: initialVitals,
            rxHistory: []
        };
        setPatients([createdPatient, ...patients]);
        setAddVisible(false);
        setNewPatient(createEmptyPatientDraft());
        showToast('Success', 'New Patient Added Successfully!', 'success');
    };

    const openPatientPopup = (patient) => {
        setViewingPatient(patient);
        setDetailModalVisible(true);
    };

    const openEdit = (patient) => {
        setEditForm({ ...patient });
        setView('edit');
    };

    const StatBadge = ({ label, value, icon: Icon, gradientColors, iconBg, iconColor, valueColor }) => (
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 18, padding: 16, minWidth: 130 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: valueColor, lineHeight: 28 }}>{value}</Text>
                    <Text style={{ fontSize: 11, color: valueColor, opacity: 0.75, fontWeight: '600', marginTop: 2 }}>{label}</Text>
                </View>
            </View>
        </LinearGradient>
    );

    const PatientAvatar = ({ patient }) => (
        <LinearGradient colors={theme.mode === 'dark' ? ['rgba(45,212,191,0.26)', 'rgba(14,165,233,0.22)'] : ['#ccfbf1', '#dbeafe']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: tableTheme.accentText, fontSize: 16, fontWeight: '800' }}>{patient?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </LinearGradient>
    );

    const getBloodBadgeTheme = (group) => {
        const normalized = String(group || '').toUpperCase();

        if (normalized.includes('-')) {
            return theme.mode === 'dark'
                ? { bg: 'rgba(249,115,22,0.18)', text: '#fdba74' }
                : { bg: '#ffedd5', text: '#c2410c' };
        }

        return theme.mode === 'dark'
            ? { bg: 'rgba(244,63,94,0.18)', text: '#fda4af' }
            : { bg: '#ffe4e6', text: '#be123c' };
    };

    const handleHeaderBack = () => {
        if (view === 'list') onBack();
        else if (selectedPatientId) onBack();
        else setView('list');
    };

    const renderList = () => (
        <View style={{ flex: 1 }}>
            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(15,23,42,0.9)', 'rgba(15,23,42,0.6)'] : ['rgba(239,246,255,0.95)', 'rgba(236,253,245,0.95)']} style={{ marginHorizontal: 20, marginBottom: 15, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <StatBadge
                        label={searchQuery.length > 0 ? 'Results Found' : 'Total Patients'}
                        value={filteredPatients.length}
                        icon={User}
                        gradientColors={theme.mode === 'dark' ? ['rgba(37,99,235,0.55)', 'rgba(124,58,237,0.45)'] : ['#2563eb', '#7c3aed']}
                        iconBg={theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
                        iconColor="#ffffff"
                        valueColor="#ffffff"
                    />
                    <StatBadge
                        label="Phone Registered"
                        value={phoneRegistered}
                        icon={Phone}
                        gradientColors={theme.mode === 'dark' ? ['rgba(5,150,105,0.55)', 'rgba(16,185,129,0.45)'] : ['#059669', '#10b981']}
                        iconBg={theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
                        iconColor="#ffffff"
                        valueColor="#ffffff"
                    />
                </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                    <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search Name / Mobile / ID..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                    {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 100 }} contentContainerStyle={{ flexGrow: 1 }}>
                {filteredPatients.length > 0 ? (
                    <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                            <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: 1040, alignSelf: 'flex-start', borderRadius: 24, padding: 1.5 }}>
                                <View style={{ borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                    <LinearGradient colors={tableTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                                        <Text style={{ width: 250, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient</Text>
                                        <Text style={{ width: 160, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Age / Gender</Text>
                                        <Text style={{ width: 120, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Blood Group</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Registered</Text>
                                        <Text style={{ width: 200, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                    </LinearGradient>

                                    <View style={{ overflow: 'hidden' }}>
                                    {visiblePatients.map((item, index) => {
                                        const bloodBadgeTheme = getBloodBadgeTheme(item.blood);
                                        const isLastRow = index === visiblePatients.length - 1;

                                        return (
                                            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                <View style={{ width: 250, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                                                    <PatientAvatar patient={item} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                        <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }} numberOfLines={1}>{`Patient ID #${item.id}`}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 160, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.mobile || 'N/A'}</Text>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.age || 'N/A'} / {item.gender === 'M' ? 'Male' : item.gender === 'F' ? 'Female' : 'N/A'}</Text>
                                                </View>

                                                <View style={{ width: 120, paddingRight: 12 }}>
                                                    <View style={{ alignSelf: 'flex-start', backgroundColor: bloodBadgeTheme.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)' }}>
                                                        <Text style={{ color: bloodBadgeTheme.text, fontSize: 12, fontWeight: '700' }}>{item.blood || 'N/A'}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '600' }}>{item.registeredDate || 'N/A'}</Text>
                                                </View>

                                                <View style={{ width: 200, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                    <TouchableOpacity onPress={() => openPatientPopup(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                        <Eye size={16} color={tableTheme.viewActionText} />
                                                        <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>View</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => openEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                        <Pencil size={16} color={tableTheme.editActionText} />
                                                        <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.deleteActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                        <Trash2 size={16} color={tableTheme.deleteActionText} />
                                                        <Text style={{ color: tableTheme.deleteActionText, fontSize: 12, fontWeight: '700' }}>Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    </View>
                                </View>
                            </LinearGradient>
                        </ScrollView>
                        <View style={{ marginTop: 8, marginBottom: 32, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>
                                {filteredPatients.length === patients.length
                                    ? `Showing ${visiblePatients.length} of ${patients.length} items`
                                    : `Showing ${visiblePatients.length} of ${filteredPatients.length} filtered items`}
                            </Text>
                            <TouchableOpacity onPress={() => setRowLimitPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: tableTheme.footerHint, fontSize: 12, fontWeight: '700' }}>{`Rows: ${rowLimit}`}</Text>
                                <ChevronDown size={14} color={tableTheme.footerHint} />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 20 }}>
                        <LinearGradient
                            colors={theme.mode === 'dark' ? ['rgba(14,165,233,0.28)', 'rgba(45,212,191,0.24)'] : ['#dbeafe', '#ccfbf1']}
                            style={{ width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#ffffff' }}
                        >
                            <User size={40} color={tableTheme.accentText} />
                        </LinearGradient>
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 14 }}>No patients found</Text>
                        <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 6 }}>Try changing the search or add a new patient.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );

    const PatientDetailPopup = () => {
        if (!viewingPatient || !detailModalVisible) return null;
        return (
            <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDetailModalVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderRadius: 32, padding: 1.5, width: '100%' }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderRadius: 31, overflow: 'hidden', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, paddingBottom: 40, position: 'relative' }}>
                            <View style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ position: 'absolute', bottom: -10, right: 10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View>
                                    <Text style={{ color: modalTheme.eyebrowText, fontWeight: 'bold', letterSpacing: 1, fontSize: 12 }}>MEDICAL RECORD</Text>
                                    <Text style={{ color: modalTheme.headerText, fontSize: 20, fontWeight: '800', marginTop: 6 }}>Patient Details</Text>
                                </View>
                                <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}>
                                    <X size={20} color={modalTheme.closeIcon} />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={{ alignItems: 'center', marginTop: -35 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: modalTheme.surface, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                                <LinearGradient colors={modalTheme.headerColors} style={{ width: '100%', height: '100%', borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{viewingPatient.name?.charAt(0).toUpperCase()}</Text>
                                </LinearGradient>
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 10, textTransform: 'uppercase' }}>{viewingPatient.name}</Text>
                            <Text style={{ fontSize: 14, color: theme.textDim, marginBottom: 20 }}>{viewingPatient.age} Years • {viewingPatient.gender === 'M' ? 'Male' : 'Female'}</Text>
                        </View>

                        <View style={{ paddingHorizontal: 25, paddingBottom: 30 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                                <View style={{ width: '31%', backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: modalTheme.sectionBorder, paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Droplet size={18} color="#3b82f6" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.blood || 'N/A'}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>BLOOD</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: modalTheme.sectionBorder, paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <User size={18} color="#ec4899" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.gender}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>GENDER</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: modalTheme.sectionBorder, paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Weight size={18} color="#eab308" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>65 kg</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>WEIGHT</Text>
                                </View>
                            </View>

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, marginBottom: 12, letterSpacing: 1 }}>CONTACT DETAILS</Text>
                            <View style={{ backgroundColor: modalTheme.infoBg, borderRadius: 16, padding: 15, gap: 15, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: modalTheme.surface, alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Phone Number</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.mobile}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: modalTheme.surface, alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Email Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.email || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: modalTheme.surface, alignItems: 'center', justifyContent: 'center' }}><MapPin size={16} color="#0f766e" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.address || 'Not Provided'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 5 }}>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Patient ID: <Text style={{ fontWeight: 'bold', color: theme.text }}>#{viewingPatient.id}</Text></Text>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Reg: <Text style={{ fontWeight: 'bold', color: theme.text }}>{viewingPatient.registeredDate || 'N/A'}</Text></Text>
                            </View>
                        </View>
                    </View>
                    </LinearGradient>
                </View>
            </Modal>
        );
    };

    const renderDetail = () => {
        if (!selectedPatient) return null;

        const ActionGridItem = ({ title, icon: Icon, onPress, colors }) => (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ width: '47%', marginBottom: 15 }}>
                <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 15, borderRadius: 20, height: 100, justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: colors[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon color="white" size={20} strokeWidth={2.5} />
                    </View>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{title}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );

        const handleShare = async () => {
            const message = `Patient ID Card\n\nName: ${selectedPatient.name}\nID: ${selectedPatient.id}\nAge/Gender: ${selectedPatient.age} / ${selectedPatient.gender}\nPhone: ${selectedPatient.mobile}`;
            try {
                await Share.share({ message });
            } catch {
                Alert.alert('Error', 'Could not share.');
            }
        };

        const handleDownload = () => showToast('Success', 'ID Card Image Saved', 'success');

        const actions = [
            { id: 1, title: 'Add Vitals', icon: HeartPulse, colors: ['#2dd4bf', '#0f766e'], action: () => onNavigate('vitals', selectedPatient) },
            { id: 2, title: 'Prescribe now', icon: FilePlus, colors: ['#a78bfa', '#8b5cf6'], action: () => onNavigate('prescription', selectedPatient) },
            { id: 3, title: 'Rx History', icon: Clipboard, colors: ['#f97316', '#c2410c'], action: () => onNavigate('history', selectedPatient) },
            { id: 5, title: 'Add Lab Report', icon: TestTube, colors: ['#60a5fa', '#3b82f6'], action: () => Alert.alert('Coming Soon', 'Lab Reports') }
        ];

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
                
                <View style={
                    { backgroundColor: '#116A7B',
                      borderRadius: 16,
                      overflow: 'hidden',
                      marginBottom: 15, 
                      shadowColor: '#000', 
                      shadowOpacity: 0.2, 
                      shadowRadius: 8, 
                      elevation: 5 }}>

                    <View style={
                        { position: 'absolute', 
                          top: -30, 
                          left: -30, 
                          width: 100, 
                          height: 100, 
                          borderRadius: 50, 
                          backgroundColor: 'rgba(255,255,255,0.1)' }} />

                    <View style={
                        { position: 'absolute',
                         top: -10,
                         left: 20,
                         width: 60,
                         height: 60, 
                         borderRadius: 30, 
                         backgroundColor: 'rgba(255,255,255,0.05)' }} />

                    <View style={{ padding: 20 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 }}>ID CARD</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                <User size={40} color="black" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PATIENT NAME:</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.name}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>ID NO:</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: 000{selectedPatient.id}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>AGE/GENDER:</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.age} Yrs / {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PHONE:</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.mobile}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 2, backgroundColor: '#facc15', marginVertical: 15 }} />
                        <Text style={{ color: 'white', fontSize: 10, textAlign: 'center', marginBottom: 5 }}>CONSULTANT DOCTOR:</Text>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontStyle: 'italic' }}>Dr. Mansoor Ali V. P.</Text>
                        <Text style={{ color: '#facc15', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>PATHAPPIRIYAM</Text>
                        <View style={{ marginTop: 20, backgroundColor: 'white', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
                        <Text style={{ color: '#116A7B', fontWeight: 'bold', fontSize: 12 }}>APPOINTMENT BOOKING: +91 8606344694</Text>
                        </View>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                    <TouchableOpacity onPress={handleShare} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', padding: 12, borderRadius: 12, gap: 8 }}>
                        <Share2 size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDownload} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, padding: 12, borderRadius: 12, gap: 8 }}>
                        <Download size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Card</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ marginVertical: 10, color: theme.textDim, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {actions.map((action) => <ActionGridItem key={action.id} {...action} onPress={action.action} />)}
                </View>
            </ScrollView>
        );
    };

    const renderEdit = () => (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={{ gap: 15 }}>
                <InputGroup icon={User} label="Patient Name *" value={editForm.name} onChange={(t) => setEditForm({ ...editForm, name: t })} theme={theme} styles={styles} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={editForm.mobile} onChange={(t) => setEditForm({ ...editForm, mobile: t })} theme={theme} styles={styles} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={editForm.email} onChange={(t) => setEditForm({ ...editForm, email: t })} theme={theme} styles={styles} />
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.dob || 'Select Date'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={editForm.age} onChange={(t) => setEditForm({ ...editForm, age: t })} theme={theme} styles={styles} /></View>
                </View>
                <GenderSelector value={editForm.gender} onChange={(val) => setEditForm({ ...editForm, gender: val })} theme={theme} />
                <View style={{ marginTop: 10 }}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Droplet size={20} color={theme.textDim} />
                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.blood}</Text>
                        </View>
                        <ChevronDown size={16} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
                <InputGroup icon={MapPin} label="Address" value={editForm.address} onChange={(t) => setEditForm({ ...editForm, address: t })} theme={theme} styles={styles} />
            </View>
            <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => setEditForm({ ...editForm, blood: val })} theme={theme} />
            {showDobPicker && <DateTimePicker value={new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />}
        </ScrollView>
    );

    const renderAddModal = () => (
        <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setAddVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, paddingBottom: 40, maxHeight: '90%', borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ backgroundColor: modalTheme.iconBg, padding: 8, borderRadius: 12 }}>
                                    <UserPlus size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Add New Patient</Text>
                                    <Text style={{ fontSize: 12, color: modalTheme.eyebrowText }}>Create a colorful clinical intake profile</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 6, borderRadius: 20 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView contentContainerStyle={{ padding: 25 }}>
                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(20,184,166,0.18)', 'rgba(14,165,233,0.08)'] : ['#f0fdfa', '#eff6ff']} style={{ borderRadius: 22, padding: 18, borderWidth: 1, borderColor: modalTheme.infoBorder, marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={24} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, color: modalTheme.chipText, fontWeight: '800', letterSpacing: 0.4 }}>PATIENT SNAPSHOT</Text>
                                            <Text style={{ fontSize: 17, color: theme.text, fontWeight: '700', marginTop: 4 }}>{newPatient.name || 'New patient registration'}</Text>
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: modalTheme.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                        <Text style={{ color: modalTheme.chipText, fontSize: 12, fontWeight: '700' }}>{newPatient.blood || 'O+'}</Text>
                                    </View>
                                </View>
                                <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 12 }}>{newPatient.mobile || 'Add contact details, demographics, and any opening vitals for a complete intake record.'}</Text>
                            </LinearGradient>

                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>
                            <View style={{ gap: 15, backgroundColor: modalTheme.sectionBg, borderRadius: 22, borderWidth: 1, borderColor: modalTheme.sectionBorder, padding: 16 }}>
                                <InputGroup icon={User} label="Patient Name *" value={newPatient.name} onChange={(t) => setNewPatient({ ...newPatient, name: t })} theme={theme} placeholder="Ex: John Doe" styles={styles} />
                                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={newPatient.mobile} onChange={(t) => setNewPatient({ ...newPatient, mobile: t })} theme={theme} placeholder="Ex: 9876543210" styles={styles} />
                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Cake size={20} color={theme.textDim} />
                                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.dob || 'Select Date'}</Text>
                                            </View>
                                            <ChevronDown size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 0.8 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={newPatient.age} onChange={(t) => setNewPatient({ ...newPatient, age: t })} theme={theme} placeholder="Age" styles={styles} /></View>
                                </View>
                                <GenderSelector value={newPatient.gender} onChange={(val) => setNewPatient({ ...newPatient, gender: val })} theme={theme} />
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Droplet size={20} color={theme.textDim} />
                                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.blood}</Text>
                                        </View>
                                        <ChevronDown size={16} color={theme.textDim} />
                                    </TouchableOpacity>
                                </View>
                                <InputGroup icon={MapPin} label="Address" value={newPatient.address} onChange={(t) => setNewPatient({ ...newPatient, address: t })} theme={theme} placeholder="City, Street..." styles={styles} />
                            </View>

                            <View style={{ marginTop: 28 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase' }}>Initial Vitals</Text>
                                    <Text style={{ fontSize: 11, color: theme.textDim }}>Optional</Text>
                                </View>

                                <View style={{ backgroundColor: modalTheme.infoBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.infoBorder, gap: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Systolic</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Activity size={18} color="#ef4444" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.sys} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, sys: t } })} placeholder="120" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>mmHg</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Diastolic</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Activity size={18} color="#dc2626" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.dia} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, dia: t } })} placeholder="80" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>mmHg</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Pulse</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <HeartPulse size={18} color="#8b5cf6" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.pulse} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, pulse: t } })} placeholder="72" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>BPM</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>SpO2</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Droplet size={18} color="#0ea5e9" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.spo2} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, spo2: t } })} placeholder="98" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>%</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Weight</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Weight size={18} color="#10b981" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.weight} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, weight: t } })} placeholder="65" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>kg</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>Temperature</Text>
                                                <TouchableOpacity onPress={() => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, tempUnit: newPatient.vitals.tempUnit === 'C' ? 'F' : 'C' } })}>
                                                    <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '700' }}>°{newPatient.vitals.tempUnit}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={[styles.inputContainer, { backgroundColor: modalTheme.surface, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Thermometer size={18} color="#f59e0b" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.temp} onChangeText={(t) => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, temp: t } })} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>°{newPatient.vitals.tempUnit}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 15, marginTop: 30 }}>
                                <TouchableOpacity onPress={() => setAddVisible(false)} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: modalTheme.cancelBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <Text style={{ color: modalTheme.cancelText, fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddNew} style={{ flex: 1 }}>
                                    <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Patient</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>
            <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => {
                if (addVisible) setNewPatient({ ...newPatient, blood: val });
                else setEditForm({ ...editForm, blood: val });
            }} theme={theme} />
            {showDobPicker && <DateTimePicker value={newPatient.dobObj || new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />}
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleHeaderBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    {view === 'list' ? <ArrowLeft size={24} color={theme.text} /> : <X size={24} color={theme.text} />}
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{view === 'list' ? 'Patient Management' : view === 'detail' ? 'Patient Profile' : 'Edit Patient'}</Text>
                    {view === 'list' && <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>Manage and view all patient records</Text>}
                </View>
                {view === 'list' ? (
                    <TouchableOpacity onPress={() => setAddVisible(true)} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : view === 'edit' ? (
                    <TouchableOpacity onPress={handleSaveEdit} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Check size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {view === 'list' && renderList()}
                {view === 'detail' && renderDetail()}
                {view === 'edit' && renderEdit()}
            </KeyboardAvoidingView>
            <CustomPicker visible={rowLimitPickerVisible} title="Rows to show" data={rowLimitOptions} onClose={() => setRowLimitPickerVisible(false)} onSelect={(val) => setRowLimit(Number(val))} theme={theme} />
            {renderAddModal()}
            {PatientDetailPopup()}
        </View>
    );
}
