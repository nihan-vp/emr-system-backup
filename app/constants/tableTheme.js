export const getMedicalTableTheme = (theme) => ({
    shellColors: theme.mode === 'dark'
        ? ['rgba(13,148,136,0.28)', 'rgba(15,23,42,0.96)']
        : ['#ecfeff', '#f8fafc'],
    headerColors: theme.mode === 'dark'
        ? ['rgba(20,184,166,0.38)', 'rgba(14,116,144,0.2)']
        : ['#14b8a6', '#0ea5e9'],
    headerText: theme.mode === 'dark' ? '#ccfbf1' : '#f0fdfa',
    outline: theme.mode === 'dark' ? 'rgba(45,212,191,0.3)' : '#99f6e4',
    rowEven: theme.mode === 'dark' ? 'rgba(15,23,42,0.9)' : '#ffffff',
    rowOdd: theme.mode === 'dark' ? 'rgba(15,118,110,0.12)' : '#f0fdfa',
    rowBorder: theme.mode === 'dark' ? 'rgba(148,163,184,0.18)' : '#d1fae5',
    statBg: theme.mode === 'dark' ? 'rgba(8,47,73,0.35)' : '#ecfeff',
    accentBg: theme.mode === 'dark' ? 'rgba(13,148,136,0.18)' : '#ccfbf1',
    accentText: theme.mode === 'dark' ? '#5eead4' : '#0f766e',
    viewActionBg: theme.mode === 'dark' ? 'rgba(14,165,233,0.18)' : '#e0f2fe',
    viewActionText: theme.mode === 'dark' ? '#7dd3fc' : '#0369a1',
    editActionBg: theme.mode === 'dark' ? 'rgba(16,185,129,0.16)' : '#dcfce7',
    editActionText: theme.mode === 'dark' ? '#6ee7b7' : '#15803d',
    deleteActionBg: theme.mode === 'dark' ? 'rgba(239,68,68,0.18)' : '#fee2e2',
    deleteActionText: '#dc2626',
    footerHint: theme.mode === 'dark' ? '#99f6e4' : '#0f766e'
});

export const getMedicalModalTheme = (theme) => ({
    overlay: theme.mode === 'dark' ? 'rgba(2,6,23,0.82)' : 'rgba(15,23,42,0.42)',
    shellColors: theme.mode === 'dark'
        ? ['rgba(20,184,166,0.28)', 'rgba(15,23,42,0.98)']
        : ['#ecfeff', '#f8fafc'],
    shellBorder: theme.mode === 'dark' ? 'rgba(45,212,191,0.28)' : '#99f6e4',
    surface: theme.mode === 'dark' ? '#0f172a' : '#ffffff',
    sectionBg: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    sectionBorder: theme.mode === 'dark' ? 'rgba(148,163,184,0.16)' : '#dbeafe',
    headerColors: theme.mode === 'dark' ? ['#14b8a6', '#0ea5e9'] : ['#14b8a6', '#0284c7'],
    headerText: '#f0fdfa',
    eyebrowText: theme.mode === 'dark' ? '#ccfbf1' : 'rgba(255,255,255,0.88)',
    iconBg: 'rgba(255,255,255,0.18)',
    closeBg: 'rgba(255,255,255,0.18)',
    closeIcon: '#ffffff',
    chipBg: theme.mode === 'dark' ? 'rgba(45,212,191,0.16)' : '#ccfbf1',
    chipText: theme.mode === 'dark' ? '#99f6e4' : '#0f766e',
    subtleText: theme.mode === 'dark' ? '#94a3b8' : '#475569',
    titleText: theme.text,
    cancelBg: theme.mode === 'dark' ? 'rgba(148,163,184,0.16)' : '#e2e8f0',
    cancelText: theme.mode === 'dark' ? '#e2e8f0' : '#334155',
    primaryButton: [theme.primary, theme.primaryDark],
    infoBg: theme.mode === 'dark' ? 'rgba(45,212,191,0.12)' : '#f0fdfa',
    infoBorder: theme.mode === 'dark' ? 'rgba(45,212,191,0.2)' : '#99f6e4'
});