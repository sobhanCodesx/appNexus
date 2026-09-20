import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

type LoginResponse = {
  access_token: string;
  user: { id: number; name: string };
};

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleWebClientId;
const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleWebClientId;

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    clientId: googleWebClientId,
    webClientId: googleWebClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
    selectAccount: true,
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params.id_token
      || googleResponse.authentication?.idToken;

    if (!idToken) {
      setGoogleBusy(false);
      setError('Google توکن هویتی معتبر برنگرداند.');
      return;
    }

    void (async () => {
      try {
        const result = await apiRequest<LoginResponse>(
          '/auth/google',
          {
            method: 'POST',
            body: JSON.stringify({
              id_token: idToken,
              device_name: Platform.OS + ' PlayNexus',
            }),
          },
          { auth: false },
        );

        await setAccessToken(result.access_token);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/profile');
      } catch (value) {
        setError(value instanceof Error ? value.message : 'ورود با Google انجام نشد.');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setGoogleBusy(false);
      }
    })();
  }, [googleResponse]);

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

  const google = async () => {
    if (!googleWebClientId || !googleAndroidClientId || !googleIosClientId) {
      setError('Google Client ID برای این build تنظیم نشده است.');
      return;
    }

    setError(null);
    setGoogleBusy(true);
    try {
      const result = await promptGoogle();
      if (result.type !== 'success') setGoogleBusy(false);
    } catch (value) {
      setGoogleBusy(false);
      setError(value instanceof Error ? value.message : 'Google Sign-In باز نشد.');
    }
  };

  return (
    <AuthScaffold
      kicker="PLAYNEXUS ID"
      title="برگرد به دنیای خودت"
      subtitle="یک حساب، تمام سیگنال‌ها؛ فید شخصی، ویدیوها، سفارش‌ها و بازی‌هایی که دنبال می‌کنی."
      step="PLAYER ACCESS">

      <PressableScale
        disabled={!googleRequest || googleBusy}
        onPress={() => void google()}
        style={styles.google}>
        <View style={styles.googleMark}>
          <Text style={styles.googleMarkText}>G</Text>
        </View>
        <Text style={styles.googleText}>
          {googleBusy ? 'در حال اتصال به Google…' : 'ادامه با Google'}
        </Text>
      </PressableScale>

      <View style={authStyles.dividerRow}>
        <View style={authStyles.divider} />
        <Text style={authStyles.dividerText}>OR PLAYNEXUS ID</Text>
        <View style={authStyles.divider} />
      </View>

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

      <PressableScale
        onPress={() => router.push('/auth/register')}
        style={authStyles.secondary}>
        <Text style={authStyles.secondaryText}>ساخت PlayNexus ID جدید</Text>
      </PressableScale>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  google: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleMark: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMarkText: {
    color: '#4285F4',
    fontFamily: fontFamily.black,
    fontSize: 15,
  },
  googleText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: typeScale.bodySm,
  },
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
    fontFamily: fontFamily.black,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  quickTitle: {
    color: palette.text,
    fontFamily: fontFamily.black,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
});
