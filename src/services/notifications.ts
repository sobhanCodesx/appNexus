import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isExpoGo } from '@/services/runtime';

export type PushRegistration = {
  token: string;
  provider: 'fcm' | 'apns';
};

export type DevicePushTokenLike = {
  data?: unknown;
};

export type NotificationLike = {
  request?: {
    identifier?: string;
    content?: {
      title?: string | null;
      body?: string | null;
      data?: Record<string, unknown>;
    };
  };
};

let handlerConfigured = false;
let androidChannelConfigured = false;

export async function configureNativeNotifications() {
  if (isExpoGo()) return false;

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

  if (Platform.OS === 'android' && !androidChannelConfigured) {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'اعلان‌های PlayNexus',
      description: 'اعلان‌های حساب، محتوا، سفارش و پشتیبانی PlayNexus',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#208AEF',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    androidChannelConfigured = true;
  }

  return true;
}

export async function getPushRegistration(
  devicePushToken?: DevicePushTokenLike,
): Promise<PushRegistration | null> {
  if (isExpoGo() || !Device.isDevice) return null;

  await configureNativeNotifications();
  const Notifications = await import('expo-notifications');

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

export function notificationSummary(notification: NotificationLike) {
  const content = notification.request?.content;

  return {
    id: notification.request?.identifier || String(Date.now()),
    title: content?.title || 'PlayNexus',
    body: content?.body || '',
    url: notificationUrl(notification),
  };
}
