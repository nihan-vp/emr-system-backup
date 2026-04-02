// Define a new modern theme for the medical UI
const modernTheme = {
  colors: {
    primary: '#4CAF50', // Green for primary actions
    secondary: '#FFC107', // Amber for highlights
    background: '#F5F5F5', // Light gray for backgrounds
    textPrimary: '#212121', // Dark gray for primary text
    textSecondary: '#757575', // Medium gray for secondary text
    error: '#F44336', // Red for errors
    success: '#4CAF50', // Green for success messages
    warning: '#FF9800', // Orange for warnings
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: {
      small: '12px',
      medium: '16px',
      large: '20px',
    },
    fontWeight: {
      regular: 400,
      bold: 700,
    },
  },
  spacing: (factor) => `${factor * 8}px`, // 8px spacing scale
};

export default modernTheme;