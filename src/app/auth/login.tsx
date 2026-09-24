import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, fontWeight, layout, palette, shadow, spacing, typeScale } from '@/design';
import { PLAYNEXUS_SITE_URL } from '@/config/app';
import { ApiError, apiRequest, setAccessToken } from '@/services/api';
import { registerNativePushDevice } from '@/services/push';

WebBrowser.maybeCompleteAuthSession();

type LoginResponse = {
  access_token: string;
  user: { id: number; name: string };
};

const googleRedirectUrl = 'playnexus://auth/google';
const logo = require('../../../assets/images/playnexus-app-icon.png');

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishLogin = async (result: LoginResponse) => {
    await setAccessToken(result.access_token);
    void registerNativePushDevice().catch(() => false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)/profile');
  };

  const login = async () => {
    if (!identifier.trim() || !password || submitting) return;
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

      await finishLogin(result);
    } catch (value) {
      if (value instanceof ApiError && value.status === 409) {
        const payload =
          value.payload && typeof value.payload === 'object'
            ? value.payload as {
                code?: string;
                channel?: 'email' | 'mobile';
                identifier?: string;
              }
            : null;

        if (
          payload?.code === 'verification_required'
          && (payload.channel === 'email' || payload.channel === 'mobile')
          && typeof payload.identifier === 'string'
          && payload.identifier
        ) {
          router.replace({
            pathname: '/auth/verify',
            params: {
              channel: payload.channel,
              identifier: payload.identifier,
            },
          });
          return;
        }
      }

      setError(value instanceof Error ? value.message : 'ورود انجام نشد.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const google = async () => {
    if (googleBusy) return;

    setGoogleBusy(true);
    setError(null);

    try {
      const startUrl =
        PLAYNEXUS_SITE_URL
        + '/auth/google/mobile?device_name='
        + encodeURIComponent(Platform.OS + ' PlayNexus');

      const authResult = await WebBrowser.openAuthSessionAsync(
        startUrl,
        googleRedirectUrl,
      );

      if (authResult.type !== 'success' || !authResult.url) {
        if (authResult.type !== 'cancel' && authResult.type !== 'dismiss') {
          throw new Error('ورود Google کامل نشد.');
        }
        return;
      }

      const callback = new URL(authResult.url);
      const oauthError = callback.searchParams.get('error');
      if (oauthError) {
        throw new Error(
          oauthError === 'config'
            ? 'ورود Google روی سرور PlayNexus آماده نیست.'
            : 'ورود Google کامل نشد. دوباره تلاش کن.',
        );
      }

      const code = callback.searchParams.get('code');
      if (!code) throw new Error('کد امن ورود Google دریافت نشد.');

      const result = await apiRequest<LoginResponse>(
        '/auth/google/exchange',
        {
          method: 'POST',
          body: JSON.stringify({
            code,
            device_name: Platform.OS + ' PlayNexus',
          }),
        },
        { auth: false },
      );

      await finishLogin(result);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ورود با Google انجام نشد.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.brand}>
            <View style={styles.logoShell}>
              <LinearGradient
                colors={['rgba(88,244,255,0.16)', 'rgba(77,163,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <Image source={logo} style={styles.logo} contentFit="contain" />
            </View>
            <View style={styles.brandCopy}>
              <View style={styles.signalRow}>
                <View style={styles.signalDot} />
                <Text style={styles.signal}>PLAYER ACCESS</Text>
              </View>
              <Text style={styles.title}>ورود</Text>
              <Text style={styles.subtitle}>PlayNexus ID</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>شماره موبایل یا ایمیل</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="09xxxxxxxxx"
                placeholderTextColor={palette.textDim}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
                style={styles.input}
              />
            </View>

            <View>
              <View style={styles.passwordHeading}>
                <PressableScale haptic={false} onPress={() => router.push('/auth/forgot')}>
                  <Text style={styles.forgot}>رمز را فراموش کردم</Text>
                </PressableScale>
                <Text style={styles.label}>رمز عبور</Text>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={palette.textDim}
                secureTextEntry
                textAlign="right"
                style={styles.input}
                onSubmitEditing={() => void login()}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PressableScale
              disabled={submitting}
              onPress={() => void login()}
              style={[styles.primary, submitting && styles.disabled]}>
              <Text style={styles.primaryText}>{submitting ? 'در حال ورود…' : 'ورود به PlayNexus'}</Text>
              {!submitting ? <View style={styles.arrow} /> : null}
            </PressableScale>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>یا</Text>
              <View style={styles.divider} />
            </View>

            <PressableScale
              disabled={googleBusy}
              onPress={() => void google()}
              style={[styles.google, googleBusy && styles.googleDisabled]}>
              <View style={styles.googleMark}><Text style={styles.googleMarkText}>G</Text></View>
              <Text style={styles.googleText}>{googleBusy ? 'در حال اتصال…' : 'ادامه با Google'}</Text>
            </PressableScale>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>حساب نداری؟</Text>
            <PressableScale haptic={false} onPress={() => router.push('/auth/register')}>
              <Text style={styles.register}>ساخت حساب</Text>
            </PressableScale>
          </View>

          <Text style={styles.note}>برای حساب تأییدشده، ورود با رمز مستقیم است؛ اگر ثبت‌نام ناقص باشد فقط همان مرحله تأیید ادامه پیدا می‌کند.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xxxl,
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  logoShell: {
    width: 74,
    height: 74,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cyanGlow,
  },
  logo: { width: 54, height: 54 },
  brandCopy: { flex: 1, alignItems: 'flex-end' },
  signalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  signalDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  signal: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 38, lineHeight: 45, marginTop: 4 },
  subtitle: { color: palette.textMuted, fontFamily: fontFamily.medium, fontSize: 11, letterSpacing: 0.8 },
  form: { gap: spacing.md },
  label: { color: palette.textMuted, fontFamily: fontFamily.bold, fontSize: 10, textAlign: 'right', marginBottom: 7 },
  input: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    color: palette.white,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.regular,
    fontSize: typeScale.bodySm,
  },
  passwordHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgot: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 9, marginBottom: 7 },
  error: { color: palette.danger, fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 18, textAlign: 'right' },
  primary: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
  },
  disabled: { opacity: 0.55 },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 12 },
  arrow: { width: 7, height: 7, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: palette.ink, transform: [{ rotate: '45deg' }] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 2 },
  divider: { flex: 1, height: 1, backgroundColor: palette.line },
  dividerText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 9 },
  google: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleDisabled: { opacity: 0.54 },
  googleMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  googleMarkText: { color: '#4285F4', fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 14 },
  googleText: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 11 },
  googleHint: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, lineHeight: 15, textAlign: 'center' },
  footer: { marginTop: spacing.xl, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10 },
  register: { color: palette.cyan, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 10 },
  note: { marginTop: spacing.md, color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 8, lineHeight: 14, textAlign: 'center' },
});
