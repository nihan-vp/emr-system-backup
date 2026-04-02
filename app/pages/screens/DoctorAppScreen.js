import React from 'react';
import { ClinicDashboardRoot } from '../ClinicDashboardPage';

/**
 * Stack screen name: "Doctor"
 * Renders the full doctor clinic app (DashboardHomeScreen inside MainApp). Logout returns to root Login.
 * SafeAreaProvider is provided by root App.js.
 */
export default function DoctorAppScreen({ navigation }) {
  return <ClinicDashboardRoot onLogout={() => navigation.replace('Login')} />;
}
