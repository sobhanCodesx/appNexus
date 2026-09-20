import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api';
import { getInstallationId } from '@/services/installation';
import { getPushRegistration } from '@/services/notifications';

export async function registerNativePushDevice() {
  const registration = await getPushRegistration();
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
