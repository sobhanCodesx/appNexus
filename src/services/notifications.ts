import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistration = {
  token: string;
  provider: 'fcm' | 'apns';
};

export async function getPushRegistration(
  devicePushToken?: Notifications.DevicePushToken,
): Promise<PushRegistration | null> {
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

  const nativeToken = devicePushToken ?? (await Notifications.getDevicePushTokenAsync());
  if (typeof nativeToken.data !== 'string' || nativeToken.data.trim() === '') {
    throw new Error('Native push token is unavailable on this device.');
  }

  return {
    token: nativeToken.data,
    provider: Platform.OS === 'android' ? 'fcm' : 'apns',
  };
}

export function notificationUrl(notification: Notifications.Notification): string | null {
  const url = notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}
