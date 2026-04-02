import { LinearGradient } from 'expo-linear-gradient';
import {
    Activity,
    ArrowLeft,
    Banknote,
    ChevronDown,
    Clipboard,
    Copy,
    Download,
    Droplet,
    Eye,
    FileText,
    FlaskConical,
    HeartPulse,
    Pencil,
    Pill,
    Plus,
    PlusCircle,
    Save,
    Search,
    Settings,
    Stethoscope,
    TestTube,
    Thermometer,
    Trash2,
    TrendingDown,
    UserPlus,
    Weight,
    X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomPicker, InputGroup } from '../../components/commons/FormControls';
import PrescriptionMedicineModal from '../../components/commons/PrescriptionMedicineModal';
import {
    DOSAGES_INIT,
    DURATIONS_INIT,
    FREQUENCIES_INIT,
    INSTRUCTIONS_INIT,
    PROCEDURE_CATEGORIES
} from '../../constants/medical';
import { getMedicalModalTheme, getMedicalTableTheme } from '../../constants/tableTheme';
import { buildMedicineRecord, findMatchingMedicine, sanitizeMedicineDraft } from '../../utils/medicine';
import {
    buildTemplateRecord,
    createTemplateCopyName,
    sanitizeTemplateDraft
} from '../../utils/template';

const { height } = Dimensions.get('window');

const createEmptyTemplateDraft = () => ({
    id: null,
    name: '',
    diagnosis: '',
    advice: '',
    medicines: [],
    procedures: [],
    nextVisitInvestigations: [],
    referral: ''
});

const createEmptyPrescriptionMedicineForm = () => ({
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

const createEmptyVitalsDraft = () => ({
    sys: '',
    dia: '',
    pulse: '',
    spo2: '',
    temp: '',
    tempUnit: 'C',
    weight: ''
});

const normalizeOptionValue = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const parseReferralEntries = (value = '') => String(value || '')
    .split(';')
    .map((item) => normalizeOptionValue(item))
    .filter(Boolean);

const buildReferralValue = (entries = []) => entries.join('; ');

const buildProcedureDraftKey = (item = {}) => [
    normalizeOptionValue(item.name).toLowerCase(),
    normalizeOptionValue(item.category).toLowerCase(),
    normalizeOptionValue(item.cost).toLowerCase()
].join('|');

const getPaddedContentStyle = (layout, style = {}) => ({
    width: '100%',
    maxWidth: layout?.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout?.gutter ?? 20,
    ...style,
});

// --- UPDATED TEMPLATE SCREEN ---
const TemplateScreen = ({
    theme,
    onBack,
    templates,
    setTemplates,
    medicines,
    setMedicines,
    procedures,
    setProcedures,
    showToast,
    isPrescription = false,
    patient,
    onSavePrescription,
    onUseTemplateInPrescription,
    initialPrescriptionTemplate,
    onPrescriptionTemplateApplied,
    patients = [],
    onSelectPrescriptionPatient,
    layout,
    styles,
    onSaveVitals,
}) => {
    const insets = useSafeAreaInsets();
    const safeLayout = layout || { contentMaxWidth: undefined, gutter: 20, isTablet: false };
    const modalTheme = getMedicalModalTheme(theme);
    const tableTheme = getMedicalTableTheme(theme);
    const [view, setView] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');

    // Editor State - Added 'nextVisitInvestigations' and 'referral'
    const [editorForm, setEditorForm] = useState(createEmptyTemplateDraft);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

    // State to toggle referral input visibility
    const [showReferral, setShowReferral] = useState(false);
    const [referralDraft, setReferralDraft] = useState('');

    // View Modal State
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Medicine Picker Modal State
    const [medModalVisible, setMedModalVisible] = useState(false);
    const [medSearch, setMedSearch] = useState('');

    useEffect(() => {
        if (patient?.vitalsHistory && patient.vitalsHistory.length > 0) {
            // Only pick allowed fields for new Rx
            const allowed = ['sys', 'dia', 'pulse', 'spo2', 'temp', 'tempUnit', 'weight'];
            const filtered = Object.fromEntries(
                Object.entries(patient.vitalsHistory[0] || {})
                    .filter(([k]) => allowed.includes(k))
            );
            setEditableVitals({
                ...createEmptyVitalsDraft(),
                ...filtered,
                tempUnit: filtered.tempUnit || 'C'
            });
        } else {
            setEditableVitals(createEmptyVitalsDraft());
        }
    }, [patient]);

    // --- PROCEDURE / INVESTIGATION STATES ---
    const [procModalVisible, setProcModalVisible] = useState(false);
    const [procModalType, setProcModalType] = useState('procedure');
    const [procSearch, setProcSearch] = useState('');
    const [procViewMode, setProcViewMode] = useState('list');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Form for Adding/Editing Master Procedure
    const [masterProcForm, setMasterProcForm] = useState({ id: null, name: '', cost: '', category: 'General' });

    // Form for Custom (One-off)
    const [customProcForm, setCustomProcForm] = useState({ name: '', cost: '' });
    const [editTemplateItemVisible, setEditTemplateItemVisible] = useState(false);
    const [editTemplateItemType, setEditTemplateItemType] = useState('procedure');
    const [editTemplateItemIndex, setEditTemplateItemIndex] = useState(null);
    const [editTemplateItemForm, setEditTemplateItemForm] = useState({ name: '', cost: '', category: 'General' });

    // Template Selection Modal for Rx Writer
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templatePickerSearch, setTemplatePickerSearch] = useState('');
    const [patientPickerVisible, setPatientPickerVisible] = useState(false);
    const [patientPickerSearch, setPatientPickerSearch] = useState('');
    const [diagnosisPickerVisible, setDiagnosisPickerVisible] = useState(false);
    const [diagnosisPickerSearch, setDiagnosisPickerSearch] = useState('');
    const [customDiagnosisOptions, setCustomDiagnosisOptions] = useState([]);
    const [editingDiagnosis, setEditingDiagnosis] = useState(null);
    const [editingDiagnosisText, setEditingDiagnosisText] = useState('');
    const [editingDiagnosisIsCustom, setEditingDiagnosisIsCustom] = useState(false);
    const [hiddenDiagnosisOptions, setHiddenDiagnosisOptions] = useState([]);
    const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false);
    const [rowLimitPickerVisible, setRowLimitPickerVisible] = useState(false);

    // Dynamic Arrays
    const [freqOptions, setFreqOptions] = useState(FREQUENCIES_INIT);
    const [durOptions, setDurOptions] = useState(DURATIONS_INIT);
    const [instrOptions, setInstrOptions] = useState(INSTRUCTIONS_INIT);
    const [doseOptions, setDoseOptions] = useState(DOSAGES_INIT);

    // Input Modal State
    const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
    const [editableVitals, setEditableVitals] = useState({});
    const [pastRxModalVisible, setPastRxModalVisible] = useState(false);
    const [pdfPreviewModalVisible, setPdfPreviewModalVisible] = useState(false);
    const [pdfPreviewData, setPdfPreviewData] = useState(null);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputCategory, setInputCategory] = useState(null);
    const [inputText, setInputText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newMedForm, setNewMedForm] = useState(createEmptyPrescriptionMedicineForm);
    const [editingMedIndex, setEditingMedIndex] = useState(null);
    const [rowLimit, setRowLimit] = useState(25);
    const previewVitals = patient?.vitalsHistory?.[0] || editableVitals || {};
    const formatPreviewDate = (value) => (value ? new Date(value).toLocaleDateString() : new Date().toLocaleDateString());
    const bookingNumber = patient?.bookingNo || patient?.bookingNumber || patient?.id || 'N/A';
    const popupPulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(popupPulseAnim, {
                    toValue: 1.06,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(popupPulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ])
        );

        pulseLoop.start();
        return () => pulseLoop.stop();
    }, [popupPulseAnim]);

    const rowLimitOptions = [
        { label: '25 rows', value: 25 },
        { label: '50 rows', value: 50 },
        { label: '100 rows', value: 100 }
    ];
    const referralEntries = parseReferralEntries(editorForm.referral);

    const medicalPalette = {
        hero: theme.mode === 'dark' ? ['#0f3b46', '#14532d', '#0f172a'] : ['#dcfce7', '#dbeafe', '#f0fdf4'],
        heroBorder: theme.mode === 'dark' ? 'rgba(45,212,191,0.28)' : '#a7f3d0',
        shell: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.92)',
        statA: theme.mode === 'dark' ? ['rgba(14,165,233,0.35)', 'rgba(37,99,235,0.18)'] : ['#e0f2fe', '#dbeafe'],
        statB: theme.mode === 'dark' ? ['rgba(16,185,129,0.35)', 'rgba(21,128,61,0.18)'] : ['#dcfce7', '#ecfdf5'],
        statC: theme.mode === 'dark' ? ['rgba(168,85,247,0.35)', 'rgba(124,58,237,0.18)'] : ['#f3e8ff', '#eef2ff'],
        diagnosis: theme.mode === 'dark' ? ['rgba(59,130,246,0.18)', 'rgba(6,182,212,0.08)'] : ['#eff6ff', '#ecfeff'],
        medicines: theme.mode === 'dark' ? ['rgba(16,185,129,0.16)', 'rgba(45,212,191,0.08)'] : ['#ecfdf5', '#f0fdf4'],
        procedures: theme.mode === 'dark' ? ['rgba(249,115,22,0.16)', 'rgba(234,88,12,0.08)'] : ['#fff7ed', '#fffbeb'],
        investigations: theme.mode === 'dark' ? ['rgba(14,165,233,0.16)', 'rgba(59,130,246,0.08)'] : ['#eff6ff', '#ecfeff'],
        referral: theme.mode === 'dark' ? ['rgba(139,92,246,0.16)', 'rgba(124,58,237,0.08)'] : ['#f5f3ff', '#faf5ff'],
        advice: theme.mode === 'dark' ? ['rgba(244,63,94,0.14)', 'rgba(251,146,60,0.08)'] : ['#fff1f2', '#fff7ed']
    };

    const renderSectionHeader = (title, subtitle, Icon, accent) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="white" />
                </View>
                <View>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: 0.9 }}>{title}</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>{subtitle}</Text>
                </View>
            </View>
        </View>
    );

    useEffect(() => {
        if (isPrescription) {
            setView('edit');
            setEditorForm(createEmptyTemplateDraft());
            setShowReferral(false);
            setReferralDraft('');
        }
    }, [isPrescription]);

    useEffect(() => {
        if (isPrescription && initialPrescriptionTemplate) {
            applyTemplate(initialPrescriptionTemplate);
            if (typeof onPrescriptionTemplateApplied === 'function') {
                onPrescriptionTemplateApplied();
            }
        }
    }, [isPrescription, initialPrescriptionTemplate]);

    const filteredTemplates = templates.filter((template) => {
        const query = searchQuery.toLowerCase();
        const templateMedicines = template.medicines || [];

        return String(template?.name || '').toLowerCase().includes(query)
            || (template.diagnosis || '').toLowerCase().includes(query)
            || (template.advice || '').toLowerCase().includes(query)
            || (template.referral || '').toLowerCase().includes(query)
            || templateMedicines.some((item) => String(item?.name || '').toLowerCase().includes(query));
    });

    const totalMedicineLines = templates.reduce((count, template) => count + ((template.medicines || []).length), 0);
    const totalProcedureLines = templates.reduce((count, template) => count + ((template.procedures || []).length) + ((template.nextVisitInvestigations || []).length), 0);
    const templateDiagnosisOptions = Array.from(new Set(templates.map((template) => normalizeOptionValue(template?.diagnosis)).filter(Boolean)));
    const diagnosisOptions = Array.from(
        new Set([...templateDiagnosisOptions, ...customDiagnosisOptions.map((item) => normalizeOptionValue(item)).filter(Boolean)])
    ).filter((diagnosisName) => !hiddenDiagnosisOptions.some((hiddenItem) => hiddenItem.toLowerCase() === diagnosisName.toLowerCase()));
    const diagnosisItems = diagnosisOptions.map((diagnosisName) => ({
        name: diagnosisName,
        isTemplate: templateDiagnosisOptions.some((item) => item.toLowerCase() === diagnosisName.toLowerCase()),
        isCustom: customDiagnosisOptions.some((item) => item.toLowerCase() === diagnosisName.toLowerCase())
    }));
    const filteredDiagnosisItems = diagnosisItems.filter((diagnosisItem) => diagnosisItem.name.toLowerCase().includes(diagnosisPickerSearch.toLowerCase()));
    const inlineDiagnosisSuggestions = filteredDiagnosisItems.slice(0, 8);
    const filteredPatientOptions = (patients || []).filter((patientItem) => {
        const query = patientPickerSearch.toLowerCase();
        if (!query) return true;

        return String(patientItem?.name || '').toLowerCase().includes(query)
            || String(patientItem?.mobile || '').toLowerCase().includes(query)
            || String(patientItem?.id || '').toLowerCase().includes(query);
    });
    const visibleTemplates = filteredTemplates.slice(0, rowLimit);
    const tableMinWidth = safeLayout.isTablet ? 1160 : 940;
    const popupHeight = safeLayout.isTablet ? height * 0.82 : height * 0.86;

    const applyTemplate = (template) => {
        setEditorForm((prev) => ({
            ...prev,
            diagnosis: template.diagnosis || prev.diagnosis,
            advice: template.advice || prev.advice,
            medicines: [...prev.medicines, ...(template.medicines || [])],
            procedures: [...prev.procedures, ...(template.procedures || [])],
            nextVisitInvestigations: [...prev.nextVisitInvestigations, ...(template.nextVisitInvestigations || [])],
            referral: template.referral || prev.referral
        }));
        if (template.referral) {
            setShowReferral(true);
        }
        setShowTemplatePicker(false);
        setTemplatePickerSearch('');
        showToast('Applied', `${template.name} loaded successfully`, 'info');
    };

    const handleEdit = (item) => {
        setEditorForm({
            ...item,
            medicines: [...(item.medicines || [])],
            procedures: [...(item.procedures || [])],
            nextVisitInvestigations: [...(item.nextVisitInvestigations || [])]
        });
        setShowReferral(Boolean(item.referral));
        setReferralDraft('');
        setView('edit');
    };

    const handleCreate = () => {
        setEditorForm(createEmptyTemplateDraft());
        setShowReferral(false);
        setReferralDraft('');
        setView('edit');
    };

    const handleDuplicateTemplate = (template) => {
        const copiedTemplate = sanitizeTemplateDraft(template);
        const copiedName = createTemplateCopyName(templates, copiedTemplate.name);

        setTemplates((prev) => [
            buildTemplateRecord({ ...copiedTemplate, id: null, name: copiedName }),
            ...prev
        ]);
        showToast('Copied', `${copiedName} created`, 'success');
    };

    const handleSaveTemplate = () => {
        const sanitizedTemplate = sanitizeTemplateDraft(editorForm);

        if (!isPrescription && !sanitizedTemplate.name) {
            Alert.alert('Required', 'Please enter a Template Name.');
            return;
        }

        if (isPrescription) {
            if (!patient?.id || typeof onSavePrescription !== 'function') {
                Alert.alert('Prescription Error', 'The patient record is unavailable. Please reopen the prescription from the patient list.');
                return;
            }

            if (
                sanitizedTemplate.medicines.length === 0
                && !sanitizedTemplate.advice
                && sanitizedTemplate.procedures.length === 0
                && sanitizedTemplate.nextVisitInvestigations.length === 0
                && !sanitizedTemplate.referral
            ) {
                Alert.alert('Empty', 'Please add medicines, procedures, investigations, referral or advice.');
                return;
            }

            onSavePrescription({
                ...sanitizedTemplate,
                patientId: patient.id,
                date: new Date().toISOString()
            });

            if (saveAsTemplate && sanitizedTemplate.name) {
                const newTemplate = buildTemplateRecord(sanitizedTemplate);
                setTemplates([newTemplate, ...templates]);
                showToast('Saved', 'Prescription & New Template Saved!', 'success');
            }
            return;
        }

        let updatedTemplates;
        if (sanitizedTemplate.id) {
            updatedTemplates = templates.map((template) => (template.id === sanitizedTemplate.id ? { ...sanitizedTemplate, id: sanitizedTemplate.id } : template));
            showToast('Success', 'Template Updated Successfully!', 'success');
        } else {
            const newTemplate = buildTemplateRecord(sanitizedTemplate);
            updatedTemplates = [newTemplate, ...templates];
            showToast('Success', 'New Template Created!', 'success');
        }

        setTemplates(updatedTemplates);
        setEditorForm(createEmptyTemplateDraft());
        setShowReferral(false);
        setReferralDraft('');
        setView('list');
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert('Delete', 'Remove this template?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setTemplates(templates.filter((template) => template.id !== id));
                    showToast('Deleted', 'Template removed.', 'error');
                }
            }
        ]);
    };

    const handleUseTemplateInPrescription = (template) => {
        if (typeof onUseTemplateInPrescription === 'function') {
            onUseTemplateInPrescription(template);
            return;
        }

        showToast('Info', 'Open a patient and create a prescription to use this template.', 'info');
    };

    const handleAddReferralEntry = () => {
        const normalizedReferral = normalizeOptionValue(referralDraft);

        if (!normalizedReferral) {
            Alert.alert('Required', 'Enter a referral before adding.');
            return;
        }

        const exists = referralEntries.some((item) => item.toLowerCase() === normalizedReferral.toLowerCase());
        if (exists) {
            showToast('Exists', 'Referral already added.', 'info');
            return;
        }

        setEditorForm((prev) => ({ ...prev, referral: buildReferralValue([...referralEntries, normalizedReferral]) }));
        setReferralDraft('');
    };

    const handleRemoveReferralEntry = (indexToRemove) => {
        const updatedEntries = referralEntries.filter((_, index) => index !== indexToRemove);

        setEditorForm((prev) => ({ ...prev, referral: buildReferralValue(updatedEntries) }));
    };

    const handleAddDiagnosisToList = (value = editorForm.diagnosis) => {
        const normalizedDiagnosis = normalizeOptionValue(value);

        if (!normalizedDiagnosis) {
            Alert.alert('Required', 'Enter a diagnosis first.');
            return;
        }

        const alreadyExists = diagnosisOptions.some((item) => item.toLowerCase() === normalizedDiagnosis.toLowerCase());
        if (alreadyExists) {
            showToast('Exists', 'Diagnosis is already in the list.', 'info');
            return;
        }

        setCustomDiagnosisOptions((prev) => [normalizedDiagnosis, ...prev]);
        showToast('Added', 'Diagnosis added to list.', 'success');
    };

    const handleStartEditDiagnosis = (diagnosisName, isCustom) => {
        setEditingDiagnosis(diagnosisName);
        setEditingDiagnosisText(diagnosisName);
        setEditingDiagnosisIsCustom(Boolean(isCustom));
    };

    const handleSaveEditedDiagnosis = () => {
        const oldDiagnosis = normalizeOptionValue(editingDiagnosis);
        const updatedDiagnosis = normalizeOptionValue(editingDiagnosisText);

        if (!oldDiagnosis) {
            setEditingDiagnosis(null);
            setEditingDiagnosisText('');
            return;
        }

        if (!updatedDiagnosis) {
            Alert.alert('Required', 'Diagnosis cannot be empty.');
            return;
        }

        const duplicateExists = diagnosisOptions.some((item) => item.toLowerCase() === updatedDiagnosis.toLowerCase() && item.toLowerCase() !== oldDiagnosis.toLowerCase());
        if (duplicateExists) {
            showToast('Exists', 'Diagnosis is already in the list.', 'info');
            return;
        }

        if (editingDiagnosisIsCustom) {
            setCustomDiagnosisOptions((prev) => prev.map((item) => (item.toLowerCase() === oldDiagnosis.toLowerCase() ? updatedDiagnosis : item)));
        } else {
            // Template diagnoses are read-only at source level; edited value is stored as custom and old value is hidden from this list.
            setCustomDiagnosisOptions((prev) => [updatedDiagnosis, ...prev]);
            setHiddenDiagnosisOptions((prev) => (prev.some((item) => item.toLowerCase() === oldDiagnosis.toLowerCase()) ? prev : [oldDiagnosis, ...prev]));
        }

        if ((editorForm.diagnosis || '').toLowerCase() === oldDiagnosis.toLowerCase()) {
            setEditorForm((prev) => ({ ...prev, diagnosis: updatedDiagnosis }));
        }

        setEditingDiagnosis(null);
        setEditingDiagnosisText('');
        setEditingDiagnosisIsCustom(false);
        showToast('Updated', 'Diagnosis updated.', 'success');
    };

    const handleDeleteDiagnosisFromList = (diagnosisName, isCustom) => {
        const normalizedDiagnosis = normalizeOptionValue(diagnosisName);

        Alert.alert('Delete Diagnosis', `Remove "${normalizedDiagnosis}" from this list?`, [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    if (isCustom) {
                        setCustomDiagnosisOptions((prev) => prev.filter((item) => item.toLowerCase() !== normalizedDiagnosis.toLowerCase()));
                    } else {
                        setHiddenDiagnosisOptions((prev) => (prev.some((item) => item.toLowerCase() === normalizedDiagnosis.toLowerCase()) ? prev : [normalizedDiagnosis, ...prev]));
                    }
                    if ((editorForm.diagnosis || '').toLowerCase() === normalizedDiagnosis.toLowerCase()) {
                        setEditorForm((prev) => ({ ...prev, diagnosis: '' }));
                    }
                    showToast('Deleted', 'Diagnosis removed from list.', 'error');
                }
            }
        ]);
    };

    const openTemplateDetails = (t) => {
        setSelectedTemplate(t);
        setViewModalVisible(true);
    };

    const addProcedureToForm = (procedureItem) => {
        const targetList = procModalType === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const normalizedItem = {
            ...procedureItem,
            id: Date.now(),
            name: normalizeOptionValue(procedureItem?.name),
            category: normalizeOptionValue(procedureItem?.category) || 'General',
            cost: normalizeOptionValue(procedureItem?.cost) || '0'
        };

        if (!normalizedItem.name) {
            Alert.alert('Missing Info', 'Procedure name is required.');
            return;
        }

        const existingItems = editorForm[targetList] || [];
        const duplicateExists = existingItems.some((item) => buildProcedureDraftKey(item) === buildProcedureDraftKey(normalizedItem));

        if (duplicateExists) {
            showToast('Already Added', `${normalizedItem.name} is already in this ${targetList === 'procedures' ? 'template' : 'investigation list'}.`, 'info');
            setProcModalVisible(false);
            return;
        }

        setEditorForm((prev) => ({
            ...prev,
            [targetList]: [...prev[targetList], normalizedItem]
        }));

        setProcModalVisible(false);
        showToast('Added', `${procModalType === 'investigation' ? 'Investigation' : 'Procedure'} added`, 'success');
    };

    const handleSaveMasterProcedure = () => {
        const normalizedName = normalizeOptionValue(masterProcForm.name);
        const normalizedCost = normalizeOptionValue(masterProcForm.cost) || '0';
        const normalizedCategory = normalizeOptionValue(masterProcForm.category) || 'General';

        if (!normalizedName) {
            Alert.alert('Missing Info', 'Name is required.');
            return;
        }

        const normalizedProcedure = {
            ...masterProcForm,
            name: normalizedName,
            cost: normalizedCost,
            category: normalizedCategory
        };

        const duplicateProcedure = procedures.find((procedureItem) => {
            if (masterProcForm.id && procedureItem.id === masterProcForm.id) {
                return false;
            }

            return buildProcedureDraftKey(procedureItem) === buildProcedureDraftKey(normalizedProcedure);
        });

        if (duplicateProcedure) {
            Alert.alert('Duplicate Item', 'An item with the same name, category, and price already exists in the master list.');
            return;
        }

        if (masterProcForm.id) {
            const updated = procedures.map((procedureItem) => (procedureItem.id === masterProcForm.id ? normalizedProcedure : procedureItem));
            setProcedures(updated);
            showToast('Updated', 'Master list updated', 'success');
        } else {
            const newProcedure = { ...normalizedProcedure, id: Date.now() };
            setProcedures([newProcedure, ...procedures]);
            showToast('Created', 'New item added to master list', 'success');
        }

        setMasterProcForm({ id: null, name: '', cost: '', category: 'General' });
        setProcViewMode('list');
    };

    const handleDeleteMasterProcedure = (id) => {
        Alert.alert('Delete', 'Permanently remove from master list?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setProcedures(procedures.filter((procedureItem) => procedureItem.id !== id));
                    showToast('Deleted', 'Item removed', 'error');
                }
            }
        ]);
    };

    const addCustomToRx = () => {
        const normalizedName = normalizeOptionValue(customProcForm.name);
        if (!normalizedName) {
            Alert.alert('Missing Info', 'Name is required');
            return;
        }

        const customProcedure = {
            id: Date.now(),
            name: normalizedName,
            cost: normalizeOptionValue(customProcForm.cost) || '0',
            category: 'Custom'
        };

        addProcedureToForm(customProcedure);
        setCustomProcForm({ name: '', cost: '' });
        setShowCustomInput(false);
    };

    const removeItemFromForm = (index, type) => {
        const targetList = type === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const updated = [...editorForm[targetList]];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, [targetList]: updated });
    };

    const openEditItemFromForm = (index, type) => {
        const targetList = type === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const selectedItem = editorForm[targetList]?.[index];

        if (!selectedItem) {
            return;
        }

        setEditTemplateItemType(type);
        setEditTemplateItemIndex(index);
        setEditTemplateItemForm({
            name: selectedItem.name || '',
            cost: selectedItem.cost || '0',
            category: selectedItem.category || (type === 'investigation' ? 'Investigation' : 'General')
        });
        setEditTemplateItemVisible(true);
    };

    const saveEditedItemInForm = () => {
        const normalizedName = normalizeOptionValue(editTemplateItemForm.name);
        const normalizedCost = normalizeOptionValue(editTemplateItemForm.cost) || '0';
        const normalizedCategory = normalizeOptionValue(editTemplateItemForm.category) || (editTemplateItemType === 'investigation' ? 'Investigation' : 'General');

        if (!normalizedName) {
            Alert.alert('Missing Info', 'Name is required.');
            return;
        }

        const targetList = editTemplateItemType === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const sourceList = editorForm[targetList] || [];

        const duplicateExists = sourceList.some((item, idx) => {
            if (idx === editTemplateItemIndex) {
                return false;
            }

            return buildProcedureDraftKey(item) === buildProcedureDraftKey({ name: normalizedName, cost: normalizedCost, category: normalizedCategory });
        });

        if (duplicateExists) {
            showToast('Duplicate', 'Same item already exists.', 'info');
            return;
        }

        const updatedList = [...sourceList];
        const currentItem = updatedList[editTemplateItemIndex] || {};
        updatedList[editTemplateItemIndex] = {
            ...currentItem,
            name: normalizedName,
            cost: normalizedCost,
            category: normalizedCategory
        };

        setEditorForm((prev) => ({ ...prev, [targetList]: updatedList }));
        setEditTemplateItemVisible(false);
        setEditTemplateItemIndex(null);
        showToast('Updated', `${editTemplateItemType === 'investigation' ? 'Investigation' : 'Procedure'} updated`, 'success');
    };

    const calculateTotalCost = () => editorForm.procedures.reduce((total, item) => total + (parseFloat(item.cost) || 0), 0);

    const openAddMasterProc = () => {
        setMasterProcForm({ id: null, name: '', cost: '', category: 'General' });
        setProcViewMode('add_master');
    };

    const openEditMasterProc = (item) => {
        setMasterProcForm({ ...item });
        setProcViewMode('edit_master');
    };

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

    const removeMedFromTemplate = (index) => {
        const updated = [...editorForm.medicines];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, medicines: updated });
    };

    const handleEditMedInTemplate = (index) => {
        const medicine = editorForm.medicines[index];
        setNewMedForm({
            inventoryId: medicine.inventoryId || null,
            name: medicine.name,
            content: medicine.content,
            type: medicine.type,
            doseQty: medicine.doseQty || '',
            freq: medicine.freq,
            duration: medicine.duration,
            instruction: medicine.instruction,
            isTapering: medicine.isTapering || false
        });
        setEditingMedIndex(index);
        setMedModalVisible(true);
    };

    const openMedModal = () => {
        setEditingMedIndex(null);
        setNewMedForm(createEmptyPrescriptionMedicineForm());
        setMedSearch('');
        setMedModalVisible(true);
    };

    const addMedToTemplate = () => {
        const sanitizedMedicine = sanitizeMedicineDraft(newMedForm);

        if (!sanitizedMedicine.name) {
            Alert.alert('Required', 'Medicine Name is required.');
            return;
        } 

        let finalDosage = '';
        if (sanitizedMedicine.isTapering) {
            finalDosage = 'Tapering Dose';
        } else {
            if (!sanitizedMedicine.doseQty) {
                Alert.alert('Select Dosage', 'Please select a Dose Amount.');
                return;
            }

            finalDosage = sanitizedMedicine.content ? `${sanitizedMedicine.doseQty} (${sanitizedMedicine.content})` : sanitizedMedicine.doseQty;
        }

        if (!sanitizedMedicine.freq || !sanitizedMedicine.duration) {
            Alert.alert('Missing Details', 'Please select Frequency and Duration.');
            return;
        }

        let selectedInventoryMed = sanitizedMedicine.inventoryId
            ? medicines.find((item) => item.id === sanitizedMedicine.inventoryId) || null
            : null;

        if (!selectedInventoryMed) {
            const existingMedicine = findMatchingMedicine(medicines, sanitizedMedicine);

            if (existingMedicine) {
                selectedInventoryMed = existingMedicine;
            } else {
                selectedInventoryMed = buildMedicineRecord(sanitizedMedicine);
                setMedicines((prev) => [selectedInventoryMed, ...prev]);
                showToast('Success', 'New medicine added to inventory.', 'success');
            }
        }

        const medicineObject = {
            ...sanitizedMedicine,
            inventoryId: selectedInventoryMed.id,
            name: selectedInventoryMed.name,
            content: selectedInventoryMed.content,
            type: selectedInventoryMed.type,
            dosage: finalDosage,
            id: editingMedIndex !== null ? editorForm.medicines[editingMedIndex].id : Date.now()
        };

        if (editingMedIndex !== null) {
            const updatedMeds = [...editorForm.medicines];
            updatedMeds[editingMedIndex] = medicineObject;
            setEditorForm({ ...editorForm, medicines: updatedMeds });
        } else {
            setEditorForm({ ...editorForm, medicines: [...editorForm.medicines, medicineObject] });
        }

        setMedModalVisible(false);
    };

    const selectInventoryMed = (medicine) => {
        setNewMedForm((prev) => ({
            ...prev,
            inventoryId: medicine.id,
            name: medicine.name,
            type: medicine.type,
            content: medicine.content,
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
        const normalizedValue = normalizeOptionValue(inputText);

        if (!normalizedValue) {
            setInputText('');
            setEditingItem(null);
            setInputVisible(false);
            return;
        }

        const updateList = (list, setList) => {
            if (editingItem) {
                setList(list.map((item) => (item === editingItem ? normalizedValue : item)));
            } else {
                const exists = list.some((item) => normalizeOptionValue(item).toLowerCase() === normalizedValue.toLowerCase());

                if (!exists) {
                    setList([...list, normalizedValue]);
                }
            }
        };

        if (inputCategory === 'freq') {
            updateList(freqOptions, setFreqOptions);
        } else if (inputCategory === 'dur') {
            updateList(durOptions, setDurOptions);
        } else if (inputCategory === 'instr') {
            updateList(instrOptions, setInstrOptions);
        } else if (inputCategory === 'dose') {
            updateList(doseOptions, setDoseOptions);
        }

        setInputText('');
        setEditingItem(null);
        setInputVisible(false);
    };

    const handleDeleteItem = (category, item) => {
        if (category === 'freq') {
            setFreqOptions(freqOptions.filter((option) => option !== item));
        } else if (category === 'dur') {
            setDurOptions(durOptions.filter((option) => option !== item));
        } else if (category === 'instr') {
            setInstrOptions(instrOptions.filter((option) => option !== item));
        } else if (category === 'dose') {
            setDoseOptions(doseOptions.filter((option) => option !== item));
        }
    };

    const handleLongPressItem = (category, item) => {
        Alert.alert('Manage Item', `Choose action for "${item}"`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => openAddInput(category, true, item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(category, item) }
        ]);
    };

    // --- END PROCEDURE LOGIC ---
    const renderList = () => {
        const StatCard = ({ title, value, icon: Icon, color, bg }) => (
            <View style={{ width: safeLayout.isTablet ? '32%' : '48%', backgroundColor: bg, padding: 15, borderRadius: 16, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color }}>{value}</Text>
                        <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>{title}</Text>
                    </View>
                    <View style={{ backgroundColor: color, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color="#FFF" />
                    </View>
                </View>
            </View>
        );

        return (
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={getPaddedContentStyle(layout, { marginBottom: 16 })}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <StatCard title="Total Templates" value={templates.length} icon={FileText} color="#2563eb" bg={theme.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff'} />
                        <StatCard title="Medicine Lines" value={totalMedicineLines} icon={Pill} color="#10b981" bg={theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'} />
                        <StatCard title="Proc + Investigations" value={totalProcedureLines} icon={TestTube} color="#7c3aed" bg={theme.mode === 'dark' ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff'} />
                        <StatCard title="Visible Rows" value={visibleTemplates.length} icon={Settings} color="#f59e0b" bg={theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'} />
                    </View>

                    <View style={{ marginBottom: 20, backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 12, gap: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>Filters</Text>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>{searchQuery ? 'Filtered templates' : 'All templates'}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                            <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder="Search templates..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <X size={18} color={theme.textDim} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                <View style={getPaddedContentStyle(layout, { paddingBottom: 12 })}>
                    {filteredTemplates.length > 0 ? (
                        <>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
                                <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: tableMinWidth, flex: 1, borderRadius: 24, padding: 1.5 }}>
                                    <View style={{ borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                        <LinearGradient colors={tableTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                                            <Text style={{ width: 230, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Template</Text>
                                            <Text style={{ width: 220, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Diagnosis</Text>
                                            <Text style={{ width: 130, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medicines</Text>
                                            <Text style={{ width: 170, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Procedures / Inv.</Text>
                                            <Text style={{ width: 240, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Advice / Referral</Text>
                                            <Text style={{ flex: 1, minWidth: 240, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                        </LinearGradient>

                                        <View style={{ overflow: 'hidden' }}>
                                            {visibleTemplates.map((item, index) => {
                                                const procedureCount = (item.procedures || []).length;
                                                const investigationCount = (item.nextVisitInvestigations || []).length;
                                                const isLastRow = index === visibleTemplates.length - 1;

                                                return (
                                                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                        <View style={{ width: 230, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                                                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(45,212,191,0.16)', 'rgba(14,165,233,0.14)'] : ['#ccfbf1', '#dbeafe']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                                                <FileText size={18} color={tableTheme.accentText} />
                                                            </LinearGradient>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name || 'Untitled Template'}</Text>
                                                                <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }} numberOfLines={1}>Reusable prescription template</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ width: 220, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }} numberOfLines={2}>{item.diagnosis || 'Not specified'}</Text>
                                                        </View>

                                                        <View style={{ width: 130, paddingRight: 12 }}>
                                                            <View style={{ alignSelf: 'flex-start', backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                                <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>{(item.medicines || []).length} items</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ width: 170, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }} numberOfLines={2}>{`${procedureCount} procedures • ${investigationCount} investigations`}</Text>
                                                        </View>

                                                        <View style={{ width: 240, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '500' }} numberOfLines={2}>{item.referral || item.advice || 'No advice added'}</Text>
                                                        </View>

                                                        <View style={{ flex: 1, minWidth: 240, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                            <TouchableOpacity onPress={() => handleUseTemplateInPrescription(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.16)' : '#dcfce7', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <PlusCircle size={16} color="#059669" />
                                                                <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700' }}>Use Rx</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => openTemplateDetails(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Eye size={16} color={tableTheme.viewActionText} />
                                                                <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>View</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDuplicateTemplate(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.mode === 'dark' ? 'rgba(132,204,22,0.16)' : '#ecfccb', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Copy size={16} color="#4d7c0f" />
                                                                <Text style={{ color: '#4d7c0f', fontSize: 12, fontWeight: '700' }}>Copy</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Pencil size={16} color={tableTheme.editActionText} />
                                                                <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.deleteActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
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
                                    {filteredTemplates.length === templates.length
                                        ? `Showing ${visibleTemplates.length} of ${templates.length} templates`
                                        : `Showing ${visibleTemplates.length} of ${filteredTemplates.length} filtered templates`}
                                </Text>
                                <TouchableOpacity onPress={() => setRowLimitPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ color: tableTheme.footerHint, fontSize: 12, fontWeight: '700' }}>{`Rows: ${rowLimit}`}</Text>
                                    <ChevronDown size={14} color={tableTheme.footerHint} />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <Clipboard size={50} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 10 }}>{searchQuery ? 'No templates match your search.' : 'No templates found.'}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderVitalsSummary = () => {
        const latestVitals = editableVitals && Object.keys(editableVitals).length > 0
            && (
                editableVitals.sys
                || editableVitals.dia
                || editableVitals.pulse
                || editableVitals.spo2
                || editableVitals.temp
                || editableVitals.weight
                || editableVitals.height
                || editableVitals.bmi
                || editableVitals.resp
                || editableVitals.grbs
                || editableVitals.fbs
                || editableVitals.rbs
                || editableVitals.hb
                || editableVitals.pain
            )
            ? editableVitals
            : null;

        const VitalItem = ({ label, value, unit, icon: Icon, color, bg }) => (
            <TouchableOpacity onPress={() => setVitalsModalVisible(true)} style={{ backgroundColor: bg || theme.cardBg, borderRadius: 12, padding: 12, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: color, minWidth: 80, shadowColor: color, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon size={16} color={color} />
                    <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }}>{value || '--'} <Text style={{ fontSize: 11, fontWeight: '600' }}>{unit}</Text></Text>
            </TouchableOpacity>
        );

        return (
            <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Patient Vitals</Text>
                    <TouchableOpacity onPress={() => setVitalsModalVisible(true)} style={{flexDirection:'row', alignItems:'center', gap:5, backgroundColor: theme.primary + '20', paddingHorizontal:12, paddingVertical:6, borderRadius:20}}>
                        <Pencil size={12} color={theme.primary} />
                        <Text style={{ fontSize: 12, color: theme.primary, fontWeight:'bold' }}>Update</Text>
                    </TouchableOpacity>
                </View>
                {!latestVitals ? (
                    <TouchableOpacity onPress={() => setVitalsModalVisible(true)} style={{ backgroundColor: theme.primary + '10', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 2, borderColor: theme.primary + '50' }}>
                        <Activity size={24} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontSize: 15, fontWeight:'600' }}>Tap to Record Patient Vitals</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                        {latestVitals.sys && <VitalItem label="BP" value={`${latestVitals.sys}/${latestVitals.dia}`} unit="mmHg" icon={Activity} color="#ef4444" bg="#fee2e2" />}
                        {latestVitals.pulse && <VitalItem label="Pulse" value={latestVitals.pulse} unit="bpm" icon={HeartPulse} color="#8b5cf6" bg="#ede9fe" />}
                        {latestVitals.temp && <VitalItem label="Temp" value={latestVitals.temp} unit={`°${latestVitals.tempUnit || 'C'}`} icon={Thermometer} color="#f59e0b" bg="#fef3c7" />}
                        {latestVitals.weight && <VitalItem label="Weight" value={latestVitals.weight} unit="kg" icon={Weight} color="#10b981" bg="#d1fae5" />}
                        {latestVitals.spo2 && <VitalItem label="SpO2" value={latestVitals.spo2} unit="%" icon={Droplet} color="#0ea5e9" bg="#e0f2fe" />}
                        {latestVitals.resp && <VitalItem label="RR" value={latestVitals.resp} unit="/min" icon={Stethoscope} color="#2563eb" bg="#dbeafe" />}
                        {latestVitals.height && <VitalItem label="Height" value={latestVitals.height} unit="cm" icon={Activity} color="#0891b2" bg="#cffafe" />}
                        {latestVitals.bmi && <VitalItem label="BMI" value={latestVitals.bmi} unit="kg/m2" icon={FlaskConical} color="#7c3aed" bg="#ede9fe" />}
                        {latestVitals.grbs && <VitalItem label="GRBS" value={latestVitals.grbs} unit="mg/dL" icon={TestTube} color="#dc2626" bg="#fee2e2" />}
                        {latestVitals.fbs && <VitalItem label="FBS" value={latestVitals.fbs} unit="mg/dL" icon={TestTube} color="#be123c" bg="#ffe4e6" />}
                        {latestVitals.rbs && <VitalItem label="RBS" value={latestVitals.rbs} unit="mg/dL" icon={TestTube} color="#9f1239" bg="#ffe4e6" />}
                        {latestVitals.hb && <VitalItem label="Hb" value={latestVitals.hb} unit="g/dL" icon={Droplet} color="#b91c1c" bg="#fee2e2" />}
                        {latestVitals.pain && <VitalItem label="Pain" value={latestVitals.pain} unit="/10" icon={HeartPulse} color="#c2410c" bg="#ffedd5" />}
                    </View>
                )}
            </View>
        );
    };

    const renderEditor = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 100 })}>
            {isPrescription && (
                <View style={{ marginBottom: 20 }}>
                    {patient ? (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <View>
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>{patient.name}</Text>
                                    <Text style={{ color: theme.textDim }}>{patient.age || '--'} Yrs • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Unknown'} • ID: #{patient.id}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 12, color: theme.textDim }}>Date</Text>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{new Date().toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 15 }} />
                            {renderVitalsSummary()}

                            <View style={{ marginBottom: 20, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View>
                                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Template Library</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 3 }}>Load a saved prescription structure into this visit</Text>
                                    </View>
                                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{templates.length} saved</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                    <TouchableOpacity onPress={() => setShowTemplatePicker(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.primary }}>
                                        <Copy size={18} color={theme.primary} />
                                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Template</Text>
                                    </TouchableOpacity>
                                    
                                    {isPrescription && patient?.rxHistory?.length > 0 && (
                                        <TouchableOpacity onPress={() => setPastRxModalVisible(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#d946ef' }}>
                                            <TrendingDown size={18} color="#d946ef" />
                                            <Text style={{ color: '#d946ef', fontWeight: 'bold' }}>Old Rx</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={{ marginBottom: 20, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Patient unavailable</Text>
                            <Text style={{ color: theme.textDim, fontSize: 13, marginTop: 6 }}>Select a patient to continue this prescription.</Text>
                            <TouchableOpacity
                                onPress={() => setPatientPickerVisible(true)}
                                style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.18)' : '#dbeafe', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.26)' : '#93c5fd', borderRadius: 12, paddingVertical: 10 }}
                            >
                                <UserPlus size={16} color="#2563eb" />
                                <Text style={{ color: '#2563eb', fontWeight: '700' }}>Select Patient</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {!isPrescription && (
                <LinearGradient colors={medicalPalette.hero} style={{ marginBottom: 25, borderRadius: 24, padding: 1.5 }}>
                    <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 22, padding: 5, borderWidth: 1, borderColor: medicalPalette.heroBorder }}>
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ borderRadius: 18, padding: 18 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>MEDICAL TEMPLATE BUILDER</Text>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, letterSpacing: 0.8, marginTop: 6 }}>RX TEMPLATE</Text>
                            </View>
                            <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }}>
                                <FileText size={24} color="white" />
                            </View>
                        </View>
                    </LinearGradient>
                    <View style={{ padding: 16 }}>
                        <InputGroup icon={FileText} label="Template Name *" value={editorForm.name} onChange={(value) => setEditorForm({ ...editorForm, name: value })} theme={theme} placeholder="e.g. Viral Fever" styles={styles} />
                    </View>
                    </View>
                </LinearGradient>
            )}

            <LinearGradient colors={medicalPalette.diagnosis} style={{ marginBottom: 20, borderRadius: 22, padding: 1.5 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.16)' : '#bfdbfe' }}>
                {renderSectionHeader('Diagnosis', 'Clinical notes and presenting condition', Stethoscope, '#2563eb')}
                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Diagnosis Search / Select</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <Search size={18} color={theme.textDim} />
                    <TextInput
                        style={[styles.textInput, { color: theme.text }]}
                        value={diagnosisPickerSearch}
                        onFocus={() => setShowDiagnosisSuggestions(true)}
                        onChangeText={(value) => {
                            setDiagnosisPickerSearch(value);
                            setEditorForm((prev) => ({ ...prev, diagnosis: value }));
                            setShowDiagnosisSuggestions(true);
                        }}
                        placeholder="Search diagnosis from list..."
                        placeholderTextColor={theme.textDim}
                    />
                    {diagnosisPickerSearch.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setDiagnosisPickerSearch('');
                                setShowDiagnosisSuggestions(false);
                            }}
                        >
                            <X size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    )}
                </View>

                {showDiagnosisSuggestions && diagnosisOptions.length > 0 && (
                    <View style={{ marginTop: 8, backgroundColor: theme.cardBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {inlineDiagnosisSuggestions.length > 0 ? inlineDiagnosisSuggestions.map((diagnosisItem, index) => (
                                <TouchableOpacity
                                    key={`${diagnosisItem.name}-${index}`}
                                    onPress={() => {
                                        setEditorForm((prev) => ({ ...prev, diagnosis: diagnosisItem.name }));
                                        setDiagnosisPickerSearch(diagnosisItem.name);
                                        setShowDiagnosisSuggestions(false);
                                    }}
                                    style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: index === inlineDiagnosisSuggestions.length - 1 ? 0 : 1, borderBottomColor: theme.border }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{diagnosisItem.name}</Text>
                                </TouchableOpacity>
                            )) : (
                                <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                                    <Text style={{ color: theme.textDim, fontSize: 12 }}>No matching diagnosis found.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}

                {editorForm.diagnosis ? (
                    <Text style={{ marginTop: 8, color: theme.textDim, fontSize: 12 }}>Selected: {editorForm.diagnosis}</Text>
                ) : null}
                <TouchableOpacity
                    onPress={() => handleAddDiagnosisToList(editorForm.diagnosis)}
                    style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(37,99,235,0.14)' : '#eff6ff', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.24)' : '#bfdbfe' }}
                >
                    <PlusCircle size={16} color="#2563eb" />
                    <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 13 }}>Add Diagnosis To List</Text>
                </TouchableOpacity>
                {diagnosisOptions.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setDiagnosisPickerVisible(true)}
                        style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.16)' : '#dbeafe', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.28)' : '#93c5fd' }}
                    >
                        <Search size={16} color="#2563eb" />
                        <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 13 }}>Search Pre-added Diagnosis</Text>
                    </TouchableOpacity>
                )}
            </View>
            </LinearGradient>

            <LinearGradient colors={medicalPalette.medicines} style={{ borderRadius: 22, padding: 1.5, marginTop: 10, marginBottom: 25 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.16)' : '#bbf7d0' }}>
            {renderSectionHeader('Medicines (Rx)', 'Prescription medicines and dosage plan', Pill, '#10b981')}

            <View style={{ gap: 12, marginBottom: 14 }}>
                {editorForm.medicines.map((medicine, index) => (
                    <LinearGradient key={index} colors={theme.mode === 'dark' ? ['rgba(16,185,129,0.16)', 'rgba(14,165,233,0.06)'] : ['#f0fdf4', '#ecfeff']} style={{ borderRadius: 18, padding: 1.5 }}>
                    <View style={{ backgroundColor: medicalPalette.shell, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{medicine.name} <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textDim }}>{medicine.dosage ? `(${medicine.dosage})` : ''}</Text></Text>
                            {medicine.isTapering ? (
                                <View style={{ marginTop: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                        <TrendingDown size={12} color="#c2410c" />
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#c2410c' }}>Tapering Schedule</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: '#9a3412', fontStyle: 'italic' }}>{medicine.freq} for {medicine.duration}</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: '#fdf2f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbcfe8' }}>
                                        <Text style={{ fontSize: 11, color: '#db2777', fontWeight: 'bold' }}>{medicine.freq}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}>
                                        <Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>{medicine.duration}</Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontStyle: 'italic' }}>{medicine.instruction}</Text>
                                </View>
                            )}
                        </View>
                        <View style={{ alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity onPress={() => handleEditMedInTemplate(index)} style={{ padding: 6, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                <Pencil size={14} color={theme.textDim} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeMedFromTemplate(index)} style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    </LinearGradient>
                ))}
                {editorForm.medicines.length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No medicines added yet.</Text></View>}
            </View>
            <TouchableOpacity onPress={openMedModal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.18)' : '#dcfce7', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.28)' : '#86efac' }}>
                <PlusCircle size={18} color='#10b981' />
                <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 14 }}>Add Medicine</Text>
            </TouchableOpacity>
            </View>
            </LinearGradient>

            <LinearGradient colors={medicalPalette.procedures} style={{ borderRadius: 22, padding: 1.5, marginBottom: 25 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(249,115,22,0.16)' : '#fdba74' }}>
            {renderSectionHeader('Procedures / Services', 'Treatment procedures and estimated billing', Settings, '#f97316')}

            <View style={{ gap: 12, marginBottom: 14 }}>
                {(editorForm.procedures || []).map((procedureItem, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{procedureItem.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.textDim }}>Category: {procedureItem.category}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>₹{procedureItem.cost}</Text>
                            <View style={{ alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity onPress={() => openEditItemFromForm(index, 'procedure')} style={{ padding: 6, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                    <Pencil size={14} color={theme.textDim} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeItemFromForm(index, 'procedure')} style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                    <Trash2 size={14} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
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
            <TouchableOpacity onPress={openProcedureModal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(249,115,22,0.18)' : '#ffedd5', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(249,115,22,0.28)' : '#fdba74' }}>
                <PlusCircle size={18} color='#f97316' />
                <Text style={{ color: '#f97316', fontWeight: 'bold', fontSize: 14 }}>Add Procedure</Text>
            </TouchableOpacity>
            </View>
            </LinearGradient>

            <LinearGradient colors={medicalPalette.investigations} style={{ borderRadius: 22, padding: 1.5, marginBottom: 25 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(14,165,233,0.16)' : '#93c5fd' }}>
            {renderSectionHeader('Investigation On Next Visit', 'Follow-up diagnostics and test planning', TestTube, '#0284c7')}

            <View style={{ gap: 12, marginBottom: 14 }}>
                {(editorForm.nextVisitInvestigations || []).map((item, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' }}>
                                <TestTube size={16} color="#0284c7" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{item.name}</Text>
                                <Text style={{ fontSize: 12, color: theme.textDim }}>Next Visit</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity onPress={() => openEditItemFromForm(index, 'investigation')} style={{ padding: 6, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                <Pencil size={14} color={theme.textDim} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeItemFromForm(index, 'investigation')} style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
                {(editorForm.nextVisitInvestigations || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No investigations added.</Text></View>}
            </View>
            <TouchableOpacity onPress={openInvestigationModal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(14,165,233,0.18)' : '#e0f2fe', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(14,165,233,0.26)' : '#93c5fd' }}>
                <PlusCircle size={18} color='#0284c7' />
                <Text style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 14 }}>Add Investigation</Text>
            </TouchableOpacity>
            </View>
            </LinearGradient>

            <LinearGradient colors={medicalPalette.referral} style={{ marginBottom: 20, borderRadius: 22, padding: 1.5 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.16)' : '#c4b5fd' }}>
                {renderSectionHeader('Referral', 'Specialist consultation and handoff', UserPlus, '#7c3aed')}
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
                            <Text style={{ color: theme.textDim, fontWeight: '600' }}>Referral / Specialist Consults</Text>
                            <TouchableOpacity onPress={() => { setShowReferral(false); setEditorForm({ ...editorForm, referral: '' }); setReferralDraft(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={14} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <InputGroup
                                    icon={UserPlus}
                                    label="Add Referral"
                                    value={referralDraft}
                                    onChange={setReferralDraft}
                                    theme={theme}
                                    placeholder="e.g. Neurologist - Dr. Smith"
                                    styles={styles}
                                />
                            </View>
                            <TouchableOpacity onPress={handleAddReferralEntry} style={{ marginBottom: 4 }}>
                                <LinearGradient colors={theme.mode === 'dark' ? ['#7c3aed', '#6366f1'] : ['#8b5cf6', '#6366f1']} style={{ height: 55, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {referralEntries.length > 0 && (
                            <View style={{ marginTop: 12, gap: 8 }}>
                                {referralEntries.map((referralEntry, index) => (
                                    <View key={`${referralEntry}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.16)' : '#ede9fe', borderRadius: 10, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.24)' : '#c4b5fd', paddingVertical: 8, paddingHorizontal: 10 }}>
                                        <Text style={{ color: theme.text, fontWeight: '600', flex: 1, paddingRight: 10 }}>{referralEntry}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveReferralEntry(index)} style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.2)' : '#fee2e2', padding: 6, borderRadius: 8 }}>
                                            <Trash2 size={13} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
            </LinearGradient>

            <LinearGradient colors={medicalPalette.advice} style={{ borderRadius: 22, padding: 1.5 }}>
            <View style={{ backgroundColor: medicalPalette.shell, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(251,146,60,0.16)' : '#fdba74' }}>
                {renderSectionHeader('Advice', 'Lifestyle notes and discharge guidance', Clipboard, '#ea580c')}
                <InputGroup icon={Clipboard} label="Advice / Notes" value={editorForm.advice} onChange={(value) => setEditorForm({ ...editorForm, advice: value })} theme={theme} multiline placeholder="Enter patient advice (e.g., Drink warm water)..." styles={styles} />
            </View>
            </LinearGradient>

                <View style={{ height: 40 }} />
        </ScrollView>
    );

    const renderProcedureModal = () => {
        const procMatches = (procedures || []).filter((item) => item.name.toLowerCase().includes(procSearch.toLowerCase()) && procSearch.length > 0);
        const getCatInfo = (categoryName) => PROCEDURE_CATEGORIES.find((category) => category.value === categoryName) || PROCEDURE_CATEGORIES[0];
        const modalTitle = procModalType === 'investigation' ? 'Add New Investigation' : 'Add New Procedure';
        const customBtnLabel = procModalType === 'investigation' ? 'Add Custom Investigation' : 'Add Custom Procedure';
        const procUi = procModalType === 'investigation'
            ? {
                iconBg: theme.mode === 'dark' ? 'rgba(14,165,233,0.22)' : '#e0f2fe',
                iconColor: '#0284c7',
                softBg: theme.mode === 'dark' ? 'rgba(14,165,233,0.1)' : '#f0f9ff',
                softBorder: theme.mode === 'dark' ? 'rgba(14,165,233,0.24)' : '#7dd3fc',
                shellColors: theme.mode === 'dark' ? ['rgba(14,165,233,0.2)', 'rgba(37,99,235,0.1)'] : ['#ecfeff', '#eff6ff'],
                primaryButton: ['#0ea5e9', '#2563eb']
            }
            : {
                iconBg: theme.mode === 'dark' ? 'rgba(249,115,22,0.22)' : '#ffedd5',
                iconColor: '#ea580c',
                softBg: theme.mode === 'dark' ? 'rgba(249,115,22,0.1)' : '#fff7ed',
                softBorder: theme.mode === 'dark' ? 'rgba(249,115,22,0.24)' : '#fdba74',
                shellColors: theme.mode === 'dark' ? ['rgba(249,115,22,0.2)', 'rgba(234,88,12,0.1)'] : ['#fff7ed', '#fffbeb'],
                primaryButton: ['#f97316', '#ea580c']
            };

        const renderModalContent = () => {
            if (procViewMode === 'list') {
                return (
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', gap: 12 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{modalTitle}</Text>
                                <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>Select from your master list or add a custom entry.</Text>
                            </View>
                            <TouchableOpacity onPress={() => setProcModalVisible(false)} style={{ backgroundColor: modalTheme.cancelBg, padding: 8, borderRadius: 20 }}>
                                <X size={20} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
                            <TouchableOpacity onPress={openAddMasterProc} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: procUi.softBg, borderWidth: 1, borderColor: procUi.softBorder, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                                <PlusCircle size={16} color={procUi.iconColor} />
                                <Text style={{ color: procUi.iconColor, fontSize: 12, fontWeight: 'bold' }}>New</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15, backgroundColor: modalTheme.sectionBg, borderRadius: 18, borderWidth: 1, borderColor: modalTheme.sectionBorder, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                                <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                                <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder={procModalType === 'investigation' ? 'Search investigation...' : 'Search procedure...'} placeholderTextColor={theme.textDim} value={procSearch} onChangeText={setProcSearch} />
                                {procSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setProcSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <X size={18} color={theme.textDim} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setShowCustomInput(!showCustomInput)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: procUi.softBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: procUi.softBorder, marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: procUi.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                                    <FlaskConical size={18} color={procUi.iconColor} />
                                </View>
                                <Text style={{ fontWeight: 'bold', color: theme.text }}>{customBtnLabel}</Text>
                            </View>
                            <ChevronDown size={20} color={theme.textDim} style={{ transform: [{ rotate: showCustomInput ? '180deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {showCustomInput && (
                            <LinearGradient colors={procUi.shellColors} style={{ borderRadius: 17, padding: 1.5, marginBottom: 15 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: procUi.softBorder, padding: 15, borderRadius: 16, gap: 10 }}>
                                    <InputGroup icon={FileText} label="Name" value={customProcForm.name} onChange={(value) => setCustomProcForm({ ...customProcForm, name: value })} theme={theme} placeholder={procModalType === 'investigation' ? 'e.g. Thyroid Profile' : 'e.g. X-Ray Chest'} styles={styles} />
                                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                        <View style={{ flex: 1 }}>
                                            <InputGroup icon={Banknote} label="Price (Optional)" value={customProcForm.cost} onChange={(value) => setCustomProcForm({ ...customProcForm, cost: value })} theme={theme} placeholder="0" keyboardType="numeric" styles={styles} />
                                        </View>
                                        <TouchableOpacity onPress={addCustomToRx} style={{ marginBottom: 4 }}>
                                            <LinearGradient colors={procUi.primaryButton} style={{ height: 55, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        )}

                        <FlatList
                            style={{ flex: 1 }}
                            data={procSearch.length > 0 ? procMatches : procedures}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const catInfo = getCatInfo(item.category);
                                const CategoryIcon = catInfo.icon;
                                return (
                                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: catInfo.bg, alignItems: 'center', justifyContent: 'center' }}>
                                                <CategoryIcon size={20} color={catInfo.color} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
            }

            return (
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center', gap: 12 }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{procViewMode === 'edit_master' ? `Edit ${procModalType === 'investigation' ? 'Investigation' : 'Procedure'}` : modalTitle}</Text>
                            <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>Update your reusable procedure or investigation catalog.</Text>
                        </View>
                        <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ backgroundColor: modalTheme.cancelBg, padding: 8, borderRadius: 20 }}>
                            <ArrowLeft size={20} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
                        <View style={{ gap: 15 }}>
                            <LinearGradient colors={procUi.shellColors} style={{ borderRadius: 19, padding: 1.5 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 18, borderWidth: 1, borderColor: procUi.softBorder, padding: 16 }}>
                                    <InputGroup icon={Settings} label="Name *" value={masterProcForm.name} onChange={(value) => setMasterProcForm({ ...masterProcForm, name: value })} theme={theme} placeholder="Enter name" styles={styles} />
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={procUi.shellColors} style={{ borderRadius: 19, padding: 1.5 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 18, borderWidth: 1, borderColor: procUi.softBorder, padding: 16 }}>
                                    <InputGroup icon={Banknote} label="Price (₹)" value={masterProcForm.cost} onChange={(value) => setMasterProcForm({ ...masterProcForm, cost: value })} theme={theme} placeholder="Enter price" keyboardType="numeric" styles={styles} />
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={procUi.shellColors} style={{ borderRadius: 19, padding: 1.5 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 18, borderWidth: 1, borderColor: procUi.softBorder, padding: 16 }}>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                    {PROCEDURE_CATEGORIES.map((category) => {
                                        const CategoryIcon = category.icon;
                                        const isSelected = masterProcForm.category === category.value;

                                        return (
                                            <TouchableOpacity key={category.value} onPress={() => setMasterProcForm({ ...masterProcForm, category: category.value })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: isSelected ? category.color : theme.inputBg, borderWidth: 1, borderColor: isSelected ? category.color : theme.border }}>
                                                <CategoryIcon size={14} color={isSelected ? 'white' : category.color} />
                                                <Text style={{ color: isSelected ? 'white' : theme.text, fontWeight: '600', fontSize: 12 }}>{category.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                                </View>
                            </LinearGradient>
                        </View>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: modalTheme.cancelBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                            <Text style={{ color: modalTheme.cancelText, fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveMasterProcedure} style={{ flex: 1 }}>
                            <LinearGradient colors={procUi.primaryButton} style={{ padding: 15, borderRadius: 12, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        };

        return (
            <Modal visible={procModalVisible} animationType="slide" transparent onRequestClose={() => setProcModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setProcModalVisible(false)} />
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ height: popupHeight, backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, paddingHorizontal: safeLayout.isTablet ? 25 : 18, paddingTop: 22, paddingBottom: safeLayout.isTablet ? 24 : 18, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, elevation: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                            {renderModalContent()}
                        </View>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const TemplateDetailPopup = () => {
        if (!selectedTemplate || !viewModalVisible) {
            return null;
        }

        const medicinesList = selectedTemplate.medicines || [];
        const proceduresList = selectedTemplate.procedures || [];
        const investigationsList = selectedTemplate.nextVisitInvestigations || [];

        return (
            <Modal visible={viewModalVisible} transparent animationType="fade" onRequestClose={() => setViewModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 18 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewModalVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ width: '100%', maxWidth: safeLayout.isTablet ? 720 : undefined, height: popupHeight, borderRadius: 26, padding: 1.5, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: modalTheme.surface, borderRadius: 25, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.22, elevation: 10, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={modalTheme.headerColors} style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 }}>
                                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color="white" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: modalTheme.eyebrowText, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>MEDICAL TEMPLATE</Text>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginTop: 3 }}>Template Details</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 6, borderRadius: 16 }}>
                                <X size={18} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>
                        <ScrollView
                            style={{ flex: 1, backgroundColor: 'transparent' }}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                        >
                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(16,185,129,0.16)', 'rgba(14,165,233,0.08)'] : ['#ecfdf5', '#eff6ff']} style={{ borderRadius: 16, padding: 1.5 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FileText size={16} color={theme.primary} />
                                        <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Template Name</Text>
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{selectedTemplate.name || 'Untitled Template'}</Text>
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(59,130,246,0.14)', 'rgba(14,165,233,0.08)'] : ['#eff6ff', '#ecfeff']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Stethoscope size={16} color="#2563eb" />
                                        <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Diagnosis</Text>
                                    </View>
                                    <Text style={{ fontSize: 15, color: theme.text, fontWeight: '600', lineHeight: 22 }}>{selectedTemplate.diagnosis || 'Not specified'}</Text>
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(251,146,60,0.14)', 'rgba(244,63,94,0.08)'] : ['#fff7ed', '#fff1f2']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Clipboard size={16} color="#c2410c" />
                                        <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Advice</Text>
                                    </View>
                                    <Text style={{ color: theme.textDim, fontSize: 14, lineHeight: 20 }}>{selectedTemplate.advice || 'No specific advice.'}</Text>
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(139,92,246,0.16)', 'rgba(124,58,237,0.08)'] : ['#f5f3ff', '#faf5ff']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <UserPlus size={16} color="#7c3aed" />
                                        <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Referral</Text>
                                    </View>
                                    <Text style={{ color: theme.textDim, fontSize: 14, lineHeight: 20 }}>{selectedTemplate.referral || 'No referral added.'}</Text>
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(16,185,129,0.16)', 'rgba(45,212,191,0.08)'] : ['#ecfdf5', '#f0fdf4']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Pill size={16} color="#059669" />
                                            <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Medicines</Text>
                                        </View>
                                        <Text style={{ color: '#059669', fontSize: 12, fontWeight: '800' }}>{medicinesList.length} items</Text>
                                    </View>
                                    {medicinesList.length > 0 ? medicinesList.map((medicine, index) => (
                                        <View key={`${medicine.id || medicine.name || 'med'}-${index}`} style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: modalTheme.sectionBorder, marginTop: index === 0 ? 0 : 8 }}>
                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{medicine.name || 'Unnamed medicine'}</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 3 }}>
                                                {[medicine.type, medicine.content, medicine.doseQty, medicine.freq, medicine.duration, medicine.instruction]
                                                    .filter(Boolean)
                                                    .join(' | ') || 'No additional medicine details'}
                                            </Text>
                                        </View>
                                    )) : (
                                        <Text style={{ color: theme.textDim, fontSize: 13 }}>No medicines added.</Text>
                                    )}
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(249,115,22,0.16)', 'rgba(234,88,12,0.08)'] : ['#fff7ed', '#fffbeb']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Settings size={16} color="#ea580c" />
                                            <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Procedures</Text>
                                        </View>
                                        <Text style={{ color: '#ea580c', fontSize: 12, fontWeight: '800' }}>{proceduresList.length} items</Text>
                                    </View>
                                    {proceduresList.length > 0 ? proceduresList.map((procedure, index) => (
                                        <View key={`${procedure.id || procedure.name || 'proc'}-${index}`} style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: modalTheme.sectionBorder, marginTop: index === 0 ? 0 : 8 }}>
                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{procedure.name || 'Unnamed procedure'}</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 3 }}>
                                                {[procedure.category, procedure.cost ? `Rs ${procedure.cost}` : null].filter(Boolean).join(' | ') || 'No additional procedure details'}
                                            </Text>
                                        </View>
                                    )) : (
                                        <Text style={{ color: theme.textDim, fontSize: 13 }}>No procedures added.</Text>
                                    )}
                                </View>
                            </LinearGradient>

                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(14,165,233,0.16)', 'rgba(59,130,246,0.08)'] : ['#eff6ff', '#ecfeff']} style={{ borderRadius: 16, padding: 1.5, marginTop: 14 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <FlaskConical size={16} color="#0284c7" />
                                            <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', fontWeight: '700' }}>Investigations</Text>
                                        </View>
                                        <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '800' }}>{investigationsList.length} items</Text>
                                    </View>
                                    {investigationsList.length > 0 ? investigationsList.map((investigation, index) => (
                                        <View key={`${investigation.id || investigation.name || 'inv'}-${index}`} style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: modalTheme.sectionBorder, marginTop: index === 0 ? 0 : 8 }}>
                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{investigation.name || 'Unnamed investigation'}</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 3 }}>
                                                {[investigation.category, investigation.cost ? `Rs ${investigation.cost}` : null].filter(Boolean).join(' | ') || 'No additional investigation details'}
                                            </Text>
                                        </View>
                                    )) : (
                                        <Text style={{ color: theme.textDim, fontSize: 13 }}>No investigations added.</Text>
                                    )}
                                </View>
                            </LinearGradient>
                        </ScrollView>
                    </View>
                    </LinearGradient>
                </View>
            </Modal>
        );
    };

    const TemplatePickerModal = () => {
        const pickerFilteredTemplates = templates.filter((template) => {
            const query = templatePickerSearch.toLowerCase();
            const templateMedicines = template.medicines || [];

            return String(template?.name || '').toLowerCase().includes(query)
                || (template.diagnosis || '').toLowerCase().includes(query)
                || templateMedicines.some((medicine) => String(medicine?.name || '').toLowerCase().includes(query));
        });

        return (
        <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowTemplatePicker(false)} />
                <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, height: popupHeight, borderWidth: 1, borderColor: modalTheme.shellBorder, overflow: 'hidden' }}>
                    <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: modalTheme.eyebrowText, letterSpacing: 0.7 }}>TEMPLATE LIBRARY</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: modalTheme.headerText, marginTop: 4 }}>Select a Template</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowTemplatePicker(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}>
                            <X size={22} color={modalTheme.closeIcon} />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: theme.border }}>
                            <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                            <TextInput style={{ flex: 1, color: theme.text }} placeholder="Search templates..." placeholderTextColor={theme.textDim} value={templatePickerSearch} onChangeText={setTemplatePickerSearch} />
                            {templatePickerSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setTemplatePickerSearch('')}>
                                    <X size={16} color={theme.textDim} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                        <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: modalTheme.sectionBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>Templates ready to use</Text>
                            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>{pickerFilteredTemplates.length} found</Text>
                        </View>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 12 }}>
                        {pickerFilteredTemplates.length > 0 ? (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">
                                {pickerFilteredTemplates.map((item) => {
                                    const summary = [
                                        `${(item.medicines || []).length} med`,
                                        `${(item.procedures || []).length} proc`,
                                        `${(item.nextVisitInvestigations || []).length} inv`
                                    ].join(' • ');

                                    return (
                                        <View key={item.id} style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name || 'Untitled Template'}</Text>
                                            <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 5 }} numberOfLines={2}>{item.diagnosis || 'Not specified'}</Text>
                                            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600', marginTop: 8 }}>{summary}</Text>
                                            <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                                                <TouchableOpacity onPress={() => applyTemplate(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                    <Copy size={16} color={tableTheme.editActionText} />
                                                    <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Use</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <FileText size={42} color={theme.textDim} />
                                <Text style={{ textAlign: 'center', paddingTop: 12, color: theme.textDim }}>No templates available.</Text>
                            </View>
                        )}
                    </View>
                </View>
                </LinearGradient>
            </View>
            </KeyboardAvoidingView>
        </Modal>
        );
    };

    const DiagnosisPickerModal = () => (
        <Modal visible={diagnosisPickerVisible} transparent animationType="slide" onRequestClose={() => setDiagnosisPickerVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setDiagnosisPickerVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, maxHeight: popupHeight, borderWidth: 1, borderColor: modalTheme.shellBorder, overflow: 'hidden' }}>
                            <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: modalTheme.eyebrowText, letterSpacing: 0.7 }}>DIAGNOSIS LIBRARY</Text>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: modalTheme.headerText, marginTop: 4 }}>Select Diagnosis</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setDiagnosisPickerVisible(false);
                                        setDiagnosisPickerSearch('');
                                    }}
                                    style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}
                                >
                                    <X size={22} color={modalTheme.closeIcon} />
                                </TouchableOpacity>
                            </LinearGradient>

                            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: theme.border }}>
                                    <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={{ flex: 1, color: theme.text }}
                                        placeholder="Search diagnosis..."
                                        placeholderTextColor={theme.textDim}
                                        value={diagnosisPickerSearch}
                                        onChangeText={setDiagnosisPickerSearch}
                                    />
                                    {diagnosisPickerSearch.length > 0 && (
                                        <TouchableOpacity onPress={() => setDiagnosisPickerSearch('')}>
                                            <X size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        handleAddDiagnosisToList(diagnosisPickerSearch);
                                        setDiagnosisPickerSearch('');
                                    }}
                                    style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.mode === 'dark' ? 'rgba(37,99,235,0.16)' : '#dbeafe', borderRadius: 10, paddingVertical: 9, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.24)' : '#93c5fd' }}
                                >
                                    <PlusCircle size={15} color="#2563eb" />
                                    <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 12 }}>Add Search Text To List</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                                <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: modalTheme.sectionBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>Available diagnoses</Text>
                                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>{filteredDiagnosisItems.length} found</Text>
                                </View>
                            </View>

                            <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
                                {filteredDiagnosisItems.length > 0 ? (
                                    <ScrollView style={{ maxHeight: safeLayout.isTablet ? 420 : 300 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                        <View style={{ gap: 10 }}>
                                            {filteredDiagnosisItems.map((diagnosisItem, index) => (
                                                <View
                                                    key={`${diagnosisItem.name}-${index}`}
                                                    style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: modalTheme.sectionBorder }}
                                                >
                                                    {editingDiagnosis && editingDiagnosis.toLowerCase() === diagnosisItem.name.toLowerCase() ? (
                                                        <>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 10, paddingHorizontal: 10, height: 42, borderWidth: 1, borderColor: theme.border }}>
                                                                <TextInput
                                                                    style={{ flex: 1, color: theme.text }}
                                                                    value={editingDiagnosisText}
                                                                    onChangeText={setEditingDiagnosisText}
                                                                    autoFocus
                                                                    placeholder="Edit diagnosis..."
                                                                    placeholderTextColor={theme.textDim}
                                                                />
                                                            </View>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        setEditingDiagnosis(null);
                                                                        setEditingDiagnosisText('');
                                                                        setEditingDiagnosisIsCustom(false);
                                                                    }}
                                                                    style={{ backgroundColor: modalTheme.cancelBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: modalTheme.sectionBorder }}
                                                                >
                                                                    <Text style={{ color: modalTheme.cancelText, fontWeight: '700', fontSize: 12 }}>Cancel</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={handleSaveEditedDiagnosis} style={{ backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
                                                                    <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Save</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </>
                                                    ) : (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setEditorForm((prev) => ({ ...prev, diagnosis: diagnosisItem.name }));
                                                                    setDiagnosisPickerVisible(false);
                                                                    setDiagnosisPickerSearch('');
                                                                }}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{diagnosisItem.name}</Text>
                                                                <Text style={{ marginTop: 4, color: theme.textDim, fontSize: 11 }}>{diagnosisItem.isCustom ? 'Custom diagnosis' : diagnosisItem.isTemplate ? 'From saved templates' : 'Diagnosis item'}</Text>
                                                            </TouchableOpacity>
                                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                                <TouchableOpacity onPress={() => handleStartEditDiagnosis(diagnosisItem.name, diagnosisItem.isCustom)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                                                    <Pencil size={14} color={theme.textDim} />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteDiagnosisFromList(diagnosisItem.name, diagnosisItem.isCustom)} style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 }}>
                                                                    <Trash2 size={14} color="#ef4444" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                ) : (
                                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 26, opacity: 0.6 }}>
                                        <Stethoscope size={34} color={theme.textDim} />
                                        <Text style={{ textAlign: 'center', color: theme.textDim, marginTop: 8 }}>No matching diagnosis found.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const PatientPickerModal = () => (
        <Modal visible={patientPickerVisible} transparent animationType="slide" onRequestClose={() => setPatientPickerVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setPatientPickerVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, maxHeight: popupHeight, borderWidth: 1, borderColor: modalTheme.shellBorder, overflow: 'hidden' }}>
                            <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: modalTheme.eyebrowText, letterSpacing: 0.7 }}>PATIENT LIST</Text>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: modalTheme.headerText, marginTop: 4 }}>Select Patient</Text>
                                </View>
                                <TouchableOpacity onPress={() => setPatientPickerVisible(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}>
                                    <X size={22} color={modalTheme.closeIcon} />
                                </TouchableOpacity>
                            </LinearGradient>

                            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: theme.border }}>
                                    <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={{ flex: 1, color: theme.text }}
                                        placeholder="Search patient name / mobile / ID"
                                        placeholderTextColor={theme.textDim}
                                        value={patientPickerSearch}
                                        onChangeText={setPatientPickerSearch}
                                    />
                                    {patientPickerSearch.length > 0 && (
                                        <TouchableOpacity onPress={() => setPatientPickerSearch('')}>
                                            <X size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
                                {filteredPatientOptions.length > 0 ? (
                                    <ScrollView style={{ maxHeight: safeLayout.isTablet ? 420 : 320 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                        <View style={{ gap: 10 }}>
                                            {filteredPatientOptions.map((patientItem) => (
                                                <TouchableOpacity
                                                    key={`rx-patient-${patientItem.id}`}
                                                    onPress={() => {
                                                        if (typeof onSelectPrescriptionPatient === 'function') {
                                                            onSelectPrescriptionPatient(patientItem.id);
                                                        }
                                                        setPatientPickerVisible(false);
                                                        setPatientPickerSearch('');
                                                    }}
                                                    style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: modalTheme.sectionBorder }}
                                                >
                                                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{patientItem.name}</Text>
                                                    <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 4 }}>ID: #{patientItem.id} • {patientItem.mobile || 'No mobile'}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                ) : (
                                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 26, opacity: 0.6 }}>
                                        <UserPlus size={34} color={theme.textDim} />
                                        <Text style={{ textAlign: 'center', color: theme.textDim, marginTop: 8 }}>No matching patients found.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const EditTemplateItemModal = () => (
        <Modal visible={editTemplateItemVisible} transparent animationType="fade" onRequestClose={() => setEditTemplateItemVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setEditTemplateItemVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ width: '100%', maxWidth: 360, borderRadius: 22, padding: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderRadius: 21, padding: 16, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 12 }}>{editTemplateItemType === 'investigation' ? 'Edit Investigation' : 'Edit Procedure'}</Text>
                            <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, height: 44 }}>
                                    <TextInput style={{ flex: 1, color: theme.text }} value={editTemplateItemForm.name} onChangeText={(value) => setEditTemplateItemForm((prev) => ({ ...prev, name: value }))} placeholder="Name" placeholderTextColor={theme.textDim} />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, height: 44 }}>
                                        <TextInput style={{ flex: 1, color: theme.text }} value={editTemplateItemForm.cost} onChangeText={(value) => setEditTemplateItemForm((prev) => ({ ...prev, cost: value }))} placeholder="Cost" keyboardType="numeric" placeholderTextColor={theme.textDim} />
                                    </View>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, height: 44 }}>
                                        <TextInput style={{ flex: 1, color: theme.text }} value={editTemplateItemForm.category} onChangeText={(value) => setEditTemplateItemForm((prev) => ({ ...prev, category: value }))} placeholder="Category" placeholderTextColor={theme.textDim} />
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                                <TouchableOpacity onPress={() => setEditTemplateItemVisible(false)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: modalTheme.cancelBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <Text style={{ color: modalTheme.cancelText, fontWeight: '700' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={saveEditedItemInForm} style={{ flex: 1 }}>
                                    <LinearGradient colors={modalTheme.primaryButton} style={{ alignItems: 'center', paddingVertical: 10, borderRadius: 10 }}>
                                        <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, getPaddedContentStyle(safeLayout, { marginTop: insets.top + 10 })]}>
                {view === 'list' && !isPrescription ? (
                    <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => (isPrescription ? onBack() : setView('list'))} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                )}

                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {isPrescription ? 'New Prescription' : view === 'list' ? 'Templates' : editorForm.id ? 'Edit Template' : 'New Template'}
                    </Text>
                    {isPrescription ? <Text style={{ fontSize: 12, color: theme.textDim }}>Write Rx for {patient?.name || 'selected patient'}</Text> : view === 'list' && <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your prescription sets</Text>}
                </View>

                {view === 'list' && !isPrescription ? (
                    <TouchableOpacity onPress={handleCreate} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {isPrescription && (
                            <TouchableOpacity onPress={() => setShowSaveTemplateModal(true)} style={[styles.iconBtn, { backgroundColor: theme.mode === 'dark' ? '#334155' : '#f1f5f9', borderColor: theme.border }]}>
                                <Copy size={24} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleSaveTemplate} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                            <Save size={24} color="white" />
                        </TouchableOpacity>
                    </View>
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
            {DiagnosisPickerModal()}
            {PatientPickerModal()}
            {EditTemplateItemModal()}
            <CustomPicker visible={rowLimitPickerVisible} title="Rows to show" data={rowLimitOptions} onClose={() => setRowLimitPickerVisible(false)} onSelect={(value) => setRowLimit(Number(value))} theme={theme} />

            <Modal visible={inputVisible} transparent animationType="fade" onRequestClose={() => setInputVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setInputVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ width: '100%', maxWidth: 300, borderRadius: 22, padding: 1.5 }}>
                    <View style={{ width: '100%', backgroundColor: modalTheme.surface, borderRadius: 21, padding: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 15 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: modalTheme.infoBg, borderColor: theme.primary }]}>
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} value={inputText} onChangeText={setInputText} autoFocus placeholder="Type custom value..." placeholderTextColor={theme.textDim} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setInputVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: modalTheme.cancelBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                <Text style={{ color: modalTheme.cancelText, fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddItem} style={{ flex: 1 }}>
                                <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 12, alignItems: 'center', borderRadius: 10, shadowColor: theme.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{editingItem ? 'Update' : 'Add'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                    </LinearGradient>
                </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={vitalsModalVisible} transparent animationType="slide" onRequestClose={() => setVitalsModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                            <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 33, borderTopRightRadius: 33, padding: 22, paddingBottom: Platform.OS === 'ios' ? 40 : 26, maxHeight: height * 0.9, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Animated.View style={{ transform: [{ scale: popupPulseAnim }] }}>
                                            <LinearGradient colors={['#06b6d4', '#0ea5e9']} style={{ padding: 10, borderRadius: 14 }}>
                                                <Activity size={24} color="white" />
                                            </LinearGradient>
                                        </Animated.View>
                                        <View>
                                            <Text style={{ fontSize: 21, fontWeight: '900', color: theme.text }}>Clinical Vitals</Text>
                                            <Text style={{ fontSize: 12, color: '#0891b2', fontWeight: '700' }}>Prescription Checkup Snapshot</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (onSaveVitals && patient) {
                                                    const payload = {
                                                        ...createEmptyVitalsDraft(),
                                                        ...editableVitals,
                                                        tempUnit: editableVitals?.tempUnit || 'C'
                                                    };
                                                    const newHistory = [{ ...payload, id: Date.now().toString(), date: new Date().toISOString() }, ...(patient.vitalsHistory || [])];
                                                    onSaveVitals(patient.id, newHistory);
                                                    showToast('Success', 'Vitals saved to record', 'success');
                                                }
                                                setVitalsModalVisible(false);
                                            }}
                                            style={{ borderRadius: 18, overflow: 'hidden' }}
                                        >
                                            <LinearGradient colors={['#10b981', '#059669']} style={{ padding: 9, borderRadius: 18 }}>
                                                <Save size={22} color="white" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setVitalsModalVisible(false)} style={{ backgroundColor: modalTheme.cancelBg, padding: 9, borderRadius: 18 }}>
                                            <X size={22} color={modalTheme.cancelText} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <LinearGradient colors={theme.mode === 'dark' ? ['rgba(14,116,144,0.22)', 'rgba(30,41,59,0.6)'] : ['#eff6ff', '#ecfeff']} style={{ borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bae6fd' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <HeartPulse size={19} color="#e11d48" />
                                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>Blood Pressure</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.textDim, marginBottom: 6, fontWeight: '700', fontSize: 12 }}>Systolic</Text>
                                                <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderWidth: 1, borderColor: '#7dd3fc', borderRadius: 14, paddingVertical: 14, fontSize: 20, fontWeight: '800', textAlign: 'center' }} keyboardType="numeric" value={String(editableVitals?.sys || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, sys: t }))} placeholder="120" placeholderTextColor={theme.textDim} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.textDim, marginBottom: 6, fontWeight: '700', fontSize: 12 }}>Diastolic</Text>
                                                <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderWidth: 1, borderColor: '#7dd3fc', borderRadius: 14, paddingVertical: 14, fontSize: 20, fontWeight: '800', textAlign: 'center' }} keyboardType="numeric" value={String(editableVitals?.dia || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, dia: t }))} placeholder="80" placeholderTextColor={theme.textDim} />
                                            </View>
                                        </View>
                                    </LinearGradient>

                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.14)' : '#ecfdf5', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#a7f3d0' }}>
                                            <Text style={{ color: '#059669', fontWeight: '800', marginBottom: 6 }}>Pulse (bpm)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.pulse || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, pulse: t }))} placeholder="72" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(99,102,241,0.14)' : '#eef2ff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#c7d2fe' }}>
                                            <Text style={{ color: '#4f46e5', fontWeight: '800', marginBottom: 6 }}>SpO2 (%)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.spo2 || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, spo2: t }))} placeholder="98" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.14)' : '#e0f2fe', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#bae6fd' }}>
                                            <Text style={{ color: '#0369a1', fontWeight: '800', marginBottom: 6 }}>Resp. Rate (/min)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.resp || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, resp: t }))} placeholder="18" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(249,115,22,0.14)' : '#fff7ed', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fed7aa' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Text style={{ color: '#ea580c', fontWeight: '800' }}>Temperature</Text>
                                                <TouchableOpacity onPress={() => setEditableVitals((p) => ({ ...p, tempUnit: p?.tempUnit === 'C' ? 'F' : 'C' }))} style={{ backgroundColor: '#ffedd5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                    <Text style={{ color: '#c2410c', fontWeight: '800' }}>°{editableVitals?.tempUnit || 'C'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.temp || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, temp: t }))} placeholder={(editableVitals?.tempUnit || 'C') === 'C' ? '37.0' : '98.6'} placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.12)' : '#f0fdf4', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' }}>
                                            <Text style={{ color: '#059669', fontWeight: '800', marginBottom: 6 }}>Weight (kg)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.weight || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, weight: t }))} placeholder="65" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(14,165,233,0.12)' : '#ecfeff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#a5f3fc' }}>
                                            <Text style={{ color: '#0891b2', fontWeight: '800', marginBottom: 6 }}>Height (cm)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.height || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, height: t }))} placeholder="170" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.12)' : '#f5f3ff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#ddd6fe' }}>
                                            <Text style={{ color: '#6d28d9', fontWeight: '800', marginBottom: 6 }}>BMI (kg/m2)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.bmi || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, bmi: t }))} placeholder="22.5" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(244,63,94,0.12)' : '#fff1f2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fecdd3' }}>
                                            <Text style={{ color: '#be123c', fontWeight: '800', marginBottom: 6 }}>GRBS (mg/dL)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.grbs || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, grbs: t }))} placeholder="140" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(225,29,72,0.12)' : '#ffe4e6', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fda4af' }}>
                                            <Text style={{ color: '#9f1239', fontWeight: '800', marginBottom: 6 }}>FBS (mg/dL)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.fbs || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, fbs: t }))} placeholder="95" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(190,24,93,0.12)' : '#fce7f3', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fbcfe8' }}>
                                            <Text style={{ color: '#be185d', fontWeight: '800', marginBottom: 6 }}>RBS (mg/dL)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.rbs || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, rbs: t }))} placeholder="160" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(185,28,28,0.12)' : '#fee2e2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fecaca' }}>
                                            <Text style={{ color: '#b91c1c', fontWeight: '800', marginBottom: 6 }}>Hemoglobin (g/dL)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.hb || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, hb: t }))} placeholder="13.5" placeholderTextColor={theme.textDim} />
                                        </View>
                                        <View style={{ width: '48%', backgroundColor: theme.mode === 'dark' ? 'rgba(234,88,12,0.12)' : '#ffedd5', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#fdba74' }}>
                                            <Text style={{ color: '#c2410c', fontWeight: '800', marginBottom: 6 }}>Pain Score (0-10)</Text>
                                            <TextInput style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800' }} keyboardType="numeric" value={String(editableVitals?.pain || '')} onChangeText={(t) => setEditableVitals((p) => ({ ...p, pain: t }))} placeholder="2" placeholderTextColor={theme.textDim} />
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>
                        </LinearGradient>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal visible={pastRxModalVisible} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 29, borderTopRightRadius: 29, height: '80%', padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ flexDirection:'row', alignItems:'center', gap: 10 }}>
                                <Animated.View style={{ transform: [{ scale: popupPulseAnim }] }}>
                                    <TrendingDown size={28} color="#d946ef" />
                                </Animated.View>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>Past Prescriptions</Text>
                            </View>
                            <TouchableOpacity onPress={() => setPastRxModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 20 }}><X size={24} color={theme.textDim} /></TouchableOpacity>
                        </View>
                        <FlatList
                            data={patient?.rxHistory || []}
                            keyExtractor={item => (item.id || Math.random()).toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={{ backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#ffffff', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? '#334155' : '#e2e8f0', shadowColor: '#000', shadowOffset:{width:0, height:4}, shadowOpacity:0.06, shadowRadius:10, elevation:4, overflow: 'hidden' }}>
                                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.mode === 'dark' ? '#334155' : '#f1f5f9', padding: 16, backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#f8fafc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 12 }}>
                                                <FileText size={18} color="#0284c7" />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{new Date(item.date).toLocaleDateString()}</Text>
                                                <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>Past Visit Record</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => { setPdfPreviewData(item); setPdfPreviewModalVisible(true); }} style={{ padding: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.2)' : '#eff6ff', borderRadius: 10, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.3)' : '#bfdbfe' }}>
                                                <Eye size={18} color="#3b82f6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => showToast('Download', 'Downloading PDF...', 'info')} style={{ padding: 8, backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.2)' : '#ecfdf5', borderRadius: 10, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.3)' : '#a7f3d0' }}>
                                                <Download size={18} color="#10b981" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ padding: 16 }}>
                                        {!!item.diagnosis && (
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                                                <Text style={{ fontWeight: '900', color: theme.text, width: 30, marginTop: 2 }}>Dx</Text>
                                                <View style={{ flex: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.15)' : '#f5f3ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.3)' : '#ddd6fe' }}>
                                                    <Text style={{ color: theme.mode === 'dark' ? '#c4b5fd' : '#6d28d9', fontSize: 14, fontWeight: '600' }}>{item.diagnosis}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {item.medicines && item.medicines.length > 0 && (
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
                                                <Text style={{ fontWeight: '900', color: theme.text, width: 30, marginTop: 2 }}>Rx</Text>
                                                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                    {item.medicines.map((m, idx) => (
                                                        <View key={idx} style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.15)' : '#ecfdf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(16,185,129,0.3)' : '#a7f3d0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <Pill size={12} color="#10b981" />
                                                            <Text style={{ color: theme.mode === 'dark' ? '#6ee7b7' : '#059669', fontSize: 13, fontWeight: '700' }}>{m.name}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <TouchableOpacity onPress={() => showToast('Delete', 'Prescription deleted', 'error')} style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.15)' : '#fee2e2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.3)' : '#fecaca' }}>
                                                <Trash2 size={20} color="#ef4444" />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                                                setEditorForm(prev => ({
                                                    ...prev,
                                                    diagnosis: item.diagnosis || '',
                                                    advice: item.advice || '',
                                                    medicines: item.medicines ? JSON.parse(JSON.stringify(item.medicines)) : [],
                                                    procedures: item.procedures ? JSON.parse(JSON.stringify(item.procedures)) : [],
                                                    nextVisitInvestigations: item.nextVisitInvestigations ? JSON.parse(JSON.stringify(item.nextVisitInvestigations)) : [],
                                                    referral: item.referral || ''
                                                }));
                                                setPastRxModalVisible(false);
                                                showToast('Loaded', 'Data copied to New Rx successfully', 'success');
                                            }}>
                                                <LinearGradient colors={['#0ea5e9', '#2563eb']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#2563eb', shadowOffset: {height:4, width:0}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                                                    <Copy size={18} color="white" />
                                                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>COPY TO NEW RX</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={() => (
                                <View style={{ alignItems:'center', justifyContent:'center', paddingVertical: 40}}>
                                    <Clipboard size={48} color={theme.border} />
                                    <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 15, fontSize: 16 }}>No past prescriptions found.</Text>
                                </View>
                            )}
                        />
                    </View>
                    </LinearGradient>
                </View>
            </Modal>

            {/* --- PDF Preview Modal --- */}
            <Modal visible={pdfPreviewModalVisible} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '90%', height: '85%', backgroundColor: '#f8fafc', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 }}>
                        
                        {/* Header */}
                        <LinearGradient colors={['#ffffff', '#f1f5f9']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ backgroundColor: '#fee2e2', padding: 10, borderRadius: 12 }}>
                                    <FileText size={22} color="#ef4444" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Prescription Preview</Text>
                                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>{pdfPreviewData ? new Date(pdfPreviewData.date).toLocaleDateString() : ''}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={() => showToast('Download', 'Downloading PDF...', 'info')} style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Download size={16} color="#0284c7" />
                                    <Text style={{ color: '#0284c7', fontWeight: 'bold' }}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setPdfPreviewModalVisible(false)} style={{ backgroundColor: '#f1f5f9', padding: 10, borderRadius: 12 }}>
                                    <X size={20} color="#475569" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        {/* PDF Content Area */}
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                            <View style={{ backgroundColor: '#e2e8f0', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#cbd5e1' }}>
                                <LinearGradient colors={['#0f9f6e', '#0ea5e9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ color: '#ecfdf3', fontWeight: '900', fontSize: 18 }}>Dr.MANSOOR ALI.V.P, MD (PHYSICIAN)</Text>
                                    <Text style={{ color: '#d1fae5', fontWeight: '600', fontSize: 12, marginTop: 4, textAlign: 'center' }}>General Practitioner | Reg No: 35083 | +91 9893532078 | Pathappiriyam</Text>
                                    <Text style={{ color: '#ecfdf3', fontWeight: '800', fontSize: 12, marginTop: 6, letterSpacing: 0.8 }}>BOOKING NO: {bookingNumber}</Text>
                                </LinearGradient>

                                <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dbeafe', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                        <View style={{ width: '55%', marginBottom: 10 }}>
                                            <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '800' }}>Patient Information:</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>ID No: {patient?.id || 'N/A'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Name: {patient?.name || 'Unknown'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Diagnosis: {pdfPreviewData?.diagnosis || 'N/A'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Additional Notes: {pdfPreviewData?.advice || 'N/A'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Date: {formatPreviewDate(pdfPreviewData?.date)}</Text>
                                        </View>
                                        <View style={{ width: '40%', marginBottom: 10 }}>
                                            <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '800' }}>Vitals</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Age: {patient?.age || '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Gender: {patient?.gender || '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Phone: {patient?.mobile || patient?.phone || '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>SpO2: {previewVitals.spo2 || '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>BP: {previewVitals.sys && previewVitals.dia ? `${previewVitals.sys}/${previewVitals.dia}` : '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Pulse: {previewVitals.pulse || '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Temp: {previewVitals.temp ? `${previewVitals.temp}°${previewVitals.tempUnit || 'C'}` : '--'}</Text>
                                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Weight: {previewVitals.weight ? `${previewVitals.weight} kg` : '--'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', overflow: 'hidden', marginBottom: 12 }}>
                                    <View style={{ backgroundColor: '#0f766e', paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row' }}>
                                        <Text style={{ color: 'white', fontWeight: '800', width: 32 }}>SI</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 2 }}>Medicine</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 1 }}>Dosage</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 1 }}>Type</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 1 }}>Frequency</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 1 }}>Duration</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', flex: 1.5 }}>Instructions</Text>
                                    </View>
                                    {pdfPreviewData?.medicines && pdfPreviewData.medicines.length > 0 ? pdfPreviewData.medicines.map((med, idx) => (
                                        <View key={idx} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottomWidth: idx === pdfPreviewData.medicines.length - 1 ? 0 : 1, borderBottomColor: '#e2e8f0' }}>
                                            <Text style={{ width: 32, color: '#0f172a', fontWeight: '700' }}>{idx + 1}</Text>
                                            <View style={{ flex: 2 }}>
                                                <Text style={{ color: '#0f172a', fontWeight: '800' }}>{med.name || '-'}</Text>
                                                {med.content ? <Text style={{ color: '#475569', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>Content: {med.content}</Text> : null}
                                            </View>
                                            <Text style={{ flex: 1, color: '#0f172a', fontWeight: '700' }}>{med.dosage || med.doseQty || '-'}</Text>
                                            <Text style={{ flex: 1, color: '#0f172a' }}>{med.type || '-'}</Text>
                                            <Text style={{ flex: 1, color: '#0f172a' }}>{med.freq || '-'}</Text>
                                            <Text style={{ flex: 1, color: '#0f172a' }}>{med.duration || '-'}</Text>
                                            <Text style={{ flex: 1.5, color: '#0f172a' }}>{med.instruction || (med.isTapering ? 'Tapering schedule' : '-')}</Text>
                                        </View>
                                    )) : (
                                        <View style={{ padding: 14, alignItems: 'center' }}>
                                            <Text style={{ color: '#475569', fontWeight: '600' }}>No medicines added.</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>Advice / Additional Notes:</Text>
                                    <Text style={{ color: '#334155', lineHeight: 20 }}>
                                        {pdfPreviewData?.advice || pdfPreviewData?.referral || 'No additional notes added.'}
                                    </Text>
                                </View>

                                <View style={{ alignItems: 'flex-end', marginTop: 16, paddingTop: 12 }}>
                                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Signed by</Text>
                                    <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '900' }}>DR MANSOOR ALI.V.P</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: '#475569', marginTop: 12, textAlign: 'left' }}>Prescription Generated by Suhaim Software • Visit us: www.clinicppm.site</Text>
                            </View>
                        </ScrollView>

                    </View>
                </View>
            </Modal>

            <Modal visible={showSaveTemplateModal} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxWidth: 500 }}>
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderRadius: 24, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderRadius: 23, padding: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Animated.View style={{ transform: [{ scale: popupPulseAnim }] }}>
                                    <View style={{ backgroundColor: theme.primary + '20', padding: 10, borderRadius: 12 }}>
                                        <Save size={24} color={theme.primary} />
                                    </View>
                                    </Animated.View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Save as Template</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowSaveTemplateModal(false)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 20 }}>
                                    <X size={20} color={theme.textDim} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: theme.textDim, marginBottom: 16 }}>Save the current prescription items as a reusable template.</Text>
                            
                            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>Template Name</Text>
                            <TextInput 
                                style={{ backgroundColor: theme.inputBg, color: theme.text, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 16, marginBottom: 24 }}
                                placeholder="e.g. Standard Fever Initial"
                                placeholderTextColor={theme.textDim}
                                value={editorForm.name}
                                onChangeText={t => setEditorForm(p => ({...p, name: t}))}
                                autoFocus
                            />
                            
                            <TouchableOpacity onPress={() => {
                                if(!editorForm.name) {
                                    showToast('Error', 'Please enter a template name', 'error');
                                    return;
                                }
                                handleSaveTemplate();
                                setShowSaveTemplateModal(false);
                            }} style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Template</Text>
                            </TouchableOpacity>
                        </View>
                        </LinearGradient>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

export default TemplateScreen;