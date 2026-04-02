import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Archive, ArrowLeft, ChevronDown, Eye, Filter, Layers, LayoutGrid, Package, Pencil, Pill, Plus, Search, Tag, Trash2, X } from 'lucide-react-native';
import { MEDICINE_CATEGORIES } from '../../constants/medical';
import { getMedicalModalTheme, getMedicalTableTheme } from '../../constants/tableTheme';
import { CustomPicker, InputGroup } from '../../components/commons/FormControls';
import { buildMedicineRecord, findMatchingMedicine, sanitizeMedicineDraft } from '../../utils/medicine';

export default function MedicineScreen({ theme, onBack, medicines, setMedicines, showToast, styles, layout }) {
    const insets = useSafeAreaInsets();
    const tableTheme = getMedicalTableTheme(theme);
    const modalTheme = getMedicalModalTheme(theme);
    const defaultFormData = { name: '', type: 'Tablet', content: '' };
    const rowLimitOptions = [
        { label: '25 rows', value: 25 },
        { label: '50 rows', value: 50 },
        { label: '100 rows', value: 100 }
    ];

    // Screen state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [addEditVisible, setAddEditVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [filterPickerVisible, setFilterPickerVisible] = useState(false);
    const [rowLimitPickerVisible, setRowLimitPickerVisible] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState(defaultFormData);
    const [rowLimit, setRowLimit] = useState(25);

    // Derived inventory data
    const filteredMedicines = medicines.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || item.type === filterType;
        return matchesSearch && matchesType;
    });
    const visibleMedicines = filteredMedicines.slice(0, rowLimit);

    const totalMedicines = medicines.length;
    const distinctTypes = [...new Set(medicines.map((item) => item.type))].length;

    const getCategoryDetails = (type) => MEDICINE_CATEGORIES.find((item) => item.value === type) || MEDICINE_CATEGORIES[MEDICINE_CATEGORIES.length - 1];

    const filterData = [
        { label: 'All Types', value: 'All', icon: Layers, color: theme.text, bg: theme.inputBg },
        ...MEDICINE_CATEGORIES
    ];

    const contentContainerStyle = {
        width: '100%',
        maxWidth: layout?.contentMaxWidth || undefined,
        alignSelf: 'center',
        paddingHorizontal: layout?.gutter ?? 20
    };

    const tableMinWidth = layout?.isTablet ? 900 : 760;

    // Inventory actions
    const closeAddEditModal = () => {
        setAddEditVisible(false);
        setCategoryPickerVisible(false);
        setIsEditing(false);
        setCurrentId(null);
        setFormData(defaultFormData);
    };

    const handleAdd = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData(defaultFormData);
        setAddEditVisible(true);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setCurrentId(item.id);
        setFormData({ name: item.name, type: item.type, content: item.content });
        setAddEditVisible(true);
    };

    const handleView = (item) => {
        setSelectedMed(item);
        setDetailVisible(true);
    };

    const handleSave = () => {
        const sanitizedMedicine = sanitizeMedicineDraft(formData);

        if (!sanitizedMedicine.name) {
            Alert.alert('Required', 'Medicine Name is required.');
            return;
        }

        const duplicateMedicine = findMatchingMedicine(medicines, sanitizedMedicine, isEditing ? currentId : null);
        if (duplicateMedicine) {
            Alert.alert('Duplicate Medicine', 'A medicine with the same name, dosage form, and strength already exists.');
            return;
        }

        if (isEditing) {
            setMedicines((prev) => prev.map((item) => (item.id === currentId ? { ...item, ...sanitizedMedicine } : item)));
            showToast('Success', 'Medicine Updated', 'success');
        } else {
            const newMed = buildMedicineRecord(sanitizedMedicine);
            setMedicines((prev) => [newMed, ...prev]);
            showToast('Success', 'New Medicine Added', 'success');
        }
        closeAddEditModal();
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Item', 'Remove this medicine?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setMedicines((prev) => prev.filter((item) => item.id !== id));
                    showToast('Deleted', 'Medicine removed.', 'error');
                }
            }
        ]);
    };

    // Dashboard stat card
    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <View style={{ width: '48%', backgroundColor: bg, padding: 15, borderRadius: 16, marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color }}>{value}</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>{title}</Text>
                </View>
                <View style={{ backgroundColor: color, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="#FFF" />
                </View>
            </View>
        </View>
    );

    // Medicine details modal
    const DetailPopup = ({ medicine, visible, onClose }) => {
        const scaleAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            if (visible && medicine) {
                scaleAnim.setValue(0);
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
            }
        }, [medicine, scaleAnim, visible]);

        if (!medicine || !visible) return null;
        const catDetails = getCategoryDetails(medicine.type);
        const CatIcon = catDetails.icon;

        return (
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                    <Animated.View style={{ width: '100%', maxWidth: 340, borderRadius: 26, overflow: 'hidden', transform: [{ scale: scaleAnim }] }}>
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderRadius: 26, padding: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, overflow: 'hidden', borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={[catDetails.color, '#0ea5e9']} style={{ padding: 20, alignItems: 'center', position: 'relative' }}>
                            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 15, right: 15, padding: 5, backgroundColor: modalTheme.closeBg, borderRadius: 20 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                <CatIcon size={30} color="white" strokeWidth={2.5} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Medicine Details</Text>
                            <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>{medicine.type} PROFILE</Text>
                            </View>
                        </LinearGradient>
                        <View style={{ padding: 25, gap: 20 }}>
                            <View style={{ backgroundColor: catDetails.bg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Medicine Name</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{medicine.name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1, borderColor: modalTheme.sectionBorder, padding: 16, backgroundColor: modalTheme.sectionBg }}>
                                <View>
                                    <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Dosage Form</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catDetails.color }} />
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>{medicine.type}</Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: catDetails.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                    <Text style={{ color: catDetails.color, fontSize: 12, fontWeight: '700' }}>Active</Text>
                                </View>
                            </View>
                            <View style={{ borderRadius: 18, padding: 16, backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Content / Strength</Text>
                                <Text style={{ fontSize: 16, color: theme.text }}>{medicine.content}</Text>
                            </View>
                        </View>
                        </View>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

    // Add and edit medicine modal
    const AddEditPopup = () => {
        if (!addEditVisible) return null;
        const catDetails = getCategoryDetails(formData.type);
        const CatIcon = catDetails.icon;

        return (
            <Modal visible={addEditVisible} transparent animationType="slide" onRequestClose={closeAddEditModal} statusBarTranslucent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={closeAddEditModal} />
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, padding: 25, paddingBottom: 32, maxHeight: '88%', shadowColor: '#000', shadowOpacity: 0.3, elevation: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{isEditing ? 'Edit Medicine' : 'Add New Medicine'}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>Build a clean, colorful medication record</Text>
                                </View>
                                <TouchableOpacity onPress={closeAddEditModal} style={{ backgroundColor: modalTheme.cancelBg, padding: 8, borderRadius: 20 }}>
                                    <X size={20} color={theme.textDim} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 15 }}>
                                    <View style={{ backgroundColor: catDetails.bg, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                                <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: catDetails.color, alignItems: 'center', justifyContent: 'center' }}>
                                                    <CatIcon size={24} color="white" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 13, color: catDetails.color, fontWeight: '800', letterSpacing: 0.4 }}>MEDICATION SNAPSHOT</Text>
                                                    <Text style={{ fontSize: 17, color: theme.text, fontWeight: '700', marginTop: 4 }}>{formData.name || 'New medicine entry'}</Text>
                                                </View>
                                            </View>
                                            <View style={{ backgroundColor: modalTheme.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                <Text style={{ color: catDetails.color, fontSize: 12, fontWeight: '700' }}>{formData.type}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 12 }}>{formData.content || 'Add the strength or content to complete the prescription-ready medicine profile.'}</Text>
                                    </View>

                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <InputGroup icon={Pill} label="Medicine Name *" value={formData.name} onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))} theme={theme} placeholder="Enter medicine name" styles={styles} />
                                    </View>
                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Dosage Form *</Text>
                                        <TouchableOpacity onPress={() => setCategoryPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: catDetails.bg, borderColor: catDetails.color, justifyContent: 'space-between', paddingRight: 15 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <CatIcon size={20} color={catDetails.color} />
                                                <Text style={{ color: theme.text, fontSize: 16 }}>{formData.type}</Text>
                                            </View>
                                            <ChevronDown size={16} color={catDetails.color} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <InputGroup icon={Activity} label="Content/Strength" value={formData.content} onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))} theme={theme} placeholder="e.g. 500mg" styles={styles} />
                                    </View>
                                </View>
                            </ScrollView>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                                <TouchableOpacity onPress={closeAddEditModal} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: modalTheme.cancelBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <Text style={{ color: modalTheme.cancelText, fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} style={{ flex: 1 }}>
                                    <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{isEditing ? 'Save Changes' : 'Add Medicine'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    // Main screen layout
    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, contentContainerStyle, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Medicine Inventory</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your pharmacy stock efficiently</Text>
                </View>
                <TouchableOpacity onPress={handleAdd} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ ...contentContainerStyle, paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <StatCard title="Total Medicines" value={totalMedicines} icon={Package} color="#2563eb" bg={theme.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff'} />
                    <StatCard title="Medicine Types" value={distinctTypes} icon={Layers} color="#10b981" bg={theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'} />
                    <StatCard title="Stock Items" value="408" icon={LayoutGrid} color="#7c3aed" bg={theme.mode === 'dark' ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff'} />
                    <StatCard title="Categories" value={MEDICINE_CATEGORIES.length} icon={Tag} color="#f59e0b" bg={theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'} />
                </View>

                <View style={{ marginBottom: 20, backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 12, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>Filters</Text>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{filterType === 'All' ? 'All dosage forms' : filterType}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder="Search medicines..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <X size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={() => setFilterPickerVisible(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border, gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                <Filter size={18} color={theme.textDim} />
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{filterType === 'All' ? 'Filter by dosage form' : filterType}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                        {filterType !== 'All' && (
                            <TouchableOpacity onPress={() => setFilterType('All')} style={{ backgroundColor: '#fee2e2', height: 50, width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={{ marginTop: 4 }}>
                    {filteredMedicines.length > 0 ? (
                        <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
                            <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: tableMinWidth, flex: 1, borderRadius: 24, padding: 1.5 }}>
                                <View style={{ borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                    <LinearGradient colors={tableTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                                        <Text style={{ width: 250, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medicine</Text>
                                        <Text style={{ width: 190, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Content/Strength</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Dosage Form</Text>
                                        <Text style={{ width: 120, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Text>
                                        <Text style={{ flex: 1, minWidth: 190, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                    </LinearGradient>

                                    <View style={{ overflow: 'hidden' }}>
                                    {visibleMedicines.map((item, index) => {
                                        const catDetails = getCategoryDetails(item.type);
                                        const CatIcon = catDetails.icon;
                                        const isLastRow = index === visibleMedicines.length - 1;

                                        return (
                                            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                <View style={{ width: 250, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                                                    <LinearGradient colors={theme.mode === 'dark' ? [catDetails.bg, 'rgba(15,23,42,0.2)'] : [catDetails.bg, '#ffffff']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                                        <CatIcon size={20} color={catDetails.color} />
                                                    </LinearGradient>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                        <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }} numberOfLines={1}>Inventory medicine</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 190, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }} numberOfLines={1}>{item.content || 'Not specified'}</Text>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <View style={{ alignSelf: 'flex-start', backgroundColor: catDetails.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catDetails.color }} />
                                                        <Text style={{ fontSize: 12, fontWeight: '700', color: catDetails.color }}>{item.type}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 120, paddingRight: 12 }}>
                                                    <View style={{ alignSelf: 'flex-start', backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                        <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Active</Text>
                                                    </View>
                                                </View>

                                                <View style={{ flex: 1, minWidth: 190, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                    <TouchableOpacity onPress={() => handleView(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                        <Eye size={16} color={tableTheme.viewActionText} />
                                                        <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>View</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
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
                        <View style={{ marginTop: 8, paddingHorizontal: 9, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>
                                {filteredMedicines.length === medicines.length
                                    ? `Showing ${visibleMedicines.length} of ${medicines.length} items`
                                    : `Showing ${visibleMedicines.length} of ${filteredMedicines.length} filtered items`}
                            </Text>
                            <TouchableOpacity onPress={() => setRowLimitPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: tableTheme.footerHint, fontSize: 12, fontWeight: '700' }}>{`Rows: ${rowLimit}`}</Text>
                                <ChevronDown size={14} color={tableTheme.footerHint} />
                            </TouchableOpacity>
                        </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <Archive size={50} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 10 }}>{filterType === 'All' ? 'No medicines found.' : `No ${filterType}s found.`}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <DetailPopup medicine={selectedMed} visible={detailVisible} onClose={() => setDetailVisible(false)} />
            <AddEditPopup />
            <CustomPicker visible={categoryPickerVisible} title="Select Dosage Form" data={MEDICINE_CATEGORIES} onClose={() => setCategoryPickerVisible(false)} onSelect={(val) => setFormData((prev) => ({ ...prev, type: val }))} theme={theme} colored />
            <CustomPicker visible={filterPickerVisible} title="Filter by Type" data={filterData} onClose={() => setFilterPickerVisible(false)} onSelect={(val) => setFilterType(val)} theme={theme} colored />
            <CustomPicker visible={rowLimitPickerVisible} title="Rows to show" data={rowLimitOptions} onClose={() => setRowLimitPickerVisible(false)} onSelect={(val) => setRowLimit(Number(val))} theme={theme} />
        </View>
    );
}
