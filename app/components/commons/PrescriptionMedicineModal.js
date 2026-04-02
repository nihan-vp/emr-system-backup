import { LinearGradient } from 'expo-linear-gradient';
import { Plus, PlusCircle, Search, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getMedicalModalTheme } from '../../constants/tableTheme';

function ManageableOptionList({ data, selectedValue, onSelect, onAdd, onLongPress, color, theme }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
            <TouchableOpacity
                onPress={onAdd}
                style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}
            >
                <Plus size={18} color={theme.textDim} />
            </TouchableOpacity>
            {data.map((item, index) => {
                const isSelected = selectedValue === item;
                const activeColor = color || theme.primary;
                return (
                    <TouchableOpacity
                        key={`${item}-${index}`}
                        onPress={() => onSelect(item)}
                        onLongPress={() => onLongPress(item)}
                        delayLongPress={500}
                        style={{ backgroundColor: isSelected ? activeColor : theme.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: isSelected ? activeColor : theme.border, shadowColor: isSelected ? activeColor : '#000', shadowOpacity: isSelected ? 0.3 : 0, elevation: 3 }}
                    >
                        <Text style={{ color: isSelected ? 'white' : theme.text, fontWeight: 'bold' }}>{item}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

export default function PrescriptionMedicineModal({
    visible,
    theme,
    medicines,
    medSearch,
    setMedSearch,
    newMedForm,
    setNewMedForm,
    editingMedIndex,
    freqOptions,
    durOptions,
    doseOptions,
    instrOptions,
    onClose,
    onSelectInventoryMed,
    onClearSelection,
    onOpenAddInput,
    onLongPressItem,
    onSubmit,
}) {
    const inventoryMatches = medicines.filter((item) => item.name.toLowerCase().includes(medSearch.toLowerCase()) && medSearch.length > 0);
    const isLocked = newMedForm.inventoryId !== null;
    const isManualEntry = newMedForm.inventoryId === -1;
    const modalTheme = getMedicalModalTheme(theme);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        );

        pulseLoop.start();
        return () => pulseLoop.stop();
    }, [pulseAnim]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, padding: 25, height: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, elevation: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <Text style={{ fontSize: 11, color: modalTheme.chipText, fontWeight: '800', letterSpacing: 0.7 }}>PRESCRIPTION BUILDER</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 4 }}>{editingMedIndex !== null ? 'Update Medicine' : 'Add Medicine'}</Text>
                            </Animated.View>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: modalTheme.cancelBg, padding: 8, borderRadius: 20 }}><X size={20} color={modalTheme.cancelText} /></TouchableOpacity>
                        </View>

                        {!isLocked && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>SEARCH INVENTORY</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: modalTheme.infoBg, borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                    <Search size={20} color={theme.primary} style={{ marginRight: 10 }} />
                                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Type medicine name..." placeholderTextColor={theme.textDim} value={medSearch} onChangeText={setMedSearch} />
                                    {medSearch.length > 0 && <TouchableOpacity onPress={() => setMedSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                                </View>
                                {medSearch.length > 0 && inventoryMatches.length > 0 && (
                                    <View style={{ maxHeight: 200, borderWidth: 1, borderColor: modalTheme.sectionBorder, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden', backgroundColor: modalTheme.surface, elevation: 5 }}>
                                        <FlatList
                                            data={inventoryMatches}
                                            keyExtractor={(item) => item.id.toString()}
                                            nestedScrollEnabled
                                            keyboardShouldPersistTaps="handled"
                                            renderItem={({ item }) => (
                                                <TouchableOpacity onPress={() => onSelectInventoryMed(item)} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View>
                                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.content} • {item.type}</Text>
                                                    </View>
                                                    <PlusCircle size={20} color={theme.primary} />
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                                <LinearGradient colors={theme.mode === 'dark' ? ['rgba(16,185,129,0.18)', 'rgba(14,165,233,0.08)'] : ['#ecfdf5', '#eff6ff']} style={{ marginTop: 16, borderRadius: 18, padding: 1.5 }}>
                                    <View style={{ padding: 16, borderRadius: 16, backgroundColor: modalTheme.sectionBg, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>Select from inventory</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginTop: 6, lineHeight: 20 }}>Search and pick an existing medicine, or use the button below to add a new medicine manually.</Text>
                                        <TouchableOpacity
                                            onPress={() => setNewMedForm((prev) => ({
                                                ...prev,
                                                inventoryId: -1,
                                                name: prev.name || '',
                                                content: prev.content || '',
                                                type: prev.type || 'Tablet',
                                                doseQty: '',
                                                freq: '',
                                                duration: '',
                                                instruction: '',
                                                isTapering: false
                                            }))}
                                            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.18)' : '#dbeafe', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(59,130,246,0.3)' : '#93c5fd', borderRadius: 10, paddingVertical: 10 }}
                                        >
                                            <PlusCircle size={15} color="#1d4ed8" />
                                            <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Add New Medicine</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </View>
                        )}

                        {(isLocked || editingMedIndex !== null) && (
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={{ gap: 20 }}>
                                {isLocked && (
                                    <LinearGradient colors={theme.mode === 'dark' ? ['rgba(16,185,129,0.2)', 'rgba(14,165,233,0.1)'] : ['#dcfce7', '#e0f2fe']} style={{ borderRadius: 18, padding: 1.5 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: modalTheme.infoBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                            <View>
                                                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>{isManualEntry ? 'NEW MEDICINE ENTRY' : 'SELECTED MEDICINE'}</Text>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>{newMedForm.name || (isManualEntry ? 'Enter medicine details' : '')}</Text>
                                            </View>
                                            <TouchableOpacity onPress={onClearSelection} style={{ backgroundColor: modalTheme.surface, padding: 8, borderRadius: 10 }}><X size={18} color="#ef4444" /></TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                )}

                                {isManualEntry && (
                                    <View style={{ gap: 10, backgroundColor: modalTheme.sectionBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                        <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>NEW MEDICINE DETAILS</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: theme.border }}>
                                            <TextInput
                                                style={{ flex: 1, color: theme.text, fontSize: 15 }}
                                                placeholder="Medicine Name *"
                                                placeholderTextColor={theme.textDim}
                                                value={newMedForm.name}
                                                onChangeText={(value) => setNewMedForm((prev) => ({ ...prev, name: value }))}
                                            />
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: theme.border }}>
                                                <TextInput
                                                    style={{ flex: 1, color: theme.text, fontSize: 14 }}
                                                    placeholder="Content/Strength"
                                                    placeholderTextColor={theme.textDim}
                                                    value={newMedForm.content}
                                                    onChangeText={(value) => setNewMedForm((prev) => ({ ...prev, content: value }))}
                                                />
                                            </View>
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: theme.border }}>
                                                <TextInput
                                                    style={{ flex: 1, color: theme.text, fontSize: 14 }}
                                                    placeholder="Type (Tablet)"
                                                    placeholderTextColor={theme.textDim}
                                                    value={newMedForm.type}
                                                    onChangeText={(value) => setNewMedForm((prev) => ({ ...prev, type: value }))}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Content/Strength</Text>
                                        <View style={{ height: 50, backgroundColor: modalTheme.sectionBg, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: modalTheme.sectionBorder, opacity: 0.85 }}>
                                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{newMedForm.content || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Type</Text>
                                        <View style={{ height: 50, backgroundColor: modalTheme.sectionBg, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: modalTheme.sectionBorder, opacity: 0.85 }}>
                                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{newMedForm.type || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ backgroundColor: modalTheme.sectionBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: modalTheme.sectionBorder }}>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Tapering / Complex Dose?</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Enable complex dosage schedule</Text>
                                    </View>
                                    <Switch value={newMedForm.isTapering} onValueChange={(value) => setNewMedForm((prev) => ({ ...prev, isTapering: value }))} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor="white" />
                                </View>

                                {newMedForm.isTapering ? (
                                    <View style={{ gap: 20, backgroundColor: 'rgba(234, 88, 12, 0.05)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.2)' }}>
                                        <Text style={{ color: '#ea580c', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', marginBottom: 5 }}>TAPERING SCHEDULE</Text>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Frequency Pattern</Text>
                                            <ManageableOptionList data={freqOptions} selectedValue={newMedForm.freq} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, freq: value }))} onAdd={() => onOpenAddInput('freq')} onLongPress={(value) => onLongPressItem('freq', value)} color="#ea580c" theme={theme} />
                                        </View>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>For Duration</Text>
                                            <ManageableOptionList data={durOptions} selectedValue={newMedForm.duration} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, duration: value }))} onAdd={() => onOpenAddInput('dur')} onLongPress={(value) => onLongPressItem('dur', value)} color="#f97316" theme={theme} />
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Dose Amount</Text>
                                            <ManageableOptionList data={doseOptions} selectedValue={newMedForm.doseQty} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, doseQty: value }))} onAdd={() => onOpenAddInput('dose')} onLongPress={(value) => onLongPressItem('dose', value)} color="#06b6d4" theme={theme} />
                                        </View>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Frequency</Text>
                                            <ManageableOptionList data={freqOptions} selectedValue={newMedForm.freq} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, freq: value }))} onAdd={() => onOpenAddInput('freq')} onLongPress={(value) => onLongPressItem('freq', value)} theme={theme} />
                                        </View>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Duration</Text>
                                            <ManageableOptionList data={durOptions} selectedValue={newMedForm.duration} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, duration: value }))} onAdd={() => onOpenAddInput('dur')} onLongPress={(value) => onLongPressItem('dur', value)} color="#8b5cf6" theme={theme} />
                                        </View>
                                        <View>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Instructions</Text>
                                            <ManageableOptionList data={instrOptions} selectedValue={newMedForm.instruction} onSelect={(value) => setNewMedForm((prev) => ({ ...prev, instruction: value }))} onAdd={() => onOpenAddInput('instr')} onLongPress={(value) => onLongPressItem('instr', value)} color="#f59e0b" theme={theme} />
                                        </View>
                                    </>
                                )}
                            </View>
                        </ScrollView>
                        )}

                        {(isLocked || editingMedIndex !== null) && (
                            <TouchableOpacity onPress={onSubmit} style={{ marginTop: 25 }}>
                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, elevation: 8 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{editingMedIndex !== null ? 'Update Prescription' : 'Add to Prescription'}</Text>
                                </LinearGradient>
                                </Animated.View>
                            </TouchableOpacity>
                        )}
                    </View>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}