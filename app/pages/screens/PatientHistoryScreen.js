import { LinearGradient } from 'expo-linear-gradient';
import { 
    ArrowLeft, Clipboard, FilePlus, HeartPulse, Phone, 
    Search, Stethoscope, FileText, Download, Activity, 
    FileType, ActivitySquare, UserX, X, Edit, Trash2, Eye, Share2, Printer
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
    ScrollView, Text, TextInput, TouchableOpacity, 
    View, Animated, Easing, StyleSheet, Alert, Dimensions, Modal, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

// --- Utility Functions ---
const formatDateTime = (dateLike) => {
    const parsed = dateLike ? new Date(dateLike) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return 'Unknown date';
    return parsed.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const getPatientLabel = (name = '') => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toDisplayText = (value, fallback = '-') => {
    const normalized = String(value ?? '').trim();
    return normalized ? escapeHtml(normalized) : fallback;
};

const buildPatientTimeline = (patient) => {
    const vitalsEntries = (patient?.vitalsHistory ||[]).map((item) => ({
        id: `v-${item.id || Math.random().toString(36).slice(2)}`,
        type: 'vitals', date: item.date, payload: item
    }));

    const rxEntries = (patient?.rxHistory ||[]).map((item) => ({
        id: `r-${item.id || Math.random().toString(36).slice(2)}`,
        type: 'prescription', date: item.date, payload: item
    }));

    return[...vitalsEntries, ...rxEntries]
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
};

const normalizeNameList = (items) => (items ||[])
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((item) => String(item || '').trim())
    .filter(Boolean);

// --- Custom Animation Wrapper ---
const FadeInUp = ({ delay = 0, children, style }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 500, delay, useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            })
        ]).start();
    },[fadeAnim, translateY, delay]);

    return (
        <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

// --- Main Component ---
export default function PatientHistoryScreen({
    theme, onBack, patients =[], selectedPatientId,
    onOpenVitals, onOpenPrescription, styles: propStyles,
    onEditRx, onDeleteRx, onEditPatient, onDeletePatient,
    onSaveVitals, showToast
}) {
    const insets = useSafeAreaInsets();
    const[searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState(selectedPatientId || null);
    const[activeTab, setActiveTab] = useState(selectedPatientId ? 'timeline' : 'prescriptions');
    const[isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    // Modal State for Full Screen Document Viewer
    const [previewRx, setPreviewRx] = useState(null);

    // SweetAlert-style confirmation for WhatsApp share
    const [confirmShareVisible, setConfirmShareVisible] = useState(false);
    const [confirmShareRx, setConfirmShareRx] = useState(null);

    useEffect(() => {
        if (selectedPatientId) {
            setSelectedId(selectedPatientId);
            setActiveTab('timeline');
        }
    }, [selectedPatientId]);

    // Enhanced Search Filtering
    const filteredPatients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return patients;
        return patients.filter((item) => (
            (item.name || '').toLowerCase().includes(query) ||
            String(item.mobile || '').includes(query) ||
            String(item.id || '').includes(query)
        ));
    }, [patients, searchQuery]);

    const selectedPatient = useMemo(
        () => patients.find((item) => item.id === selectedId) || null,[patients, selectedId]
    );

    const allPrescriptions = useMemo(() => {
        return filteredPatients.flatMap(p => 
            (p.rxHistory ||[]).map(rx => ({ ...rx, patient: p }))
        ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    },[filteredPatients]);

    const timeline = useMemo(() => buildPatientTimeline(selectedPatient), [selectedPatient]);

    // --- PDF Export for Complete History ---
    const generateAndSharePDF = async () => {
        if (!selectedPatient) return;
        try {
            setIsGeneratingPDF(true);
            let timelineHtml = timeline.map(entry => {
                const dateStr = formatDateTime(entry.date);
                if (entry.type === 'vitals') {
                    const v = entry.payload;
                    return `<div class="card vitals-card"><div class="header"><h3>💙 Vitals</h3><span>${dateStr}</span></div><div class="grid">${v.sys ? `<div class="data-item"><strong>BP:</strong> ${v.sys}/${v.dia || '-'}</div>` : ''}${v.pulse ? `<div class="data-item"><strong>Pulse:</strong> ${v.pulse} bpm</div>` : ''}${v.spo2 ? `<div class="data-item"><strong>SpO2:</strong> ${v.spo2}%</div>` : ''}${v.weight ? `<div class="data-item"><strong>Weight:</strong> ${v.weight} kg</div>` : ''}${v.temp ? `<div class="data-item"><strong>Temp:</strong> ${v.temp}°${v.tempUnit || 'C'}</div>` : ''}</div></div>`;
                } else {
                    const r = entry.payload;
                    const meds = (r.medicines ||[]).map(m => `<li>${m.name} ${m.dosage ? '- ' + m.dosage : ''}</li>`).join('');
                    return `<div class="card rx-card"><div class="header"><h3>💜 Prescription (Rx)</h3><span>${dateStr}</span></div><div class="diagnosis"><strong>Diagnosis:</strong> ${r.diagnosis || 'None listed'}</div>${meds ? `<strong>Medicines:</strong><ul>${meds}</ul>` : ''}${r.advice ? `<div style="margin-top:10px;"><strong>Advice:</strong> ${r.advice}</div>` : ''}</div>`;
                }
            }).join('');

            const html = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; }
                        .report-header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .report-header h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
                        .patient-info { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 20px; border: 1px solid #e2e8f0; }
                        .info-group { flex: 1; min-width: 150px; }
                        .info-group label { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                        .info-group div { font-size: 18px; font-weight: 600; color: #0f172a; }
                        h2 { color: #334155; margin-bottom: 20px; }
                        .card { padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
                        .vitals-card { background: #f0f9ff; border-left: 5px solid #0ea5e9; }
                        .rx-card { background: #fdf4ff; border-left: 5px solid #d946ef; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px; margin-bottom: 15px; }
                        .header h3 { margin: 0; font-size: 18px; color: #0f172a; }
                        .grid { display: flex; flex-wrap: wrap; gap: 10px; }
                        .data-item { background: white; padding: 8px 12px; border-radius: 8px; font-size: 14px; border: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="report-header">
                        <h1>Comprehensive Patient History</h1>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="patient-info">
                        <div class="info-group"><label>Patient Name</label><div>${selectedPatient.name}</div></div>
                        <div class="info-group"><label>Patient ID</label><div>#${selectedPatient.id}</div></div>
                        <div class="info-group"><label>Age / Gender</label><div>${selectedPatient.age || '-'} yrs / ${selectedPatient.gender || '-'}</div></div>
                        <div class="info-group"><label>Contact</label><div>${selectedPatient.mobile || 'No contact'}</div></div>
                    </div>
                    <h2>Timeline Records</h2>
                    ${timelineHtml || '<p>No history recorded for this patient.</p>'}
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Patient History' });

            if (typeof showToast === 'function') {
                showToast('Shared', 'Patient history PDF share opened.', 'success');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not generate PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // --- OLD PRESCRIPTION LAYOUT WITH EXACT 1-PAGE FIX AND PERFECT MOBILE SCALING ---
    const getPrescriptionHTML = (rx) => {
        const patient = rx.patient || selectedPatient || {};
        const dateObj = new Date(rx.date || Date.now());
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const vitals = Array.isArray(patient?.vitalsHistory)
            ? [...patient.vitalsHistory].sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime())[0] || {}
            : {};

        const genderLabel = patient?.gender === 'M' ? 'Male' : patient?.gender === 'F' ? 'Female' : toDisplayText(patient?.gender || '', 'Other');
        const patientName = toDisplayText(patient?.name || 'Unknown Patient', 'Unknown Patient').toUpperCase();
        const patientId = toDisplayText(patient?.id, 'N/A');
        const bookingNumber = toDisplayText(patient?.bookingNo || patient?.bookingNumber || patient?.id || 'N/A', 'N/A');
        const mobile = toDisplayText(patient?.mobile || 'N/A', 'N/A');
        const age = toDisplayText(patient?.age || '-', '-');

        const diagnosis = toDisplayText(rx?.diagnosis || '', '-');
        const bookingNotes = toDisplayText(rx?.bookingNotes || patient?.bookingNotes || patient?.notes || '', '-');
        const additionalNotes = toDisplayText(rx?.advice || '', '-');
        const labNotes = toDisplayText(rx?.labNotes || '', '-');

        const procedures = (rx?.procedures ||[]).map((item) => (typeof item === 'string' ? item : item?.name)).map((item) => String(item || '').trim()).filter(Boolean);
        const investigations = (rx?.nextVisitInvestigations ||[]).map((item) => (typeof item === 'string' ? item : item?.name)).map((item) => String(item || '').trim()).filter(Boolean);
        const referral = toDisplayText(rx?.referral || '', '-');

        const medsRows = (rx?.medicines ||[]).map((m, index) => {
            const medName = toDisplayText(m?.name || '', '-').toUpperCase();
            const medContent = toDisplayText(m?.content || m?.dosage || m?.type || '', '-');
            return `
                <tr>
                    <td class="tc">${index + 1}</td>
                    <td style="text-align: left;">
                        <div class="med-name">${medName}</div>
                        <div class="med-meta">Content: ${medContent}</div>
                    </td>
                    <td class="tc">${toDisplayText(m?.dosage || '', '-')}</td>
                    <td class="tc">${toDisplayText(m?.type || 'tab', 'tab')}</td>
                    <td class="tc">${toDisplayText(m?.freq || '', '-')}</td>
                    <td class="tc">${toDisplayText(m?.duration || '', '-')}</td>
                    <td class="tc">${toDisplayText(m?.instruction || '', '-')}</td>
                </tr>
            `;
        }).join('');

        const procedureItems = procedures.length > 0 ? procedures.map((item) => `<li>${toDisplayText(item)}</li>`).join('') : '';
        const investigationItems = investigations.length > 0 ? investigations.map((item) => `<li>${toDisplayText(item)}</li>`).join('') : '';

        return `
<!DOCTYPE html>
<html>
<head>
    <!-- Viewport 794 maps exactly to 210mm at 96dpi, forcing perfect mobile WebView scale -->
    <meta name="viewport" content="width=794, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <style>
        /* Base Reset */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #cbd5e1; /* Background color behind paper in webview */
            color: #000000;
            font-size: 15px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        /* Centering the paper wrapper for screen view */
        .mobile-wrapper {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            padding: 10px 0; /* Tiny gap for looks in webview */
        }

        /* 
           STRICT 1-PAGE A4 CONTAINER 
           794px x 1122px is exactly A4 at 96 DPI.
           overflow: hidden absolutely prevents a second page blank sheet.
        */
        .page {
            width: 794px;
            height: 1122px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            overflow: hidden; /* Force strict 1 page */
            position: relative;
        }

        /* EXACT OLD LAYOUT STYLES */
        .header-band {
            background: #009b8e;
            color: #ffffff; 
            text-align: center; 
            padding: 20px 10px;
        }
        .header-title { margin: 0 0 4px 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; }
        .header-sub { margin: 0 0 6px 0; font-size: 14px; }
        .header-booking { margin: 0; font-size: 16px; font-weight: bold; }

        .content { padding: 20px 30px; display: flex; flex-direction: column; flex: 1; }

        .top-section { display: flex; justify-content: space-between; margin-bottom: 25px; line-height: 1.4; }
        .patient-info { flex: 0 0 75%; }
        .vitals-info { flex: 0 0 20%; }
        .info-inline-row { display: flex; gap: 25px; flex-wrap: wrap; }
        .bold { font-weight: bold; font-size: 17px; }

        .lab-section { display: flex; margin-bottom: 20px; }
        .lab-col { flex: 1; }
        .lab-col h3 { margin: 0 0 5px 0; font-size: 17px; font-weight: bold; }
        .lab-col p { margin: 0; }

        .divider { border-top: 1px solid #c0c0c0; margin: 0 0 20px 0; }

        .med-title { margin: 0 0 10px 0; font-size: 18px; font-weight: bold; }
        .med-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .med-table th, .med-table td { border: 1px solid #a0a0a0; padding: 8px 6px; text-align: center; vertical-align: middle; }
        .med-table th { background-color: #f5f5f5; font-weight: bold; font-size: 14px; }
        
        .med-name { font-size: 15px; font-weight: bold; display: block; }
        .med-meta { font-size: 13px; font-style: italic; color: #444444; display: block; margin-top: 3px; }

        .notes-block { margin-bottom: 8px; line-height: 1.4; }
        .notes-label { font-weight: bold; font-size: 16px; }
        .notes-list { list-style: none; margin: 0; padding: 0; }
        .notes-list li { margin: 0; padding: 0; }
        .notes-text { margin: 0; }

        /* FOOTER FORCED TO BOTTOM */
        .footer { 
            padding: 20px 0 0 0; 
            margin-top: auto; /* Magic line that pushes it strictly to the bottom */
            position: relative; 
            width: 100%;
        }
        .signature-box { 
            position: absolute; 
            right: 30px; 
            bottom: 60px; 
            text-align: left; 
            line-height: 1.2; 
        }
        .signature-box .signed-by { font-style: italic; }
        .signature-box .doc-name { font-weight: bold; font-size: 16px; }
        .software-info { 
            font-size: 14px; 
            line-height: 1.4; 
            width: 100%; 
            text-align: center; 
            background-color: #f1f5f9; 
            border-top: 1px solid #cbd5e1; 
            padding: 10px 30px; 
        }

        /* STRICT PRINT OVERRIDES TO ENSURE 1 PAGE */
        @page { size: A4 portrait; margin: 0; }
        @media print {
            body { background: #ffffff; }
            .mobile-wrapper { padding: 0; display: block; }
            .page { 
                width: 210mm; 
                height: 296mm; /* Safe print height */
                margin: 0; 
                box-shadow: none; 
                overflow: hidden; 
                page-break-after: avoid; 
            }
        }
    </style>
</head>
<body>
    <div class="mobile-wrapper">
        <div class="page">
            
            <!-- Exact Header Match -->
            <div class="header-band">
                <h1 class="header-title">Dr.MANSOOR ALI.V.P, MD (PHYSICIAN)</h1>
                <p class="header-sub">General Practitioner | Reg No: 35083 | +91 9895353078 | Pathappiriyam</p>
                <p class="header-booking">BOOKING NO: +${bookingNumber}</p>
            </div>

            <div class="content">
                <!-- Patient Info & Vitals Grid -->
                <div class="top-section">
                    <div class="patient-info">
                        <div><span class="bold">Patient Information:</span> ID NO: ${patientId}</div>
                        <div class="info-inline-row">
                            <div><span class="bold">Name:</span> ${patientName}</div>
                            <div><span class="bold">Age:</span> ${age}</div>
                            <div><span class="bold">Gender:</span> ${genderLabel}</div>
                            <div><span class="bold">Phone:</span> ${mobile}</div>
                        </div>
                        <div><span class="bold">Booking Notes:</span> ${bookingNotes}</div>
                        <div><span class="bold">Diagnosis:</span> ${diagnosis}</div>
                        <div><span class="bold">Additional Notes:</span> ${additionalNotes}</div>
                        <div><span class="bold">Date:</span> ${dateStr}</div>
                    </div>
                    
                    <div class="vitals-info">
                        <div><span class="bold">SpO2:</span> ${toDisplayText(vitals?.spo2 ? `${vitals.spo2}` : '', '-')}</div>
                        <div><span class="bold">BP:</span> ${toDisplayText(vitals?.sys ? `${vitals.sys}/${vitals?.dia || ''}` : '', '-')}</div>
                        <div><span class="bold">Pulse:</span> ${toDisplayText(vitals?.pulse ? `${vitals.pulse}` : '', '-')}</div>
                        <div><span class="bold">Temp:</span> ${toDisplayText(vitals?.temp ? `${vitals.temp}${vitals?.tempUnit ? ` ${vitals.tempUnit}` : ''}` : '', '-')}</div>
                        <div><span class="bold">Weight:</span> ${toDisplayText(vitals?.weight ? `${vitals.weight}` : '', '-')}</div>
                    </div>
                </div>

                <!-- Lab Sections -->
                <div class="lab-section">
                    <div class="lab-col">
                        <h3>Lab Reports</h3>
                        <p>${investigations.length > 0 ? investigations.map((item) => toDisplayText(item)).join(', ') : '-'}</p>
                    </div>
                    <div class="lab-col">
                        <h3>Lab Notes</h3>
                        <p>${labNotes || '-'}</p>
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Medicines Section -->
                <h2 class="med-title">Medicines</h2>
                <table class="med-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">Sl</th>
                            <th style="width: 32%;">Medicine</th>
                            <th style="width: 10%;">Dosage</th>
                            <th style="width: 13%;">Route</th>
                            <th style="width: 13%;">Frequency</th>
                            <th style="width: 12%;">Duration</th>
                            <th style="width: 15%;">Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medsRows || `<tr><td colspan="7">No medicines added.</td></tr>`}
                    </tbody>
                </table>

                <!-- Post Table Items (No Bullets) -->
                ${procedures.length > 0 ? `
                    <div class="notes-block">
                        <div class="notes-label">Procedures:</div>
                        <ul class="notes-list">${procedureItems}</ul>
                    </div>
                ` : ''}

                ${investigations.length > 0 ? `
                    <div class="notes-block">
                        <div class="notes-label">Investigation On Next Visit:</div>
                        <ul class="notes-list">${investigationItems}</ul>
                    </div>
                ` : ''}

                ${referral && referral !== '-' ? `
                    <div class="notes-block">
                        <div class="notes-label">Referral:</div>
                        <div class="notes-text">${referral}</div>
                    </div>
                ` : ''}
            </div>

            <!-- Footer exactly matched to original -->
            <div class="footer">
                <div class="signature-box">
                    <div class="signed-by">Signed by</div>
                    <div class="doc-name">DR MANSOOR ALI V.P</div>
                </div>
                
                <div class="software-info">
                    <div>Prescription Generated by Suhaim Software</div>
                    <div>Visit us: www.clinicppm.site</div>
                </div>
            </div>

        </div>
    </div>
</body>
</html>
        `;
    };

    const handleDownloadRxPDF = async (rx) => {
        try {
            setIsGeneratingPDF(true);
            const html = getPrescriptionHTML(rx);
            const patient = rx.patient || selectedPatient || {};
            const rawName = String(patient.name || 'Prescription').trim();
            const safeBaseName = rawName || 'Prescription';
            const sanitizedFileName = (safeBaseName
                .replace(/[^a-z0-9_\- ]+/gi, '')
                .replace(/\s+/g, '_')
                .slice(0, 60) || 'Prescription') + '.pdf';

            const { uri } = await Print.printToFileAsync({ html, base64: false });

            // Move/rename file so external apps (WhatsApp, Files, etc.) see patient name
            const newUri = FileSystem.documentDirectory
                ? FileSystem.documentDirectory + sanitizedFileName
                : uri;

            if (FileSystem.documentDirectory) {
                try {
                    await FileSystem.moveAsync({ from: uri, to: newUri });
                } catch (e) {
                    // If move fails, fall back to original uri
                }
            }
            await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription PDF' });

            if (typeof showToast === 'function') {
                showToast('Shared', 'Prescription PDF share opened.', 'success');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not generate Prescription PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrintRx = async (rx) => {
        try {
            setIsGeneratingPDF(true);
            const html = getPrescriptionHTML(rx);
            await Print.printAsync({ html });
        } catch (error) {
            Alert.alert('Error', 'Could not print Prescription.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleShareWhatsapp = (rx) => {
        setConfirmShareRx(rx);
        setConfirmShareVisible(true);
    };

    const confirmShareWhatsappNow = async () => {
        if (!confirmShareRx) {
            setConfirmShareVisible(false);
            return;
        }

        const rx = confirmShareRx;
        const patient = rx.patient || selectedPatient || {};
        const patientName = patient?.name || 'Unknown Patient';
        try {
            setIsGeneratingPDF(true);
            const html = getPrescriptionHTML(rx);

            const rawName = String(patientName || 'Prescription').trim();
            const safeBaseName = rawName || 'Prescription';
            const sanitizedFileName = (safeBaseName
                .replace(/[^a-z0-9_\- ]+/gi, '')
                .replace(/\s+/g, '_')
                .slice(0, 60) || 'Prescription') + '.pdf';

            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const newUri = FileSystem.documentDirectory
                ? FileSystem.documentDirectory + sanitizedFileName
                : uri;

            if (FileSystem.documentDirectory) {
                try {
                    await FileSystem.moveAsync({ from: uri, to: newUri });
                } catch (e) {
                    // ignore and use original uri
                }
            }

            await Sharing.shareAsync(newUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Prescription PDF',
            });

            if (typeof showToast === 'function') {
                showToast('Shared', 'Prescription PDF ready to send via WhatsApp.', 'success');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not prepare Prescription PDF for sharing.');
        } finally {
            setIsGeneratingPDF(false);
            setConfirmShareVisible(false);
            setConfirmShareRx(null);
        }
    };

    const handleBackPress = () => {
        if (selectedPatient && !selectedPatientId) {
            setSelectedId(null);
            setActiveTab('prescriptions');
            return;
        }
        onBack();
    };

    // --- Search Empty State UI ---
    const renderEmptySearch = () => (
        <FadeInUp delay={100} style={localStyles.emptySearchContainer}>
            <LinearGradient
                colors={theme.mode === 'dark' ?['rgba(244,63,94,0.15)', 'rgba(225,29,72,0.05)'] :['#ffe4e6', '#fecdd3']}
                style={localStyles.emptySearchCircle}
            >
                <UserX size={36} color={theme.mode === 'dark' ? '#fb7185' : '#e11d48'} />
            </LinearGradient>
            <Text style={[localStyles.emptySearchTitle, { color: theme.text }]}>No Results Found</Text>
            <Text style={[localStyles.emptySearchSub, { color: theme.textDim }]}>
                We couldn't find any match. Please check the spelling or try a different ID/Number.
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
                <LinearGradient colors={['#f43f5e', '#e11d48']} style={localStyles.clearSearchBtn}>
                    <X size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 6 }}>Clear Search</Text>
                </LinearGradient>
            </TouchableOpacity>
        </FadeInUp>
    );

    // --- History List View ---
    const renderHistoryList = () => (
        <View style={{ flex: 1 }}>
            <FadeInUp delay={50} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={[localStyles.searchBar, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                    <Search size={20} color={theme.textDim} />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, color: theme.text, fontSize: 16 }}
                        placeholder="Search patients by name, ID, or phone..."
                        placeholderTextColor={theme.textDim}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={18} color={theme.textDim} />
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={[localStyles.tabContainer, { borderColor: theme.border, backgroundColor: theme.inputBg, marginTop: 16, marginBottom: 0 }]}>
                    <TouchableOpacity style={[localStyles.switchTab, activeTab === 'prescriptions' && { backgroundColor: theme.primary, shadowColor: theme.primary, elevation: 5 }]} onPress={() => setActiveTab('prescriptions')} activeOpacity={0.8}>
                        <Text style={{ color: activeTab === 'prescriptions' ? 'white' : theme.text, fontWeight: '700', fontSize: 14 }}>Recent Prescriptions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[localStyles.switchTab, activeTab === 'timeline' && { backgroundColor: theme.primary, shadowColor: theme.primary, elevation: 5 }]} onPress={() => setActiveTab('timeline')} activeOpacity={0.8}>
                        <Text style={{ color: activeTab === 'timeline' ? 'white' : theme.text, fontWeight: '700', fontSize: 14 }}>Patient Directory</Text>
                    </TouchableOpacity>
                </View>
            </FadeInUp>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {activeTab === 'prescriptions' ? (
                    allPrescriptions.length === 0 ? renderEmptySearch() : allPrescriptions.map((rx, index) => (
                        <FadeInUp key={rx.id} delay={index * 100}>
                            <View style={[localStyles.timelineCard, { marginTop: 16, marginLeft: 0, borderColor: theme.border, backgroundColor: theme.cardBg, borderLeftWidth: 4, borderLeftColor: '#d946ef' }]}>
                                <View style={localStyles.timelineCardHeader}>
                                    <View>
                                        <Text style={{ color: '#db2777', fontWeight: '800', fontSize: 14 }}>PRESCRIPTION (Rx)</Text>
                                        <TouchableOpacity onPress={() => { setSelectedId(rx.patient.id); setActiveTab('timeline'); }}>
                                            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 4 }}>{rx.patient?.name}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>{formatDateTime(rx.date)}</Text>
                                </View>
                                <View>
                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>{rx.diagnosis || 'General Diagnosis'}</Text>
                                    {normalizeNameList(rx.procedures).length > 0 && (
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                            Procedures/Services: {normalizeNameList(rx.procedures).join(', ')}
                                        </Text>
                                    )}
                                    {normalizeNameList(rx.nextVisitInvestigations).length > 0 && (
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                            Investigation On Next Visit: {normalizeNameList(rx.nextVisitInvestigations).join(', ')}
                                        </Text>
                                    )}
                                    {!!rx.referral && (
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                            Referral: {rx.referral}
                                        </Text>
                                    )}
                                    {!!rx.advice && (
                                        <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 6 }} numberOfLines={2}>
                                            Advice: {rx.advice}
                                        </Text>
                                    )}
                                    {(rx.medicines ||[]).length > 0 && (
                                        <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border, alignSelf: 'flex-start' }]}>
                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>💊 {rx.medicines.length} Medicines Prescribed</Text>
                                        </View>
                                    )}

                                    {/* Action Buttons */}
                                    <View style={{ flexDirection: 'row', marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                                        <TouchableOpacity style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#f1f5f9' }]} onPress={() => { setPreviewRx(rx); }}>
                                            <Eye size={16} color={theme.primary} />
                                            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Open Rx View</Text>
                                        </TouchableOpacity>
                                        <View style={{ flex: 1 }} />
                                        <TouchableOpacity style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(234,179,8,0.1)' : '#fefce8' }]} onPress={() => onEditRx && onEditRx(rx.patient.id, rx)}>
                                            <Edit size={16} color="#eab308" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]} onPress={() => onDeleteRx && onDeleteRx(rx.patient.id, rx.id)}>
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </FadeInUp>
                    ))
                ) : (
                    filteredPatients.length === 0 ? renderEmptySearch() : filteredPatients.map((item, index) => {
                        const vitalsCount = (item.vitalsHistory ||[]).length;
                        const rxCount = (item.rxHistory ||[]).length;
                        return (
                            <FadeInUp key={item.id} delay={index * 100}>
                                <TouchableOpacity
                                    onPress={() => { setSelectedId(item.id); setActiveTab('timeline'); }}
                                    style={[localStyles.patientCard, { borderColor: theme.border, backgroundColor: theme.cardBg, marginTop: 16, marginBottom: 0 }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        <LinearGradient
                                            colors={theme.mode === 'dark' ?['#0e7490', '#1d4ed8'] :['#a5f3fc', '#bfdbfe']}
                                            style={localStyles.avatar}
                                        >
                                            <Text style={{ color: theme.mode === 'dark' ? '#fff' : '#1e3a8a', fontWeight: '800', fontSize: 18 }}>
                                                {getPatientLabel(item.name)}
                                            </Text>
                                        </LinearGradient>
                                        <View style={{ flex: 1, marginLeft: 14 }}>
                                            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>{item.name}</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 14, marginTop: 4, fontWeight: '500' }} numberOfLines={1}>
                                                ID: #{item.id}  •  {item.mobile || 'No contact'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }}>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={[localStyles.badge, { backgroundColor: theme.mode === 'dark' ? 'rgba(6,182,212,0.15)' : '#ecfeff' }]}>
                                                <Activity size={14} color="#06b6d4" style={{ marginRight: 6 }}/>
                                                <Text style={{ color: theme.mode === 'dark' ? '#22d3ee' : '#0891b2', fontSize: 13, fontWeight: '700' }}>Vitals: {vitalsCount}</Text>
                                            </View>
                                            <View style={[localStyles.badge, { backgroundColor: theme.mode === 'dark' ? 'rgba(217,70,239,0.15)' : '#fdf4ff' }]}>
                                                <FileText size={14} color="#d946ef" style={{ marginRight: 6 }}/>
                                                <Text style={{ color: theme.mode === 'dark' ? '#e879f9' : '#c026d3', fontSize: 13, fontWeight: '700' }}>Rx: {rxCount}</Text>
                                            </View>
                                        </View>
                                        
                                        {/* Delete Button for Patient Directory */}
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity 
                                                style={[localStyles.patientActionIcon, { backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]} 
                                                onPress={() => onDeletePatient && onDeletePatient(item.id)}
                                            >
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </FadeInUp>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );

    // --- Timeline / Rx Cards ---
    const handleDeleteVitalsEntry = (entryId) => {
        if (!selectedPatient || !onSaveVitals) return;

        Alert.alert('Delete Vitals', 'Are you sure you want to delete this vitals entry?',[
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    const updatedHistory = (selectedPatient.vitalsHistory || []).filter((v) => v.id !== entryId);
                    onSaveVitals(selectedPatient.id, updatedHistory);
                }
            }
        ]);
    };

    const renderTimelineEntry = (entry, index) => {
        const isVitals = entry.type === 'vitals';
        const item = entry.payload || {};
        const isLast = index === timeline.length - 1;

        return (
            <FadeInUp key={entry.id} delay={index * 120}>
                <View style={{ flexDirection: 'row', marginBottom: isLast ? 0 : 20 }}>
                    <View style={{ width: 44, alignItems: 'center' }}>
                        <LinearGradient
                            colors={isVitals ?['#38bdf8', '#0284c7'] :['#f472b6', '#db2777']}
                            style={localStyles.timelineIconContainer}
                        >
                            {isVitals ? <HeartPulse size={18} color="white" /> : <Clipboard size={18} color="white" />}
                        </LinearGradient>
                        {!isLast && <View style={[localStyles.timelineLine, { backgroundColor: theme.border }]} />}
                    </View>

                    <View style={[
                        localStyles.timelineCard, 
                        { borderColor: theme.border, backgroundColor: theme.cardBg },
                        !isVitals && { borderLeftWidth: 4, borderLeftColor: '#d946ef' },
                        isVitals && { borderLeftWidth: 4, borderLeftColor: '#0ea5e9' }
                    ]}>
                        <View style={localStyles.timelineCardHeader}>
                            <Text style={{ color: isVitals ? '#0284c7' : '#db2777', fontWeight: '800', fontSize: 14 }}>
                                {isVitals ? 'VITALS CAPTURED' : 'PRESCRIPTION (Rx)'}
                            </Text>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>
                                {formatDateTime(item.date)}
                            </Text>
                        </View>

                        {isVitals ? (
                            <View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    {item.sys && <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>BP: <Text style={{ color: '#0ea5e9' }}>{item.sys}/{item.dia || '-'}</Text></Text></View>}
                                    {item.pulse && <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Pulse: <Text style={{ color: '#0ea5e9' }}>{item.pulse}</Text></Text></View>}
                                    {item.spo2 && <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>SpO2: <Text style={{ color: '#0ea5e9' }}>{item.spo2}%</Text></Text></View>}
                                    {item.weight && <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Weight: <Text style={{ color: '#0ea5e9' }}>{item.weight}kg</Text></Text></View>}
                                    {item.temp && <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Temp: <Text style={{ color: '#0ea5e9' }}>{item.temp}°{item.tempUnit || 'C'}</Text></Text></View>}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
                                    {!!onSaveVitals && (
                                        <TouchableOpacity 
                                            style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]}
                                            onPress={() => handleDeleteVitalsEntry(item.id)}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                                    {item.diagnosis || 'General Diagnosis'}
                                </Text>
                                {normalizeNameList(item.procedures).length > 0 && (
                                    <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                        Procedures/Services: {normalizeNameList(item.procedures).join(', ')}
                                    </Text>
                                )}
                                {normalizeNameList(item.nextVisitInvestigations).length > 0 && (
                                    <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                        Investigation On Next Visit: {normalizeNameList(item.nextVisitInvestigations).join(', ')}
                                    </Text>
                                )}
                                {!!item.referral && (
                                    <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                                        Referral: {item.referral}
                                    </Text>
                                )}
                                {!!item.advice && (
                                    <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 6 }} numberOfLines={2}>
                                        Advice: {item.advice}
                                    </Text>
                                )}
                                {(item.medicines ||[]).length > 0 && (
                                    <View style={[localStyles.dataChip, { backgroundColor: theme.inputBg, borderColor: theme.border, alignSelf: 'flex-start' }]}>
                                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>
                                            💊 {item.medicines.length} Medicines Prescribed
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                                    <TouchableOpacity 
                                        style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#f1f5f9', paddingHorizontal: 16 }]}
                                        onPress={() => setPreviewRx(item)}
                                    >
                                        <Eye size={16} color={theme.primary} />
                                        <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '700', marginLeft: 6 }}>Open Rx View</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={{ flex: 1 }} />
                                    
                                    <TouchableOpacity 
                                        style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(234,179,8,0.1)' : '#fefce8' }]}
                                        onPress={() => onEditRx && onEditRx(selectedPatient.id, item)}
                                    >
                                        <Edit size={16} color="#eab308" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[localStyles.rxActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]}
                                        onPress={() => onDeleteRx && onDeleteRx(selectedPatient.id, item.id)}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </FadeInUp>
        );
    };

    const renderPatientDetail = () => {
        if (!selectedPatient) return null;

        const tabStyle = (tab) => ({
            flex: 1, alignItems: 'center', justifyContent: 'center',
            borderRadius: 14, paddingVertical: 14,
            backgroundColor: activeTab === tab ? theme.primary : 'transparent',
            shadowColor: activeTab === tab ? theme.primary : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: activeTab === tab ? 5 : 0
        });

        const vitalsList = timeline.filter(e => e.type === 'vitals');
        const rxList = timeline.filter(e => e.type === 'prescription');

        return (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
                <FadeInUp delay={100}>
                    <LinearGradient
                        colors={theme.mode === 'dark' ?['#1e293b', '#0f172a'] :['#ffffff', '#f8fafc']}
                        style={[localStyles.detailHeaderCard, { borderColor: theme.border }]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <LinearGradient
                                    colors={['#0ea5e9', '#6366f1']}
                                    style={localStyles.largeAvatar}
                                >
                                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>
                                        {getPatientLabel(selectedPatient.name)}
                                    </Text>
                                </LinearGradient>
                                <View style={{ marginLeft: 16, flex: 1, justifyContent: 'center' }}>
                                    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{selectedPatient.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                                        <Text style={{ color: theme.textDim, fontSize: 14, fontWeight: '600' }}>#{selectedPatient.id}</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 14 }}>•</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 14, fontWeight: '600' }}>{selectedPatient.age || '--'} yrs</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 14 }}>•</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 14, fontWeight: '600' }}>{selectedPatient.gender || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={generateAndSharePDF} 
                                disabled={isGeneratingPDF}
                                style={[localStyles.pdfBtn, { backgroundColor: theme.mode === 'dark' ? '#334155' : '#f1f5f9' }]}
                            >
                                <Download size={20} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity onPress={() => onOpenVitals?.(selectedPatient)} style={{ flex: 1 }}>
                                <LinearGradient colors={['#0284c7', '#0369a1']} style={localStyles.actionBtn}>
                                    <HeartPulse size={18} color="white" />
                                    <Text style={localStyles.actionBtnText}>Add Vitals</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onOpenPrescription?.(selectedPatient)} style={{ flex: 1 }}>
                                <LinearGradient colors={['#d946ef', '#a21caf']} style={localStyles.actionBtn}>
                                    <FilePlus size={18} color="white" />
                                    <Text style={localStyles.actionBtnText}>New Rx</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </FadeInUp>

                <FadeInUp delay={200}>
                    <View style={[localStyles.tabContainer, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                        <TouchableOpacity style={tabStyle('timeline')} onPress={() => setActiveTab('timeline')} activeOpacity={0.8}>
                            <Text style={{ color: activeTab === 'timeline' ? 'white' : theme.text, fontWeight: '700', fontSize: 14 }}>All History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={tabStyle('vitals')} onPress={() => setActiveTab('vitals')} activeOpacity={0.8}>
                            <Text style={{ color: activeTab === 'vitals' ? 'white' : theme.text, fontWeight: '700', fontSize: 14 }}>Vitals ({vitalsList.length})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={tabStyle('rx')} onPress={() => setActiveTab('rx')} activeOpacity={0.8}>
                            <Text style={{ color: activeTab === 'rx' ? 'white' : theme.text, fontWeight: '700', fontSize: 14 }}>Rx ({rxList.length})</Text>
                        </TouchableOpacity>
                    </View>
                </FadeInUp>

                <View style={{ marginTop: 16 }}>
                    {activeTab === 'timeline' && (
                        timeline.length > 0 
                            ? timeline.map((entry, idx) => renderTimelineEntry(entry, idx)) 
                            : <FadeInUp delay={300} style={localStyles.emptyStateContainer}>
                                  <ActivitySquare size={54} color={theme.border} />
                                  <Text style={[localStyles.emptyStateText, { color: theme.text }]}>No history yet.</Text>
                                  <Text style={[localStyles.emptyStateSub, { color: theme.textDim }]}>Add vitals or write a prescription to build the timeline.</Text>
                              </FadeInUp>
                    )}
                    
                    {activeTab === 'vitals' && (
                        vitalsList.length > 0 
                            ? vitalsList.map((entry, idx) => renderTimelineEntry(entry, idx)) 
                            : <FadeInUp delay={300} style={localStyles.emptyStateContainer}>
                                  <HeartPulse size={54} color={theme.border} />
                                  <Text style={[localStyles.emptyStateText, { color: theme.text }]}>No Vitals Recorded</Text>
                              </FadeInUp>
                    )}

                    {activeTab === 'rx' && (
                        rxList.length > 0 
                            ? rxList.map((entry, idx) => renderTimelineEntry(entry, idx)) 
                            : <FadeInUp delay={300} style={localStyles.emptyStateContainer}>
                                  <Clipboard size={54} color={theme.border} />
                                  <Text style={[localStyles.emptyStateText, { color: theme.text }]}>No Prescriptions Found</Text>
                              </FadeInUp>
                    )}
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={[propStyles?.container || localStyles.container, { backgroundColor: theme.bg }]}> 
            {/* Header */}
            <View style={[propStyles?.header || localStyles.header, { marginTop: insets.top + 10 }]}> 
                <TouchableOpacity onPress={handleBackPress} style={[propStyles?.iconBtn || localStyles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}> 
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 12, alignItems: 'center' }}>
                    <Text style={[propStyles?.headerTitle || localStyles.headerTitle, { color: theme.text }]}>
                        {selectedPatient ? 'Patient Record' : 'History & Records'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>
                        {selectedPatient ? 'Unified Rx and Vitals Timeline' : 'Search patients for past records'}
                    </Text>
                </View>
                <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <FileType size={24} color={theme.primary || '#0ea5e9'} />
                </View>
            </View>

            {/* Content Switcher */}
            {selectedPatient ? renderPatientDetail() : renderHistoryList()}

            {/* SweetAlert-style Confirm Share Modal */}
            <Modal
                visible={confirmShareVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!isGeneratingPDF) {
                        setConfirmShareVisible(false);
                        setConfirmShareRx(null);
                    }
                }}
            >
                <View style={localStyles.confirmOverlay}>
                    <View style={[localStyles.confirmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}> 
                        <Text style={[localStyles.confirmTitle, { color: theme.text }]}>Are you sure?</Text>
                        <Text style={[localStyles.confirmText, { color: theme.textDim }]}> 
                            You are about to share this patient's prescription PDF via WhatsApp.
                        </Text>
                        <View style={localStyles.confirmButtonsRow}>
                            <TouchableOpacity
                                style={[localStyles.confirmBtn, { backgroundColor: theme.mode === 'dark' ? '#4b5563' : '#f3f4f6' }]}
                                disabled={isGeneratingPDF}
                                onPress={() => {
                                    if (!isGeneratingPDF) {
                                        setConfirmShareVisible(false);
                                        setConfirmShareRx(null);
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={[localStyles.confirmBtnText, { color: theme.mode === 'dark' ? '#e5e7eb' : '#111827' }]}>No, cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.confirmBtn, { backgroundColor: '#25D366' }]}
                                disabled={isGeneratingPDF}
                                onPress={confirmShareWhatsappNow}
                                activeOpacity={0.8}
                            >
                                <Text style={[localStyles.confirmBtnText, { color: 'white' }]}>
                                    {isGeneratingPDF ? 'Preparing...' : 'Yes, share' }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* HIGH-END FULL SCREEN Rx PDF PREVIEW UI */}
            <Modal
                visible={!!previewRx}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setPreviewRx(null)}
            >
                <View style={[localStyles.fullScreenModal, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
                    
                    {/* Header for Document View */}
                    <View style={[localStyles.modalPageHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => setPreviewRx(null)} style={[localStyles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, letterSpacing: 0.5 }}>Rx Document Viewer</Text>
                            <Text style={{ fontSize: 13, color: theme.textDim, marginTop: 4 }}>Exact A4 Scale Rendering</Text>
                        </View>
                        <View style={{ width: 48 }} />
                    </View>
                    
                    {/* Immersive WebView Area */}
                    <View style={[localStyles.modalBodyFull, { backgroundColor: theme.mode === 'dark' ? '#0b1220' : '#cbd5e1' }]}>
                        {previewRx && (
                            <WebView 
                                originWhitelist={['*']} 
                                source={{ html: getPrescriptionHTML(previewRx) }} 
                                style={{ flex: 1, backgroundColor: 'transparent' }} 
                                showsVerticalScrollIndicator={false}
                                javaScriptEnabled={true}
                            />
                        )}
                    </View>

                    {/* Large, Responsive Bottom Action Bar */}
                    <View style={[localStyles.largeBottomBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border, paddingBottom: insets.bottom + 16 }]}>
                        
                        <TouchableOpacity 
                            style={[localStyles.largeActionCard, { backgroundColor: '#25D366' }]}
                            onPress={() => handleShareWhatsapp(previewRx)}
                            activeOpacity={0.8}
                        >
                            <Share2 size={26} color="white" />
                            <Text style={localStyles.largeActionText}>Share Rx</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[localStyles.largeActionCard, { backgroundColor: '#009b8e' }]}
                            onPress={() => handleDownloadRxPDF(previewRx)}
                            activeOpacity={0.8}
                        >
                            <Download size={26} color="white" />
                            <Text style={localStyles.largeActionText}>Save PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[localStyles.largeActionCard, { backgroundColor: '#4f46e5' }]}
                            onPress={() => handlePrintRx(previewRx)}
                            activeOpacity={0.8}
                        >
                            <Printer size={26} color="white" />
                            <Text style={localStyles.largeActionText}>Print Rx</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- High-End Styling ---
const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    iconBtn: {
        width: 48, height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '900',
    },
    searchBar: {
        height: 58,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    patientCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    patientActionIcon: {
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 60, height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    largeAvatar: {
        width: 68, height: 68,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    badge: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailHeaderCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
    },
    actionBtn: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    pdfBtn: {
        width: 48, height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContainer: {
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: 'row',
        padding: 6,
        marginBottom: 24,
    },
    switchTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 14,
    },
    timelineIconContainer: {
        width: 38, height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    timelineLine: {
        width: 3,
        flex: 1,
        marginTop: -6,
        marginBottom: -26,
        zIndex: 1,
        borderRadius: 2,
    },
    timelineCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 22,
        padding: 18,
        marginLeft: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.15)',
        paddingBottom: 10,
    },
    dataChip: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 20,
    },
    emptyStateSub: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptySearchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 30,
        marginTop: 20,
    },
    emptySearchCircle: {
        width: 80, height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptySearchTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    emptySearchSub: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    clearSearchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 999,
        marginTop: 24,
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    rxActionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // --- Full Screen Document Viewer Styles ---
    fullScreenModal: {
        flex: 1,
    },
    modalPageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    modalBodyFull: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    largeBottomBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 16,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
    },
    largeActionCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    largeActionText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
        marginTop: 10,
        letterSpacing: 0.5,
    },

    // SweetAlert-style confirmation modal
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    confirmCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 10,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    confirmButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '800',
    },
});