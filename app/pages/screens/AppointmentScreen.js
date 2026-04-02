import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Cake, Calendar, Check, ChevronDown, Clock, Droplet, MessageCircle, Pencil, Phone, Plus, Search, Trash2, User, X, Mail, ClipboardList, Activity, HeartPulse, Weight, Thermometer, CheckCircle2 } from 'lucide-react-native';
import { BLOOD_GROUPS, INITIAL_FORM_STATE } from '../../constants/medical';
import { getMedicalModalTheme } from '../../constants/tableTheme';
import { GenderSelector, InputGroup } from '../../components/commons/FormControls';
import { calculateAge } from '../../utils/patient.js';

const { width } = Dimensions.get('window');

export default function AppointmentScreen({ theme, onBack, form, setForm, appointments, setAppointments, patients, setPatients, onSelectPatient, onEditAppointment, viewMode, setViewMode, showToast, styles }) {
    const insets = useSafeAreaInsets();
    const modalTheme = getMedicalModalTheme(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerMode, setPickerMode] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const[showBloodPicker, setShowBloodPicker] = useState(false); // New Blood Group Picker State
    const[tempDate, setTempDate] = useState(new Date());
    const [patientSearch, setPatientSearch] = useState('');
    const isEditorView = viewMode === 'new';
    const bloodOptions = (BLOOD_GROUPS && BLOOD_GROUPS.length ? BLOOD_GROUPS : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Custom']).map((bg) =>
        typeof bg === 'string' ? { label: bg, value: bg } : bg
    );

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const getBloodLabel = () => (form.blood === 'Custom' ? (form.customBlood || 'Custom / Other') : form.blood);

    const getAvatarLabel = (name = '') => {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'PT';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    };

    const resetForm = () => {
        setForm(INITIAL_FORM_STATE);
        setPatientSearch('');
    };

    const hasVitalsInput = () => Boolean(
        form.sys || form.dia || form.pulse || form.spo2 || form.weight || form.temp
    );

    const buildVitalsEntry = () => ({
        id: Date.now(),
        date: new Date().toISOString(),
        sys: form.sys || '',
        dia: form.dia || '',
        pulse: form.pulse || '',
        spo2: form.spo2 || '',
        weight: form.weight || '',
        temp: form.temp || '',
        tempUnit: form.tempUnit || 'C'
    });

    const handleQuickSave = () => {
        if (!form.name || !form.mobile) {
            Alert.alert('Missing Info', 'Patient Name and Mobile are required.');
            return;
        }

        if (form.blood === 'Custom' && !(form.customBlood || '').trim()) {
            Alert.alert('Missing Info', 'Please enter a blood group when selecting Custom.');
            return;
        }

        const finalBlood = form.blood === 'Custom' ? (form.customBlood || '').trim() : form.blood;
        const appointmentData = {
            name: form.name,
            mobile: form.mobile,
            email: form.email,
            time: formatTime(form.timeObj),
            date: formatDate(form.dateObj),
            notes: form.notes || 'Regular Visit',
            blood: finalBlood
        };

        const newAppt = { id: Date.now(), ...appointmentData, status: 'upcoming' };
        let newAppointments = [newAppt, ...appointments];

        if (form.isFollowUp) {
            const followUpAppt = {
                id: Date.now() + 1,
                name: form.name,
                mobile: form.mobile,
                email: form.email,
                time: '09:00 AM',
                date: formatDate(form.followUpObj),
                notes: 'Follow-up Visit',
                status: 'upcoming' // Added as upcoming directly
            };
            newAppointments =[...newAppointments, followUpAppt];
            showToast('Success', 'Appointment & Follow-up Created!', 'success');
        } else {
            showToast('Success', 'Appointment Booked Successfully!', 'success');
        }
        
        setAppointments(newAppointments);

        const patientExists = patients.find((item) => item.mobile === form.mobile);
        const vitalsEntry = hasVitalsInput() ? buildVitalsEntry() : null;

        if (patientExists && vitalsEntry) {
            setPatients((prev) => prev.map((item) => {
                if (item.mobile !== form.mobile) return item;
                return {
                    ...item,
                    vitalsHistory:[vitalsEntry, ...(item.vitalsHistory || [])]
                };
            }));
        }

        if (!patientExists) {
            const newPatient = {
                id: Date.now() + 50,
                name: form.name,
                mobile: form.mobile,
                email: form.email || '',
                age: form.age || 'N/A',
                dob: form.dob || '',
                gender: form.gender || 'M',
                blood: finalBlood,
                address: form.address || '',
                registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                vitalsHistory: vitalsEntry ? [vitalsEntry] :[],
                rxHistory:[]
            };
            setPatients((prev) => [newPatient, ...prev]);
        }

        resetForm();
        setViewMode('list');
    };

    const handleCall = (mobile) => Linking.openURL(`tel:${mobile}`);
    const handleWhatsApp = (mobile) => {
        const cleanMobile = mobile.replace(/\D/g, '');
        Linking.openURL(`whatsapp://send?phone=${cleanMobile}&text=${encodeURIComponent("Hello, this is regarding your appointment.")}`);
    };

    const openDatePicker = (mode, currentVal) => {
        setPickerMode(mode);
        const validDate = currentVal instanceof Date ? currentVal : new Date();
        setTempDate(validDate);
        setShowDatePicker(true);
    };

    const onDateChange = (_event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') saveDateSelection(selectedDate);
        }
    };

    const saveDateSelection = (dateToSave) => {
        const date = dateToSave || tempDate;
        if (pickerMode === 'date') setForm((prev) => ({ ...prev, dateObj: date, date: formatDate(date) }));
        else if (pickerMode === 'time') setForm((prev) => ({ ...prev, timeObj: date, time: formatTime(date) }));
        else if (pickerMode === 'followup') setForm((prev) => ({ ...prev, followUpObj: date, followUpDate: formatDate(date) }));
        else if (pickerMode === 'dob') {
            const age = calculateAge(date);
            setForm((prev) => ({ ...prev, dobObj: date, dob: date.toISOString().split('T')[0], age }));
        }
        setShowDatePicker(false);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Appointment', 'Remove this booking?',[
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setAppointments(appointments.filter((item) => item.id !== id));
                    showToast('Deleted', 'Appointment removed.', 'error');
                }
            }
        ]);
    };

    const handleEdit = (item) => {
        if (onEditAppointment) {
            onEditAppointment(item);
        }
    };

    const getPatientMatches = () => {
        if (!patientSearch) return[];
        return patients.filter((item) => item.name.toLowerCase().includes(patientSearch.toLowerCase()) || item.mobile.includes(patientSearch) || item.id.toString().includes(patientSearch));
    };

    const fillPatientData = (patient) => {
        const latestVitals = Array.isArray(patient.vitalsHistory) && patient.vitalsHistory.length > 0 
            ? patient.vitalsHistory[0] 
            : null;

        setForm((prev) => ({
            ...prev,
            name: patient.name,
            mobile: patient.mobile,
            email: patient.email || '',
            age: patient.age,
            dob: patient.dob || '',
            gender: patient.gender,
            blood: patient.blood,
            address: patient.address || '',
            sys: latestVitals?.sys || '',
            dia: latestVitals?.dia || '',
            pulse: latestVitals?.pulse || '',
            spo2: latestVitals?.spo2 || '',
            weight: latestVitals?.weight || '',
            temp: latestVitals?.temp || '',
            tempUnit: latestVitals?.tempUnit || 'C'
        }));
        setPatientSearch('');
        Keyboard.dismiss();
    };

    const renderList = () => {
        // Only showing upcoming appointments
        let filteredData = appointments.filter((item) => item.status === 'upcoming');
        if (searchQuery) {
            filteredData = filteredData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.mobile.includes(searchQuery));
        }

        return (
            <View style={{ flex: 1 }}>
                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <LinearGradient colors={theme.mode === 'dark' ?['rgba(56,189,248,0.2)', 'rgba(20,184,166,0.1)'] : ['#ecfeff', '#f0fdfa']} style={{ borderRadius: 16, padding: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(15,23,42,0.9)' : '#ffffff', borderRadius: 14, paddingHorizontal: 16, height: 50 }}>
                            <Search size={20} color={theme.primary} style={{ marginRight: 10 }} />
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }} placeholder="Search Name / Mobile..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                            {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')} style={{ backgroundColor: theme.inputBg, padding: 6, borderRadius: 10 }}><X size={16} color={theme.textDim} /></TouchableOpacity>}
                        </View>
                    </LinearGradient>
                </View>

                {/* Section Title */}
                <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }}>Upcoming Appointments</Text>
                </View>

                {/* Highly Colorful Appointment Cards */}
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {filteredData.length > 0 ? filteredData.map((item) => {
                        const rawTime = String(item.time || '').trim();
                        let timeMain = rawTime;
                        let timeSuffix = '';

                        if (rawTime) {
                            const match = rawTime.match(/^(\d{1,2}:\d{2})(?:\s*([AaPp][Mm]))?$/);
                            if (match) {
                                timeMain = match[1];
                                timeSuffix = match[2] || '';
                            } else {
                                const parts = rawTime.split(/\s+/);
                                timeMain = parts[0];
                                timeSuffix = parts.slice(1).join(' ');
                            }
                        }

                        return (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectPatient(item)} key={item.id} style={{ backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#ffffff', borderRadius: 24, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5 }}>
                            
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <LinearGradient colors={theme.mode === 'dark' ?['rgba(14,165,233,0.3)', 'rgba(45,212,191,0.1)'] :['#e0f2fe', '#ccfbf1']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 18, paddingVertical: 12, width: 70, height: 80, borderWidth: 1, borderColor: theme.mode === 'dark' ? '#0ea5e950' : '#bae6fd' }}>
                                    <Text style={{ fontWeight: '900', color: theme.mode === 'dark' ? '#38bdf8' : '#0284c7', fontSize: 16 }}>{timeMain}</Text>
                                    <Text style={{ fontSize: 10, color: theme.mode === 'dark' ? '#bae6fd' : '#0369a1', fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>{timeSuffix}</Text>
                                </LinearGradient>

                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View>
                                            <Text style={{ fontWeight: '900', color: theme.text, fontSize: 17, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                                            <View style={{ backgroundColor: theme.primary + '15', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 }}>
                                                <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>ID: #{item.id}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f59e0b15', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} color="#f59e0b" /></TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef444415', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#ef4444" /></TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={{ color: theme.textDim, fontSize: 13, fontWeight: '500', lineHeight: 18 }} numberOfLines={2}>{item.notes}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={12} color={theme.textDim} />
                                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>{item.date}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Phone size={12} color={theme.textDim} />
                                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>{item.mobile}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={() => handleCall(item.mobile)} style={{ flex: 1 }}>
                                    <LinearGradient colors={['#3b82f6', '#2563eb']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                                        <Phone size={16} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Call Phone</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleWhatsApp(item.mobile)} style={{ flex: 1 }}>
                                    <LinearGradient colors={['#25D366', '#128C7E']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                                        <MessageCircle size={16} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>WhatsApp</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <ClipboardList size={40} color={theme.textDim} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>No Upcoming Appointments</Text>
                            <Text style={{ color: theme.textDim, fontSize: 15, marginTop: 8 }}>Click the '+' icon to add a new booking.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderNewPatient = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            
            <LinearGradient colors={theme.mode === 'dark' ?['#0f3b46', '#14532d'] :['#dcfce7', '#dbeafe']} style={{ borderRadius: 20, padding: 1.5, marginBottom: 20 }}>
                <View style={{ backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#ffffff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#10b98120', padding: 10, borderRadius: 12, marginRight: 15 }}>
                        <Activity size={24} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>Smart Booking</Text>
                        <Text style={{ color: theme.textDim, marginTop: 4, fontSize: 12, fontWeight: '500' }}>Search existing patients or add a new one instantly.</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* HIGHLY COLORFUL AUTO-FILL SEARCH BAR */}
            <View style={{ marginBottom: 30 }}>
                <Text style={{ color: theme.textDim, marginBottom: 10, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Auto-Fill Data</Text>
                
                <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ borderRadius: 18, padding: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#ffffff', borderRadius: 16, paddingHorizontal: 16, height: 56 }}>
                        <Search size={22} color="#8b5cf6" style={{ marginRight: 10 }} />
                        <TextInput 
                            style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }} 
                            placeholder="Search Name, Mobile or ID..." 
                            placeholderTextColor={theme.textDim} 
                            value={patientSearch} 
                            onChangeText={setPatientSearch} 
                        />
                        {patientSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setPatientSearch('')} style={{ backgroundColor: theme.inputBg, padding: 6, borderRadius: 10 }}>
                                <X size={16} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {patientSearch.length > 0 && (
                    <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginTop: 10, borderRadius: 16, overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 }}>
                        {getPatientMatches().map((patient) => (
                            <TouchableOpacity key={patient.id} onPress={() => fillPatientData(patient)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <LinearGradient colors={['#8b5cf6', '#3b82f6']} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{getAvatarLabel(patient.name)}</Text>
                                    </LinearGradient>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{patient.name} <Text style={{ fontSize: 11, color: theme.textDim }}>(#{patient.id})</Text></Text>
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginTop: 4 }}>{patient.mobile}</Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: '#8b5cf6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
                                    <Text style={{ fontSize: 13, color: 'white', fontWeight: 'bold' }}>Select</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {getPatientMatches().length === 0 && <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: theme.textDim, fontSize: 14, fontWeight: '600' }}>No existing patient found. Fill details below.</Text></View>}
                    </View>
                )}
            </View>

            {/* Basic Info Section */}
            <View style={{ backgroundColor: theme.cardBg, borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <LinearGradient colors={['#8b5cf6', '#3b82f6']} style={{ width: 6, height: 24, borderRadius: 3, marginRight: 12 }} />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 1 }}>Patient Details</Text>
                </View>

                <View style={{ gap: 16 }}>
                    <InputGroup icon={User} label="Patient Name *" value={form.name} onChange={(t) => setForm({ ...form, name: t })} theme={theme} styles={styles} />
                    <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={form.mobile} onChange={(t) => setForm({ ...form, mobile: t })} theme={theme} styles={styles} />
                    <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={form.email} onChange={(t) => setForm({ ...form, email: t })} theme={theme} placeholder="patient@email.com" styles={styles} />

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Date of Birth</Text>
                            <TouchableOpacity onPress={() => openDatePicker('dob', form.dobObj)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15, height: 54, borderRadius: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Cake size={20} color={theme.primary} />
                                    <Text style={{ color: theme.text, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{form.dob || 'Select'}</Text>
                                </View>
                                <ChevronDown size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={form.age} onChange={(t) => setForm({ ...form, age: t })} theme={theme} styles={styles} /></View>
                    </View>

                    <GenderSelector value={form.gender} onChange={(val) => setForm({ ...form, gender: val })} theme={theme} />

                    <View style={{ marginTop: 5 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Blood Group</Text>
                        <TouchableOpacity onPress={() => setShowBloodPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15, height: 54, borderRadius: 16 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>\
                                <Droplet size={20} color="#ef4444" />\
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{getBloodLabel()}</Text>\
                            </View>
                            <ChevronDown size={18} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    
                    {form.blood === 'Custom' && (
                        <View>
                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Enter Blood Group</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, height: 54, borderRadius: 16 }]}>
                                <Droplet size={20} color={theme.primary} />
                                <TextInput style={[styles.textInput, { color: theme.text, fontWeight: '600' }]} value={form.customBlood} onChangeText={(t) => setForm({ ...form, customBlood: t })} placeholder="Type blood group here..." placeholderTextColor={theme.textDim} />
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Vitals Section */}
            <View style={{ backgroundColor: theme.cardBg, borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <LinearGradient colors={['#ec4899', '#f43f5e']} style={{ width: 6, height: 24, borderRadius: 3, marginRight: 12 }} />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 1 }}>Vitals (Optional)</Text>
                </View>
                
                <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <InputGroup icon={Activity} label="Systolic BP" value={form.sys} onChange={(t) => setForm({ ...form, sys: t })} theme={theme} keyboardType="numeric" placeholder="120" styles={styles} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputGroup icon={Activity} label="Diastolic BP" value={form.dia} onChange={(t) => setForm({ ...form, dia: t })} theme={theme} keyboardType="numeric" placeholder="80" styles={styles} />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <InputGroup icon={HeartPulse} label="Pulse (bpm)" value={form.pulse} onChange={(t) => setForm({ ...form, pulse: t })} theme={theme} keyboardType="numeric" placeholder="72" styles={styles} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputGroup icon={Droplet} label="SpO2 (%)" value={form.spo2} onChange={(t) => setForm({ ...form, spo2: t })} theme={theme} keyboardType="numeric" placeholder="98" styles={styles} />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
                        <View style={{ flex: 1 }}>
                            <InputGroup icon={Weight} label="Weight (kg)" value={form.weight} onChange={(t) => setForm({ ...form, weight: t })} theme={theme} keyboardType="numeric" placeholder="65" styles={styles} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: theme.textDim, fontWeight: '700', fontSize: 13 }}>{`Temp (°${form.tempUnit || 'C'})`}</Text>
                                <TouchableOpacity onPress={() => setForm({ ...form, tempUnit: form.tempUnit === 'C' ? 'F' : 'C' })}>
                                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>Switch to °{form.tempUnit === 'C' ? 'F' : 'C'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, height: 54, borderRadius: 16 }]}>
                                <Thermometer size={20} color={theme.textDim} />
                                <TextInput
                                    style={[styles.textInput, { color: theme.text, fontWeight: '600' }]}
                                    value={form.temp}
                                    onChangeText={(t) => setForm({ ...form, temp: t })}
                                    keyboardType="numeric"
                                    placeholder={form.tempUnit === 'C' ? '36.6' : '98.6'}
                                    placeholderTextColor={theme.textDim}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Booking Details Section */}
            <View style={{ backgroundColor: theme.cardBg, borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <LinearGradient colors={['#f59e0b', '#fb923c']} style={{ width: 6, height: 24, borderRadius: 3, marginRight: 12 }} />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 1 }}>Booking details</Text>
                </View>

                <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Date</Text>
                            <TouchableOpacity onPress={() => openDatePicker('date', form.dateObj)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15, height: 54, borderRadius: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}><Calendar size={20} color={theme.primary} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{form.date}</Text></View>
                                <ChevronDown size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Time</Text>
                            <TouchableOpacity onPress={() => openDatePicker('time', form.timeObj)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15, height: 54, borderRadius: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}><Clock size={20} color="#f59e0b" /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{form.time}</Text></View>
                                <ChevronDown size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#f8fafc', padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                        <View>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>Follow Up Visit?</Text>
                            <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 4, fontWeight: '500' }}>Auto-create next visit record</Text>
                        </View>
                        <Switch value={form.isFollowUp} onValueChange={(v) => setForm({ ...form, isFollowUp: v })} trackColor={{ false: theme.border, true: '#10b981' }} thumbColor="white" />
                    </View>

                    {form.isFollowUp && (
                        <View>
                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Next Visit Date</Text>
                            <TouchableOpacity onPress={() => openDatePicker('followup', form.followUpObj)} style={[styles.inputContainer, { backgroundColor: '#10b98110', borderColor: '#10b981', justifyContent: 'space-between', paddingRight: 15, height: 54, borderRadius: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}><Calendar size={20} color="#10b981" /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{form.followUpDate}</Text></View>
                                <ChevronDown size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '700', fontSize: 13 }}>Booking Notes</Text>
                        <View style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 16, minHeight: 120 }}>
                            <TextInput style={{ color: theme.text, fontSize: 15, fontWeight: '500', width: '100%', textAlignVertical: 'top', flex: 1 }} value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} placeholder="Type complaints, visit reason, or doctor's notes here..." placeholderTextColor={theme.textDim} multiline />
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            
            {/* Blood Group Picker */}
            <Modal visible={showBloodPicker} transparent animationType="slide" onRequestClose={() => setShowBloodPicker(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowBloodPicker(false)} />
                    <LinearGradient colors={theme.mode === 'dark' ?['#1e293b', '#0f172a'] :['#ffffff', '#f8fafc']} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: insets.bottom + 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }}>
                        <View style={{ padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ backgroundColor: '#ef444420', padding: 8, borderRadius: 12, marginRight: 12 }}>
                                        <Droplet size={20} color="#ef4444" />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text }}>Blood Group</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowBloodPicker(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                                    <X size={24} color={theme.textDim} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
                                {bloodOptions.map(({ label, value }) => (
                                    <TouchableOpacity 
                                        key={value} 
                                        onPress={() => { setForm({ ...form, blood: value, ...(value !== 'Custom' ? { customBlood: '' } : {}) }); setShowBloodPicker(false); }} 
                                        style={{ width: '31%', backgroundColor: form.blood === value ? '#ef4444' : theme.inputBg, paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: form.blood === value ? '#ef4444' : theme.border }}
                                    >
                                        <Text style={{ color: form.blood === value ? 'white' : theme.text, fontWeight: '800', fontSize: 16 }}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity onPress={() => setShowBloodPicker(false)} style={{ marginTop: 24, backgroundColor: theme.inputBg, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Close Window</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showDatePicker}>
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: modalTheme.overlay }}>
                            <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 2, paddingHorizontal: 2 }}>
                            <View style={{ backgroundColor: modalTheme.surface, padding: 24, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: modalTheme.cancelText, fontSize: 16, fontWeight: '800' }}>Cancel</Text></TouchableOpacity>
                                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>Select {pickerMode === 'time' ? 'Time' : pickerMode === 'dob' ? 'DOB' : 'Date'}</Text>
                                    <TouchableOpacity onPress={() => saveDateSelection(tempDate)}><Text style={{ color: theme.primary, fontWeight: '900', fontSize: 16 }}>Confirm</Text></TouchableOpacity>
                                </View>
                                <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="spinner" onChange={onDateChange} themeVariant={theme.mode} textColor={theme.text} />
                            </View>
                            </LinearGradient>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="default" onChange={onDateChange} themeVariant={theme.mode} />
                )
            )}

            {/* Header */}
            <View style={[styles.header, { marginTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 0 }]}>
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={onBack} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setViewMode('list')} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                        <X size={22} color={theme.text} />
                    </TouchableOpacity>
                )}
                
                <Text style={[styles.headerTitle, { color: theme.text, fontSize: 22, fontWeight: '900' }]}>{viewMode === 'list' ? 'Appointments' : 'New Booking'}</Text>
                
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={() => setViewMode('new')} style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', shadowColor: theme.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}>
                        <LinearGradient colors={['#3b82f6', '#2dd4bf']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={24} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleQuickSave} style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', shadowColor: '#10b981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}>
                        <LinearGradient colors={['#10b981', '#34d399']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={24} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {viewMode === 'list' && renderList()}
                {isEditorView && renderNewPatient()}
            </KeyboardAvoidingView>
        </View>
    );
}