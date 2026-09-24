import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import type { ProfilePayload } from '@/types/api';

export default function SecurityScreen() {
  const [hasPassword, setHasPassword] = useState(true);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiRequest<ProfilePayload>('/me').then((data) => {
      setHasPassword(Boolean((data.profile as ProfilePayload['profile'] & { has_password?: boolean }).has_password ?? true));
    });
  }, []);

  const changePassword = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: hasPassword ? current : null,
          password,
          password_confirmation: confirmation,
        }),
      });
      setCurrent('');
      setPassword('');
      setConfirmation('');
      setHasPassword(true);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تغییر رمز انجام نشد.');
    } finally {
      setBusy(false);
    }
  };

  const logoutAll = async () => {
    setBusy(true);
    try {
      await apiRequest('/auth/logout-all', { method: 'POST' });
    } finally {
      await setAccessToken(null);
      invalidateResource();
      router.replace('/auth/login');
    }
  };

  return (
    <Screen>
      <PageHeader title="Security" subtitle="PLAYER ID SECURITY" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <Text style={styles.kicker}>PASSWORD</Text>
          <Text style={styles.title}>{hasPassword ? 'تغییر رمز عبور' : 'ساخت رمز عبور'}</Text>
          {hasPassword ? <SecretField label="رمز فعلی" value={current} onChange={setCurrent} /> : null}
          <SecretField label="رمز جدید" value={password} onChange={setPassword} />
          <SecretField label="تکرار رمز جدید" value={confirmation} onChange={setConfirmation} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PressableScale disabled={busy || password.length < 8 || password !== confirmation} onPress={() => void changePassword()} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? 'در حال ذخیره…' : 'ذخیره رمز جدید'}</Text>
          </PressableScale>
        </View>

        <View style={styles.danger}>
          <Text style={styles.dangerKicker}>ALL SESSIONS</Text>
          <Text style={styles.dangerTitle}>خروج از همه دستگاه‌ها</Text>
          <Text style={styles.description}>تمام توکن‌های موبایل و دستگاه‌های Push این حساب باطل می‌شن.</Text>
          <PressableScale disabled={busy} onPress={() => void logoutAll()} style={styles.logoutAll}>
            <Text style={styles.logoutAllText}>خروج از همه دستگاه‌ها</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SecretField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} secureTextEntry placeholder="••••••••" placeholderTextColor={palette.textDim} textAlign="right" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80, gap: spacing.xl },
  panel: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg, gap: spacing.sm },
  kicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 23, textAlign: 'right', marginBottom: spacing.sm },
  field: { gap: 5 },
  label: { color: palette.textMuted, fontFamily: fontFamily.bold, textAlign: 'right', fontSize: 11 },
  input: { minHeight: 56, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, color: palette.white, backgroundColor: 'rgba(3,5,9,0.45)', paddingHorizontal: spacing.md, fontFamily: fontFamily.regular },
  message: { color: palette.warning, fontFamily: fontFamily.regular, textAlign: 'right' },
  primary: { minHeight: 56, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black },
  danger: { borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(255,97,120,0.18)', backgroundColor: 'rgba(255,97,120,0.04)', padding: spacing.lg, alignItems: 'flex-end' },
  dangerKicker: { color: palette.danger, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  dangerTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 20, marginTop: 4 },
  description: { color: palette.textMuted, fontFamily: fontFamily.regular, textAlign: 'right', lineHeight: 22, marginTop: spacing.sm },
  logoutAll: { width: '100%', minHeight: 52, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255,97,120,0.28)', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutAllText: { color: palette.danger, fontFamily: fontFamily.black },
});
