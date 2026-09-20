import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';

type LoginResponse = {
  access_token: string;
  user: { id: number; name: string };
};

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!identifier.trim() || !password) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
            device_name: Platform.OS + ' PlayNexus',
          }),
        },
        { auth: false },
      );

      await setAccessToken(result.access_token);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/profile');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ورود انجام نشد.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PLAYNEXUS ID</Text>
          <Text style={styles.title}>برگرد به دنیای خودت</Text>
          <Text style={styles.subtitle}>ایمیل یا شماره موبایل و رمز عبورت را وارد کن.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="ایمیل یا شماره موبایل"
            placeholderTextColor={palette.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            textAlign="right"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="رمز عبور"
            placeholderTextColor={palette.textDim}
            secureTextEntry
            textAlign="right"
            style={styles.input}
            onSubmitEditing={() => void login()}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PressableScale disabled={submitting} onPress={() => void login()} style={styles.button}>
            <Text style={styles.buttonText}>{submitting ? 'در حال ورود…' : 'ورود'}</Text>
          </PressableScale>

          <View style={styles.quickLinks}>
            <PressableScale haptic={false} onPress={() => router.push('/auth/otp')} style={styles.link}>
              <Text style={styles.linkText}>ورود با کد یکبارمصرف</Text>
            </PressableScale>
            <PressableScale haptic={false} onPress={() => router.push('/auth/forgot')} style={styles.link}>
              <Text style={styles.linkText}>رمز رو فراموش کردی؟</Text>
            </PressableScale>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>یا</Text>
            <View style={styles.divider} />
          </View>

          <PressableScale onPress={() => router.push('/auth/register')} style={styles.register}>
            <Text style={styles.registerText}>ساخت حساب PlayNexus</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
  },
  header: { alignItems: 'flex-end', marginBottom: spacing.xxl },
  eyebrow: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    letterSpacing: 1.3,
  },
  title: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 43,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  form: { gap: spacing.sm },
  input: {
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.045)',
    color: palette.white,
    paddingHorizontal: spacing.lg,
    fontSize: typeScale.body,
  },
  button: {
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { color: palette.ink, fontSize: typeScale.body, fontWeight: fontWeight.black },
  quickLinks: {
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  link: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: palette.line,
  },
  dividerText: {
    color: palette.textDim,
    fontSize: typeScale.caption,
  },
  register: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.30)',
    backgroundColor: 'rgba(77,163,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: palette.cyan,
    fontWeight: fontWeight.black,
  },
  error: {
    color: palette.danger,
    fontSize: typeScale.caption,
    textAlign: 'right',
    paddingHorizontal: spacing.xs,
  },
});
