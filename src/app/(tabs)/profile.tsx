import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import {
  fontFamily,
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { apiRequest, getAccessToken, setAccessToken } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import { registerNativePushDevice } from '@/services/push';
import type { ProfilePayload } from '@/types/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await getAccessToken();
      if (!token) {
        setGuest(true);
        return;
      }

      try {
        setProfile(await apiRequest<ProfilePayload>('/me'));
      } catch {
        setGuest(true);
      }
    })();
  }, []);

  if (guest) {
    return <GuestProfile />;
  }

  const user = profile?.profile;

  return (
    <Screen>
      <PageHeader
        title="Player Hub"
        subtitle="YOUR PLAYNEXUS ID"
        avatarUrl={user?.avatar_url}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.playerCard}>
          <LinearGradient
            colors={[
              'rgba(24,124,255,0.14)',
              'rgba(167,123,255,0.08)',
              'rgba(8,14,23,0.90)',
            ]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.cardSignalTop} />

          <View style={styles.playerTop}>
            <View style={styles.playerMetaBlock}>
              <Text style={styles.playerLabel}>PLAYER ID</Text>
              <Text style={styles.playerName}>{user?.name || 'PlayNexus Gamer'}</Text>
              <Text style={styles.playerIdentity}>
                {user?.email || user?.phone || 'PlayNexus ID'}
              </Text>
            </View>

            <View style={styles.avatarShell}>
              <View style={styles.avatarHalo} />
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <View style={styles.avatarFallbackCore} />
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>
          </View>

          <View style={styles.profileProgress}>
            <View style={styles.progressCopy}>
              <Text style={styles.progressLabel}>PROFILE SYNC</Text>
              <Text style={styles.progressValue}>
                {(profile?.profile_completion || 0).toLocaleString('fa-IR')}٪
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: (Math.max(5, Math.min(100, profile?.profile_completion || 0)) + '%') as `${number}%` },
                ]}
              />
            </View>
          </View>

          <Text style={styles.cardSerial}>
            PN // {String(user?.id || 0).padStart(6, '0')}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <Stat
            kicker="WALLET"
            label="کیف پول"
            value={(profile?.wallet_balance || 0).toLocaleString('fa-IR')}
            suffix="تومان"
            tone="cyan"
          />
          <Stat
            kicker="SIGNALS"
            label="اعلان جدید"
            value={String(profile?.unread_notifications_count || 0)}
            tone="violet"
          />
          <Stat
            kicker="ORDERS"
            label="سفارش‌ها"
            value={String(
              Object.values(profile?.order_status_counts || {})
                .reduce((sum, count) => sum + count, 0),
            )}
            tone="blue"
          />
        </View>

        <HubSection
          kicker="YOUR LIBRARY"
          title="فضای شخصی"
          items={[
            {
              symbol: '◇',
              title: 'ذخیره‌شده‌ها',
              caption: 'محتوایی که برای بعد نگه داشتی',
              onPress: () => router.push('/saved'),
            },
            {
              symbol: '▣',
              title: 'سفارش‌ها',
              caption: 'وضعیت خریدها و سفارش‌های قبلی',
              onPress: () => router.push('/orders'),
            },
            {
              symbol: '⌂',
              title: 'آدرس‌ها',
              caption: 'مدیریت مقصدهای تحویل',
              onPress: () => router.push('/addresses'),
            },
          ]}
        />

        <HubSection
          kicker="NEXUS SERVICES"
          title="PlayNexus"
          items={[
            {
              symbol: '◫',
              title: 'فروشگاه',
              caption: 'محصولات، تخفیف‌ها و معاوضه',
              onPress: () => router.push('/store'),
            },
            {
              symbol: '◌',
              title: 'اعلان‌ها',
              caption: 'سیگنال‌های مهم بازی‌ها و سفارش‌ها',
              onPress: () => router.push('/notifications'),
            },
            {
              symbol: '⌁',
              title: 'فعال‌سازی Push',
              caption: 'اعلان native روی همین دستگاه',
              onPress: () => void registerNativePushDevice(),
            },
            {
              symbol: '?',
              title: 'پشتیبانی',
              caption: 'تیکت‌ها و گفتگو با PlayNexus',
              onPress: () => router.push('/tickets'),
            },
          ]}
        />

        <View style={styles.dangerZone}>
          <Text style={styles.dangerKicker}>SESSION</Text>
          <PressableScale
            style={styles.logout}
            onPress={() => void (async () => {
              try {
                await apiRequest('/auth/logout', { method: 'POST' });
              } finally {
                await setAccessToken(null);
                invalidateResource();
                setProfile(null);
                setGuest(true);
              }
            })()}>
            <Text style={styles.logoutText}>خروج امن از این دستگاه</Text>
            <View style={styles.logoutArrow} />
          </PressableScale>
        </View>
      </ScrollView>
    </Screen>
  );
}

function GuestProfile() {
  return (
    <Screen>
      <PageHeader title="Player Hub" subtitle="PLAYNEXUS ID" />

      <View style={styles.guest}>
        <View style={styles.guestOrbitLarge}>
          <View style={styles.guestOrbitMid}>
            <View style={styles.guestMark}>
              <View style={styles.guestMarkCore} />
            </View>
          </View>
        </View>

        <Text style={styles.guestKicker}>UNLOCK YOUR NEXUS</Text>
        <Text style={styles.guestTitle}>دنیای گیمت رو شخصی کن</Text>
        <Text style={styles.guestText}>
          فید شخصی، ادامه تماشای ویدیو، ذخیره‌ها، سفارش‌ها و سیگنال بازی‌هایی که دنبال می‌کنی با PlayNexus ID فعال می‌شن.
        </Text>

        <PressableScale
          style={styles.primary}
          onPress={() => router.push('/auth/login')}>
          <Text style={styles.primaryText}>ورود به PlayNexus</Text>
          <View style={styles.primaryArrow} />
        </PressableScale>

        <PressableScale
          haptic={false}
          style={styles.guestSecondary}
          onPress={() => router.push('/auth/register')}>
          <Text style={styles.guestSecondaryText}>ساخت حساب جدید</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

type Tone = 'cyan' | 'violet' | 'blue';

function Stat({
  kicker,
  label,
  value,
  suffix,
  tone,
}: {
  kicker: string;
  label: string;
  value: string;
  suffix?: string;
  tone: Tone;
}) {
  const color = tone === 'cyan'
    ? palette.cyan
    : tone === 'violet'
      ? palette.violet
      : palette.blue;

  return (
    <View style={styles.stat}>
      <View style={[styles.statSignal, { backgroundColor: color }]} />
      <Text style={[styles.statKicker, { color }]}>{kicker}</Text>
      <Text numberOfLines={1} style={styles.statValue}>{value}</Text>
      {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type HubItem = {
  symbol: string;
  title: string;
  caption: string;
  onPress?: () => void;
};

function HubSection({
  kicker,
  title,
  items,
}: {
  kicker: string;
  title: string;
  items: HubItem[];
}) {
  return (
    <View style={styles.hubSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionKicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.menuList}>
        {items.map((item) => (
          <MenuRow key={item.title} {...item} />
        ))}
      </View>
    </View>
  );
}

function MenuRow({
  symbol,
  title,
  caption,
  onPress,
}: HubItem) {
  return (
    <PressableScale style={styles.menu} onPress={onPress}>
      <View style={styles.menuArrowWrap}>
        <View style={styles.menuArrow} />
      </View>

      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuCaption}>{caption}</Text>
      </View>

      <View style={styles.menuSymbol}>
        <Text style={styles.menuSymbolText}>{symbol}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 142,
  },
  playerCard: {
    minHeight: 236,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
    backgroundColor: 'rgba(8,14,23,0.88)',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardSignalTop: {
    position: 'absolute',
    top: 0,
    right: 26,
    width: 74,
    height: 2,
    backgroundColor: palette.cyan,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  playerMetaBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playerLabel: {
    color: palette.cyan,
    fontSize: 9,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  playerName: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    lineHeight: 33,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 5,
  },
  playerIdentity: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: typeScale.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  avatarShell: {
    width: 88,
    height: 88,
    borderRadius: 29,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(24,124,255,0.08)',
  },
  avatarHalo: {
    position: 'absolute',
    inset: -10,
    borderRadius: 38,
    backgroundColor: 'rgba(24,124,255,0.055)',
  },
  avatar: {
    flex: 1,
    borderRadius: 26,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackCore: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: 10,
    width: 13,
    height: 13,
    borderRadius: 13,
    backgroundColor: palette.success,
    borderWidth: 2,
    borderColor: palette.ink,
  },
  profileProgress: {
    marginTop: spacing.xl,
  },
  progressCopy: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: palette.textDim,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  progressValue: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.cyan,
  },
  cardSerial: {
    color: palette.textDim,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  statGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    minHeight: 112,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  statSignal: {
    position: 'absolute',
    top: 0,
    right: 14,
    width: 34,
    height: 2,
  },
  statKicker: {
    fontSize: 7,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  statValue: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    marginTop: spacing.sm,
  },
  statSuffix: {
    color: palette.textDim,
    fontSize: 8,
    marginTop: 1,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 9,
    marginTop: 'auto',
  },
  hubSection: {
    marginTop: spacing.xxxl,
  },
  sectionHeading: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  sectionKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  menuList: {
    gap: spacing.sm,
  },
  menu: {
    minHeight: 82,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuSymbol: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSymbolText: {
    color: palette.cyan,
    fontSize: 19,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  menuCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  menuCaption: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  menuArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.textMuted,
    transform: [{ rotate: '45deg' }],
  },
  dangerZone: {
    marginTop: spacing.xxxl,
  },
  dangerKicker: {
    color: palette.danger,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  logout: {
    minHeight: 60,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,97,120,0.18)',
    backgroundColor: 'rgba(255,97,120,0.045)',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutText: {
    color: palette.danger,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  logoutArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.danger,
    transform: [{ rotate: '45deg' }],
  },
  guest: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 56,
    alignItems: 'center',
  },
  guestOrbitLarge: {
    width: 190,
    height: 190,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOrbitMid: {
    width: 122,
    height: 122,
    borderRadius: 122,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestMark: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: 'rgba(24,124,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  guestMarkCore: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  guestKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
    marginTop: spacing.xxxl,
  },
  guestTitle: {
    color: palette.white,
    fontSize: typeScale.displaySm,
    lineHeight: 38,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  guestText: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: typeScale.bodySm,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 330,
  },
  primary: {
    width: '100%',
    minHeight: 58,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: palette.ink,
    fontSize: typeScale.body,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  primaryArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  guestSecondary: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
});
