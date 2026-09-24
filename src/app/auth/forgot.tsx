import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';

type Channel = 'email' | 'mobile';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [normalized, setNormalized] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (!identifier.trim()) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<{
        channel: Channel;
        identifier: string;
        message: string;
      }>(
        '/auth/password/reset/request',
        {
          method: 'POST',
          body: JSON.stringify({ identifier }),
        },
        { auth: false },
      );

      setChannel(result.channel);
      setNormalized(result.identifier);
      setMessage(result.message);
    } catch (value) {
      setMessage(
        value instanceof Error ? value.message : 'درخواست انجام نشد.',
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!channel || code.length !== 6 || !password) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await apiRequest<{ message: string }>(
        '/auth/password/reset/confirm',
        {
          method: 'POST',
          body: JSON.stringify({
            channel,
            identifier: normalized,
            code,
            password,
            password_confirmation: confirmation,
          }),
        },
        { auth: false },
      );

      setMessage(result.message);
      router.replace('/auth/login');
    } catch (value) {
      setMessage(
        value instanceof Error ? value.message : 'رمز عبور تغییر نکرد.',
      );
    } finally {
      setBusy(false);
    }
  };

  const step = channel ? 'STEP 02 / 02' : 'STEP 01 / 02';

  return (
    <AuthScaffold
      kicker="RECOVERY MODE"
      title={channel ? 'حسابت رو پس بگیر' : 'دسترسی رو برگردون'}
      subtitle={
        channel
          ? 'کد بازیابی و رمز جدید رو وارد کن؛ بعدش مستقیم می‌تونی وارد PlayNexus بشی.'
          : 'ایمیل یا شماره موبایل حساب رو بده تا مسیر بازیابی امن شروع بشه.'
      }
      tone="blue"
      step={step}>
      {!channel ? (
        <>
          <AuthFieldLabel label="ایمیل یا شماره موبایل" meta="PLAYER ID" />
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="ایمیل یا شماره موبایل"
            placeholderTextColor={palette.textDim}
            autoCapitalize="none"
            textAlign="right"
            style={authStyles.input}
          />

          <View style={styles.recoveryNote}>
            <View style={styles.recoveryIcon}>
              <Text style={styles.recoveryIconText}>↺</Text>
            </View>
            <View style={styles.recoveryCopy}>
              <Text style={styles.recoveryTitle}>Secure Recovery</Text>
              <Text style={styles.recoveryText}>
                کد بازیابی فقط برای کانال تأییدشده حساب ارسال می‌شه.
              </Text>
            </View>
          </View>

          <PressableScale
            disabled={busy || !identifier.trim()}
            onPress={() => void request()}
            style={authStyles.primary}>
            <Text style={authStyles.primaryText}>
              {busy ? 'در حال ارسال…' : 'ارسال کد بازیابی'}
            </Text>
            {!busy ? <View style={authStyles.primaryArrow} /> : null}
          </PressableScale>
        </>
      ) : (
        <>
          <View style={styles.destination}>
            <Text style={styles.destinationKicker}>
              {channel === 'email' ? 'RECOVERY EMAIL' : 'RECOVERY MOBILE'}
            </Text>
            <Text style={styles.destinationValue}>{normalized}</Text>
          </View>

          <AuthFieldLabel label="کد بازیابی" meta="6 DIGITS" />
          <TextInput
            value={code}
            onChangeText={(value) => setCode(
              value.replace(/\D/g, '').slice(0, 6),
            )}
            placeholder="• • • • • •"
            placeholderTextColor={palette.textDim}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            style={[authStyles.input, styles.code]}
          />

          <AuthFieldLabel label="رمز جدید" meta="NEW PASSWORD" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="رمز جدید"
            placeholderTextColor={palette.textDim}
            secureTextEntry
            textAlign="right"
            style={authStyles.input}
          />

          <AuthFieldLabel label="تکرار رمز" meta="CONFIRM" />
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="تکرار رمز جدید"
            placeholderTextColor={palette.textDim}
            secureTextEntry
            textAlign="right"
            style={authStyles.input}
          />

          <View style={styles.strength}>
            <View style={styles.strengthBars}>
              <View style={[styles.strengthBar, password.length >= 4 && styles.strengthBarActive]} />
              <View style={[styles.strengthBar, password.length >= 8 && styles.strengthBarActive]} />
              <View style={[styles.strengthBar, /[A-Za-z]/.test(password) && /\d/.test(password) && styles.strengthBarActive]} />
            </View>
            <Text style={styles.strengthText}>PASSWORD SIGNAL</Text>
          </View>

          <PressableScale
            disabled={busy || code.length !== 6 || !password}
            onPress={() => void reset()}
            style={authStyles.primary}>
            <Text style={authStyles.primaryText}>
              {busy ? 'در حال ثبت…' : 'ثبت رمز جدید'}
            </Text>
            {!busy ? <View style={authStyles.primaryArrow} /> : null}
          </PressableScale>
        </>
      )}

      {message ? <Text style={authStyles.message}>{message}</Text> : null}

      <PressableScale
        haptic={false}
        onPress={() => router.replace('/auth/login')}
        style={authStyles.link}>
        <Text style={authStyles.linkText}>برگشت به ورود</Text>
      </PressableScale>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  recoveryNote: {
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
  recoveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(85,169,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryIconText: {
    color: palette.blue,
    fontSize: 20,
    fontWeight: fontWeight.black,
  },
  recoveryCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recoveryTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  recoveryText: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  destination: {
    minHeight: 68,
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
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  code: {
    minHeight: 72,
    fontSize: 27,
    fontWeight: fontWeight.black,
    letterSpacing: 8,
    borderColor: 'rgba(85,169,255,0.20)',
    backgroundColor: 'rgba(85,169,255,0.04)',
  },
  strength: {
    marginTop: spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  strengthBarActive: {
    backgroundColor: palette.blue,
  },
  strengthText: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
    marginTop: 5,
    textAlign: 'right',
  },
});
