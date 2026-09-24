import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';

type TokenResponse = { access_token: string };
type Channel = 'email' | 'mobile';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    channel: string;
    identifier: string;
  }>();
  const channel = (
    Array.isArray(params.channel)
      ? params.channel[0]
      : params.channel
  ) as Channel;
  const identifier = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramClaim, setTelegramClaim] = useState<string | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
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
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      router.replace('/(tabs)/profile');
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'کد تأیید نشد.');
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const beginTelegramVerification = async () => {
    if (channel !== 'mobile' || !identifier || telegramBusy) return;

    setTelegramBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<{
        identifier: string;
        claim_token: string;
        url: string;
        message: string;
      }>(
        '/auth/verification/telegram',
        {
          method: 'POST',
          body: JSON.stringify({ phone: identifier }),
        },
        { auth: false },
      );

      setTelegramClaim(result.claim_token);
      setTelegramUrl(result.url);
      setMessage(result.message);
      await Linking.openURL(result.url);
    } catch (value) {
      setMessage(
        value instanceof Error
          ? value.message
          : 'شروع تأیید با Telegram انجام نشد.',
      );
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setTelegramBusy(false);
    }
  };

  const completeTelegramVerification = async () => {
    if (!telegramClaim || telegramBusy) return;

    setTelegramBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<TokenResponse>(
        '/auth/verification/telegram/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            claim_token: telegramClaim,
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
      setMessage(
        value instanceof Error
          ? value.message
          : 'تأیید Telegram هنوز کامل نشده است.',
      );
    } finally {
      setTelegramBusy(false);
    }
  };

  const resend = async () => {
    try {
      const result = await apiRequest<{ message: string }>(
        '/auth/verification/resend',
        {
          method: 'POST',
          body: JSON.stringify({ channel, identifier }),
        },
        { auth: false },
      );
      setMessage(result.message);
      void Haptics.selectionAsync();
    } catch (value) {
      setMessage(
        value instanceof Error ? value.message : 'ارسال مجدد انجام نشد.',
      );
    }
  };

  return (
    <AuthScaffold
      kicker="VERIFY PLAYER"
      title="هویتت رو تأیید کن"
      subtitle="این آخرین قدم ساخت PlayNexus ID ـه؛ کد ۶ رقمی رو وارد کن و مستقیم وارد Player Hub شو."
      tone="violet"
      step="FINAL STEP">
      <View style={styles.destination}>
        <View style={styles.destinationIcon}>
          <View style={styles.destinationIconCore} />
        </View>
        <View style={styles.destinationCopy}>
          <Text style={styles.destinationKicker}>
            {channel === 'email' ? 'EMAIL VERIFICATION' : 'MOBILE VERIFICATION'}
          </Text>
          <Text style={styles.destinationValue}>{identifier}</Text>
        </View>
      </View>

      <AuthFieldLabel label="کد تأیید" meta="6 DIGITS" />
      <TextInput
        value={code}
        onChangeText={(value) => setCode(
          value.replace(/\D/g, '').slice(0, 6),
        )}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
        placeholder="• • • • • •"
        placeholderTextColor={palette.textDim}
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

      {message ? <Text style={authStyles.message}>{message}</Text> : null}

      <PressableScale
        disabled={submitting || code.length !== 6}
        onPress={() => void verify()}
        style={[
          authStyles.primary,
          (submitting || code.length !== 6) && styles.disabled,
        ]}>
        <Text style={authStyles.primaryText}>
          {submitting ? 'در حال تأیید…' : 'تأیید و ورود'}
        </Text>
        {!submitting ? <View style={authStyles.primaryArrow} /> : null}
      </PressableScale>

      <View style={styles.resendPanel}>
        <View style={styles.resendCopy}>
          <Text style={styles.resendTitle}>کد نرسید؟</Text>
          <Text style={styles.resendText}>
            دوباره می‌فرستیم؛ نیازی نیست از این صفحه خارج شی.
          </Text>
        </View>
        <PressableScale
          onPress={() => void resend()}
          haptic={false}
          style={styles.resendButton}>
          <Text style={styles.resendButtonText}>ارسال مجدد</Text>
        </PressableScale>
      </View>

      {channel === 'mobile' ? (
        <View style={styles.telegramPanel}>
          <View style={styles.telegramMark}>
            <Text style={styles.telegramMarkText}>TG</Text>
          </View>
          <View style={styles.telegramCopy}>
            <Text style={styles.telegramKicker}>SECURE PHONE PROOF</Text>
            <Text style={styles.telegramTitle}>تأیید مستقیم با Telegram</Text>
            <Text style={styles.telegramText}>
              Bot فقط شماره متعلق به همان حساب Telegram را می‌پذیرد؛ بعد از اشتراک شماره، کد SMS لازم نیست.
            </Text>
          </View>
          <PressableScale
            disabled={telegramBusy}
            onPress={() => void (
              telegramClaim
                ? completeTelegramVerification()
                : beginTelegramVerification()
            )}
            style={[styles.telegramButton, telegramBusy && styles.disabled]}>
            <Text style={styles.telegramButtonText}>
              {telegramBusy
                ? '...'
                : telegramClaim
                  ? 'بررسی تأیید'
                  : 'باز کردن Telegram'}
            </Text>
          </PressableScale>
        </View>
      ) : null}

      {channel === 'mobile' && telegramClaim && telegramUrl ? (
        <PressableScale
          haptic={false}
          onPress={() => void Linking.openURL(telegramUrl)}
          style={authStyles.link}>
          <Text style={authStyles.linkText}>باز کردن دوباره Bot</Text>
        </PressableScale>
      ) : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  destination: {
    minHeight: 76,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.15)',
    backgroundColor: 'rgba(167,123,255,0.045)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  destinationIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(167,123,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationIconCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.violet,
    transform: [{ rotate: '45deg' }],
  },
  destinationCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  destinationKicker: {
    color: palette.violet,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
  },
  destinationValue: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  code: {
    minHeight: 78,
    fontSize: 29,
    fontWeight: fontWeight.black,
    letterSpacing: 9,
    borderColor: 'rgba(167,123,255,0.24)',
    backgroundColor: 'rgba(167,123,255,0.045)',
  },
  codeProgress: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  codeStep: {
    width: 24,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  codeStepActive: {
    backgroundColor: palette.violet,
  },
  disabled: {
    opacity: 0.48,
  },
  resendPanel: {
    minHeight: 76,
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resendCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resendTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  resendText: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  resendButton: {
    minWidth: 86,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(167,123,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonText: {
    color: palette.violet,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  telegramPanel: {
    minHeight: 118,
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(52,173,237,0.20)',
    backgroundColor: 'rgba(52,173,237,0.055)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  telegramMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(52,173,237,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52,173,237,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telegramMarkText: {
    color: '#55B9F3',
    fontSize: 11,
    fontWeight: fontWeight.black,
  },
  telegramCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  telegramKicker: {
    color: '#55B9F3',
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  telegramTitle: {
    color: palette.white,
    fontSize: 13,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  telegramText: {
    color: palette.textMuted,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'right',
    marginTop: 3,
  },
  telegramButton: {
    minWidth: 92,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52,173,237,0.25)',
    backgroundColor: 'rgba(52,173,237,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  telegramButtonText: {
    color: '#75CCFA',
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
});
