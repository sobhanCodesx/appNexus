import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { type Href, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavGlyph } from '@/components/ui/nav-glyph';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, layout, palette, radii, shadow } from '@/design';
import { apiRequest, getAccessToken } from '@/services/api';
import { getAppMeta, type MobileAppMeta } from '@/services/app-meta';
import type { ProfilePayload } from '@/types/api';

type DockItem = {
  key: 'home' | 'radar' | 'ai' | 'explore' | 'video' | 'profile';
  label: string;
  href: Href;
};

function isHidden(pathname: string) {
  return pathname.startsWith('/auth')
    || pathname.startsWith('/onboarding')
    || pathname.startsWith('/stories')
    || pathname.startsWith('/shorts')
    || pathname.startsWith('/nexus-ai');
}

function isActive(pathname: string, key: DockItem['key']) {
  if (key === 'home') return pathname === '/' || pathname === '/index';
  if (key === 'radar') return pathname.startsWith('/radar');
  if (key === 'ai') return pathname.startsWith('/nexus-ai');
  if (key === 'explore') return pathname.startsWith('/explore');
  if (key === 'video') return pathname.startsWith('/videos');
  return pathname.startsWith('/profile');
}

export function GlobalAppDock() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<{
    loggedIn: boolean;
    avatar?: string | null;
    name?: string | null;
  }>({ loggedIn: false });
  const [nexusAi, setNexusAi] = useState<MobileAppMeta['nexus_ai']>();

  useEffect(() => {
    let alive = true;
    void getAppMeta(true)
      .then((meta) => {
        if (alive) setNexusAi(meta.nexus_ai);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const token = await getAccessToken();
      if (!mounted) return;
      if (!token) {
        setProfile({ loggedIn: false });
        return;
      }      try {
        const payload = await apiRequest<ProfilePayload>('/me');
        if (!mounted) return;
        setProfile({
          loggedIn: true,
          avatar: payload.profile.avatar_url,
          name: payload.profile.name,
        });
      } catch {
        if (mounted) setProfile({ loggedIn: false });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (isHidden(pathname)) return null;

  const bottom = Math.max(
    Platform.OS === 'android' ? 8 : 6,
    insets.bottom + (Platform.OS === 'android' ? 8 : 6),
  );

  const showNexusAi = Boolean(
    nexusAi?.enabled && nexusAi?.page_enabled && nexusAi?.show_in_nav,
  );
  const items: DockItem[] = [
    { key: 'home', label: 'خانه', href: '/(tabs)' },
    showNexusAi
      ? { key: 'ai', label: nexusAi?.nav_label || 'Nexus AI', href: '/nexus-ai' as Href }
      : { key: 'radar', label: 'رادار', href: '/(tabs)/radar' },
    { key: 'explore', label: 'کشف', href: '/(tabs)/explore' },
    { key: 'video', label: 'ویدیو', href: '/(tabs)/videos' },
    { key: 'profile', label: 'من', href: '/(tabs)/profile' },
  ];

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom }]}>
      <View style={styles.dock}>
        <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glow} />
        <View style={styles.hairline} />

        {items.map((item) => {
          const active = isActive(pathname, item.key);
          return (
            <PressableScale
              key={item.key}
              haptic={false}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                void Haptics.selectionAsync();
                router.navigate(item.href);
              }}
              style={[styles.item, active && styles.itemActive]}>              {item.key === 'profile' && profile.loggedIn ? (
                <ProfileAvatar
                  uri={profile.avatar}
                  name={profile.name}
                  active={active}
                />
              ) : (
                <NavGlyph name={item.key} active={active} />
              )}
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function ProfileAvatar({
  uri,
  name,
  active,
}: {
  uri?: string | null;
  name?: string | null;
  active: boolean;
}) {
  const initial = (name || 'P').trim().slice(0, 1).toUpperCase();

  return (
    <View style={[styles.avatarShell, active && styles.avatarShellActive]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.onlineDot} />
    </View>
  );
}const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 820,
    elevation: 22,
  },
  dock: {
    height: layout.tabBarHeight - 4,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.135)',
    backgroundColor: Platform.OS === 'android'
      ? 'rgba(7,11,18,0.96)'
      : 'transparent',
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: 4,
    ...shadow.soft,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 64,
    borderRadius: 90,
    alignSelf: 'center',
    top: -36,
    backgroundColor: 'rgba(24,124,255,0.08)',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.22)',
  },  item: {
    flex: 1,
    marginVertical: 5,
    marginHorizontal: 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  itemActive: {
    backgroundColor: 'rgba(88,244,255,0.065)',
  },
  label: {
    color: palette.textDim,
    fontSize: 9,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  labelActive: {
    color: palette.cyan,
  },
  avatarShell: {
    width: 31,
    height: 31,
    borderRadius: 12,
    padding: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  avatarShellActive: {
    borderColor: 'rgba(88,244,255,0.55)',
    backgroundColor: 'rgba(88,244,255,0.08)',
    ...shadow.cyanGlow,
  },  avatar: {
    flex: 1,
    borderRadius: 10,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(24,124,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 12,
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.success,
    borderWidth: 1.5,
    borderColor: 'rgba(7,11,18,0.96)',
  },
});