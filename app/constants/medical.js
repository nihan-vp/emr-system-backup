import {
    Activity,
    Droplet,
    FlaskConical,
    HeartPulse,
    Layers,
    Package,
    Pill,
    Sparkles,
    Stethoscope,
    Syringe,
    TestTube
} from 'lucide-react-native';

export const INITIAL_FORM_STATE = {
    name: '',
    mobile: '',
    email: '',
    age: '',
    gender: 'M',
    address: '',
    blood: 'O+',
    customBlood: '',
    date: 'Today',
    time: '09:00 AM',
    notes: '',
    isFollowUp: false,
    followUpDate: 'Next Week',
    dateObj: new Date(),
    timeObj: new Date(),
    followUpObj: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    dob: '',
    dobObj: new Date(),
    sys: '',
    dia: '',
    pulse: '',
    spo2: '',
    weight: '',
    temp: '',
    tempUnit: 'C',
    height: '',
    bmi: '',
    resp: '',
    grbs: '',
    fbs: '',
    rbs: '',
    hb: '',
    pain: ''
};

export const PROCEDURE_CATEGORIES = [
    { label: 'General', value: 'General', color: '#3b82f6', bg: '#eff6ff', icon: Stethoscope },
    { label: 'Dental', value: 'Dental', color: '#06b6d4', bg: '#ecfeff', icon: Sparkles },
    { label: 'Surgery', value: 'Surgery', color: '#ef4444', bg: '#fef2f2', icon: Activity },
    { label: 'Lab Test', value: 'Lab', color: '#8b5cf6', bg: '#f5f3ff', icon: TestTube },
    { label: 'Therapy', value: 'Therapy', color: '#10b981', bg: '#ecfdf5', icon: HeartPulse },
    { label: 'Other', value: 'Other', color: '#64748b', bg: '#f1f5f9', icon: Layers }
];

export const MEDICINE_CATEGORIES = [
    { label: 'Tablet', value: 'Tablet', color: '#3b82f6', bg: '#eff6ff', icon: Pill },
    { label: 'Capsule', value: 'Capsule', color: '#8b5cf6', bg: '#f5f3ff', icon: Pill },
    { label: 'Syrup', value: 'Syrup', color: '#ec4899', bg: '#fdf2f8', icon: FlaskConical },
    { label: 'Injection', value: 'Injection', color: '#ef4444', bg: '#fef2f2', icon: Syringe },
    { label: 'Cream', value: 'Cream', color: '#f59e0b', bg: '#fffbeb', icon: Droplet },
    { label: 'Drops', value: 'Drops', color: '#06b6d4', bg: '#ecfeff', icon: Droplet },
    { label: 'Other', value: 'Other', color: '#64748b', bg: '#f1f5f9', icon: Package }
];

export const BLOOD_GROUPS = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'Custom / Other', value: 'Custom' }
];

export const FREQUENCIES_INIT = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', '0-1-0', 'SOS', 'Once a week', '1-1-1-1'];
export const DURATIONS_INIT = ['3 Days', '5 Days', '7 Days', '10 Days', '15 Days', '1 Month', 'Continue', '2 Weeks'];
export const INSTRUCTIONS_INIT = ['After Food', 'Before Food', 'With Food', 'At Night', 'Empty Stomach'];
export const DOSAGES_INIT = ['1 Unit', '1/2 Unit', '2 Units', '1 Tablet', '1/2 Tablet', '5 ml', '10 ml', '15 ml', '1 Drop', '2 Drops', '1 Puff'];
