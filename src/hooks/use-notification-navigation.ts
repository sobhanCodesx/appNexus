import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { nativeHrefFromUrl } from '@/services/native-navigation';
import { notificationUrl } from '@/services/notifications';
import { isExpoGo } from '@/services/runtime';

type RemovableSubscription = {
  remove: () => void;
};

export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let notificationSubscription: RemovableSubscription | null = null;

    const navigate = (value?: string | null) => {
      const href = nativeHrefFromUrl(value);
      if (href) router.push(href);
    };

    if (!isExpoGo()) {
      void import('expo-notifications')
        .then((Notifications) => {
          if (disposed) return;

          notificationSubscription =
            Notifications.addNotificationResponseReceivedListener(
              (response) => {
                navigate(notificationUrl(response.notification));
              },
            );

          void Notifications.getLastNotificationResponseAsync()
            .then((response) => {
              if (!disposed && response) {
                navigate(notificationUrl(response.notification));
              }
            })
            .catch(() => undefined);
        })
        .catch(() => undefined);
    }

    const linkingSubscription = Linking.addEventListener(
      'url',
      ({ url }) => {
        const parsed = Linking.parse(url);
        const nested = typeof parsed.queryParams?.url === 'string'
          ? parsed.queryParams.url
          : url;

        navigate(nested);
      },
    );

    return () => {
      disposed = true;
      notificationSubscription?.remove();
      linkingSubscription.remove();
    };
  }, [router]);
}
