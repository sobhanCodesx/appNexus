import Constants from 'expo-constants';
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

  return (
    await Notifications.getExpoPushTokenAsync({
      projectId,
      ...(devicePushToken ? { devicePushToken } : {}),
    })
  ).data;
}

export function notificationUrl(notification: Notifications.Notification): string | null {
  const url = notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}
