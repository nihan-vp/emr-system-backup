import { Activity, ArrowLeft, HelpCircle, Mail, MessageCircle, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupportScreen({ theme, onBack, layout, styles }) {
    const insets = useSafeAreaInsets();
    const company = {
        name: 'SuhaimSoft',
        email: 'info@suhaimsoft.com',
        phone: '+91 8891479505',
        phoneClean: '918891479505'
    };
    const developer = {
        name: 'Fouzan',
        phone: '+91 90720 70473',
        phoneClean: '919072070473',
        email: 'muhammedfauzan7862@gmail.com'
    };
    const astDeveloper = {
        name: 'Nihan',
        phone: '+91 77367 08566',
        phoneClean: '917736708566',
        email: 'qwerty311980@gmail.com'
    };


    const handleCall = (number) => Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Cannot place call'));
    const handleEmail = (email) => Linking.openURL(`mailto:${email}`).catch(() => Alert.alert('Error', 'Cannot open email app'));
    const handleWhatsApp = (number) => Linking.openURL(`whatsapp://send?phone=${number}`).catch(() => Alert.alert('Error', 'WhatsApp not installed'));

    const ContactCard = ({ title, data, isDev = false }) => (
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDev ? '#eff6ff' : '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    {isDev ? <User size={22} color="#2563eb" /> : <Activity size={22} color="#10b981" />}
                </View>
                <View>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>{data.name}</Text>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>{title}</Text>
                </View>
            </View>
            <View style={{ gap: 12 }}>
                <TouchableOpacity onPress={() => handleCall(data.phoneClean)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Phone size={18} color={theme.primary} style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>{data.phone}</Text>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>CALL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleWhatsApp(data.phoneClean)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <MessageCircle size={18} color="#25D366" style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>WhatsApp Support</Text>
                    <Text style={{ color: '#25D366', fontSize: 12, fontWeight: 'bold' }}>CHAT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEmail(data.email)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Mail size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{data.email}</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold' }}>MAIL</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.gutter }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Support & Help</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={{ width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', padding: layout.gutter }}>
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 1, borderColor: theme.border }}>
                        <HelpCircle size={40} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>How can we help you?</Text>
                    <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 5 }}>Contact our support team or developer directly for assistance.</Text>
                </View>
                <View style={{ flexDirection: layout.isDesktop ? 'row' : 'column', gap: 20 }}>
                    <View style={{ flex: 1 }}>
                        <ContactCard title="Technical Support Team" data={company} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ContactCard title="Lead Developer" data={developer} isDev />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ContactCard title="Assistant Developer" data={astDeveloper} isDev />
                    </View>     
                </View>
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>Suhaim Soft v2.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}