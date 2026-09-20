import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type Preferences = { sms_enabled: boolean; email_enabled: boolean; feed_enabled: boolean };
type Payload = { preferences: Preferences };
const defaults: Payload = { preferences: { sms_enabled: true, email_enabled: false, feed_enabled: false } };

export default function NotificationPreferencesScreen() {
  const { data, refresh } = useApiResource<Payload>('/notification-preferences', defaults);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const values = draft ?? data.preferences;

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

  return (
    <Screen>
      <PageHeader title="Signal Control" subtitle="NOTIFICATION PREFERENCES" />
      <ScrollView contentContainerStyle={styles.content}>
        <Preference title="پیامک" caption="اعلان‌های محتوایی مهم از طریق SMS" value={values.sms_enabled} onChange={(v) => update('sms_enabled', v)} />
        <Preference title="ایمیل" caption="خلاصه و اعلان‌های محتوایی روی ایمیل" value={values.email_enabled} onChange={(v) => update('email_enabled', v)} />
        <Preference title="فید داخل سایت" caption="اعلان محتوایی داخل تجربه PlayNexus" value={values.feed_enabled} onChange={(v) => update('feed_enabled', v)} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PressableScale onPress={() => void save()} style={styles.primary}><Text style={styles.primaryText}>ذخیره تنظیمات</Text></PressableScale>
      </ScrollView>
    </Screen>
  );
}

function Preference({ title, caption, value, onChange }: { title: string; caption: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: palette.surfaceBright, true: palette.blueHot }} thumbColor={palette.white} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80, gap: spacing.sm },
  row: { minHeight: 92, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  copy: { flex: 1, alignItems: 'flex-end' },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 16 },
  caption: { color: palette.textMuted, fontFamily: fontFamily.regular, textAlign: 'right', fontSize: 11, lineHeight: 18, marginTop: 3 },
  message: { color: palette.warning, fontFamily: fontFamily.regular, textAlign: 'right', marginTop: spacing.sm },
  primary: { minHeight: 56, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black },
});
