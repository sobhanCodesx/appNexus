import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { nativeHrefFromUrl } from '@/services/native-navigation';
import { notificationUrl } from '@/services/notifications';

export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    const navigate = (value?: string | null) => {
      const href = nativeHrefFromUrl(value);
      if (href) router.push(href);
    };

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigate(notificationUrl(response.notification));
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigate(notificationUrl(response.notification));
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      const nested = typeof parsed.queryParams?.url === 'string'
        ? parsed.queryParams.url
        : url;
      navigate(nested);
    });

    return () => {
      notificationSubscription.remove();
      linkingSubscription.remove();
    };
  }, [router]);
}
