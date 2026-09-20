import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isExpoGo } from '@/services/runtime';

export type PushRegistration = {
  token: string;
  provider: 'fcm' | 'apns';
};

type DevicePushTokenLike = {
  data?: unknown;
};

type NotificationLike = {
  request?: {
    content?: {
      data?: Record<string, unknown>;
    };
  };
};

let handlerConfigured = false;

export async function getPushRegistration(
  devicePushToken?: DevicePushTokenLike,
): Promise<PushRegistration | null> {
  if (isExpoGo() || !Device.isDevice) return null;

  const Notifications = await import('expo-notifications');

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

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
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();

  if (!permission.granted) return null;

  const nativeToken = devicePushToken
    ?? await Notifications.getDevicePushTokenAsync();

  if (
    typeof nativeToken.data !== 'string'
    || nativeToken.data.trim() === ''
  ) {
    throw new Error(
      'Native push token is unavailable on this device.',
    );
  }

  return {
    token: nativeToken.data,
    provider: Platform.OS === 'android' ? 'fcm' : 'apns',
  };
}

export function notificationUrl(
  notification: NotificationLike,
): string | null {
  const url = notification.request?.content?.data?.url;
  return typeof url === 'string' ? url : null;
}
