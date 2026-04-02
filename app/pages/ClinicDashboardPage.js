
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppointmentEditModal from '../components/commons/AppointmentEditModal';
import PrescriptionMedicineModal from '../components/commons/PrescriptionMedicineModal';
import ToastNotification from '../components/commons/ToastNotification';
import SplashScreen from '../components/loaders/SplashScreen';
import SideMenu from '../components/navbars/SideMenu';
import { fetchClinicState, replaceClinicCollection } from '../utils/clinicApi';
import { buildMedicineRecord, findMatchingMedicine, sanitizeMedicineDraft } from '../utils/medicine';
import AppointmentScreenPage from './screens/AppointmentScreen';
import DashboardHomePage from './screens/DashboardHomeScreen';
import LoginPage from './screens/EmbeddedLoginScreen';
import MedicinePage from './screens/MedicineScreen';
import PatientHistoryScreenPage from './screens/PatientHistoryScreen';
import PatientScreenPage from './screens/PatientScreen';
import PlaceholderPage from './screens/PlaceholderScreen';
import ProceduresPage from './screens/ProceduresScreen';
import SupportPage from './screens/SupportScreen';
import TemplateScreenPage from './screens/TemplateScreen';
import VitalsScreenPage from './screens/VitalsScreen';

import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Banknote,
    BookOpen,
    Cake,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clipboard,
    Clock,
    Copy,
    Download,
    Droplet,
    Eye,
    FilePlus,
    FileText,
    FlaskConical,
    HeartPulse,
    Home,
    Layers,
    List,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    Pencil,
    Phone,
    Pill,
    Plus,
    PlusCircle,
    Save,
    Search,
    Settings,
    Share2,
    Sparkles,
    Stethoscope,
    TestTube,
    Thermometer,
    Trash2,
    TrendingDown,
    User,
    UserPlus,
    Weight,
    X
} from 'lucide-react-native';

// --- THEME CONFIGURATION ---
const THEMES = {
  dark: {
    mode: 'dark',
    bg: '#0f172a', cardBg: '#1e293b', primary: '#2dd4bf', primaryDark: '#115e59', 
    text: '#f1f5f9', textDim: '#94a3b8', border: 'rgba(255,255,255,0.1)', inputBg: 'rgba(255,255,255,0.05)',
    blurTint: 'dark', navBg: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)',
    glowTop: 'rgba(45, 212, 191, 0.15)', glowBottom: 'rgba(16, 185, 129, 0.1)',
    success: '#10b981', warning: '#f59e0b', danger: '#ef4444'
  },
  light: {
    mode: 'light',
    bg: '#f0f4f8', cardBg: '#ffffff', primary: '#0d9488', primaryDark: '#115e59', 
    text: '#0f172a', textDim: '#64748b', border: '#e2e8f0', inputBg: '#f8fafc',     
    blurTint: 'light', navBg: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
    glowTop: 'rgba(13, 148, 136, 0.08)', glowBottom: 'rgba(16, 185, 129, 0.05)',
    success: '#10b981', warning: '#f59e0b', danger: '#ef4444'
  }
};

const { height } = Dimensions.get('window');

// --- CONSTANTS ---
const INITIAL_FORM_STATE = { 
    name: '', mobile: '', email: '', age: '', gender: 'M', address: '', 
    blood: 'O+', customBlood: '', 
    date: 'Today', time: '09:00 AM', notes: '',
    isFollowUp: false, followUpDate: 'Next Week',
    dateObj: new Date(), timeObj: new Date(), followUpObj: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    dob: '', dobObj: new Date()
};

const INITIAL_APPOINTMENTS = [
    { id: 101, name: "Sarah Jenkins", mobile: "9876543210", email: "sarah.j@example.com", time: "10:00 AM", date: "Feb 16", notes: "General Checkup", status: "upcoming", blood: "A+" },
    { id: 102, name: "Mike Ross", mobile: "9988776655", email: "mike.ross@law.com", time: "11:30 AM", date: "Feb 16", notes: "Dental Cleaning", status: "upcoming", blood: "O-" },
    { id: 103, name: "Harvey Specter", mobile: "9123456789", email: "harvey@specter.com", time: "02:00 PM", date: "Feb 17", notes: "Consultation", status: "pending", blood: "AB+" },
    { id: 104, name: "Jessica Pearson", mobile: "9123456000", email: "jessica@firm.com", time: "09:00 AM", date: "Feb 10", notes: "Annual Review", status: "lastWeek", blood: "A-" },
];

const INITIAL_PATIENTS = [
    { id: 101, name: "Sarah Jenkins", mobile: "9876543210", email: "sarah.j@example.com", age: "28", dob: "1996-01-10", gender: "F", blood: "A+", address: "New York, NY", registeredDate: "Jan 10, 2024", vitalsHistory: [ { id: 1, date: new Date().toISOString(), sys: '120', dia: '80', pulse: '72', weight: '65', temp: '36.6', tempUnit: 'C' } ], rxHistory: [] },
    { id: 102, name: "Mike Ross", mobile: "9988776655", email: "mike.ross@law.com", age: "35", dob: "1989-02-01", gender: "M", blood: "O-", address: "Brooklyn, NY", registeredDate: "Feb 01, 2024", vitalsHistory: [], rxHistory: [] },
    { id: 822, name: "Suhaim", mobile: "8891479505", email: "suhaim@example.com", age: "18", dob: "2006-05-15", gender: "M", blood: "O+", address: "Pathappiriyam", registeredDate: "Feb 19, 2026", vitalsHistory: [], rxHistory: [] },
    { id: 103, name: "Harvey Specter", mobile: "9123456789", email: "harvey@specter.com", age: "40", dob: "1984-03-01", gender: "M", blood: "AB+", address: "Manhattan, NY", registeredDate: "Jan 15, 2024", vitalsHistory: [], rxHistory: [] },
    { id: 104, name: "Jessica Pearson", mobile: "9123456000", email: "jessica@firm.com", age: "38", dob: "1986-04-01", gender: "F", blood: "A-", address: "Queens, NY", registeredDate: "Jan 20, 2024", vitalsHistory: [], rxHistory: [] },
    { id: 105, name: "Louis Litt", mobile: "9123456001", email: "louis@firm.com", age: "42", dob: "1982-05-01", gender: "M", blood: "O+", address: "Brooklyn, NY", registeredDate: "Jan 25, 2024", vitalsHistory: [], rxHistory: [] },
];

const PROCEDURE_CATEGORIES = [
    { label: 'General', value: 'General', color: '#3b82f6', bg: '#eff6ff', icon: Stethoscope },
    { label: 'Dental', value: 'Dental', color: '#06b6d4', bg: '#ecfeff', icon: Sparkles },
    { label: 'Surgery', value: 'Surgery', color: '#ef4444', bg: '#fef2f2', icon: Activity },
    { label: 'Lab Test', value: 'Lab', color: '#8b5cf6', bg: '#f5f3ff', icon: TestTube },
    { label: 'Therapy', value: 'Therapy', color: '#10b981', bg: '#ecfdf5', icon: HeartPulse },
    { label: 'Other', value: 'Other', color: '#64748b', bg: '#f1f5f9', icon: Layers },
];

const INITIAL_PROCEDURES = [
    { id: 1, name: "General Consultation", cost: "500", duration: "15 min", category: "General", notes: "Standard physician checkup", date: new Date().toISOString() },
    { id: 2, name: "Root Canal Treatment", cost: "4500", duration: "60 min", category: "Dental", notes: "Requires anesthesia", date: new Date().toISOString() },
    { id: 3, name: "Blood Sugar (FBS/PP)", cost: "150", duration: "10 min", category: "Lab", notes: "Fasting required for FBS", date: new Date(Date.now() - 86400000).toISOString() }, 
    { id: 4, name: "E.C.G.", cost: "300", duration: "15 min", category: "Lab", notes: "Electrocardiogram", date: new Date(Date.now() - 172800000).toISOString() }, 
    { id: 5, name: "Wound Dressing", cost: "250", duration: "20 min", category: "General", notes: "Includes consumables", date: new Date().toISOString() },
];

const INITIAL_TEMPLATES = [
    { 
        id: 1, 
        name: "Viral Fever Protocol", 
        diagnosis: "Viral Pyrexia", 
        advice: "Drink plenty of fluids (3L/day). Complete bed rest.",
        medicines: [
            { id: 1, name: "Paracetamol", dosage: "1 Tablet (500mg)", freq: "1-1-1", duration: "3 Days", instruction: "After Food", type: "Tablet" },
            { id: 2, name: "Vitamin C", dosage: "1 Tablet (500mg)", freq: "1-0-0", duration: "5 Days", instruction: "After Food", type: "Tablet" }
        ],
        procedures: [],
        nextVisitInvestigations: [],
        referral: ''
    },
];

const INITIAL_MEDICINES = [
    { id: 1, name: "CEFGLOBE- S FORTE 1.5 G", type: "Injection", content: "Cefoperazone 1G + Sulbactam 0.5G" },
    { id: 2, name: "Paracetamol", type: "Tablet", content: "500mg" },
    { id: 3, name: "Amoxicillin", type: "Capsule", content: "250mg" },
    { id: 4, name: "Ibuprofen", type: "Syrup", content: "100mg/5ml" },
    { id: 5, name: "Insulin", type: "Injection", content: "100IU" },
];

const FEATURES = [
  { id: 1, title: "Dashboard", subtitle: "Overview & Stats", icon: Home, color: ['#3b82f6', '#2563eb'], action: 'dashboard' },
  { id: 2, title: "Book Appointment", subtitle: "Schedule visits", icon: Calendar, color: ['#f59e0b', '#d97706'], action: 'appointment' },
  { id: 3, title: "Medicine Inventory", subtitle: "Pharmacy & Stock", icon: Activity, color: ['#ef4444', '#dc2626'], action: 'medicines' },
  { id: 4, title: "Patients History", subtitle: "Medical Records", icon: Clock, color: ['#8b5cf6', '#7c3aed'], action: 'history' },
  { id: 5, title: "Templates", subtitle: "Prescription formats", icon: Copy, color: ['#10b981', '#059669'], action: 'templates' },
  { id: 6, title: "Patient List", subtitle: "Manage Patients", icon: List, color: ['#06b6d4', '#0891b2'], action: 'patients' },
  { id: 7, title: "Lab Reports", subtitle: "Test Results", icon: BookOpen, color: ['#ec4899', '#db2777'], action: 'reports' },
  { id: 8, title: "Procedures", subtitle: "Medical Procedures", icon: Settings, color: ['#6366f1', '#4f46e5'], action: 'procedures' },
];

const BLOOD_GROUPS = [
    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
    { label: 'Custom / Other', value: 'Custom' },
];

// --- DYNAMIC DATA INITIALIZERS ---
const FREQUENCIES_INIT = ["1-0-1", "1-0-0", "0-0-1", "1-1-1", "0-1-0", "SOS", "Once a week", "1-1-1-1"];
const DURATIONS_INIT = ["3 Days", "5 Days", "7 Days", "10 Days", "15 Days", "1 Month", "Continue", "2 Weeks"];
const INSTRUCTIONS_INIT = ["After Food", "Before Food", "With Food", "At Night", "Empty Stomach"];
const DOSAGES_INIT = ["1 Unit", "1/2 Unit", "2 Units", "1 Tablet", "1/2 Tablet", "5 ml", "10 ml", "15 ml", "1 Drop", "2 Drops", "1 Puff"];

const calculateAge = (date) => {
    const diff_ms = Date.now() - date.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970).toString();
};

const parseAppointmentDateValue = (label) => {
    if (!label) return new Date();

    const currentYear = new Date().getFullYear();
    const parsed = new Date(`${label}, ${currentYear} 09:00 AM`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const parseAppointmentTimeValue = (label, baseDate = new Date()) => {
    if (!label) return new Date(baseDate);

    const parsed = new Date(`1970-01-01 ${label}`);
    if (Number.isNaN(parsed.getTime())) {
        return new Date(baseDate);
    }

    const merged = new Date(baseDate);
    merged.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0);
    return merged;
};

const buildAppointmentEditForm = (appointment) => {
    const dateObj = parseAppointmentDateValue(appointment.date);
    const timeObj = parseAppointmentTimeValue(appointment.time, dateObj);

    return {
        ...INITIAL_FORM_STATE,
        name: appointment.name,
        mobile: appointment.mobile,
        email: appointment.email || '',
        blood: appointment.blood || 'O+',
        customBlood: '',
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes || '',
        dateObj,
        timeObj,
        editingId: appointment.id,
    };
};

const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1100;
const WIDE_BREAKPOINT = 1440;

const getResponsiveLayout = (windowWidth) => {
    const isTablet = windowWidth >= TABLET_BREAKPOINT;
    const isDesktop = windowWidth >= DESKTOP_BREAKPOINT;
    const isWide = windowWidth >= WIDE_BREAKPOINT;
    const gutter = isWide ? 32 : isTablet ? 24 : 20;
    const contentMaxWidth = isWide ? 1320 : isDesktop ? 1180 : isTablet ? 960 : 680;

    return {
        width: windowWidth,
        isTablet,
        isDesktop,
        isWide,
        gutter,
        contentMaxWidth,
        featureCardWidth: isDesktop ? '23.5%' : isTablet ? '31.5%' : '48%',
        menuWidth: Math.min(Math.max(windowWidth * (isDesktop ? 0.26 : 0.74), 240), 320),
        centeredNavWidth: Math.min(windowWidth - (gutter * 2), 640),
        authMaxWidth: isTablet ? 520 : 420,
    };
};

const getContentWidthStyle = (layout, style = {}) => ({
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    ...style,
});

const getPaddedContentStyle = (layout, style = {}) => ({
    ...getContentWidthStyle(layout),
    paddingHorizontal: layout.gutter,
    ...style,
});

const getBottomNavConfig = (layout, insets) => {
    const safeInset = Math.max(insets.bottom, layout.isTablet ? 12 : 10);
    const bodyHeight = layout.isTablet ? 60 : 56;
    const bottomOffset = layout.isTablet ? Math.max(insets.bottom, 14) : 0;

    return {
        height: bodyHeight + safeInset,
        safeInset,
        bottomOffset,
        contentPaddingBottom: bodyHeight + safeInset + bottomOffset + (layout.isTablet ? 12 : 0),
        iconSize: layout.isTablet ? 22 : 20,
        labelSize: layout.isTablet ? 10 : 9,
    };
};

// --- REUSABLE COMPONENTS ---
const GenderSelector = ({ value, onChange, theme }) => {
    const options = [ { label: 'Male', val: 'M' }, { label: 'Female', val: 'F' }, { label: 'Other', val: 'O' } ];
    return (
        <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {options.map((opt) => {
                    const isActive = value === opt.val;
                    return (
                        <TouchableOpacity 
                            key={opt.val} onPress={() => onChange(opt.val)}
                            style={{ flex: 1, backgroundColor: isActive ? theme.primary : theme.cardBg, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: isActive ? theme.primary : theme.border }}
                        >
                            <Text style={{ color: isActive ? 'white' : theme.text, fontWeight: 'bold' }}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};


const CustomPicker = ({ visible, title, data, onSelect, onClose, theme, colored = false }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: height * 0.7, paddingBottom: 30 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color={theme.textDim} /></TouchableOpacity>
                    </View>
                    <FlatList 
                        data={data}
                        keyExtractor={(item) => typeof item === 'string' ? item : item.value}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => {
                            const label = typeof item === 'string' ? item : item.label;
                            const value = typeof item === 'string' ? item : item.value;
                            return (
                            <TouchableOpacity onPress={() => { onSelect(value); onClose(); }} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                    {colored && item.icon && (
                                        <View style={{ backgroundColor: item.bg, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                    )}
                                    <Text style={{ fontSize: 16, color: colored ? (item.color || theme.text) : theme.text, fontWeight: colored ? 'bold' : 'normal' }}>{label}</Text>
                                </View>
                                <ChevronRight size={16} color={theme.textDim} />
                            </TouchableOpacity>
                        )}}
                    />
                </View>
            </View>
        </Modal>
    );
};

const InputGroup = ({ icon: Icon, label, value, onChange, theme, multiline, keyboardType, placeholder }) => (
    <View>
        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>{label}</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center', paddingVertical: multiline ? 12 : 4 }]}>
            <Icon size={20} color={theme.textDim} style={{ marginTop: multiline ? 2 : 0 }} />
            <TextInput style={[styles.textInput, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center' }]} value={value} onChangeText={onChange} placeholder={placeholder || label} placeholderTextColor={theme.textDim} multiline={multiline} keyboardType={keyboardType || 'default'} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />
        </View>
    </View>
);

// --- UPDATED TEMPLATE SCREEN ---
// eslint-disable-next-line no-unused-vars
const TemplateScreen = ({ theme, onBack, templates, setTemplates, medicines, setMedicines, procedures, setProcedures, showToast, isPrescription = false, patient, onSavePrescription, layout }) => {
    const insets = useSafeAreaInsets();
    const [view, setView] = useState('list'); 
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State - Added 'nextVisitInvestigations' and 'referral'
    const [editorForm, setEditorForm] = useState({ 
        id: null, name: '', diagnosis: '', advice: '', 
        medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' 
    });
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    
    // State to toggle referral input visibility
    const [showReferral, setShowReferral] = useState(false);

    // View Modal State
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Medicine Picker Modal State
    const [medModalVisible, setMedModalVisible] = useState(false);
    const [medSearch, setMedSearch] = useState('');

    // --- PROCEDURE / INVESTIGATION STATES ---
    const [procModalVisible, setProcModalVisible] = useState(false);
    const [procModalType, setProcModalType] = useState('procedure'); // 'procedure' or 'investigation'
    const [procSearch, setProcSearch] = useState('');
    const [procViewMode, setProcViewMode] = useState('list'); // 'list' | 'add_master' | 'edit_master'
    const [showCustomInput, setShowCustomInput] = useState(false);
    
    // Form for Adding/Editing Master Procedure
    const [masterProcForm, setMasterProcForm] = useState({ id: null, name: '', cost: '', category: 'General' });
    
    // Form for Custom (One-off)
    const [customProcForm, setCustomProcForm] = useState({ name: '', cost: '' });

    // Template Selection Modal for Rx Writer
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templatePickerSearch, setTemplatePickerSearch] = useState('');
    
    // Dynamic Arrays
    const [freqOptions, setFreqOptions] = useState(FREQUENCIES_INIT);
    const [durOptions, setDurOptions] = useState(DURATIONS_INIT);
    const [instrOptions, setInstrOptions] = useState(INSTRUCTIONS_INIT);
    const [doseOptions, setDoseOptions] = useState(DOSAGES_INIT);

    // Input Modal State
    const [inputVisible, setInputVisible] = useState(false);
    const [inputCategory, setInputCategory] = useState(null);
    const [inputText, setInputText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newMedForm, setNewMedForm] = useState({ 
        inventoryId: null, name: '', content: '', type: 'Tablet', 
        doseQty: '', freq: '', duration: '', instruction: '', isTapering: false
    });
    const [editingMedIndex, setEditingMedIndex] = useState(null);

    const getEmptyPrescriptionMedicineForm = () => ({
        inventoryId: null,
        name: '',
        content: '',
        type: 'Tablet',
        doseQty: '',
        freq: '',
        duration: '',
        instruction: '',
        isTapering: false
    });

    useEffect(() => {
        if (isPrescription) {
            setView('edit');
            setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' });
            setShowReferral(false);
        }
    }, [isPrescription]);

    const applyTemplate = (template) => {
        setEditorForm(prev => ({
            ...prev,
            diagnosis: template.diagnosis || prev.diagnosis,
            advice: template.advice || prev.advice,
            medicines: [...prev.medicines, ...template.medicines],
            procedures: [...prev.procedures, ...(template.procedures || [])],
            nextVisitInvestigations: [...prev.nextVisitInvestigations, ...(template.nextVisitInvestigations || [])],
            referral: template.referral || prev.referral
        }));
        if(template.referral) setShowReferral(true);
        setShowTemplatePicker(false);
        showToast('Applied', `${template.name} loaded successfully`, 'info');
    };

    const handleEdit = (item) => {
        setEditorForm({ 
            ...item, 
            medicines: [...item.medicines], 
            procedures: [...(item.procedures || [])],
            nextVisitInvestigations: [...(item.nextVisitInvestigations || [])]
        });
        if(item.referral) setShowReferral(true);
        setView('edit');
    };

    const handleCreate = () => {
        setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' });
        setShowReferral(false);
        setView('edit');
    };

    const handleSaveTemplate = () => {
        if (!isPrescription && !editorForm.name) { Alert.alert("Required", "Please enter a Template Name."); return; }
        
        if (isPrescription) {
            if (editorForm.medicines.length === 0 && !editorForm.advice && editorForm.procedures.length === 0 && editorForm.nextVisitInvestigations.length === 0 && !editorForm.referral) {
                Alert.alert("Empty", "Please add medicines, procedures, investigations, referral or advice."); return;
            }
            onSavePrescription({
                ...editorForm,
                patientId: patient.id,
                date: new Date().toISOString()
            });

            if (saveAsTemplate && editorForm.name) {
                 const newTemplate = { ...editorForm, id: Date.now() };
                 setTemplates([newTemplate, ...templates]);
                 showToast('Saved', 'Prescription & New Template Saved!', 'success');
            }
            return;
        }

        let updatedTemplates;
        if (editorForm.id) {
            updatedTemplates = templates.map(t => t.id === editorForm.id ? editorForm : t);
            showToast('Success', 'Template Updated Successfully!', 'success');
        } else {
            const newTemplate = { ...editorForm, id: Date.now() };
            updatedTemplates = [newTemplate, ...templates];
            showToast('Success', 'New Template Created!', 'success');
        }
        setTemplates(updatedTemplates);
        setView('list');
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert("Delete", "Remove this template?", [{text: "Cancel"}, {text: "Delete", style: 'destructive', onPress: () => {
            setTemplates(templates.filter(t => t.id !== id));
            showToast('Deleted', 'Template removed.', 'error');
        }}]);
    };

    const openTemplateDetails = (t) => {
        setSelectedTemplate(t);
        setViewModalVisible(true);
    };

    // --- PROCEDURE / INVESTIGATION LOGIC ---
    
    // Add item to form (Handles both Procedures and Investigations)
    const addProcedureToForm = (proc) => {
        const targetList = procModalType === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const newItem = { ...proc, id: Date.now() }; // New ID for the instance in Rx

        setEditorForm(prev => ({
             ...prev,
             [targetList]: [...prev[targetList], newItem]
        }));
        
        setProcModalVisible(false);
        showToast('Added', `${procModalType === 'investigation' ? 'Investigation' : 'Procedure'} added`, 'success');
    };

    // Save New/Edited Master Procedure (Inventory)
    const handleSaveMasterProcedure = () => {
        if(!masterProcForm.name) {
            Alert.alert("Missing Info", "Name is required.");
            return;
        }
        
        if (masterProcForm.id) {
            const updated = procedures.map(p => p.id === masterProcForm.id ? masterProcForm : p);
            setProcedures(updated);
            showToast('Updated', 'Master list updated', 'success');
        } else {
            const newProc = { ...masterProcForm, id: Date.now(), category: masterProcForm.category || 'General' };
            setProcedures([newProc, ...procedures]);
            showToast('Created', 'New item added to master list', 'success');
        }
        setProcViewMode('list');
    };

    const handleDeleteMasterProcedure = (id) => {
        Alert.alert("Delete", "Permanently remove from master list?", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: () => {
                setProcedures(procedures.filter(p => p.id !== id));
                showToast('Deleted', 'Item removed', 'error');
            }}
        ]);
    };

    // Add One-Off Custom Item
    const addCustomToRx = () => {
        if (!customProcForm.name) {
            Alert.alert("Missing Info", "Name is required");
            return;
        }
        const customProc = {
            id: Date.now(),
            name: customProcForm.name,
            cost: customProcForm.cost || '0',
            category: 'Custom'
        };
        addProcedureToForm(customProc);
        setCustomProcForm({ name: '', cost: '' });
        setShowCustomInput(false);
    };

    // Generic remover
    const removeItemFromForm = (index, type) => {
        const targetList = type === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const updated = [...editorForm[targetList]];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, [targetList]: updated });
    };

    const calculateTotalCost = () => {
        return editorForm.procedures.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
    };

    const openAddMasterProc = () => {
        setMasterProcForm({ id: null, name: '', cost: '', category: 'General' });
        setProcViewMode('add_master');
    };

    const openEditMasterProc = (item) => {
        setMasterProcForm({ ...item });
        setProcViewMode('edit_master');
    };

    // Open Modal Helpers
    const openProcedureModal = () => {
        setProcModalType('procedure');
        setProcViewMode('list');
        setProcSearch('');
        setShowCustomInput(false);
        setProcModalVisible(true);
    };

    const openInvestigationModal = () => {
        setProcModalType('investigation');
        setProcViewMode('list');
        setProcSearch('');
        setShowCustomInput(false);
        setProcModalVisible(true);
    };
    // --- END PROCEDURE LOGIC ---

    const removeMedFromTemplate = (index) => {
        const updated = [...editorForm.medicines];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, medicines: updated });
    };

    const handleEditMedInTemplate = (index) => {
        const med = editorForm.medicines[index];
        setNewMedForm({
            inventoryId: med.inventoryId || null,
            name: med.name, content: med.content, type: med.type,
            doseQty: med.doseQty || '', freq: med.freq, duration: med.duration,
            instruction: med.instruction, isTapering: med.isTapering || false
        });
        setEditingMedIndex(index);
        setMedModalVisible(true);
    };

    const openMedModal = () => {
        setEditingMedIndex(null);
        setNewMedForm(getEmptyPrescriptionMedicineForm());
        setMedSearch('');
        setMedModalVisible(true);
    };

    const addMedToTemplate = () => {
        const sanitizedMed = sanitizeMedicineDraft(newMedForm);

        if (!sanitizedMed.name) {
            Alert.alert('Required', 'Medicine Name is required.');
            return;
        }

        let finalDosage = '';
        if (sanitizedMed.isTapering) {
            finalDosage = 'Tapering Dose';
        } else {
            if (!sanitizedMed.doseQty) {
                Alert.alert('Select Dosage', 'Please select a Dose Amount.');
                return;
            }

            finalDosage = sanitizedMed.content ? `${sanitizedMed.doseQty} (${sanitizedMed.content})` : sanitizedMed.doseQty;
        }

        if (!sanitizedMed.freq || !sanitizedMed.duration) {
            Alert.alert('Missing Details', 'Please select Frequency and Duration.');
            return;
        }

        let selectedInventoryMed = sanitizedMed.inventoryId
            ? medicines.find((item) => item.id === sanitizedMed.inventoryId) || null
            : null;

        if (!selectedInventoryMed) {
            const existingMedicine = findMatchingMedicine(medicines, sanitizedMed);

            if (existingMedicine) {
                selectedInventoryMed = existingMedicine;
            } else {
                selectedInventoryMed = buildMedicineRecord(sanitizedMed);
                setMedicines((prev) => [selectedInventoryMed, ...prev]);
                showToast('Success', 'New medicine added to inventory.', 'success');
            }
        }

        const medObject = { 
            ...sanitizedMed,
            inventoryId: selectedInventoryMed.id,
            name: selectedInventoryMed.name,
            content: selectedInventoryMed.content,
            type: selectedInventoryMed.type,
            dosage: finalDosage, 
            id: editingMedIndex !== null ? editorForm.medicines[editingMedIndex].id : Date.now() 
        };

        if (editingMedIndex !== null) {
            const updatedMeds = [...editorForm.medicines];
            updatedMeds[editingMedIndex] = medObject;
            setEditorForm({ ...editorForm, medicines: updatedMeds });
        } else {
            setEditorForm({ ...editorForm, medicines: [...editorForm.medicines, medObject] });
        }
        setMedModalVisible(false);
    };

    const selectInventoryMed = (med) => {
        setNewMedForm((prev) => ({ 
            ...prev,
            inventoryId: med.id,
            name: med.name,
            type: med.type,
            content: med.content,
            doseQty: '',
            isTapering: false
        }));
        setMedSearch('');
    };

    const clearSelection = () => {
        setNewMedForm((prev) => ({
            ...prev,
            inventoryId: null,
            name: '',
            content: '',
            type: 'Tablet',
            doseQty: '',
            isTapering: false
        }));
    };

    const openAddInput = (category, isEdit = false, value = '') => {
        setInputCategory(category);
        setInputText(value);
        setEditingItem(isEdit ? value : null);
        setInputVisible(true);
    };

    const handleAddItem = () => {
        if (!inputText.trim()) { setInputVisible(false); return; }
        const updateList = (list, setList) => {
            if (editingItem) { setList(list.map(i => i === editingItem ? inputText : i)); } 
            else { setList([...list, inputText]); }
        };
        if (inputCategory === 'freq') updateList(freqOptions, setFreqOptions);
        else if (inputCategory === 'dur') updateList(durOptions, setDurOptions);
        else if (inputCategory === 'instr') updateList(instrOptions, setInstrOptions);
        else if (inputCategory === 'dose') updateList(doseOptions, setDoseOptions);
        setInputVisible(false);
    };

    const handleDeleteItem = (category, item) => {
        if (category === 'freq') setFreqOptions(freqOptions.filter(i => i !== item));
        else if (category === 'dur') setDurOptions(durOptions.filter(i => i !== item));
        else if (category === 'instr') setInstrOptions(instrOptions.filter(i => i !== item));
        else if (category === 'dose') setDoseOptions(doseOptions.filter(i => i !== item));
    };

    const handleLongPressItem = (category, item) => {
        Alert.alert("Manage Item", `Choose action for "${item}"`, [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => openAddInput(category, true, item) },
            { text: "Delete", style: "destructive", onPress: () => handleDeleteItem(category, item) }
        ]);
    };

    const renderList = () => {
        const filtered = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 16, paddingHorizontal: 15, height: 55, shadowColor: "#000", shadowOffset: {width:0,height:4}, shadowOpacity:0.05, shadowRadius:10, elevation:3 }}>
                        <Search size={22} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }} placeholder="Search Templates..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={20} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                </View>
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => openTemplateDetails(item)} style={{ marginBottom: 20 }}>
                            <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, shadowColor: theme.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                <LinearGradient colors={index % 2 === 0 ? ['#2dd4bf', '#0f766e'] : ['#8b5cf6', '#6d28d9']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10 }}><FileText size={18} color="white" /></View>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={{ padding: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <Stethoscope size={16} color={theme.primary} />
                                        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.diagnosis}</Text>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        {item.medicines.slice(0, 2).map((med, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}>
                                                <Pencil size={14} color={theme.textDim} />
                                                <Text style={{ color: theme.textDim, fontSize: 12, flex: 1, fontWeight: '500' }}>
                                                    {med.name} <Text style={{ fontSize: 10 }}>({med.dosage})</Text>
                                                </Text>
                                            </View>
                                        ))}
                                        {item.medicines.length > 2 && <Text style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold', marginLeft: 5 }}>+ {item.medicines.length - 2} more medicines</Text>}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: theme.border }}>
                                        <TouchableOpacity onPress={() => openTemplateDetails(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 10, gap: 5 }}><Eye size={16} color="#0284c7" /><Text style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 13 }}>View</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleEdit(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffedd5', padding: 10, borderRadius: 10, gap: 5 }}><Pencil size={16} color="#ea580c" /><Text style={{ color: "#ea580c", fontWeight: 'bold', fontSize: 13 }}>Edit</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 10, borderRadius: 10 }}><Trash2 size={16} color="#dc2626" /></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}><Sparkles size={60} color={theme.textDim} /><Text style={{ color: theme.textDim, marginTop: 15, fontSize: 16 }}>Create your first prescription template</Text></View>}
                />
            </View>
        );
    };

    const renderVitalsSummary = () => {
        const latestVitals = patient?.vitalsHistory && patient.vitalsHistory.length > 0 ? patient.vitalsHistory[0] : null;
        if (!latestVitals) return (
            <View style={{marginBottom: 20, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, flexDirection:'row', alignItems:'center', gap: 10, borderStyle:'dashed', borderWidth:1, borderColor: theme.border}}>
                <Activity size={20} color={theme.textDim} />
                <Text style={{color: theme.textDim, fontSize: 13}}>No vitals recorded for this patient.</Text>
            </View>
        );
        const VitalItem = ({ label, value, unit, icon: Icon, color }) => (
            <View style={{backgroundColor: theme.cardBg, borderRadius: 10, padding: 8, flex: 1, alignItems:'center', borderWidth: 1, borderColor: theme.border, minWidth: 70}}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 4, marginBottom: 4}}>
                    <Icon size={12} color={color} />
                    <Text style={{fontSize: 10, color: theme.textDim, fontWeight:'bold', textTransform:'uppercase'}}>{label}</Text>
                </View>
                <Text style={{fontSize: 14, fontWeight:'bold', color: theme.text}}>{value || '--'} <Text style={{fontSize: 10, fontWeight:'normal'}}>{unit}</Text></Text>
            </View>
        );
        return (
            <View style={{ marginBottom: 20 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>VITALS (AUTO-FILLED)</Text>
                    <Text style={{ fontSize: 10, color: theme.textDim }}>{new Date(latestVitals.date).toLocaleDateString()}</Text>
                 </View>
                 <View style={{ flexDirection:'row', gap: 8, flexWrap:'wrap' }}>
                     {latestVitals.sys && <VitalItem label="BP" value={`${latestVitals.sys}/${latestVitals.dia}`} unit="mmHg" icon={Activity} color="#ef4444" />}
                     {latestVitals.pulse && <VitalItem label="Pulse" value={latestVitals.pulse} unit="bpm" icon={HeartPulse} color="#8b5cf6" />}
                     {latestVitals.temp && <VitalItem label="Temp" value={latestVitals.temp} unit={`°${latestVitals.tempUnit||'C'}`} icon={Thermometer} color="#f59e0b" />}
                     {latestVitals.weight && <VitalItem label="Weight" value={latestVitals.weight} unit="kg" icon={Weight} color="#10b981" />}
                     {latestVitals.spo2 && <VitalItem label="SpO2" value={latestVitals.spo2} unit="%" icon={Droplet} color="#0ea5e9" />}
                 </View>
            </View>
        );
    };

    const renderEditor = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {isPrescription && (
                <View style={{ marginBottom: 20 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <View>
                             <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>{patient.name}</Text>
                             <Text style={{ color: theme.textDim }}>{patient.age} Yrs • {patient.gender === 'M' ? 'Male' : 'Female'} • ID: #{patient.id}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                             <Text style={{ fontSize: 12, color: theme.textDim }}>Date</Text>
                             <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{new Date().toLocaleDateString()}</Text>
                        </View>
                     </View>
                     <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 15 }} />
                     {renderVitalsSummary()}
                     
                     <TouchableOpacity 
                        onPress={() => setShowTemplatePicker(true)}
                        style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.primary, marginBottom: 20 }}
                     >
                         <Copy size={18} color={theme.primary} />
                         <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Load from Template</Text>
                     </TouchableOpacity>
                </View>
            )}

            {!isPrescription && (
                 <View style={{ marginBottom: 25, backgroundColor: theme.cardBg, borderRadius: 20, padding: 5, shadowColor: theme.primary, shadowOffset: {width:0, height:4}, shadowOpacity:0.2, elevation:5 }}>
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ borderRadius: 16, padding: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>RX TEMPLATE</Text>
                            <FileText size={24} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>
                     <View style={{ padding: 15 }}>
                        <InputGroup icon={FileText} label="Template Name *" value={editorForm.name} onChange={t => setEditorForm({...editorForm, name: t})} theme={theme} placeholder="e.g. Viral Fever" />
                     </View>
                 </View>
            )}

            <View style={{ marginBottom: 20 }}>
                <InputGroup icon={Stethoscope} label="Diagnosis / Clinical Notes" value={editorForm.diagnosis} onChange={t => setEditorForm({...editorForm, diagnosis: t})} theme={theme} placeholder="e.g. Viral Pyrexia, URTI" />
            </View>

            {/* --- MEDICINES SECTION --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pill size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>MEDICINES (Rx)</Text>
                </View>
                <TouchableOpacity onPress={openMedModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Medicine</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {editorForm.medicines.map((med, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bae6fd' }}><Text style={{fontWeight:'bold', color:'#0ea5e9'}}>{index + 1}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{med.name} <Text style={{fontSize: 13, fontWeight: '500', color: theme.textDim}}>{med.dosage ? `(${med.dosage})` : ''}</Text></Text>
                            {med.isTapering ? (
                                <View style={{ marginTop: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2}}><TrendingDown size={12} color="#c2410c" /><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#c2410c' }}>Tapering Schedule</Text></View>
                                    <Text style={{ fontSize: 12, color: '#9a3412', fontStyle: 'italic' }}>{med.freq} for {med.duration}</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: '#fdf2f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbcfe8' }}><Text style={{ fontSize: 11, color: '#db2777', fontWeight: 'bold' }}>{med.freq}</Text></View>
                                    <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}><Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>{med.duration}</Text></View>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontStyle: 'italic' }}>{med.instruction}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleEditMedInTemplate(index)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 10, marginRight: 5 }}><Pencil size={18} color={theme.textDim} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMedFromTemplate(index)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                ))}
                {editorForm.medicines.length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No medicines added yet.</Text></View>}
            </View>

            {/* --- PROCEDURES SECTION --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Settings size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>PROCEDURES / SERVICES</Text>
                </View>
                <TouchableOpacity onPress={openProcedureModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Procedure</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {(editorForm.procedures || []).map((proc, index) => (
                     <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{proc.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.textDim }}>Category: {proc.category}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                             <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>₹{proc.cost}</Text>
                             <TouchableOpacity onPress={() => removeItemFromForm(index, 'procedure')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                        </View>
                    </View>
                ))}
                {(editorForm.procedures || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No procedures added.</Text></View>}
                {(editorForm.procedures || []).length > 0 && (
                    <View style={{ alignItems: 'flex-end', marginTop: 5 }}>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Total Estimated Cost: <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>₹{calculateTotalCost()}</Text></Text>
                    </View>
                )}
            </View>

            {/* --- INVESTIGATIONS ON NEXT VISIT SECTION (NEW) --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TestTube size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>INVESTIGATION ON NEXT VISIT</Text>
                </View>
                <TouchableOpacity onPress={openInvestigationModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Investigation</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {(editorForm.nextVisitInvestigations || []).map((item, index) => (
                     <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f9ff', alignItems:'center', justifyContent:'center'}}>
                                <TestTube size={16} color="#0284c7" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{item.name}</Text>
                                <Text style={{ fontSize: 12, color: theme.textDim }}>Next Visit</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeItemFromForm(index, 'investigation')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                ))}
                {(editorForm.nextVisitInvestigations || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No investigations added.</Text></View>}
            </View>

            {/* --- UPDATED REFERRAL SECTION --- */}
            <View style={{ marginBottom: 20 }}>
                {!showReferral ? (
                    <TouchableOpacity onPress={() => setShowReferral(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 }}>
                        <View style={{ backgroundColor: theme.inputBg, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                            <UserPlus size={18} color={theme.primary} />
                        </View>
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>+ Add Referral</Text>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: theme.textDim, fontWeight: '600' }}>Referral / Specialist Consult</Text>
                            <TouchableOpacity onPress={() => { setShowReferral(false); setEditorForm({...editorForm, referral: ''}); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={14} color="#ef4444" />
                                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: 'bold' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <UserPlus size={20} color={theme.textDim} />
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                value={editorForm.referral}
                                onChangeText={t => setEditorForm({...editorForm, referral: t})}
                                placeholder="e.g. Refer to Neurologist, Dr. Smith"
                                placeholderTextColor={theme.textDim}
                            />
                        </View>
                    </View>
                )}
            </View>

            <InputGroup icon={Clipboard} label="Advice / Notes" value={editorForm.advice} onChange={t => setEditorForm({...editorForm, advice: t})} theme={theme} multiline placeholder="Enter patient advice (e.g., Drink warm water)..." />
            
            {isPrescription && (
                <View style={{ marginTop: 20, backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                    <View style={{flex: 1}}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Save as New Template</Text>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Use this combination later</Text>
                        {saveAsTemplate && (
                             <TextInput 
                                style={{ marginTop: 8, padding: 8, backgroundColor: theme.inputBg, borderRadius: 8, color: theme.text, borderWidth:1, borderColor: theme.border }}
                                placeholder="Enter Template Name..."
                                placeholderTextColor={theme.textDim}
                                value={editorForm.name}
                                onChangeText={(t) => setEditorForm({...editorForm, name: t})}
                             />
                        )}
                    </View>
                    <Switch value={saveAsTemplate} onValueChange={setSaveAsTemplate} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor={'white'} />
                </View>
            )}

            {isPrescription && (
                <View style={{ marginTop: 40, alignItems: 'flex-end', opacity: 0.7 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>Dr. Mansoor Ali V. P.</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Cardiologist</Text>
                </View>
            )}
        </ScrollView>
    );

    // --- REFACTORED PROCEDURE PICKER MODAL ---
    const renderProcedureModal = () => {
        // Filter Logic
        const procMatches = (procedures || []).filter(p => p.name.toLowerCase().includes(procSearch.toLowerCase()) && procSearch.length > 0);
        
        // Helper to get category details
        const getCatInfo = (catName) => PROCEDURE_CATEGORIES.find(c => c.value === catName) || PROCEDURE_CATEGORIES[0];
        
        // Dynamic Title based on Type
        const modalTitle = procModalType === 'investigation' ? 'Add Investigation' : 'Add Procedure';
        const customBtnLabel = procModalType === 'investigation' ? 'Add Custom Investigation' : 'Add Custom Procedure';

        // Content to render based on view mode
        const renderModalContent = () => {
            if (procViewMode === 'list') {
                return (
                    <View style={{flex: 1}}>
                         {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setProcModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><X size={20} color={theme.textDim} /></TouchableOpacity>
                        </View>

                         {/* Add New Master Button (Top Right Action) */}
                        <View style={{position: 'absolute', top: 0, right: 50}}>
                             <TouchableOpacity onPress={openAddMasterProc} style={{flexDirection:'row', alignItems:'center', gap:5, backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20}}>
                                 <PlusCircle size={16} color={theme.primary} />
                                 <Text style={{color: theme.primary, fontSize: 12, fontWeight: 'bold'}}>New</Text>
                             </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                                <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                                <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder={procModalType === 'investigation' ? "Search investigation..." : "Search procedure..."} placeholderTextColor={theme.textDim} value={procSearch} onChangeText={setProcSearch} />
                                {procSearch.length > 0 && <TouchableOpacity onPress={() => setProcSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                            </View>
                        </View>

                         {/* Custom Investigation Toggle */}
                         <TouchableOpacity onPress={() => setShowCustomInput(!showCustomInput)} style={{flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', backgroundColor: showCustomInput ? theme.inputBg : theme.cardBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                             <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                 <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center'}}>
                                     <FlaskConical size={18} color="#8b5cf6" />
                                 </View>
                                 <Text style={{fontWeight: 'bold', color: theme.text}}>{customBtnLabel}</Text>
                             </View>
                             <ChevronDown size={20} color={theme.textDim} style={{transform: [{rotate: showCustomInput ? '180deg' : '0deg'}]}} />
                         </TouchableOpacity>

                         {/* Custom Input Fields (Visible only if toggled) */}
                         {showCustomInput && (
                             <View style={{backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, marginBottom: 15, gap: 10}}>
                                 <InputGroup icon={FileText} label="Name" value={customProcForm.name} onChange={t => setCustomProcForm({...customProcForm, name: t})} theme={theme} placeholder={procModalType === 'investigation' ? "e.g. Thyroid Profile" : "e.g. X-Ray Chest"} />
                                 <View style={{flexDirection:'row', gap: 10, alignItems: 'flex-end'}}>
                                     <View style={{flex: 1}}>
                                         <InputGroup icon={Banknote} label="Price (Optional)" value={customProcForm.cost} onChange={t => setCustomProcForm({...customProcForm, cost: t})} theme={theme} placeholder="0" keyboardType="numeric" />
                                     </View>
                                     <TouchableOpacity onPress={addCustomToRx} style={{backgroundColor: theme.primary, height: 55, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4}}>
                                         <Text style={{color: 'white', fontWeight: 'bold'}}>Add</Text>
                                     </TouchableOpacity>
                                 </View>
                             </View>
                         )}

                         {/* Procedures List */}
                         <FlatList 
                            data={procSearch.length > 0 ? procMatches : procedures}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={{paddingBottom: 20}}
                            showsVerticalScrollIndicator={false}
                            renderItem={({item}) => {
                                const catInfo = getCatInfo(item.category);
                                return (
                                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                                            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: catInfo.bg, alignItems: 'center', justifyContent: 'center' }}>
                                                <catInfo.icon size={20} color={catInfo.color} />
                                            </View>
                                            <View style={{flex: 1}}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                                    {procModalType === 'procedure' && <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>₹{item.cost}</Text>}
                                                    <Text style={{ color: theme.textDim, fontSize: 12 }}>• {item.category}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <TouchableOpacity onPress={() => addProcedureToForm(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                                <PlusCircle size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openEditMasterProc(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                                <Pencil size={18} color={theme.textDim} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteMasterProcedure(item.id)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }}
                         />
                    </View>
                );
            } else {
                // ADD / EDIT MASTER MODE
                return (
                    <View style={{flex: 1}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{procViewMode === 'edit_master' ? 'Edit Item' : 'Add New Item'}</Text>
                            <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><ArrowLeft size={20} color={theme.textDim} /></TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 15 }}>
                                <InputGroup icon={Settings} label="Name *" value={masterProcForm.name} onChange={t => setMasterProcForm({...masterProcForm, name: t})} theme={theme} placeholder="Enter name" />
                                <InputGroup icon={Banknote} label="Price (₹)" value={masterProcForm.cost} onChange={t => setMasterProcForm({...masterProcForm, cost: t})} theme={theme} placeholder="Enter price" keyboardType="numeric" />
                                {/* Simple Category Selector for speed - could use CustomPicker if needed */}
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10}}>
                                        {PROCEDURE_CATEGORIES.map((cat) => (
                                            <TouchableOpacity 
                                                key={cat.value} 
                                                onPress={() => setMasterProcForm({...masterProcForm, category: cat.value})}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                                                    backgroundColor: masterProcForm.category === cat.value ? cat.color : theme.inputBg,
                                                    borderWidth: 1, borderColor: masterProcForm.category === cat.value ? cat.color : theme.border
                                                }}
                                            >
                                                <cat.icon size={14} color={masterProcForm.category === cat.value ? 'white' : cat.color} />
                                                <Text style={{color: masterProcForm.category === cat.value ? 'white' : theme.text, fontWeight: '600', fontSize: 12}}>{cat.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                            <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.inputBg }}>
                                <Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveMasterProcedure} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }
        };

        return (
            <Modal visible={procModalVisible} animationType="slide" transparent onRequestClose={() => setProcModalVisible(false)}>
                 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                         <TouchableOpacity style={{ flex: 1 }} onPress={() => setProcModalVisible(false)} />
                         <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '85%', shadowColor: "#000", shadowOffset: {width:0, height:-10}, shadowOpacity:0.3, elevation:20 }}>
                             {renderModalContent()}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const TemplateDetailPopup = () => {
        if (!selectedTemplate || !viewModalVisible) return null;
        return (
            <Modal visible={viewModalVisible} transparent animationType="fade" onRequestClose={() => setViewModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
                     <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewModalVisible(false)} />
                     <View style={{ backgroundColor: theme.cardBg, borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOpacity:0.3, elevation:10, maxHeight: '80%' }}>
                        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <FileText size={24} color="white" />
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Template Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 5 }}>{selectedTemplate.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                                <Stethoscope size={16} color={theme.textDim} />
                                <Text style={{ fontSize: 14, color: theme.textDim, fontWeight: '600' }}>Diagnosis: {selectedTemplate.diagnosis}</Text>
                            </View>
                            <Text style={{ fontSize: 14, color: theme.textDim, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>Medicines List</Text>
                            <View style={{ gap: 10, marginBottom: 20 }}>
                                {selectedTemplate.medicines.map((med, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
                                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Pill size={16} color={theme.primary} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{med.name} <Text style={{fontSize: 12, color: theme.textDim}}>({med.dosage})</Text></Text>
                                            {med.isTapering ? (
                                                <Text style={{ fontSize: 12, color: '#c2410c', marginTop: 2, fontStyle:'italic' }}>Tapering: {med.freq} for {med.duration}</Text>
                                            ) : (
                                                <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>{med.freq} • {med.duration} • {med.instruction}</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <Clipboard size={16} color="#c2410c" />
                                    <Text style={{ fontWeight: 'bold', color: '#c2410c' }}>Advice / Notes</Text>
                                </View>
                                <Text style={{ color: '#9a3412', fontStyle: 'italic' }}>{selectedTemplate.advice || "No specific advice."}</Text>
                            </View>
                        </ScrollView>
                     </View>
                </View>
            </Modal>
        );
    };

    const TemplatePickerModal = () => (
        <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: height * 0.7, paddingBottom: 30 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Select a Template</Text>
                        <TouchableOpacity onPress={() => setShowTemplatePicker(false)}><X size={24} color={theme.textDim} /></TouchableOpacity>
                    </View>
                    
                    {/* NEW: Template Search Bar */}
                    <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: theme.border }}>
                            <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                            <TextInput 
                                style={{ flex: 1, color: theme.text }}
                                placeholder="Search templates..."
                                placeholderTextColor={theme.textDim}
                                value={templatePickerSearch}
                                onChangeText={setTemplatePickerSearch}
                            />
                             {templatePickerSearch.length > 0 && <TouchableOpacity onPress={() => setTemplatePickerSearch('')}><X size={16} color={theme.textDim} /></TouchableOpacity>}
                        </View>
                    </View>

                    <FlatList 
                        data={templates.filter(t => t.name.toLowerCase().includes(templatePickerSearch.toLowerCase()))}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => applyTemplate(item)} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                    <View style={{ backgroundColor: theme.inputBg, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={20} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                                        <Text style={{ fontSize: 12, color: theme.textDim }}>{item.medicines.length} Medicines • {item.diagnosis}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={16} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{textAlign: 'center', padding: 20, color: theme.textDim}}>No templates available.</Text>}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, getPaddedContentStyle(layout, { marginTop: insets.top + 10 })]}>
                {view === 'list' && !isPrescription ? (
                     <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => isPrescription ? onBack() : setView('list')} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                
                <View style={{flex: 1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {isPrescription ? 'New Prescription' : view === 'list' ? 'Templates' : editorForm.id ? 'Edit Template' : 'New Template'}
                    </Text>
                    {isPrescription ? <Text style={{ fontSize: 12, color: theme.textDim }}>Write Rx for {patient?.name}</Text> : view === 'list' && <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your prescription sets</Text>}
                </View>

                {view === 'list' && !isPrescription ? (
                    <TouchableOpacity onPress={handleCreate} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleSaveTemplate} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Save size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {view === 'list' && !isPrescription ? renderList() : renderEditor()}
            </KeyboardAvoidingView>
            <PrescriptionMedicineModal
                visible={medModalVisible}
                theme={theme}
                medicines={medicines}
                medSearch={medSearch}
                setMedSearch={setMedSearch}
                newMedForm={newMedForm}
                setNewMedForm={setNewMedForm}
                editingMedIndex={editingMedIndex}
                freqOptions={freqOptions}
                durOptions={durOptions}
                doseOptions={doseOptions}
                instrOptions={instrOptions}
                onClose={() => setMedModalVisible(false)}
                onSelectInventoryMed={selectInventoryMed}
                onClearSelection={clearSelection}
                onOpenAddInput={openAddInput}
                onLongPressItem={handleLongPressItem}
                onSubmit={addMedToTemplate}
            />
            {renderProcedureModal()} 
            {TemplateDetailPopup()}
            {TemplatePickerModal()}
            
            {/* Simple Input Modal for Items */}
            <Modal visible={inputVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxWidth: 300, backgroundColor: theme.cardBg, borderRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 15 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.primary }]}>
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} value={inputText} onChangeText={setInputText} autoFocus placeholder="Type custom value..." placeholderTextColor={theme.textDim} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setInputVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleAddItem} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: theme.primary }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{editingItem ? 'Update' : 'Add'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
// --- END TEMPLATE SCREEN ---

// --- VITALS SCREEN (REFACTORED - CLEAN & EDITABLE ONLY) ---
// eslint-disable-next-line no-unused-vars
const VitalsScreen = ({ theme, onBack, patient, onSaveVitals, showToast, layout }) => {
    const insets = useSafeAreaInsets();
    
    // Initial state based on the LATEST history record if available
    const [form, setForm] = useState({
        sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C'
    });

    // On Load: Populate with latest vitals
    useEffect(() => {
        if (patient?.vitalsHistory && patient.vitalsHistory.length > 0) {
            const latest = patient.vitalsHistory[0]; // Assuming index 0 is latest
            setForm({
                sys: latest.sys || '',
                dia: latest.dia || '',
                pulse: latest.pulse || '',
                spo2: latest.spo2 || '',
                weight: latest.weight || '',
                temp: latest.temp || '',
                tempUnit: latest.tempUnit || 'C'
            });
        }
    }, [patient]);

    const handleSave = () => {
        if (!form.sys && !form.weight && !form.temp) {
            Alert.alert("Empty Input", "Please enter at least one vital sign.");
            return;
        }

        // Logic: Create a new record timestamped NOW, but effectively "updating" current status
        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...form
        };

        // Add to TOP of history (Latest)
        const updatedHistory = [newEntry, ...(patient.vitalsHistory || [])];
        
        onSaveVitals(patient.id, updatedHistory);
        showToast('Success', 'Current Vitals Updated', 'success');
        // Keyboard.dismiss(); // Optional: Dismiss if you want, or keep open for multiple edits
    };

    const MedicalInput = ({ icon: Icon, label, value, onChange, unit, placeholder, color, width = '48%' }) => (
        <View style={{ width: width, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, 
                borderRadius: 12, height: 55, 
                borderWidth: 1.5, borderColor: value ? color : theme.border, 
                paddingHorizontal: 12, 
                shadowColor: value ? color : "#000", shadowOffset: {width:0,height:2}, shadowOpacity: value ? 0.15 : 0.05, shadowRadius: 3, elevation: value ? 3 : 1 
            }}>
                <Icon size={20} color={value ? color : theme.textDim} strokeWidth={2.5} />
                <TextInput 
                    style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textDim}
                    keyboardType="numeric"
                />
                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>{unit}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, getPaddedContentStyle(layout, { marginTop: insets.top + 10, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border })]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{flex:1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Patient Vitals</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '500' }}>Patient: {patient?.name}</Text>
                </View>
                <TouchableOpacity onPress={handleSave} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5 }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Save Update</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 100 })} showsVerticalScrollIndicator={false}>
                {/* NOTICE BOX */}
                <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', marginBottom: 25, flexDirection: 'row', gap: 10 }}>
                    <AlertCircle size={20} color="#c2410c" />
                    <Text style={{ color: '#9a3412', fontSize: 13, flex: 1, lineHeight: 20 }}>
                        <Text style={{fontWeight: 'bold'}}>Note:</Text> Updating vitals here will update the patient&apos;s current record.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Activity size={20} color={theme.primary} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Current Readings</Text>
                    </View>
                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600' }}>
                            {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* INPUT GRID - CLEAN LAYOUT */}
                <View style={{ backgroundColor: theme.inputBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={Activity} label="Systolic (High)" value={form.sys} onChange={t => setForm({...form, sys: t})} unit="mmHg" placeholder="120" color="#ef4444" />
                        <MedicalInput icon={Activity} label="Diastolic (Low)" value={form.dia} onChange={t => setForm({...form, dia: t})} unit="mmHg" placeholder="80" color="#ef4444" />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={HeartPulse} label="Pulse Rate" value={form.pulse} onChange={t => setForm({...form, pulse: t})} unit="BPM" placeholder="72" color="#8b5cf6" />
                        <MedicalInput icon={Droplet} label="SpO2 Level" value={form.spo2} onChange={t => setForm({...form, spo2: t})} unit="%" placeholder="98" color="#0ea5e9" />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={Weight} label="Weight" value={form.weight} onChange={t => setForm({...form, weight: t})} unit="kg" placeholder="65" color="#10b981" />
                        <View style={{ width: '48%', marginBottom: 15 }}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                                <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>Temp</Text>
                                <TouchableOpacity onPress={() => setForm({...form, tempUnit: form.tempUnit === 'C' ? 'F' : 'C'})}>
                                    <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}>Scale: °{form.tempUnit}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ 
                                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, 
                                borderRadius: 12, height: 55, 
                                borderWidth: 1.5, borderColor: form.temp ? '#f59e0b' : theme.border, 
                                paddingHorizontal: 12, 
                                shadowColor: form.temp ? "#f59e0b" : "#000", shadowOpacity: form.temp ? 0.15 : 0.05, elevation: 2 
                            }}>
                                <Thermometer size={20} color={form.temp ? '#f59e0b' : theme.textDim} strokeWidth={2.5} />
                                <TextInput style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }} value={form.temp} onChangeText={t => setForm({...form, temp: t})} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>°{form.tempUnit}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                
                {/* DECORATIVE FILLER FOR EMPTY SPACE SINCE HISTORY IS GONE */}
                <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.3 }}>
                    <Activity size={80} color={theme.textDim} />
                    <Text style={{ marginTop: 15, color: theme.textDim, fontSize: 14 }}>Enter latest clinical data above</Text>
                </View>
            </ScrollView>
        </View>
    );
};

// --- PATIENT MANAGEMENT SCREEN ---
// eslint-disable-next-line no-unused-vars
const PatientScreen = ({ theme, onBack, patients, setPatients, appointments, setAppointments, selectedPatientId, onBookAppointment, onNavigate, showToast, layout }) => {
    const insets = useSafeAreaInsets();
    const createEmptyVitalsDraft = () => ({ sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C' });
    const createEmptyPatientDraft = () => ({ name: '', mobile: '', email: '', age: '', dob: '', dobObj: new Date(), gender: 'M', blood: 'O+', address: '', vitals: createEmptyVitalsDraft() });
    const hasVitalsData = (vitals) => ['sys', 'dia', 'pulse', 'spo2', 'weight', 'temp'].some((key) => String(vitals?.[key] || '').trim().length > 0);
    const [view, setView] = useState('list'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [addVisible, setAddVisible] = useState(false);
    const [newPatient, setNewPatient] = useState(createEmptyPatientDraft());
    const [pickerVisible, setPickerVisible] = useState(false);
    const [showDobPicker, setShowDobPicker] = useState(false);

    useEffect(() => {
        if (selectedPatientId) {
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                setSelectedPatient(patient);
                setView('detail');
            }
        }
    }, [selectedPatientId, patients]);

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mobile.includes(searchQuery) || p.id.toString().includes(searchQuery));
    const totalPatients = patients.length;
    const phoneRegistered = patients.filter(p => p.mobile && p.mobile.length > 0).length;
    
    const handleDelete = (id) => {
        Alert.alert(
            "Delete Patient", "This will permanently remove the patient.",
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => {
                        const updated = patients.filter(p => p.id !== id);
                        setPatients(updated);
                        if(view !== 'list') setView('list');
                        showToast('Deleted', 'Patient removed successfully.', 'error');
                    }}]
        );
    };

    const handleSaveEdit = () => {
        if (!editForm.name || !editForm.mobile) { Alert.alert("Error", "Name and Mobile are required"); return; }
        const updated = patients.map(p => p.id === editForm.id ? editForm : p);
        setPatients(updated);
        showToast('Success', 'Patient Details Updated!', 'success');
        setView('list');
    };

    const handleDobChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDobPicker(false);
        if (selectedDate) {
            const age = calculateAge(selectedDate);
            const dateStr = selectedDate.toISOString().split('T')[0];
            if (addVisible) {
                setNewPatient({ ...newPatient, dobObj: selectedDate, dob: dateStr, age: age });
            } else {
                setEditForm({ ...editForm, dob: dateStr, age: age }); 
            }
        }
    };

    const handleAddNew = () => {
        if (!newPatient.name || !newPatient.mobile) { Alert.alert("Required", "Please enter Patient Name and Mobile Number."); return; }
        const timestamp = Date.now();
        const initialVitals = hasVitalsData(newPatient.vitals)
            ? [{ id: timestamp + 1, date: new Date().toISOString(), ...newPatient.vitals }]
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

    const openNothing = () => {};

    const StatBadge = ({ label, value, icon: Icon, color }) => (
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 12, flex: 1, borderWidth: 1, borderColor: theme.border, alignItems: 'center', minWidth: 100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Icon size={14} color={color} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{value}</Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.textDim, textAlign: 'center' }}>{label}</Text>
        </View>
    );

    const PatientAvatar = ({ patient }) => (
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: theme.mode === 'dark' ? 'rgba(45,212,191,0.2)' : '#ccfbf1', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '800' }}>{patient?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
    );

    const handleHeaderBack = () => {
        if (view === 'list') { onBack(); } 
        else {
            if (selectedPatientId) onBack(); 
            else setView('list');
        }
    };

    const renderList = () => (
        <View style={{ flex: 1 }}>
                 <View style={[getPaddedContentStyle(layout, { marginBottom: 15 }), { flexDirection: 'row', gap: 10 }]}>
                <StatBadge label="Total Patients" value={totalPatients} icon={User} color={theme.primary} />
                <StatBadge label="Phone Reg." value={phoneRegistered} icon={Phone} color="#10b981" />
            </View>

                 <View style={getPaddedContentStyle(layout, { marginBottom: 15 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                    <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search Name / Mobile / ID..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <X size={18} color={theme.textDim} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={[getPaddedContentStyle(layout, { paddingBottom: 100 }), { flex: 1 }]}>
                {filteredPatients.length > 0 ? (
                    <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ minWidth: 1040, flex: 1 }}>
                                <View style={{ flexDirection: 'row', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: theme.border, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                                    <Text style={{ width: 230, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient</Text>
                                    <Text style={{ width: 160, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile</Text>
                                    <Text style={{ width: 150, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Age / Gender</Text>
                                    <Text style={{ width: 120, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Blood Group</Text>
                                    <Text style={{ width: 150, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Registered</Text>
                                    <Text style={{ flex: 1, minWidth: 170, color: theme.textDim, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                </View>

                                <FlatList
                                    data={filteredPatients}
                                    keyExtractor={(item) => item.id.toString()}
                                    style={{ maxHeight: 520, borderWidth: 1, borderTopWidth: 0, borderColor: theme.border, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: theme.cardBg }}
                                    nestedScrollEnabled
                                    renderItem={({ item, index }) => (
                                        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: index === filteredPatients.length - 1 ? 0 : 1, borderBottomColor: theme.border, backgroundColor: index % 2 === 0 ? theme.cardBg : theme.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fcfdff' }}>
                                            <TouchableOpacity activeOpacity={0.75} onPress={() => openNothing()} style={{ width: 230, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <PatientAvatar patient={item} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>#{item.id}</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <View style={{ width: 160, paddingRight: 12 }}>
                                                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.mobile || 'N/A'}</Text>
                                            </View>

                                            <View style={{ width: 150, paddingRight: 12 }}>
                                                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.age || 'N/A'} / {item.gender === 'M' ? 'Male' : item.gender === 'F' ? 'Female' : 'N/A'}</Text>
                                            </View>

                                            <View style={{ width: 120, paddingRight: 12 }}>
                                                <View style={{ alignSelf: 'flex-start', backgroundColor: theme.mode === 'dark' ? 'rgba(14,165,233,0.16)' : '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                                                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{item.blood || 'N/A'}</Text>
                                                </View>
                                            </View>

                                            <View style={{ width: 150, paddingRight: 12 }}>
                                                <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '600' }}>{item.registeredDate || 'N/A'}</Text>
                                            </View>

                                            <View style={{ flex: 1, minWidth: 170, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                <TouchableOpacity onPress={() => openPatientPopup(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.18)' : '#dbeafe', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                    <Eye size={16} color={theme.primary} />
                                                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>View</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => openEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                    <Pencil size={16} color={theme.text} />
                                                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                    <Trash2 size={16} color="#ef4444" />
                                                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                />
                            </View>
                        </ScrollView>
                        <View style={{ marginTop: 8, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>{`Showing ${filteredPatients.length} of ${patients.length} patients`}</Text>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>Scroll sideways for full details</Text>
                        </View>
                    </>
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 50 }}><Text style={{ color: theme.textDim }}>No patients found.</Text></View>
                )}
            </View>
        </View>
    );

    const PatientDetailPopup = () => {
        if (!viewingPatient || !detailModalVisible) return null;
        return (
            <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDetailModalVisible(false)} />
                    <View style={{ backgroundColor: theme.cardBg, borderRadius: 30, overflow: 'hidden', width: '100%', shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
                        <LinearGradient colors={['#2dd4bf', '#0f766e']} style={{ padding: 20, paddingBottom: 40, position: 'relative' }}>
                            <View style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ position: 'absolute', bottom: -10, right: 10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1, fontSize: 12 }}>MEDICAL RECORD</Text>
                                <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={{ alignItems: 'center', marginTop: -35 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                                <View style={{ width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{viewingPatient.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 10, textTransform: 'uppercase' }}>{viewingPatient.name}</Text>
                            <Text style={{ fontSize: 14, color: theme.textDim, marginBottom: 20 }}>{viewingPatient.age} Years • {viewingPatient.gender === 'M' ? 'Male' : 'Female'}</Text>
                        </View>

                        <View style={{ paddingHorizontal: 25, paddingBottom: 30 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#eff6ff', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Droplet size={18} color="#3b82f6" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.blood || 'N/A'}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>BLOOD</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#fdf2f8', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <User size={18} color="#ec4899" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.gender}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>GENDER</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#fefce8', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Weight size={18} color="#eab308" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>65 kg</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>WEIGHT</Text>
                                </View>
                            </View>

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, marginBottom: 12, letterSpacing: 1 }}>CONTACT DETAILS</Text>
                            <View style={{ backgroundColor: theme.inputBg, borderRadius: 16, padding: 15, gap: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Phone Number</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.mobile}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Email Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.email || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><MapPin size={16} color="#0f766e" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.address || 'Not Provided'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 5 }}>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Patient ID: <Text style={{fontWeight:'bold', color: theme.text}}>#{viewingPatient.id}</Text></Text>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Reg: <Text style={{fontWeight:'bold', color: theme.text}}>{viewingPatient.registeredDate || 'N/A'}</Text></Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderDetail = () => {
        if (!selectedPatient) return null;
        
        const ActionGridItem = ({ title, icon: Icon, onPress, colors }) => (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ width: '47%', marginBottom: 15 }}>
                <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ padding: 15, borderRadius: 20, height: 100, justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: colors[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon color="white" size={20} strokeWidth={2.5} />
                    </View>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{title}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );

        const handleShare = async () => {
            const message = `Patient ID Card\n\nName: ${selectedPatient.name}\nID: ${selectedPatient.id}\nAge/Gender: ${selectedPatient.age} / ${selectedPatient.gender}\nPhone: ${selectedPatient.mobile}`;
            try { await Share.share({ message }); } catch (_error) { Alert.alert("Error", "Could not share."); }
        };

        const handleDownload = () => { showToast('Success', 'ID Card Image Saved', 'success'); };

        const ACTIONS = [
            { id: 1, title: 'Add Vitals', icon: HeartPulse, colors: ['#2dd4bf', '#0f766e'], action: () => onNavigate('vitals', selectedPatient) },
            { id: 2, title: 'Prescribe now', icon: FilePlus, colors: ['#a78bfa', '#8b5cf6'], action: () => onNavigate('prescription', selectedPatient) },
            // ADDED Rx History BACK
            { id: 3, title: 'Rx History', icon: Clipboard, colors: ['#f97316', '#c2410c'], action: () => Alert.alert("Rx History", `View history for ${selectedPatient.name}`) }, 
            { id: 5, title: 'Add Lab Report', icon: TestTube, colors: ['#60a5fa', '#3b82f6'], action: () => Alert.alert("Coming Soon", "Lab Reports") },
        ];

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 150 })}>
                 <View style={{ backgroundColor: '#116A7B', borderRadius: 16, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
                    <View style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <View style={{ position: 'absolute', top: -10, left: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    
                    <View style={{ padding: 20 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 }}>ID CARD</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                <User size={40} color="black" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PATIENT NAME:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.name}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>ID NO:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: 000{selectedPatient.id}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>AGE/GENDER:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.age} Yrs / {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PHONE:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.mobile}</Text></View>
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
                     {ACTIONS.map(action => (
                         <ActionGridItem key={action.id} {...action} onPress={action.action} />
                     ))}
                 </View>
            </ScrollView>
        );
    };

    const renderEdit = () => (
        <ScrollView contentContainerStyle={getPaddedContentStyle(layout)}>
            <View style={{ gap: 15 }}>
                <InputGroup icon={User} label="Patient Name *" value={editForm.name} onChange={t => setEditForm({...editForm, name: t})} theme={theme} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={editForm.mobile} onChange={t => setEditForm({...editForm, mobile: t})} theme={theme} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={editForm.email} onChange={t => setEditForm({...editForm, email: t})} theme={theme} />
                
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.dob || 'Select Date'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={editForm.age} onChange={t => setEditForm({...editForm, age: t})} theme={theme} /></View>
                </View>
                
                {/* Gender Selector in Edit Mode */}
                <GenderSelector value={editForm.gender} onChange={(val) => setEditForm({...editForm, gender: val})} theme={theme} />

                <View style={{ marginTop: 10 }}>
                     <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Droplet size={20} color={theme.textDim} />
                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.blood}</Text>
                        </View>
                        <ChevronDown size={16} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
                <InputGroup icon={MapPin} label="Address" value={editForm.address} onChange={t => setEditForm({...editForm, address: t})} theme={theme} />
            </View>
            <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => {
                setEditForm({...editForm, blood: val});
                setPickerVisible(false);
            }} theme={theme} />
            {showDobPicker && (
                <DateTimePicker value={new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />
            )}
        </ScrollView>
    );

    const renderAddModal = () => (
        <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setAddVisible(false)} />
                    <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '90%' }}>
                        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}>
                                    <UserPlus size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Add New Patient</Text>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Enter patient information</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 20 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView contentContainerStyle={getPaddedContentStyle(layout, { paddingTop: 25, paddingBottom: 25 })}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>
                            <View style={{ gap: 15 }}>
                                <InputGroup icon={User} label="Patient Name *" value={newPatient.name} onChange={t => setNewPatient({...newPatient, name: t})} theme={theme} placeholder="Ex: John Doe" />
                                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={newPatient.mobile} onChange={t => setNewPatient({...newPatient, mobile: t})} theme={theme} placeholder="Ex: 9876543210" />
                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <Cake size={20} color={theme.textDim} />
                                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.dob || 'Select Date'}</Text>
                                            </View>
                                            <ChevronDown size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 0.8 }}>
                                        <InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={newPatient.age} onChange={t => setNewPatient({...newPatient, age: t})} theme={theme} placeholder="Age" />
                                    </View>
                                </View>

                                {/* Gender Selector in Add Modal */}
                                <GenderSelector value={newPatient.gender} onChange={(val) => setNewPatient({...newPatient, gender: val})} theme={theme} />

                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Droplet size={20} color={theme.textDim} />
                                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.blood}</Text>
                                        </View>
                                        <ChevronDown size={16} color={theme.textDim} />
                                    </TouchableOpacity>
                                </View>
                                <InputGroup icon={MapPin} label="Address" value={newPatient.address} onChange={t => setNewPatient({...newPatient, address: t})} theme={theme} placeholder="City, Street..." />
                            </View>

                            <View style={{ marginTop: 28 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase' }}>Initial Vitals</Text>
                                    <Text style={{ fontSize: 11, color: theme.textDim }}>Optional</Text>
                                </View>

                                <View style={{ backgroundColor: theme.inputBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Systolic</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Activity size={18} color="#ef4444" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.sys} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, sys: t } })} placeholder="120" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>mmHg</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Diastolic</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Activity size={18} color="#dc2626" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.dia} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, dia: t } })} placeholder="80" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>mmHg</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Pulse</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <HeartPulse size={18} color="#8b5cf6" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.pulse} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, pulse: t } })} placeholder="72" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>BPM</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>SpO2</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Droplet size={18} color="#0ea5e9" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.spo2} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, spo2: t } })} placeholder="98" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>%</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' }}>Weight</Text>
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Weight size={18} color="#10b981" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.weight} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, weight: t } })} placeholder="65" placeholderTextColor={theme.textDim} keyboardType="numeric" />
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
                                            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingRight: 12 }]}>
                                                <Thermometer size={18} color="#f59e0b" />
                                                <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }} value={newPatient.vitals.temp} onChangeText={t => setNewPatient({ ...newPatient, vitals: { ...newPatient.vitals, temp: t } })} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>°{newPatient.vitals.tempUnit}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 15, marginTop: 30 }}>
                                <TouchableOpacity onPress={() => setAddVisible(false)} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                                    <Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddNew} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Patient</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
             <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => {
                if(addVisible) setNewPatient({...newPatient, blood: val});
                else setEditForm({...editForm, blood: val});
            }} theme={theme} />
             {showDobPicker && (
                <DateTimePicker value={newPatient.dobObj || new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />
            )}
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, getPaddedContentStyle(layout, { marginTop: insets.top + 10 })]}>
                <TouchableOpacity onPress={handleHeaderBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    {view === 'list' ? <ArrowLeft size={24} color={theme.text} /> : <X size={24} color={theme.text} />}
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {view === 'list' ? 'Patient List' : view === 'detail' ? 'Patient Profile' : 'Edit Patient'}
                </Text>
                
                {/* Header Actions Logic */}
                {view === 'list' ? (
                    <TouchableOpacity onPress={() => setAddVisible(true)} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : view === 'edit' ? (
                    // Small "Update" Button in Header
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
            {renderAddModal()}
            {PatientDetailPopup()}
        </View>
    );
};

// Medicine inventory screen moved to app/pages/screens/MedicineScreen.js

// --- 4. APPOINTMENT SCREEN ---
// eslint-disable-next-line no-unused-vars
const AppointmentScreen = ({ theme, onBack, form, setForm, appointments, setAppointments, patients, setPatients, onSelectPatient, viewMode, setViewMode, showToast, layout }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null); 
    const [pickerType, setPickerType] = useState(null); 
    const [pickerMode, setPickerMode] = useState(null); 
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [patientSearch, setPatientSearch] = useState('');
    
    const tabs = [
        { id: 'upcoming', label: 'Upcoming' }, 
        { id: 'pending', label: 'Pending' },
        { id: 'lastWeek', label: 'Last Week' } 
    ];
    
    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const resetForm = () => {
        setForm(INITIAL_FORM_STATE);
        setPatientSearch('');
    };

    const handleQuickSave = () => {
        if (!form.name || !form.mobile) { Alert.alert("Missing Info", "Patient Name and Mobile are required."); return; }
        
        const finalBlood = form.blood === 'Custom' ? form.customBlood : form.blood;
        const appointmentData = {
            name: form.name,
            mobile: form.mobile,
            email: form.email, 
            time: formatTime(form.timeObj),
            date: formatDate(form.dateObj),
            notes: form.notes || "Regular Visit",
            blood: finalBlood 
        };

        if (editingId) {
            const updated = appointments.map(a => a.id === editingId ? { ...a, ...appointmentData, status: 'upcoming' } : a);
            setAppointments(updated);
            showToast('Success', 'Appointment Updated', 'success');
        } else {
            const newAppt = { id: Date.now(), ...appointmentData, status: 'upcoming' };
            let newAppointments = [newAppt, ...appointments];

            if (form.isFollowUp) {
                const followUpAppt = {
                    id: Date.now() + 1,
                    name: form.name,
                    mobile: form.mobile,
                    email: form.email,
                    time: "09:00 AM",
                    date: formatDate(form.followUpObj),
                    notes: "Follow-up Visit",
                    status: 'pending'
                };
                newAppointments = [...newAppointments, followUpAppt];
                showToast('Success', 'Appointment & Follow-up Created!', 'success');
            } else {
                showToast('Success', 'Appointment Booked Successfully!', 'success');
            }
            setAppointments(newAppointments);
            setActiveTab('upcoming');

            const patientExists = patients.find(p => p.mobile === form.mobile);
            if (!patientExists) {
                const newPatient = {
                    id: Date.now() + 50, 
                    name: form.name,
                    mobile: form.mobile,
                    email: form.email || "", 
                    age: form.age || "N/A",
                    dob: form.dob || "", 
                    gender: form.gender || "M",
                    blood: finalBlood,
                    address: form.address || "",
                    registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    vitalsHistory: [],
                    rxHistory: []
                };
                setPatients(prev => [newPatient, ...prev]);
            }
        }
        resetForm();
        setEditingId(null);
        setViewMode('list');
    };

    const handleCall = (mobile) => Linking.openURL(`tel:${mobile}`);
    const handleWhatsApp = (mobile) => Linking.openURL(`whatsapp://send?phone=${mobile}&text=Hello, this is regarding your appointment.`);
    const handleComplete = (id) => { showToast('Completed', 'Appointment marked as done.', 'success'); const filtered = appointments.filter(a => a.id !== id); setAppointments(filtered); };
    const handlePending = (id) => { const updated = appointments.map(a => a.id === id ? { ...a, status: 'pending' } : a); setAppointments(updated); showToast('Moved', 'Appointment moved to Pending.', 'info'); };

    const openDatePicker = (mode, currentVal) => {
        setPickerMode(mode);
        const validDate = currentVal instanceof Date ? currentVal : new Date();
        setTempDate(validDate);
        setShowDatePicker(true);
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') saveDateSelection(selectedDate);
        }
    };

    const saveDateSelection = (dateToSave) => {
        const date = dateToSave || tempDate;
        if (pickerMode === 'date') setForm(prev => ({ ...prev, dateObj: date, date: formatDate(date) }));
        else if (pickerMode === 'time') setForm(prev => ({ ...prev, timeObj: date, time: formatTime(date) }));
        else if (pickerMode === 'followup') setForm(prev => ({ ...prev, followUpObj: date, followUpDate: formatDate(date) }));
        else if (pickerMode === 'dob') {
            const age = calculateAge(date);
            setForm(prev => ({ ...prev, dobObj: date, dob: date.toISOString().split('T')[0], age: age }));
        }
        setShowDatePicker(false);
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Appointment", "Remove this booking?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => { 
            const filtered = appointments.filter(a => a.id !== id); 
            setAppointments(filtered);
            showToast('Deleted', 'Appointment removed.', 'error');
        }}]);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            name: item.name, mobile: item.mobile, email: item.email || '', age: '', gender: 'M', address: '', 
            blood: item.blood || 'O+', customBlood: '', date: item.date, time: item.time, notes: item.notes,
            isFollowUp: false, followUpDate: 'Next Week',
            dateObj: new Date(), timeObj: new Date(), followUpObj: new Date(), dob: '', dobObj: new Date()
        });
        setViewMode('new');
    };
    
    const getPatientMatches = () => {
        if(!patientSearch) return [];
        return patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mobile.includes(patientSearch) || p.id.toString().includes(patientSearch));
    };
    
    const fillPatientData = (p) => {
        setForm(prev => ({
            ...prev,
            name: p.name,
            mobile: p.mobile,
            email: p.email || '',
            age: p.age,
            dob: p.dob || '',
            gender: p.gender,
            blood: p.blood,
            address: p.address || ''
        }));
        setPatientSearch('');
        Keyboard.dismiss();
    };

    const renderList = () => {
        let filteredData = appointments.filter(a => a.status === activeTab);
        if (searchQuery) filteredData = filteredData.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.mobile.includes(searchQuery));

        return (
            <View style={{ flex: 1 }}>
                <View style={getPaddedContentStyle(layout, { marginBottom: 15 })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search Name / Mobile..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                </View>
                <View style={[getPaddedContentStyle(layout, { marginBottom: 20 }), { flexDirection: 'row', gap: 10 }]}>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: isActive ? theme.primary : theme.inputBg, borderWidth: 1, borderColor: isActive ? theme.primary : theme.border, alignItems: 'center' }}>
                                <Text style={{ fontWeight: '700', color: isActive ? 'white' : theme.textDim, fontSize: 13 }}>{tab.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
                <ScrollView contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 100 })} showsVerticalScrollIndicator={false}>
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectPatient(item)} key={item.id} style={{ backgroundColor: theme.cardBg, borderRadius: 18, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05, shadowRadius: 5, elevation: 3 }}>
                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingVertical: 10, width: 65, height: 70 }}>
                                        <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>{item.time.split(' ')[0]}</Text>
                                        <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '600', textTransform: 'uppercase' }}>{item.time.split(' ')[1]}</Text>
                                    </View>
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16, marginBottom: 4 }}>{item.name} <Text style={{fontSize: 12, color: theme.textDim}}>(#{item.id})</Text></Text>
                                            <View style={{flexDirection: 'row', gap: 12 }}>
                                                <TouchableOpacity onPress={() => handleEdit(item)}><Pencil size={18} color={theme.textDim} /></TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                                                {(activeTab === 'upcoming') && <><TouchableOpacity onPress={() => handlePending(item.id)}><Clock size={18} color="#f59e0b" /></TouchableOpacity><TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity></>}
                                                {(activeTab === 'pending') && <TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity>}
                                            </View>
                                        </View>
                                        <Text style={{ color: theme.textDim, fontSize: 13 }} numberOfLines={1}>{item.notes}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                                            <Calendar size={12} color={theme.textDim} />
                                            <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.date}</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 12 }}>• {item.mobile}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity onPress={() => handleCall(item.mobile)} style={{ flex: 1, backgroundColor: theme.inputBg, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}><Phone size={14} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Call</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleWhatsApp(item.mobile)} style={{ flex: 1, backgroundColor: theme.inputBg, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}><MessageCircle size={14} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>WhatsApp</Text></TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><AlertCircle size={40} color={theme.textDim} /></View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textDim }}>No Appointments</Text>
                            <Text style={{ color: theme.textDim, fontSize: 14 }}>Try searching or add new.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderNewPatient = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 100 })}>
            {!editingId && (
                <View style={{marginBottom: 25}}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12 }}>EASY BOOK (AUTO-FILL)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={18} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput 
                            style={{ flex: 1, color: theme.text, fontSize: 15 }} 
                            placeholder="Search Name, Mobile or ID..." 
                            placeholderTextColor={theme.textDim}
                            value={patientSearch}
                            onChangeText={setPatientSearch}
                        />
                         {patientSearch.length > 0 && <TouchableOpacity onPress={() => setPatientSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                    {patientSearch.length > 0 && (
                        <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginTop: 5, borderRadius: 12, overflow: 'hidden' }}>
                            {getPatientMatches().map((p) => (
                                <TouchableOpacity key={p.id} onPress={() => fillPatientData(p)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{p.name} <Text style={{fontSize: 10, color: theme.textDim}}>(#{p.id})</Text></Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{p.mobile}</Text>
                                    </View>
                                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, color: theme.text }}>Select</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {getPatientMatches().length === 0 && <View style={{padding: 15}}><Text style={{color: theme.textDim, fontSize: 12}}>No existing patient found. Fill details below.</Text></View>}
                        </View>
                    )}
                </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 4, height: 20, backgroundColor: theme.primary, borderRadius: 2, marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Enter patient information</Text>
            </View>
            
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>

            <View style={{ gap: 15, marginBottom: 30 }}>
                <InputGroup icon={User} label="Patient Name *" value={form.name} onChange={t => setForm({...form, name: t})} theme={theme} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={form.mobile} onChange={t => setForm({...form, mobile: t})} theme={theme} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={form.email} onChange={t => setForm({...form, email: t})} theme={theme} placeholder="patient@email.com" />

                <View style={{ flexDirection: 'row', gap: 15 }}>
                     <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => openDatePicker('dob', form.dobObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.dob || 'Select'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={form.age} onChange={t => setForm({...form, age: t})} theme={theme} /></View>
                </View>

                {/* Gender Selector in New Appointment */}
                <GenderSelector value={form.gender} onChange={(val) => setForm({...form, gender: val})} theme={theme} />

                 <View style={{ marginTop: 5 }}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerType('blood')} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Droplet size={20} color={theme.textDim} />
                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.blood}</Text>
                        </View>
                        <ChevronDown size={16} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
                {form.blood === 'Custom' && (
                    <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Enter Blood Group</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <Droplet size={20} color={theme.primary} /><TextInput style={[styles.textInput, { color: theme.text }]} value={form.customBlood} onChangeText={t => setForm({...form, customBlood: t})} placeholder="Type blood group here..." placeholderTextColor={theme.textDim} />
                        </View>
                    </View>
                )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Appointment Details</Text>
            </View>

            <View style={{ gap: 15, marginBottom: 40 }}>
                 <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date</Text>
                        <TouchableOpacity onPress={() => openDatePicker('date', form.dateObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Calendar size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.date}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Time</Text>
                        <TouchableOpacity onPress={() => openDatePicker('time', form.timeObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Clock size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.time}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                </View>

                {!editingId && (
                    <View style={{ backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                        <View><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Follow Up Required?</Text><Text style={{ color: theme.textDim, fontSize: 12 }}>Auto-create next visit record</Text></View>
                        <Switch value={form.isFollowUp} onValueChange={v => setForm({...form, isFollowUp: v})} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor={'white'} />
                    </View>
                )}

                {form.isFollowUp && (
                     <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Next Visit Date</Text>
                        <TouchableOpacity onPress={() => openDatePicker('followup', form.followUpObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.primary, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Calendar size={20} color={theme.primary} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.followUpDate}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                )}

                <View>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Booking Notes</Text>
                    <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 15, minHeight: 120 }}>
                         <TextInput style={{ color: theme.text, fontSize: 16, width: '100%', textAlignVertical: 'top', flex: 1 }} value={form.notes} onChangeText={t => setForm({...form, notes: t})} placeholder="Type complaints, visit reason, or doctor's notes here..." placeholderTextColor={theme.textDim} multiline />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <CustomPicker visible={pickerType === 'blood'} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerType(null)} onSelect={(val) => setForm({...form, blood: val})} theme={theme} />
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showDatePicker}>
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                            <View style={{ backgroundColor: theme.cardBg, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: theme.textDim, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Select {pickerMode === 'time' ? 'Time' : pickerMode === 'dob' ? 'DOB' : 'Date'}</Text>
                                    <TouchableOpacity onPress={() => saveDateSelection(tempDate)}><Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>Confirm</Text></TouchableOpacity>
                                </View>
                                <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="spinner" onChange={onDateChange} themeVariant={theme.mode} textColor={theme.text} />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="default" onChange={onDateChange} themeVariant={theme.mode} />
                )
            )}
            <View style={[styles.header, getPaddedContentStyle(layout, { marginTop: insets.top + 10 })]}>
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => { setViewMode('list'); setEditingId(null); }} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        {viewMode === 'new' ? <X size={24} color={theme.text} /> : <ArrowLeft size={24} color={theme.text} />}
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {viewMode === 'list' ? 'Appointments' : editingId ? 'Edit Appointment' : 'New Booking'}
                </Text>
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={() => setViewMode('new')} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleQuickSave} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Check size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {viewMode === 'list' && renderList()}
                {viewMode === 'new' && renderNewPatient()}
            </KeyboardAvoidingView>
        </View>
    );
};

// 6. SIDE MENU (IMPROVED 3D UI/UX)

// 8. MAIN APP ORCHESTRATOR
const MainApp = ({ skipLogin = false, onLogoutExternal }) => {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [isLoggedIn, setIsLoggedIn] = useState(skipLogin);
    const [isLoading, setIsLoading] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('home');
    const [menuVisible, setMenuVisible] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [appointmentScreenMode, setAppointmentScreenMode] = useState('list'); 
    const [appointmentEditModalVisible, setAppointmentEditModalVisible] = useState(false);
    
    // --- TOAST STATE ---
    const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'success' });
    const showToast = (title, message, type = 'success') => {
        setToast({ visible: true, title, message, type });
    };

    // --- STATE PERSISTENCE ---
    const [appointmentForm, setAppointmentForm] = useState(INITIAL_FORM_STATE);
    const [appointmentEditForm, setAppointmentEditForm] = useState({ ...INITIAL_FORM_STATE, editingId: null });
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [patients, setPatients] = useState(INITIAL_PATIENTS); 
    const [medicines, setMedicines] = useState(INITIAL_MEDICINES); 
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
    const [pendingPrescriptionTemplate, setPendingPrescriptionTemplate] = useState(null);
    const [rxIdToEdit, setRxIdToEdit] = useState(null);
    const [procedures, setProcedures] = useState(INITIAL_PROCEDURES);
    const [isApiReady, setIsApiReady] = useState(false);
    const syncBlockedRef = useRef(true);

    const theme = isDarkMode ? THEMES.dark : THEMES.light;
    const layout = getResponsiveLayout(width);
    const bottomNavConfig = getBottomNavConfig(layout, insets);
    const heroAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { 
        if(isLoggedIn && currentScreen === 'home') {
             heroAnim.setValue(0);
             Animated.timing(heroAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.exp) }).start(); 
        }
    }, [heroAnim, isLoggedIn, currentScreen]);

    useEffect(() => {
        let isMounted = true;

        const loadClinicState = async () => {
            try {
                const clinicState = await fetchClinicState();

                if (!isMounted) {
                    return;
                }

                setAppointments(clinicState.appointments || INITIAL_APPOINTMENTS);
                setPatients(clinicState.patients || INITIAL_PATIENTS);
                setMedicines(clinicState.medicines || INITIAL_MEDICINES);
                setTemplates(clinicState.templates || INITIAL_TEMPLATES);
                setProcedures(clinicState.procedures || INITIAL_PROCEDURES);
                setIsApiReady(true);

                setTimeout(() => {
                    if (isMounted) {
                        syncBlockedRef.current = false;
                    }
                }, 0);
            } catch (error) {
                console.error('Failed to load MongoDB clinic state:', error);

                if (isMounted) {
                    setToast({
                        visible: true,
                        title: 'Offline Mode',
                        message: 'MongoDB API not reachable. Using local demo data.',
                        type: 'info'
                    });
                }
            }
        };

        loadClinicState();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!isApiReady || syncBlockedRef.current) return;

        replaceClinicCollection('appointments', appointments).catch((error) => {
            console.error('Failed to sync appointments:', error);
        });
    }, [appointments, isApiReady]);

    useEffect(() => {
        if (!isApiReady || syncBlockedRef.current) return;

        replaceClinicCollection('patients', patients).catch((error) => {
            console.error('Failed to sync patients:', error);
        });
    }, [patients, isApiReady]);

    useEffect(() => {
        if (!isApiReady || syncBlockedRef.current) return;

        replaceClinicCollection('medicines', medicines).catch((error) => {
            console.error('Failed to sync medicines:', error);
        });
    }, [medicines, isApiReady]);

    useEffect(() => {
        if (!isApiReady || syncBlockedRef.current) return;

        replaceClinicCollection('templates', templates).catch((error) => {
            console.error('Failed to sync templates:', error);
        });
    }, [templates, isApiReady]);

    useEffect(() => {
        if (!isApiReady || syncBlockedRef.current) return;

        replaceClinicCollection('procedures', procedures).catch((error) => {
            console.error('Failed to sync procedures:', error);
        });
    }, [procedures, isApiReady]);

    useEffect(() => { const timer = setInterval(() => setCurrentDate(new Date()), 60000); return () => clearInterval(timer); }, []);

    const getFormattedDate = () => currentDate.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const getFormattedTime = () => currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const handleLogin = () => { setIsLoggedIn(true); setCurrentScreen('home'); };
    /** Logout: when embedded in root navigator, delegate to React Navigation; else show local login screen */
    const handleLogout = () => {
        if (onLogoutExternal) {
            onLogoutExternal();
        } else {
            setIsLoggedIn(false);
            setCurrentScreen('home');
        }
    };

    const handleBookFromProfile = (patient) => {
        setAppointmentForm({
            ...INITIAL_FORM_STATE,
            name: patient.name,
            mobile: patient.mobile,
            email: patient.email || '',
            age: patient.age,
            blood: patient.blood,
            gender: patient.gender,
            address: patient.address || ''
        });
        setAppointmentScreenMode('new');
        setCurrentScreen('appointment');
    };

    const closeAppointmentEditModal = () => {
        setAppointmentEditModalVisible(false);
        setAppointmentEditForm({ ...INITIAL_FORM_STATE, editingId: null });
    };

    const openAppointmentEditModal = (appointment) => {
        setAppointmentEditForm(buildAppointmentEditForm(appointment));
        setAppointmentEditModalVisible(true);
    };

    const handleSaveAppointmentEdit = () => {
        if (!appointmentEditForm.name || !appointmentEditForm.mobile) {
            Alert.alert('Missing Info', 'Patient Name and Mobile are required.');
            return;
        }

        const finalBlood = appointmentEditForm.blood === 'Custom' ? appointmentEditForm.customBlood : appointmentEditForm.blood;
        const updatedAppointment = {
            name: appointmentEditForm.name,
            mobile: appointmentEditForm.mobile,
            email: appointmentEditForm.email,
            time: appointmentEditForm.timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: appointmentEditForm.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            notes: appointmentEditForm.notes || 'Regular Visit',
            blood: finalBlood,
        };

        setAppointments((prev) => prev.map((item) => (
            item.id === appointmentEditForm.editingId ? { ...item, ...updatedAppointment, status: item.status || 'upcoming' } : item
        )));
        showToast('Success', 'Appointment Updated', 'success');
        closeAppointmentEditModal();
    };

    const handleDashboardAppointmentEdit = (appointment) => {
        openAppointmentEditModal(appointment);
    };

    const handleDashboardAppointmentDelete = (appointmentId) => {
        Alert.alert('Delete Appointment', 'Remove this booking?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setAppointments((prev) => prev.filter((item) => item.id !== appointmentId));
                    showToast('Deleted', 'Appointment removed.', 'error');
                }
            }
        ]);
    };

    const handleSaveVitals = (patientId, newHistory) => {
        const updatedPatients = patients.map(p => p.id === patientId ? { ...p, vitalsHistory: newHistory } : p);
        setPatients(updatedPatients);
    };

    const handleSavePrescription = (prescription) => {
        const patientId = prescription.patientId;
        
        let existingRecord = null;
        if (rxIdToEdit) {
            const patient = patients.find(p => p.id === patientId);
            existingRecord = (patient?.rxHistory || []).find(r => r.id === rxIdToEdit);
        }

        const recordData = {
            id: rxIdToEdit || Date.now(),
            date: existingRecord ? existingRecord.date : new Date().toISOString(),
            templateName: prescription.name || '',
            diagnosis: prescription.diagnosis,
            medicines: prescription.medicines,
            procedures: prescription.procedures,
            nextVisitInvestigations: prescription.nextVisitInvestigations,
            advice: prescription.advice,
            referral: prescription.referral
        };

        const updatedPatients = patients.map(p => {
            if (p.id === patientId) {
                let currentHistory = p.rxHistory || [];
                if (rxIdToEdit) {
                    currentHistory = currentHistory.map(r => r.id === rxIdToEdit ? recordData : r);
                } else {
                    currentHistory = [recordData, ...currentHistory];
                }
                return { ...p, rxHistory: currentHistory };
            }
            return p;
        });

        setPatients(updatedPatients);
        setRxIdToEdit(null);
        showToast(rxIdToEdit ? 'Updated' : 'Prescribed', rxIdToEdit ? 'Prescription updated successfully.' : 'Prescription saved to patient history.', 'success');
        setCurrentScreen('patients');
    };

    const handleEditRx = (patientId, rxItem) => {
        setSelectedPatientId(patientId);
        setPendingPrescriptionTemplate(rxItem);
        setRxIdToEdit(rxItem.id);
        setCurrentScreen('prescription');
    };

    const handleDeleteRx = (patientId, rxId) => {
        Alert.alert('Delete Prescription', 'Are you sure you want to delete this prescription?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    const updatedPatients = patients.map(p => {
                        if (p.id === patientId) {
                            return { ...p, rxHistory: (p.rxHistory || []).filter(r => r.id !== rxId) };
                        }
                        return p;
                    });
                    setPatients(updatedPatients);
                    showToast('Deleted', 'Prescription removed.', 'error');
                }
            }
        ]);
    };

    const handleHistoryEditPatient = (patient) => {
        if (!patient) return;
        setSelectedPatientId(patient.id);
        setCurrentScreen('patients');
    };

    const handleHistoryDeletePatient = (patientId) => {
        Alert.alert('Delete Patient', 'This will permanently remove the patient.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setPatients((prev) => prev.filter((p) => p.id !== patientId));
                    if (selectedPatientId === patientId) {
                        setSelectedPatientId(null);
                    }
                    showToast('Deleted', 'Patient removed successfully.', 'error');
                }
            }
        ]);
    };

    const handleUseTemplateFromTemplateScreen = (template) => {
        setPendingPrescriptionTemplate(template);
        setSelectedPatientId(null);
        setCurrentScreen('prescription');
        showToast('Template Selected', 'Now select a patient in prescription screen.', 'info');
    };

    const handleSelectPatientFromAppt = (appt) => {
        const patient = patients.find(p => p.mobile === appt.mobile || p.name === appt.name);
        if (patient) {
            setSelectedPatientId(patient.id);
            setCurrentScreen('patients');
        } else {
            Alert.alert("Profile Not Found", "This patient is not fully registered yet.");
        }
    };

    const renderContent = () => {
        switch(currentScreen) {
            case 'dashboard':
            case 'home':
                const upcomingList = appointments.filter(a => a.status === 'upcoming');
                const nextAppt = upcomingList.length > 0 ? upcomingList[0] : null;

                return (
                    <DashboardHomePage
                        theme={theme}
                        insets={insets}
                        layout={layout}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        heroAnim={heroAnim}
                        nextAppt={nextAppt}
                        upcomingAppointments={upcomingList.slice(0, 6)}
                        upcomingCount={upcomingList.length}
                        formattedDate={getFormattedDate()}
                        formattedTime={getFormattedTime()}
                        onEditAppointment={handleDashboardAppointmentEdit}
                        onDeleteAppointment={handleDashboardAppointmentDelete}
                        onOpenAppointment={() => setCurrentScreen('appointment')}
                        onOpenReports={() => setCurrentScreen('reports')}
                        onOpenAction={(action) => {
                            if (action === 'patients') setSelectedPatientId(null);
                            setCurrentScreen(action);
                        }}
                        features={FEATURES}
                        styles={styles}
                    />
                );
            case 'appointment': 
                return <AppointmentScreenPage 
                    theme={theme} 
                    layout={layout}
                    onBack={() => setCurrentScreen('home')} 
                    form={appointmentForm} 
                    setForm={setAppointmentForm}
                    appointments={appointments}
                    setAppointments={setAppointments}
                    patients={patients}
                    setPatients={setPatients}
                    onSelectPatient={handleSelectPatientFromAppt}
                    onEditAppointment={openAppointmentEditModal}
                    viewMode={appointmentScreenMode} 
                    setViewMode={setAppointmentScreenMode} 
                    showToast={showToast}
                    styles={styles}
                />;
            case 'patients': 
                return <PatientScreenPage 
                    theme={theme}
                    layout={layout}
                    onBack={() => {
                        if (selectedPatientId) { setSelectedPatientId(null); setAppointmentScreenMode('list'); setCurrentScreen('appointment'); } 
                        else { setCurrentScreen('home'); }
                    }}
                    patients={patients}
                    setPatients={setPatients}
                    appointments={appointments}
                    setAppointments={setAppointments}
                    selectedPatientId={selectedPatientId}
                    onBookAppointment={handleBookFromProfile}
                    onNavigate={(screen, data) => {
                        if (screen === 'vitals') { setSelectedPatientId(data.id); setCurrentScreen('vitals'); }
                        else if (screen === 'prescription') { setSelectedPatientId(data.id); setCurrentScreen('prescription'); }
                        else if (screen === 'history') { setSelectedPatientId(data.id); setCurrentScreen('history'); }
                        else { setCurrentScreen(screen); }
                    }}
                    showToast={showToast}
                    styles={styles}
                />;
            case 'vitals':
                const patientForVitals = patients.find(p => p.id === selectedPatientId);
                return <VitalsScreenPage theme={theme} onBack={() => setCurrentScreen('patients')} patient={patientForVitals} onSaveVitals={handleSaveVitals} showToast={showToast} styles={styles} />;
            case 'prescription':
                const patientForRx = patients.find(p => p.id === selectedPatientId);
                return <TemplateScreenPage 
                    theme={theme} 
                    layout={layout}
                    onBack={() => {
                        setRxIdToEdit(null);
                        setPendingPrescriptionTemplate(null);
                        setCurrentScreen('patients');
                    }}
                    templates={templates}
                    setTemplates={setTemplates}
                    medicines={medicines}
                    setMedicines={setMedicines}
                    procedures={procedures} // NEW PROP PASSED
                    setProcedures={setProcedures} // NEW: Pass setter
                    showToast={showToast}
                    isPrescription={true}
                    patient={patientForRx}
                    patients={patients}
                    onSelectPrescriptionPatient={(patientId) => setSelectedPatientId(patientId)}
                    onSavePrescription={handleSavePrescription}
                    initialPrescriptionTemplate={pendingPrescriptionTemplate}
                    onPrescriptionTemplateApplied={() => setPendingPrescriptionTemplate(null)}
                    styles={styles}
                    onSaveVitals={handleSaveVitals}
                />;
            case 'medicines': return <MedicinePage theme={theme} layout={layout} styles={styles} onBack={() => setCurrentScreen('home')} medicines={medicines} setMedicines={setMedicines} showToast={showToast} />;
            case 'templates': 
                return <TemplateScreenPage 
                    theme={theme} 
                    layout={layout}
                    onBack={() => setCurrentScreen('home')}
                    templates={templates}
                    setTemplates={setTemplates}
                    medicines={medicines}
                    setMedicines={setMedicines}
                    procedures={procedures} // NEW PROP PASSED
                    setProcedures={setProcedures} // NEW: Pass setter
                    showToast={showToast}
                    onUseTemplateInPrescription={handleUseTemplateFromTemplateScreen}
                    styles={styles}
                />;
            case 'procedures': 
                return <ProceduresPage 
                    theme={theme} 
                    layout={layout}
                    onBack={() => setCurrentScreen('home')} 
                    procedures={procedures}
                    setProcedures={setProcedures}
                    showToast={showToast}
                    procedureCategories={PROCEDURE_CATEGORIES}
                    pickerMaxHeight={height * 0.7}
                    styles={styles}
                />;
            case 'support': return <SupportPage theme={theme} layout={layout} onBack={() => setCurrentScreen('home')} styles={styles} />;
            case 'history':
                return <PatientHistoryScreenPage
                    theme={theme}
                    onBack={() => {
                        if (selectedPatientId) {
                            setCurrentScreen('patients');
                        } else {
                            setCurrentScreen('home');
                        }
                    }}
                    patients={patients}
                    selectedPatientId={selectedPatientId}
                    onOpenVitals={(patient) => {
                        setSelectedPatientId(patient.id);
                        setCurrentScreen('vitals');
                    }}
                    onOpenPrescription={(patient) => {
                        setSelectedPatientId(patient.id);
                        setRxIdToEdit(null);
                        setPendingPrescriptionTemplate(null);
                        setCurrentScreen('prescription');
                    }}
                    onEditRx={handleEditRx}
                    onDeleteRx={handleDeleteRx}
                    onEditPatient={handleHistoryEditPatient}
                    onDeletePatient={handleHistoryDeletePatient}
                    onSaveVitals={handleSaveVitals}
                    showToast={showToast}
                    styles={styles}
                />;
            case 'reports': return <PlaceholderPage title="Lab Reports" icon={BookOpen} color={['#ec4899', '#db2777']} theme={theme} layout={layout} onBack={() => setCurrentScreen('home')} styles={styles} />;
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            {/* TOAST NOTIFICATION RENDERED AT ROOT LEVEL */}
            <ToastNotification 
                visible={toast.visible} 
                title={toast.title} 
                message={toast.message} 
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
                styles={styles}
            />

            {/* SplashScreen removed as per request */}
            {!isLoading && !isLoggedIn && <LoginPage onLogin={handleLogin} theme={theme} layout={layout} showToast={showToast} styles={styles} />}
            {isLoggedIn && (
                <>
                    <View style={[styles.glowTop, { backgroundColor: theme.glowTop }]} />
                    <View style={[styles.glowBottom, { backgroundColor: theme.glowBottom }]} />
                    
                    {/* MENU OVERLAY */}
                    <SideMenu 
                        visible={menuVisible} onClose={() => setMenuVisible(false)} insets={insets} theme={theme} 
                        layout={layout}
                        features={FEATURES}
                        styles={styles}
                        onNavigate={(screen) => { if (screen === 'patients') setSelectedPatientId(null); setCurrentScreen(screen); }} 
                        onLogout={handleLogout} 
                    />
                    
                    <View style={[styles.contentStage, { paddingBottom: bottomNavConfig.contentPaddingBottom }]}>
                        {renderContent()}
                    </View>
                    
                    <BlurView intensity={isDarkMode ? 30 : 80} tint={theme.blurTint} style={[
                        styles.bottomNav,
                        layout.isTablet && styles.bottomNavFloating,
                        {
                            width: layout.isTablet ? layout.centeredNavWidth : undefined,
                            left: layout.isTablet ? (layout.width - layout.centeredNavWidth) / 2 : 0,
                            right: layout.isTablet ? undefined : 0,
                            bottom: bottomNavConfig.bottomOffset,
                            height: bottomNavConfig.height,
                            paddingTop: layout.isTablet ? 10 : 8,
                            paddingBottom: bottomNavConfig.safeInset,
                            borderTopColor: theme.border,
                            backgroundColor: theme.navBg,
                        }
                    ]}>
                        <View style={[styles.bottomNavLine, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('home')}><Home size={bottomNavConfig.iconSize} color={currentScreen === 'home' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'home' ? theme.primary : theme.textDim, fontSize: bottomNavConfig.labelSize }]}>Home</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('appointment')}><Calendar size={bottomNavConfig.iconSize} color={currentScreen === 'appointment' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'appointment' ? theme.primary : theme.textDim, fontSize: bottomNavConfig.labelSize }]}>Appoint</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('medicines')}><Activity size={bottomNavConfig.iconSize} color={currentScreen === 'medicines' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'medicines' ? theme.primary : theme.textDim, fontSize: bottomNavConfig.labelSize }]}>Pharma</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setMenuVisible(true)}><Menu size={bottomNavConfig.iconSize} color={theme.textDim} /><Text style={[styles.navText, { color: theme.textDim, fontSize: bottomNavConfig.labelSize }]}>Menu</Text></TouchableOpacity>
                    </BlurView>
                    <AppointmentEditModal visible={appointmentEditModalVisible} theme={theme} styles={styles} form={appointmentEditForm} setForm={setAppointmentEditForm} onClose={closeAppointmentEditModal} onSave={handleSaveAppointmentEdit} />
                </>
            )}
        </View>
    );
};

/** Doctor role: full clinic UI (DashboardHomeScreen, etc.) with auth handled by root App.js */
export function ClinicDashboardRoot({ onLogout }) {
    return <MainApp skipLogin onLogoutExternal={onLogout} />;
}

export default function App() { return <SafeAreaProvider><MainApp /></SafeAreaProvider>; }
const styles = StyleSheet.create({
  // --- LAYOUT & BASICS ---
  container: { 
    flex: 1 
  },
    contentStage: {
        flex: 1,
        zIndex: 1,
    },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 16, 
    paddingHorizontal: 15, 
    paddingVertical: 4, 
    height: 55 
  },
  textInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    height: '100%' 
  },
  
  // --- LOGIN SCREEN ---
  loginBtn: { 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#2563eb', 
    shadowOffset: {width:0, height:8}, 
    shadowOpacity:0.3, 
    shadowRadius:10, 
    elevation:10 
  },
  glowTop: { 
    position: 'absolute', 
    top: -100, 
    left: -50, 
    width: 300, 
    height: 300, 
    borderRadius: 150, 
    transform: [{ scaleX: 1.5 }] 
  },
  glowBottom: { 
    position: 'absolute', 
    bottom: -100, 
    right: -50, 
    width: 300, 
    height: 300, 
    borderRadius: 150 
  },

  // --- HEADERS ---
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 25 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  greeting: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  dateContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  dateText: { 
    fontSize: 14 
  },
  timeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  dot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    marginHorizontal: 8 
  },
  iconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },

  // --- HERO / DASHBOARD CARD ---
  heroContainer: { 
    marginHorizontal: 20, 
    height: 190, 
    borderRadius: 24, 
    shadowColor: '#3b82f6', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 10, 
    marginBottom: 30 
  },
  heroGradient: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 20, 
    justifyContent: 'space-between', 
    borderWidth: 1 
  },
  heroContent: { 
    position: 'relative', 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  heroBgIcon: { 
    position: 'absolute', 
    right: -10, 
    top: -10, 
    transform: [{ rotate: '-15deg' }] 
  },
  badge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  badgeText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  surahName: { 
    color: 'white', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  ayahInfo: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14 
  },
  heroActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  resumeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 6 
  },
  resumeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },
        dashboardSectionBlock: {
                marginBottom: 28,
        },
    dashboardTableCard: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    dashboardTableHeader: {
        padding: 18,
        borderBottomWidth: 1,
    },
    dashboardTableHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dashboardTableTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dashboardTableSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    dashboardTableActions: {
        flexDirection: 'row',
        gap: 10,
    },
    dashboardTableButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    dashboardTableButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dashboardTableMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dashboardTableCountChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    dashboardTableCountText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dashboardAppointmentList: {
        paddingHorizontal: 2,
    },
    dashboardAppointmentCard: {
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: '#0f766e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    dashboardAppointmentAccent: {
        width: 6,
        alignSelf: 'stretch',
        borderRadius: 999,
    },
    dashboardAppointmentCompactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dashboardAppointmentTimeBadge: {
        width: 84,
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    dashboardAppointmentTimeValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    dashboardAppointmentCompactBody: {
        flex: 1,
        minWidth: 0,
    },
    dashboardPatientName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    dashboardAppointmentDiagnosisLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dashboardAppointmentNotes: {
        fontSize: 12,
        lineHeight: 16,
    },
    dashboardAppointmentSideActions: {
        gap: 8,
    },
    dashboardRowActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashboardEmptyState: {
        paddingHorizontal: 18,
        paddingVertical: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    dashboardEmptyTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    dashboardEmptyText: {
        fontSize: 13,
        textAlign: 'center',
    },

  // --- GRID & FEATURES ---
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 20, 
        marginBottom: 18 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 15, 
    justifyContent: 'space-between' 
  },
  cardContainer: { 
    width: '48%', 
    marginBottom: 15 
  },
  cardInner: { 
    borderRadius: 20, 
    padding: 16, 
    height: 130, 
    justifyContent: 'space-between', 
    borderWidth: 1 
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 8 
  },
  cardTextContent: { 
    marginTop: 10 
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  cardSubtitle: { 
    fontSize: 11 
  },

  // --- PLACEHOLDER SCREENS ---
  comingSoonIconContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    elevation: 20, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 20, 
    marginBottom: 40 
  },
  comingSoonGradient: { 
    flex: 1, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  comingSoonTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  comingSoonDesc: { 
    fontSize: 15, 
    textAlign: 'center', 
    lineHeight: 24, 
    paddingHorizontal: 40 
  },

  // --- BOTTOM NAVIGATION ---
  bottomNav: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
        zIndex: 30,
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderTopWidth: 1 
  },
    bottomNavFloating: {
                borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 10,
    },
  bottomNavLine: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 1 
  },
  navItem: { 
    alignItems: 'center', 
        gap: 2, 
        paddingHorizontal: 8,
        paddingVertical: 6,
    minWidth: 50 
  },
  navText: { 
    fontWeight: '500' 
  },

  // --- SIDE MENU (3D) ---
  menuOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  menuBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  menuSidebar: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    width: '80%', 
    borderRightWidth: 1, 
    paddingHorizontal: 20 
  },
  menuHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30, 
    marginTop: 20 
  },
  closeBtn: { 
    padding: 5, 
    borderRadius: 8 
  },
  menuItems: { 
    flex: 1 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    borderBottomWidth: 1 
  },
  menuItemText: { 
    fontSize: 16 
  },
  menuDivider: { 
    height: 1, 
    marginVertical: 20 
  },
  menuVersion: { 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 20, 
    marginBottom: 40 
  },
  menuSectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginTop: 10 
  },
  menuFeatureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  menuFeatureIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // --- TOAST NOTIFICATIONS ---
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  toastIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  toastTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13
  }
});