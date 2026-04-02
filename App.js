import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './app/pages/screens/LoginScreen';
import DoctorAppScreen from './app/pages/screens/DoctorAppScreen';
import NurseDashboard from './app/pages/screens/NurseDashboard';
import LabDashboard from './app/pages/screens/LabDashboard';
import PharmacyDashboard from './app/pages/screens/PharmacyDashboard';

/**
 * Route names MUST stay exactly: Login, Doctor, Nurse, Lab, Pharmacy
 * so navigation.replace('Doctor') etc. always resolve.
 */
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Doctor" component={DoctorAppScreen} />
            <Stack.Screen name="Nurse" component={NurseDashboard} />
            <Stack.Screen name="Lab" component={LabDashboard} />
            <Stack.Screen name="Pharmacy" component={PharmacyDashboard} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
