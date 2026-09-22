import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';

export default function OtpLoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);

  const request = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<{ identifier: string; message: string }>(
        '/auth/passwordless/request',
        { method: 'POST', body: JSON.stringify({ phone }) },
        { auth: false },
      );
      setPhone(result.identifier);
      setRequested(true);
      setMessage(result.message);
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'کد ارسال نشد.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<{ access_token: string }>(
        '/auth/passwordless/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            phone,
            code,
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
      setMessage(value instanceof Error ? value.message : 'کد صحیح نیست.');
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold
      kicker="FAST ACCESS"
      title={requested ? 'کد رو گرفتی؟' : 'بدون رمز وارد شو'}
      subtitle={
        requested
          ? 'کد ۶ رقمی ارسال‌شده رو وارد کن تا مستقیم وارد Player Hub بشی.'
          : 'شماره موبایلت رو بده؛ PlayNexus یک کد یکبارمصرف می‌فرسته.'
      }
      tone="blue"
      step={requested ? 'STEP 02 / 02' : 'STEP 01 / 02'}>
      {!requested ? (
        <>
          <AuthFieldLabel label="شماره موبایل" meta="IR MOBILE" />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="09xxxxxxxxx"
            placeholderTextColor={palette.textDim}
            textAlign="center"
            style={[authStyles.input, styles.phone]}
          />

          <View style={styles.fastNote}>
            <View style={styles.fastIcon}>
              <View style={styles.fastIconCore} />
            </View>
            <View style={styles.fastCopy}>
              <Text style={styles.fastTitle}>Fast Login</Text>
              <Text style={styles.fastText}>
                هیچ رمزی لازم نیست؛ فقط همین دستگاه و کد موقت.
              </Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.destination}>
            <Text style={styles.destinationKicker}>CODE SENT TO</Text>
            <Text style={styles.destinationValue}>{phone}</Text>
          </View>

          <AuthFieldLabel label="کد تأیید" meta="6 DIGITS" />
          <TextInput
            value={code}
            onChangeText={(value) => setCode(
              value.replace(/\D/g, '').slice(0, 6),
            )}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="• • • • • •"
            placeholderTextColor={palette.textDim}
            textAlign="center"
            style={[authStyles.input, styles.code]}
          />

          <View style={styles.codeProgress}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.codeStep,
                  index < code.length && styles.codeStepActive,
                ]}
              />
            ))}
          </View>
        </>
      )}

      {message ? <Text style={authStyles.message}>{message}</Text> : null}

      <PressableScale
        disabled={busy || (requested ? code.length !== 6 : !phone.trim())}
        onPress={() => void (requested ? verify() : request())}
        style={authStyles.primary}>
        <Text style={authStyles.primaryText}>
          {busy
            ? 'چند لحظه…'
            : requested
              ? 'تأیید و ورود'
              : 'ارسال کد ورود'}
        </Text>
        {!busy ? <View style={authStyles.primaryArrow} /> : null}
      </PressableScale>

      {requested ? (
        <PressableScale
          haptic={false}
          onPress={() => {
            setRequested(false);
            setCode('');
            setMessage(null);
          }}
          style={authStyles.link}>
          <Text style={authStyles.linkText}>شماره رو اشتباه زدی؟ تغییرش بده</Text>
        </PressableScale>
      ) : (
        <PressableScale
          haptic={false}
          onPress={() => router.replace('/auth/login')}
          style={authStyles.link}>
          <Text style={authStyles.linkText}>ورود با رمز عبور</Text>
        </PressableScale>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  phone: {
    fontSize: typeScale.titleSm,
    letterSpacing: 1.2,
  },
  fastNote: {
    minHeight: 72,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(85,169,255,0.14)',
    backgroundColor: 'rgba(85,169,255,0.04)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fastIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(85,169,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastIconCore: {
    width: 13,
    height: 13,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  fastCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fastTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  fastText: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  destination: {
    minHeight: 66,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(85,169,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(85,169,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationKicker: {
    color: palette.blue,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  destinationValue: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  code: {
    minHeight: 74,
    fontSize: 28,
    fontWeight: fontWeight.black,
    letterSpacing: 8,
    borderColor: 'rgba(85,169,255,0.22)',
    backgroundColor: 'rgba(85,169,255,0.045)',
  },
  codeProgress: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  codeStep: {
    width: 24,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  codeStepActive: {
    backgroundColor: palette.blue,
  },
});
