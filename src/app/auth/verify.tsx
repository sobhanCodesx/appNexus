import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';
import { useState } from 'react';

type TokenResponse = { access_token: string };
type Channel = 'email' | 'mobile';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ channel: string; identifier: string }>();
  const channel = (Array.isArray(params.channel) ? params.channel[0] : params.channel) as Channel;
  const identifier = Array.isArray(params.identifier) ? params.identifier[0] : params.identifier;
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const verify = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const result = await apiRequest<TokenResponse>(
        '/auth/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            channel,
            identifier,
            code,
            device_name: Platform.OS + ' PlayNexus',
          }),
        },
        { auth: false },
      );
      await setAccessToken(result.access_token);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/profile');
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'کد تأیید نشد.');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      const result = await apiRequest<{ message: string }>(
        '/auth/verification/resend',
        { method: 'POST', body: JSON.stringify({ channel, identifier }) },
        { auth: false },
      );
      setMessage(result.message);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'ارسال مجدد انجام نشد.');
    }
  };

  return (
    <Screen>
      <View style={styles.root}>
        <Text style={styles.eyebrow}>VERIFY PLAYER</Text>
        <Text style={styles.title}>کد ۶ رقمی رو وارد کن</Text>
        <Text style={styles.subtitle}>کد برای {identifier} ارسال شده.</Text>

        <TextInput
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          placeholder="• • • • • •"
          placeholderTextColor={palette.textDim}
          style={styles.code}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PressableScale disabled={submitting || code.length !== 6} onPress={() => void verify()} style={styles.primary}>
          <Text style={styles.primaryText}>{submitting ? 'در حال تأیید…' : 'تأیید و ورود'}</Text>
        </PressableScale>
        <PressableScale onPress={() => void resend()} haptic={false} style={styles.link}>
          <Text style={styles.linkText}>ارسال دوباره کد</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, alignItems: 'center' },
  eyebrow: { color: palette.cyan, fontSize: typeScale.caption, fontWeight: fontWeight.black, letterSpacing: 1.2 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { color: palette.textMuted, fontSize: typeScale.bodySm, textAlign: 'center', marginTop: spacing.sm },
  code: { width: '100%', minHeight: 72, marginTop: spacing.xxl, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(77,163,255,0.35)', backgroundColor: 'rgba(77,163,255,0.07)', color: palette.white, fontSize: 28, fontWeight: fontWeight.black, letterSpacing: 9 },
  message: { color: palette.warning, textAlign: 'center', marginTop: spacing.md },
  primary: { width: '100%', minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  primaryText: { color: palette.ink, fontWeight: fontWeight.black },
  link: { padding: spacing.lg },
  linkText: { color: palette.textMuted, fontWeight: fontWeight.bold },
});
