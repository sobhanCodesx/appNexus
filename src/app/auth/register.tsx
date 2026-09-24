import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AuthFieldLabel,
  AuthScaffold,
  authStyles,
} from '@/components/auth/auth-scaffold';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';

type RegisterResponse = {
  verification_required: boolean;
  channel: 'email' | 'mobile';
  identifier: string;
  message: string;
};

export default function RegisterScreen() {
  const [channel, setChannel] = useState<'email' | 'mobile'>('mobile');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    if (
      !firstName.trim()
      || !lastName.trim()
      || !identifier.trim()
      || !password
    ) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<RegisterResponse>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            channel,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            ...(channel === 'email'
              ? { email: identifier.trim() }
              : { phone: identifier.trim() }),
            password,
            password_confirmation: confirmation,
          }),
        },
        { auth: false },
      );

      router.replace({
        pathname: '/auth/verify',
        params: {
          channel: result.channel,
          identifier: result.identifier,
        },
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ثبت‌نام انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      kicker="NEW PLAYER"
      title="هویت گیمینگت رو بساز"
      subtitle="PlayNexus ID کل تجربه شخصی تو رو بین وب و اپ نگه می‌داره، ولی رابط موبایل کاملاً مال خودشه."
      tone="violet"
      step="CREATE ID">
      <View style={styles.channelBlock}>
        <View style={styles.channelHeading}>
          <Text style={styles.channelKicker}>VERIFY WITH</Text>
          <Text style={styles.channelTitle}>روش ساخت حساب</Text>
        </View>

        <View style={styles.switcher}>
          <Chip
            label="شماره موبایل"
            active={channel === 'mobile'}
            onPress={() => {
              setChannel('mobile');
              setIdentifier('');
            }}
          />
          <Chip
            label="ایمیل"
            active={channel === 'email'}
            onPress={() => {
              setChannel('email');
              setIdentifier('');
            }}
          />
        </View>
      </View>

      <View style={styles.nameRow}>
        <View style={styles.half}>
          <AuthFieldLabel label="نام" />
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="نام"
            placeholderTextColor={palette.textDim}
            textAlign="right"
            style={authStyles.input}
          />
        </View>

        <View style={styles.half}>
          <AuthFieldLabel label="نام خانوادگی" />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="نام خانوادگی"
            placeholderTextColor={palette.textDim}
            textAlign="right"
            style={authStyles.input}
          />
        </View>
      </View>

      <AuthFieldLabel
        label={channel === 'email' ? 'ایمیل' : 'شماره موبایل'}
        meta={channel === 'email' ? 'EMAIL' : 'MOBILE'}
      />
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        placeholder={channel === 'email' ? 'name@example.com' : '09xxxxxxxxx'}
        placeholderTextColor={palette.textDim}
        keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
        textAlign="right"
        style={authStyles.input}
      />

      <AuthFieldLabel label="رمز عبور" meta="8+ CHARACTERS" />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="حرف و عدد"
        placeholderTextColor={palette.textDim}
        secureTextEntry
        textAlign="right"
        style={authStyles.input}
      />

      <AuthFieldLabel label="تکرار رمز عبور" meta="CONFIRM" />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="دوباره وارد کن"
        placeholderTextColor={palette.textDim}
        secureTextEntry
        textAlign="right"
        style={authStyles.input}
      />

      <View style={styles.securityNote}>
        <View style={styles.securityIcon}>
          <Text style={styles.securityIconText}>✓</Text>
        </View>
        <View style={styles.securityCopy}>
          <Text style={styles.securityTitle}>PlayNexus ID امن</Text>
          <Text style={styles.securityText}>
            بعد از ثبت، یک کد تأیید برای همین روش ارسال می‌شه.
          </Text>
        </View>
      </View>

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <PressableScale
        disabled={submitting}
        onPress={() => void register()}
        style={authStyles.primary}>
        <Text style={authStyles.primaryText}>
          {submitting ? 'در حال ساخت حساب…' : 'ساخت PlayNexus ID'}
        </Text>
        {!submitting ? <View style={authStyles.primaryArrow} /> : null}
      </PressableScale>

      <PressableScale
        haptic={false}
        onPress={() => router.replace('/auth/login')}
        style={authStyles.link}>
        <Text style={authStyles.linkText}>حساب داری؟ ورود به PlayNexus</Text>
      </PressableScale>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  channelBlock: {
    paddingBottom: spacing.xs,
  },
  channelHeading: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  channelKicker: {
    color: palette.violet,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  channelTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  switcher: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
    gap: spacing.xs,
  },
  securityNote: {
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.15)',
    backgroundColor: 'rgba(167,123,255,0.045)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(167,123,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIconText: {
    color: palette.violet,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  securityCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  securityTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  securityText: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
});
