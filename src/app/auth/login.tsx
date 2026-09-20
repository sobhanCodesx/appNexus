import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { PressableScale } from '@/components/ui/pressable-scale';
import { palette, spacing, typeScale, fontWeight } from '@/design';
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
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      router.replace('/(tabs)/profile');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ورود انجام نشد.');
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      kicker="PLAYNEXUS ID"
      title="برگرد به دنیای خودت"
      subtitle="یک حساب، تمام سیگنال‌ها؛ فید شخصی، ویدیوها، سفارش‌ها و بازی‌هایی که دنبال می‌کنی."
      step="PLAYER ACCESS">
      <AuthFieldLabel label="شناسه ورود" meta="EMAIL / MOBILE" />
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="ایمیل یا شماره موبایل"
        placeholderTextColor={palette.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        textAlign="right"
        style={authStyles.input}
      />

      <AuthFieldLabel label="رمز عبور" meta="SECURE" />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="رمز عبور"
        placeholderTextColor={palette.textDim}
        secureTextEntry
        textAlign="right"
        style={authStyles.input}
        onSubmitEditing={() => void login()}
      />

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <PressableScale
        disabled={submitting}
        onPress={() => void login()}
        style={authStyles.primary}>
        <Text style={authStyles.primaryText}>
          {submitting ? 'در حال ورود…' : 'ورود به PlayNexus'}
        </Text>
        {!submitting ? <View style={authStyles.primaryArrow} /> : null}
      </PressableScale>

      <View style={styles.quickRow}>
        <PressableScale
          haptic={false}
          onPress={() => router.push('/auth/otp')}
          style={styles.quick}>
          <Text style={styles.quickKicker}>OTP</Text>
          <Text style={styles.quickTitle}>ورود با کد</Text>
        </PressableScale>

        <PressableScale
          haptic={false}
          onPress={() => router.push('/auth/forgot')}
          style={styles.quick}>
          <Text style={styles.quickKicker}>RECOVERY</Text>
          <Text style={styles.quickTitle}>بازیابی حساب</Text>
        </PressableScale>
      </View>

      <View style={authStyles.dividerRow}>
        <View style={authStyles.divider} />
        <Text style={authStyles.dividerText}>NEW PLAYER</Text>
        <View style={authStyles.divider} />
      </View>

      <PressableScale
        onPress={() => router.push('/auth/register')}
        style={authStyles.secondary}>
        <Text style={authStyles.secondaryText}>ساخت PlayNexus ID جدید</Text>
      </PressableScale>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  quickRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quick: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  quickKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  quickTitle: {
    color: palette.text,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
});
