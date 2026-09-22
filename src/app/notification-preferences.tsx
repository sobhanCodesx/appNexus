import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import { registerNativePushDevice } from '@/services/push';
import type { ProfilePayload } from '@/types/api';

type Preferences = {
  sms_enabled: boolean;
  email_enabled: boolean;
  feed_enabled: boolean;
  telegram_enabled: boolean;
};
type Payload = { preferences: Preferences };
const defaults: Payload = {
  preferences: {
    sms_enabled: true,
    email_enabled: false,
    feed_enabled: false,
    telegram_enabled: false,
  },
};
const emptyProfile: ProfilePayload = { profile: { id: 0, name: '' } };

export default function NotificationPreferencesScreen() {
  const { data, refresh } = useApiResource<Payload>('/notification-preferences', defaults);
  const { data: account } = useApiResource<ProfilePayload>('/me', emptyProfile);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pushState, setPushState] = useState<'idle' | 'busy' | 'ready' | 'blocked'>('idle');
  const values = draft ?? data.preferences;
  const telegramConnected = Boolean(account.profile.telegram_connected);

  const update = (key: keyof Preferences, value: boolean) => setDraft({ ...values, [key]: value });

  const save = async () => {
    try {
      const result = await apiRequest<{ message: string; preferences: Preferences }>('/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      setDraft(result.preferences);
      setMessage(result.message);
      invalidateResource('/notification-preferences');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تنظیمات ذخیره نشد.');
    }
  };

  const enablePush = async () => {
    setPushState('busy');
    try {
      const ok = await registerNativePushDevice();
      setPushState(ok ? 'ready' : 'blocked');
      setMessage(ok ? 'Push روی این دستگاه فعال شد.' : 'اجازه اعلان روی دستگاه فعال نشد.');
    } catch (error) {
      setPushState('blocked');
      setMessage(error instanceof Error ? error.message : 'فعال‌سازی Push انجام نشد.');
    }
  };

  return (
    <Screen>
      <PageHeader title="Signal Control" subtitle="NOTIFICATION PREFERENCES" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pushCard}>
          <View style={styles.pushOrb}><View style={styles.pushOrbCore} /></View>
          <View style={styles.pushCopy}>
            <Text style={styles.pushKicker}>FIREBASE PUSH</Text>
            <Text style={styles.pushTitle}>اعلان فوری روی گوشی</Text>
            <Text style={styles.pushCaption}>توکن FCM همین دستگاه با حساب PlayNexus ثبت می‌شود و لینک اعلان داخل خود اپ باز می‌شود.</Text>
          </View>
          <PressableScale
            disabled={pushState === 'busy'}
            onPress={() => void enablePush()}
            style={[styles.pushButton, pushState === 'ready' && styles.pushButtonReady]}>
            <Text style={styles.pushButtonText}>
              {pushState === 'busy' ? '...' : pushState === 'ready' ? 'فعال' : 'فعال‌سازی'}
            </Text>
          </PressableScale>
        </View>
        <Preference title="پیامک" caption="اعلان‌های محتوایی مهم از طریق SMS" value={values.sms_enabled} onChange={(v) => update('sms_enabled', v)} />
        <Preference title="ایمیل" caption="خلاصه و اعلان‌های محتوایی روی ایمیل" value={values.email_enabled} onChange={(v) => update('email_enabled', v)} />
        <Preference title="فید + Push محتوایی" caption="اعلان انتشار محتوای بازی‌هایی که دنبال می‌کنی داخل اپ و روی گوشی" value={values.feed_enabled} onChange={(v) => update('feed_enabled', v)} />
        <Preference
          title="Telegram"
          caption={
            telegramConnected
              ? 'OTP و اعلان‌های انتخابی را در چت خصوصی Bot هم دریافت کن'
              : 'برای فعال‌سازی، اول Telegram را از Player Hub به حسابت وصل کن'
          }
          value={values.telegram_enabled}
          disabled={!telegramConnected}
          onChange={(v) => update('telegram_enabled', v)}
        />
        {!telegramConnected ? (
          <PressableScale
            haptic={false}
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.telegramLink}>
            <Text style={styles.telegramLinkText}>رفتن به Player Hub و اتصال Telegram</Text>
          </PressableScale>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PressableScale onPress={() => void save()} style={styles.primary}><Text style={styles.primaryText}>ذخیره تنظیمات</Text></PressableScale>
      </ScrollView>
    </Screen>
  );
}

function Preference({
  title,
  caption,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  caption: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: palette.surfaceBright, true: palette.blueHot }}
        thumbColor={palette.white}
      />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80, gap: spacing.sm },
  pushCard: { minHeight: 132, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.045)', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pushOrb: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(88,244,255,0.24)', backgroundColor: 'rgba(88,244,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  pushOrbCore: { width: 13, height: 13, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  pushCopy: { flex: 1, alignItems: 'flex-end' },
  pushKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.9 },
  pushTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 15, marginTop: 4 },
  pushCaption: { color: palette.textMuted, fontFamily: fontFamily.regular, textAlign: 'right', fontSize: 9, lineHeight: 16, marginTop: 4 },
  pushButton: { minWidth: 70, height: 38, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  pushButtonReady: { borderColor: 'rgba(80,232,176,0.24)', backgroundColor: 'rgba(80,232,176,0.08)' },
  pushButtonText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 9 },
  row: { minHeight: 92, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  rowDisabled: { opacity: 0.58 },
  telegramLink: { minHeight: 44, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(52,173,237,0.20)', backgroundColor: 'rgba(52,173,237,0.06)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  telegramLinkText: { color: '#6AC7F5', fontFamily: fontFamily.black, fontSize: 10 },
  copy: { flex: 1, alignItems: 'flex-end' },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 16 },
  caption: { color: palette.textMuted, fontFamily: fontFamily.regular, textAlign: 'right', fontSize: 11, lineHeight: 18, marginTop: 3 },
  message: { color: palette.warning, fontFamily: fontFamily.regular, textAlign: 'right', marginTop: spacing.sm },
  primary: { minHeight: 56, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black },
});
