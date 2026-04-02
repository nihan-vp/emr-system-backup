import React from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Moon, Pencil, Sun, Trash2, UserRound } from 'lucide-react-native';
import FeatureCard from '../../components/commons/FeatureCard';

export default function DashboardHomeScreen({ theme, insets, layout, isDarkMode, setIsDarkMode, heroAnim, nextAppt, upcomingAppointments, upcomingCount, formattedDate, formattedTime, onEditAppointment, onDeleteAppointment, onOpenAppointment, onOpenReports, onOpenAction, features, styles }) {
    const medicalPalettes = theme.mode === 'dark'
        ? [
            { card: '#102a34', border: '#1f4f5f', badge: '#d5fbff', badgeText: '#0c6d78', action: '#113847', delete: 'rgba(239, 68, 68, 0.18)' },
            { card: '#10273e', border: '#26557a', badge: '#dbeafe', badgeText: '#1d4ed8', action: '#152f4f', delete: 'rgba(239, 68, 68, 0.18)' },
            { card: '#112d2b', border: '#2b6b66', badge: '#dcfce7', badgeText: '#15803d', action: '#163b38', delete: 'rgba(239, 68, 68, 0.18)' },
        ]
        : [
            { card: '#f7feff', border: '#a8e3eb', badge: '#ddfbff', badgeText: '#0f766e', action: '#e7f7f9', delete: '#fee2e2' },
            { card: '#f5f9ff', border: '#b7d4ff', badge: '#dbeafe', badgeText: '#1d4ed8', action: '#e8f0ff', delete: '#fee2e2' },
            { card: '#f6fff8', border: '#b9e7ca', badge: '#dcfce7', badgeText: '#15803d', action: '#e8f8ee', delete: '#fee2e2' },
        ];

    const renderAppointmentCard = (item, index) => {
        const diagnosis = item.notes || 'Regular Visit';
        const palette = medicalPalettes[index % medicalPalettes.length];

        return (
            <View
                key={item.id}
                style={[
                    styles.dashboardAppointmentCard,
                    {
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                        marginBottom: index === upcomingAppointments.length - 1 ? 0 : 14,
                    },
                ]}
            >
                <View style={styles.dashboardAppointmentCompactRow}>
                    <View style={[styles.dashboardAppointmentAccent, { backgroundColor: palette.border }]} />

                    <View style={[styles.dashboardAppointmentTimeBadge, { backgroundColor: palette.badge, borderColor: palette.border }]}>
                        <Text style={[styles.dashboardAppointmentTimeValue, { color: palette.badgeText }]} numberOfLines={1}>{item.time}</Text>
                    </View>

                    <View style={styles.dashboardAppointmentCompactBody}>
                        <Text style={[styles.dashboardPatientName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.dashboardAppointmentDiagnosisLabel, { color: theme.textDim }]}>Diagnosis</Text>
                        <Text style={[styles.dashboardAppointmentNotes, { color: theme.textDim }]} numberOfLines={1}>
                            {diagnosis}
                        </Text>
                    </View>

                    <View style={styles.dashboardAppointmentSideActions}>
                        <TouchableOpacity style={[styles.dashboardRowActionBtn, { backgroundColor: palette.action }]} onPress={() => onEditAppointment(item)}>
                            <Pencil size={15} color={palette.badgeText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dashboardRowActionBtn, { backgroundColor: palette.delete }]} onPress={() => onDeleteAppointment(item.id)}>
                            <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.header, { marginTop: insets.top + 10, marginBottom: 10, paddingHorizontal: layout.gutter, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' }]}>
                <View>
                    <Text style={[styles.greeting, { color: theme.text }]}>Welcome, Dr. Mansoor Ali.VP</Text>
                    <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4, fontWeight: '500' }}>+91 9895353078</Text>
                    <View style={styles.dateContainer}>
                        <Text style={[styles.dateText, { color: theme.textDim }]}>{formattedDate}</Text>
                        <View style={[styles.dot, { backgroundColor: theme.textDim }]} />
                        <Text style={[styles.timeText, { color: theme.primary }]}>{formattedTime}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? <Sun size={22} color={theme.text} /> : <Moon size={22} color={theme.text} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.gutter, paddingBottom: 120, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 0 }]}>Quick Access</Text>
                <View style={[styles.grid, styles.dashboardSectionBlock, { paddingHorizontal: 0 }]}>
                    {features.map((item, index) => (
                        <FeatureCard key={item.id} item={item} index={index} theme={theme} styles={styles} layout={layout} onAction={onOpenAction} />
                    ))}
                </View>

                <Animated.View style={[styles.dashboardSectionBlock, { opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 0 }]}>Upcoming Appointments</Text>
                    <View style={styles.dashboardAppointmentList}>
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map(renderAppointmentCard)
                        ) : (
                            <View style={styles.dashboardEmptyState}>
                                <UserRound size={28} color={theme.textDim} />
                                <Text style={[styles.dashboardEmptyTitle, { color: theme.text }]}>No upcoming appointments</Text>
                                <Text style={[styles.dashboardEmptyText, { color: theme.textDim }]}>New bookings will appear here as individual cards once they are scheduled.</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
