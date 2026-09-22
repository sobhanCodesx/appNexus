import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, shadow } from '@/design';
import {
  apiRequest,
  getAccessToken,
  subscribeToAccessTokenChanges,
} from '@/services/api';
import { subscribeToNotificationState } from '@/services/notification-state';
import type { ProfilePayload } from '@/types/api';

export function GlobalNotificationCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [authenticated, setAuthenticated] = useState(false);
  const [unread, setUnread] = useState(0);

  const sync = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setAuthenticated(false);
      setUnread(0);
      return;
    }

    setAuthenticated(true);

    try {
      const payload = await apiRequest<ProfilePayload>('/me');
      setUnread(Math.max(0, payload.unread_notifications_count || 0));
    } catch {
      const currentToken = await getAccessToken();
      if (!currentToken) {
        setAuthenticated(false);
        setUnread(0);
      }
    }
  }, []);

  useEffect(() => {
    const routeSync = setTimeout(() => {
      void sync();
    }, 0);

    return () => clearTimeout(routeSync);
  }, [pathname, sync]);

  useEffect(() => {
    const unsubscribeToken = subscribeToAccessTokenChanges((token) => {
      if (!token) {
        setAuthenticated(false);
        setUnread(0);
        return;
      }

      setAuthenticated(true);
      void sync();
    });

    const unsubscribeNotifications = subscribeToNotificationState(() => {
      void sync();
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });

    const timer = setInterval(() => {
      void sync();
    }, 45_000);

    return () => {
      unsubscribeToken();
      unsubscribeNotifications();
      appStateSubscription.remove();
      clearInterval(timer);
    };
  }, [sync]);

  if (!authenticated) return null;

  const badge = unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR');

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: Math.max(insets.bottom + 86, 98),
        },
      ]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={unread ? `${badge} اعلان خوانده‌نشده` : 'اعلان‌ها'}
        onPress={() => {
          if (pathname !== '/notifications') router.push('/notifications');
        }}
        style={styles.orbShell}>
        <View style={[styles.orb, pathname === '/notifications' && styles.orbActive]}>
          <BlurView intensity={88} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.halo} />
          <View style={styles.bell}>
            <View style={styles.bellDome} />
            <View style={styles.bellBase} />
            <View style={styles.bellDot} />
          </View>
        </View>

        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : (
          <View style={styles.onlineDot} />
        )}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    right: 14,
    zIndex: 900,
    elevation: 24,
  },
  orbShell: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 54,
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.23)',
    backgroundColor: 'rgba(7,11,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cyanGlow,
  },
  orbActive: {
    borderColor: 'rgba(88,244,255,0.56)',
    backgroundColor: 'rgba(88,244,255,0.08)',
  },
  halo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.10)',
  },
  bell: {
    width: 24,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDome: {
    width: 16,
    height: 15,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1.8,
    borderColor: palette.white,
    borderBottomWidth: 0,
    marginTop: 2,
  },
  bellBase: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.white,
    marginTop: -1,
  },
  bellDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.cyan,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: palette.magenta,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 30,
    ...shadow.soft,
  },
  badgeText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 10,
    lineHeight: 13,
  },
  onlineDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
    borderWidth: 1,
    borderColor: palette.ink,
  },
});
