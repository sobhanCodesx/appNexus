import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamily, palette, radii, shadow, spacing } from '@/design';
import { nativeHrefFromUrl } from '@/services/native-navigation';
import {
  configureNativeNotifications,
  notificationSummary,
} from '@/services/notifications';
import { invalidateResource } from '@/services/resource-cache';
import { isExpoGo } from '@/services/runtime';

type Signal = {
  id: string;
  title: string;
  body: string;
  url: string | null;
};

type RemovableSubscription = {
  remove: () => void;
};

export function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signal, setSignal] = useState<Signal | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSignal(null);
    });
  }, [clearTimer, progress]);

  const show = useCallback((next: Signal) => {
    clearTimer();
    setSignal(next);
    progress.stopAnimation();
    progress.setValue(0);

    Animated.spring(progress, {
      toValue: 1,
      damping: 18,
      stiffness: 210,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    dismissTimer.current = setTimeout(hide, 6200);
  }, [clearTimer, hide, progress]);

  useEffect(() => {
    if (isExpoGo()) return;

    let disposed = false;
    let subscription: RemovableSubscription | null = null;

    void configureNativeNotifications()
      .then(async () => {
        if (disposed) return;

        const Notifications = await import('expo-notifications');
        if (disposed) return;

        subscription = Notifications.addNotificationReceivedListener((notification) => {
          const summary = notificationSummary(notification);
          invalidateResource('/notifications');
          invalidateResource('/me');
          show(summary);
        });
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      subscription?.remove();
      clearTimer();
    };
  }, [clearTimer, show]);

  if (!signal) return null;

  const open = () => {
    const href = nativeHrefFromUrl(signal.url);
    hide();
    router.push(href || '/notifications');
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          top: insets.top + 8,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-26, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={signal.title}
        onPress={open}
        style={styles.card}>
        <BlurView intensity={84} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.edgeGlow} />

        <View style={styles.iconShell}>
          <View style={styles.iconCore} />
          <View style={styles.iconRing} />
        </View>

        <View style={styles.copy}>
          <View style={styles.kickerRow}>
            <View style={styles.liveDot} />
            <Text style={styles.kicker}>NEXUS SIGNAL</Text>
          </View>
          <Text numberOfLines={1} style={styles.title}>{signal.title}</Text>
          {signal.body ? (
            <Text numberOfLines={2} style={styles.body}>{signal.body}</Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="بستن اعلان"
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            hide();
          }}
          style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    elevation: 30,
  },
  card: {
    minHeight: 92,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.22)',
    backgroundColor: 'rgba(7,11,18,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...shadow.card,
  },
  edgeGlow: {
    position: 'absolute',
    top: 0,
    left: 26,
    right: 26,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.72)',
  },
  iconShell: {
    width: 48,
    height: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.26)',
    backgroundColor: 'rgba(88,244,255,0.075)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  iconRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
  },
  copy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  kickerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  kicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 3,
  },
  body: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'right',
    marginTop: 1,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  closeText: {
    color: palette.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 22,
  },
});
