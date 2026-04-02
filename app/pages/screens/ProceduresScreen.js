import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
    ArrowLeft,
    Banknote,
    Calendar,
    ChevronDown,
    Clipboard,
    FileSpreadsheet,
    FileText,
    Layers,
    Pencil,
    Plus,
    Search,
    Settings,
    Timer,
    Trash2,
    X
} from 'lucide-react-native';
import { getMedicalModalTheme, getMedicalTableTheme } from '../../constants/tableTheme';
import { CustomPicker, InputGroup } from '../../components/commons/FormControls';

export default function ProceduresScreen({ theme, onBack, procedures, setProcedures, showToast, styles, layout, procedureCategories, pickerMaxHeight }) {
    const insets = useSafeAreaInsets();
    const tableTheme = getMedicalTableTheme(theme);
    const modalTheme = getMedicalModalTheme(theme);
    const isTablet = Boolean(layout?.isTablet);
    const isCompact = !isTablet;
    const rowLimitOptions = [
        { label: '25 rows', value: 25 },
        { label: '50 rows', value: 50 },
        { label: '100 rows', value: 100 }
    ];
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [rowLimitPickerVisible, setRowLimitPickerVisible] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', cost: '', duration: '', category: 'General', notes: '' });
    const [isEditing, setIsEditing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [rowLimit, setRowLimit] = useState(25);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [fadeAnim]);

    const filteredProcedures = procedures.filter((procedureItem) => {
        const matchesSearch = procedureItem.name.toLowerCase().includes(searchQuery.toLowerCase()) || procedureItem.category.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesDate = true;
        if (procedureItem.date) {
            const procedureDate = new Date(procedureItem.date);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = procedureDate >= start && procedureDate <= end;
        }
        return matchesSearch && matchesDate;
    });
    const visibleProcedures = filteredProcedures.slice(0, rowLimit);

    const totalAmount = filteredProcedures.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
    const averageCost = filteredProcedures.length ? Math.round(totalAmount / filteredProcedures.length) : 0;
    const getCategoryDetails = (categoryName) => procedureCategories.find((item) => item.value === categoryName) || procedureCategories[0];
    const activeCategoryDetails = getCategoryDetails(formData.category);
    const contentWidthStyle = { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.gutter };
    const tableMinWidth = isTablet ? 980 : 840;

    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/\r?\n|\r/g, ' ').replace(/"/g, '""')}"`;

    const openAdd = () => {
        setFormData({ id: null, name: '', cost: '', duration: '', category: 'General', notes: '' });
        setIsEditing(false);
        setModalVisible(true);
    };

    const openEdit = (item) => {
        setFormData({ ...item });
        setIsEditing(true);
        setModalVisible(true);
    };

    const handleExport = async () => {
        try {
            if (!procedures.length) {
                Alert.alert('No Data', 'There are no procedures available to export.');
                return;
            }

            const baseDirectory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (!baseDirectory) {
                throw new Error('No writable export directory available');
            }

            const exportRows = [...procedures].sort((left, right) => {
                const leftTime = left.date ? new Date(left.date).getTime() : 0;
                const rightTime = right.date ? new Date(right.date).getTime() : 0;
                return rightTime - leftTime;
            });

            let csvContent = '\uFEFFID,Name,Category,Cost,Duration,Date,Notes\n';
            exportRows.forEach((item) => {
                const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
                csvContent += [
                    escapeCsvValue(item.id),
                    escapeCsvValue(item.name),
                    escapeCsvValue(item.category),
                    escapeCsvValue(item.cost),
                    escapeCsvValue(item.duration),
                    escapeCsvValue(dateStr),
                    escapeCsvValue(item.notes)
                ].join(',');
                csvContent += '\n';
            });
            const fileName = `Procedures_Report_${new Date().getTime()}.csv`;
            const fileUri = `${baseDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Procedures Report', UTI: 'public.comma-separated-values-text' });
                showToast('Success', `Exported ${exportRows.length} procedures`, 'success');
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Export Failed', 'Could not generate file.');
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.cost) {
            Alert.alert('Missing Information', 'Procedure Name and Cost are required.');
            return;
        }
        if (isEditing) {
            const updated = procedures.map((item) => (item.id === formData.id ? formData : item));
            setProcedures(updated);
            showToast('Success', 'Procedure Updated Successfully', 'success');
        } else {
            const newItem = { ...formData, id: Date.now(), date: new Date().toISOString() };
            setProcedures([newItem, ...procedures]);
            showToast('Success', 'New Procedure Added', 'success');
        }
        setModalVisible(false);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Are you sure you want to remove this procedure?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setProcedures(procedures.filter((item) => item.id !== id));
                    showToast('Deleted', 'Procedure removed', 'error');
                }
            }
        ]);
    };

    const onStartDateChange = (_event, selectedDate) => {
        if (Platform.OS === 'android') setShowStartPicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndDateChange = (_event, selectedDate) => {
        if (Platform.OS === 'android') setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <View style={{ width: isTablet ? '32%' : '48%', backgroundColor: bg, padding: 15, borderRadius: 16, marginBottom: 15 }}>
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
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, contentWidthStyle, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, minWidth: 0, paddingHorizontal: isCompact ? 10 : 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Procedures & Services</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Manage pricing & revenue</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
                    <TouchableOpacity onPress={handleExport} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <FileSpreadsheet size={22} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openAdd} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ ...contentWidthStyle, paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <StatCard title="Total Procedures" value={filteredProcedures.length} icon={Layers} color="#2563eb" bg={theme.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff'} />
                    <StatCard title="Total Revenue" value={`₹${totalAmount.toLocaleString()}`} icon={Banknote} color="#10b981" bg={theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'} />
                    <StatCard title="Average Cost" value={`₹${averageCost.toLocaleString()}`} icon={Calendar} color="#7c3aed" bg={theme.mode === 'dark' ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff'} />
                    <StatCard title="Categories" value={procedureCategories.length} icon={Settings} color="#f59e0b" bg={theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'} />
                </View>

                <View style={{ marginBottom: 20, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder="Search procedures..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 15, minHeight: 58, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <Calendar size={18} color="#2563eb" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>From</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 4 }} numberOfLines={1}>{startDate.toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 15, minHeight: 58, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <Calendar size={18} color="#10b981" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>To</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 4 }} numberOfLines={1}>{endDate.toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginTop: 4 }}>
                    {filteredProcedures.length > 0 ? (
                        <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
                            <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: tableMinWidth, flex: 1, borderRadius: 24, padding: 1.5 }}>
                                <View style={{ borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                    <LinearGradient colors={tableTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                                        <Text style={{ width: 250, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Procedure</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</Text>
                                        <Text style={{ width: 140, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Duration</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</Text>
                                        <Text style={{ flex: 1, minWidth: 200, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                    </LinearGradient>

                                    <View style={{ overflow: 'hidden' }}>
                                    {visibleProcedures.map((item, index) => {
                                        const categoryDetails = getCategoryDetails(item.category);
                                        const CategoryIcon = categoryDetails.icon;
                                        const isLastRow = index === visibleProcedures.length - 1;

                                        return (
                                            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                <View style={{ width: 250, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                                                    <LinearGradient colors={theme.mode === 'dark' ? [categoryDetails.bg, 'rgba(15,23,42,0.2)'] : [categoryDetails.bg, '#ffffff']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                                        <CategoryIcon size={20} color={categoryDetails.color} />
                                                    </LinearGradient>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                        <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }} numberOfLines={1}>{item.notes || 'Clinical procedure entry'}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <View style={{ alignSelf: 'flex-start', backgroundColor: categoryDetails.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                        <Text style={{ fontSize: 12, fontWeight: '700', color: categoryDetails.color }}>{item.category}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 140, paddingRight: 12 }}>
                                                    <View style={{ alignSelf: 'flex-start', backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.18)' : '#dbeafe', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                        <Text style={{ fontSize: 13, color: theme.mode === 'dark' ? '#93c5fd' : '#1d4ed8', fontWeight: '800' }}>₹{item.cost}</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.duration || '15 min'}</Text>
                                                </View>

                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '600' }}>{item.date ? new Date(item.date).toLocaleDateString() : 'No date'}</Text>
                                                </View>

                                                <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
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
                        <View style={{ marginTop: 8, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12 }}>
                                {filteredProcedures.length === procedures.length
                                    ? `Showing ${visibleProcedures.length} of ${procedures.length} items`
                                    : `Showing ${visibleProcedures.length} of ${filteredProcedures.length} filtered items`}
                            </Text>
                            <TouchableOpacity onPress={() => setRowLimitPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: tableTheme.footerHint, fontSize: 12, fontWeight: '700' }}>{`Rows: ${rowLimit}`}</Text>
                                <ChevronDown size={14} color={tableTheme.footerHint} />
                            </TouchableOpacity>
                        </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <Settings size={50} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 10 }}>No procedures found for this range.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, paddingHorizontal: isCompact ? 18 : 25, paddingTop: 22, paddingBottom: isCompact ? 20 : 25, shadowColor: '#000', shadowOpacity: 0.3, elevation: 20, borderWidth: 1, borderColor: modalTheme.shellBorder, maxHeight: '90%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center', gap: 12 }}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{isEditing ? 'Edit Procedure' : 'New Procedure'}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>Create a clean, colorful clinical procedure card</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: modalTheme.cancelBg, padding: 8, borderRadius: 20 }}>
                                    <X size={20} color={theme.textDim} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 15 }}>
                                    <LinearGradient colors={theme.mode === 'dark' ? [`${activeCategoryDetails.color}33`, 'rgba(255,255,255,0.03)'] : [activeCategoryDetails.bg, '#ffffff']} style={{ borderRadius: 22, padding: 18, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                        <View style={{ flexDirection: isCompact ? 'column' : 'row', alignItems: isCompact ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                                <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: activeCategoryDetails.color, alignItems: 'center', justifyContent: 'center' }}>
                                                    <activeCategoryDetails.icon size={24} color="white" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 13, color: activeCategoryDetails.color, fontWeight: '800', letterSpacing: 0.4 }}>PROCEDURE SNAPSHOT</Text>
                                                    <Text style={{ fontSize: 17, color: theme.text, fontWeight: '700', marginTop: 4 }}>{formData.name || 'New clinical service'}</Text>
                                                </View>
                                            </View>
                                            <View style={{ alignSelf: isCompact ? 'flex-start' : 'auto', backgroundColor: modalTheme.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                <Text style={{ color: activeCategoryDetails.color, fontSize: 12, fontWeight: '700' }}>{formData.category}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 12 }}>{formData.notes || 'Add pricing, duration, and treatment notes to keep the procedure record complete and export-ready.'}</Text>
                                    </LinearGradient>

                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <InputGroup icon={FileText} label="Procedure Name *" value={formData.name} onChange={(text) => setFormData({ ...formData, name: text })} theme={theme} placeholder="e.g. Root Canal" styles={styles} />
                                    </View>
                                    <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 15 }}>
                                        <View style={{ flex: 1, backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                            <InputGroup icon={Banknote} label="Cost (₹) *" value={formData.cost} onChange={(text) => setFormData({ ...formData, cost: text })} theme={theme} placeholder="500" keyboardType="numeric" styles={styles} />
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                            <InputGroup icon={Timer} label="Duration" value={formData.duration} onChange={(text) => setFormData({ ...formData, duration: text })} theme={theme} placeholder="e.g. 30 min" styles={styles} />
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                        <TouchableOpacity onPress={() => setCategoryPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: activeCategoryDetails.bg, borderColor: activeCategoryDetails.color, justifyContent: 'space-between', paddingRight: 15 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                {(() => {
                                                    const categoryDetails = getCategoryDetails(formData.category);
                                                    const CategoryIcon = categoryDetails.icon;
                                                    return <CategoryIcon size={20} color={categoryDetails.color} />;
                                                })()}
                                                <Text style={{ color: theme.text, fontSize: 16 }}>{formData.category}</Text>
                                            </View>
                                            <ChevronDown size={16} color={activeCategoryDetails.color} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ backgroundColor: modalTheme.sectionBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <InputGroup icon={Clipboard} label="Notes / Description" value={formData.notes} onChange={(text) => setFormData({ ...formData, notes: text })} theme={theme} placeholder="Additional details..." multiline styles={styles} />
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={handleSave} style={{ marginTop: 25 }}>
                                <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, elevation: 8 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{isEditing ? 'Save Changes' : 'Add Procedure'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <CustomPicker visible={categoryPickerVisible} title="Select Category" data={procedureCategories} onClose={() => setCategoryPickerVisible(false)} onSelect={(value) => setFormData({ ...formData, category: value })} theme={theme} colored maxHeight={pickerMaxHeight} />
            <CustomPicker visible={rowLimitPickerVisible} title="Rows to show" data={rowLimitOptions} onClose={() => setRowLimitPickerVisible(false)} onSelect={(value) => setRowLimit(Number(value))} theme={theme} />
            {showStartPicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDateChange} />}
            {showEndPicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndDateChange} />}
        </View>
    );
}
