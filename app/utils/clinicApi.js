import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const stripTrailingSlash = (value) => value.replace(/\/$/, '');

const resolveHostUri = () => {
  return (
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    ''
  );
};

export const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredUrl) {
    return stripTrailingSlash(configuredUrl);
  }

  const hostUri = resolveHostUri();
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }

  return 'http://127.0.0.1:4000/api';
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000
});

export const fetchClinicState = async () => {
  const response = await apiClient.get('/state');
  return response.data.data;
};

export const replaceClinicCollection = async (collection, items) => {
  const response = await apiClient.put(`/state/${collection}`, { items });
  return response.data.data;
};