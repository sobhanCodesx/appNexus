import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api';
import { getInstallationId } from '@/services/installation';
import {
  type DevicePushTokenLike,
  getPushRegistration,
} from '@/services/notifications';
import { isExpoGo } from '@/services/runtime';

export async function registerNativePushDevice(
  devicePushToken?: DevicePushTokenLike,
) {
  const registration = await getPushRegistration(devicePushToken);
  if (!registration) return false;

  await apiRequest('/devices', {
    method: 'PUT',
    body: JSON.stringify({
      installation_id: await getInstallationId(),
      push_token: registration.token,
      push_provider: registration.provider,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      device_name: Device.modelName || Device.deviceName || 'PlayNexus Device',
      app_version: Application.nativeApplicationVersion || '1.0.0',
    }),
  });

  return true;
}

export async function subscribeToNativePushTokenChanges() {
  if (isExpoGo()) return null;

  const Notifications = await import('expo-notifications');

  return Notifications.addPushTokenListener((devicePushToken) => {
    void registerNativePushDevice(devicePushToken).catch(() => false);
  });
}
