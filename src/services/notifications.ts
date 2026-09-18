import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PLAYNEXUS_URL } from '@/config/app';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getPushToken(
  devicePushToken?: Notifications.DevicePushToken,
): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'اعلان‌های PlayNexus',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#208AEF',
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('EAS projectId is not configured. Link this app to an EAS project first.');
  }

  const options = {
    projectId,
    ...(devicePushToken ? { devicePushToken } : {}),
  };

  const proxyUrl = new URL('/api/mobile/push/expo-token', PLAYNEXUS_URL).toString();

  try {
    return (
      await Notifications.getExpoPushTokenAsync({
        ...options,
        url: proxyUrl,
      })
    ).data;
  } catch (proxyError) {
    console.warn('PlayNexus push token proxy failed; trying Expo directly:', proxyError);

    return (await Notifications.getExpoPushTokenAsync(options)).data;
  }
}

export function notificationUrl(notification: Notifications.Notification): string | null {
  const url = notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}
