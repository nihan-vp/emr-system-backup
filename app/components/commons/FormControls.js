import React from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, X } from 'lucide-react-native';
import { getMedicalModalTheme } from '../../constants/tableTheme';

export function GenderSelector({ value, onChange, theme }) {
    const options = [
        { label: 'Male', val: 'M' },
        { label: 'Female', val: 'F' },
        { label: 'Other', val: 'O' }
    ];

    return (
        <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {options.map((opt) => {
                    const isActive = value === opt.val;
                    return (
                        <TouchableOpacity
                            key={opt.val}
                            onPress={() => onChange(opt.val)}
                            style={{
                                flex: 1,
                                backgroundColor: isActive ? theme.primary : theme.cardBg,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: isActive ? theme.primary : theme.border
                            }}
                        >
                            <Text style={{ color: isActive ? 'white' : theme.text, fontWeight: 'bold' }}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export function CustomPicker({ visible, title, data, onSelect, onClose, theme, colored = false, maxHeight }) {
    const modalTheme = getMedicalModalTheme(theme);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 1.5, paddingHorizontal: 1.5, maxHeight }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, overflow: 'hidden', paddingBottom: 30, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={modalTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: modalTheme.eyebrowText, letterSpacing: 0.7 }}>MEDICAL PICKER</Text>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: modalTheme.headerText, marginTop: 4 }} numberOfLines={1}>{title}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}>
                                <X size={22} color={modalTheme.closeIcon} />
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                            <View style={{ backgroundColor: modalTheme.infoBg, borderColor: modalTheme.infoBorder, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
                                <Text style={{ color: modalTheme.chipText, fontSize: 12, fontWeight: '700' }}>Choose an option to update the clinical record.</Text>
                            </View>
                        </View>

                        <FlatList
                            data={data}
                            keyExtractor={(item) => (typeof item === 'string' ? item : item.value)}
                            contentContainerStyle={{ padding: 20, paddingTop: 16 }}
                            renderItem={({ item, index }) => {
                                const label = typeof item === 'string' ? item : item.label;
                                const value = typeof item === 'string' ? item : item.value;
                                const rowBg = index % 2 === 0 ? modalTheme.sectionBg : modalTheme.infoBg;

                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onSelect(value);
                                            onClose();
                                        }}
                                        style={{ paddingVertical: 15, paddingHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: modalTheme.sectionBorder, borderRadius: 18, backgroundColor: rowBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, minWidth: 0 }}>
                                            {colored && item.icon ? (
                                                <LinearGradient colors={theme.mode === 'dark' ? [item.bg, 'rgba(255,255,255,0.03)'] : [item.bg, '#ffffff']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                                    <item.icon size={20} color={item.color} />
                                                </LinearGradient>
                                            ) : (
                                                <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: modalTheme.chipBg }}>
                                                    <ChevronRight size={18} color={modalTheme.chipText} />
                                                </View>
                                            )}
                                            <Text style={{ flex: 1, minWidth: 0, fontSize: 16, color: colored ? item.color || theme.text : theme.text, fontWeight: '700' }}>{label}</Text>
                                        </View>
                                        <ChevronRight size={16} color={modalTheme.subtleText} />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
}

export function InputGroup({ icon: Icon, label, value, onChange, theme, multiline, keyboardType, placeholder, styles }) {
    return (
        <View>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>{label}</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center', paddingVertical: multiline ? 12 : 4 }]}>
                <Icon size={20} color={theme.textDim} style={{ marginTop: multiline ? 2 : 0 }} />
                <TextInput
                    style={[styles.textInput, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center' }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder || label}
                    placeholderTextColor={theme.textDim}
                    multiline={multiline}
                    keyboardType={keyboardType || 'default'}
                    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
                />
            </View>
        </View>
    );
}
