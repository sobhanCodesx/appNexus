import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
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
    return (
      <Screen>
        <PageHeader title="پروفایل" subtitle="حساب PlayNexus" />
        <View style={styles.guest}>
          <View style={styles.guestMark}><View style={styles.guestMarkCore} /></View>
          <Text style={styles.guestTitle}>PlayNexus شخصی تو از اینجا شروع می‌شود</Text>
          <Text style={styles.guestText}>
            ورود یعنی فید شخصی، ادامه تماشای ویدیو، ذخیره‌ها، سفارش‌ها و اعلان‌های بازی‌هایی که دنبال می‌کنی.
          </Text>
          <PressableScale style={styles.primary} onPress={() => router.push('/auth/login')}>
            <Text style={styles.primaryText}>ورود به حساب</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  const user = profile?.profile;

  return (
    <Screen>
      <PageHeader title="پروفایل" subtitle="مرکز کنترل تو" avatarUrl={user?.avatar_url} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {user?.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" /> : null}
          <Text style={styles.name}>{user?.name || 'گیمر PlayNexus'}</Text>
          <Text style={styles.identityMeta}>{user?.email || user?.phone || 'PlayNexus ID'}</Text>
        </View>

        <View style={styles.statGrid}>
          <Stat label="کیف پول" value={(profile?.wallet_balance || 0).toLocaleString('fa-IR')} />
          <Stat label="اعلان جدید" value={String(profile?.unread_notifications_count || 0)} />
          <Stat label="تکمیل پروفایل" value={String(profile?.profile_completion || 0) + '٪'} />
        </View>

        <MenuRow title="ذخیره‌شده‌ها" caption="پست‌ها و ویدیوهایی که نگه داشتی" onPress={() => router.push('/saved')} />
        <MenuRow title="سفارش‌ها" caption="پیگیری خریدهای PlayNexus" onPress={() => router.push('/orders')} />
        <MenuRow title="آدرس‌ها" caption="مدیریت آدرس‌های تحویل" onPress={() => router.push('/addresses')} />
        <MenuRow title="فروشگاه" caption="محصولات، تخفیف‌ها و معاوضه" onPress={() => router.push('/store')} />
        <MenuRow title="اعلان‌ها" caption="چیزهایی که واقعاً مهم‌اند" onPress={() => router.push('/notifications')} />
        <MenuRow
          title="فعال‌سازی Push"
          caption="اعلان native برای بازی‌ها و سفارش‌ها"
          onPress={() => void registerNativePushDevice()}
        />
        <MenuRow
          title="خروج"
          caption="خروج امن از این دستگاه"
          danger
          onPress={() => void (async () => {
            try {
              await apiRequest('/auth/logout', { method: 'POST' });
            } finally {
              await setAccessToken(null);
              invalidateResource();
              setProfile(null);
              setGuest(true);
            }
          })()}
        />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  title,
  caption,
  onPress,
  danger = false,
}: {
  title: string;
  caption: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <PressableScale style={styles.menu} onPress={onPress}>
      <View style={styles.chevron} />
      <View style={styles.menuCopy}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        <Text style={styles.menuCaption}>{caption}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 128 },
  guest: { flex: 1, paddingHorizontal: 34, paddingTop: 80, alignItems: 'center' },
  guestMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(77,163,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestMarkCore: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  guestTitle: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: fontWeight.black,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  guestText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  primary: {
    marginTop: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  primaryText: { color: palette.ink, fontSize: typeScale.body, fontWeight: fontWeight.black },
  identity: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 92, height: 92, borderRadius: 32, backgroundColor: palette.surface },
  name: { color: palette.white, fontSize: typeScale.displaySm, fontWeight: fontWeight.black, marginTop: spacing.md },
  identityMeta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 4 },
  statGrid: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.xl },
  stat: {
    flex: 1,
    minHeight: 92,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  statLabel: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 4 },
  menu: {
    minHeight: 76,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuCopy: { flex: 1, alignItems: 'flex-end' },
  menuTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.bold },
  menuCaption: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 4, textAlign: 'right' },
  menuTitleDanger: { color: palette.danger },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: palette.textDim,
    transform: [{ rotate: '-135deg' }],
  },
});
