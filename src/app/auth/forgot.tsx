import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
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

  const request = async () => {
    try {
      const result = await apiRequest<{ channel: Channel; identifier: string; message: string }>(
        '/auth/password/reset/request',
        { method: 'POST', body: JSON.stringify({ identifier }) },
        { auth: false },
      );
      setChannel(result.channel);
      setNormalized(result.identifier);
      setMessage(result.message);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'درخواست انجام نشد.');
    }
  };

  const reset = async () => {
    if (!channel) return;
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
      setMessage(value instanceof Error ? value.message : 'رمز عبور تغییر نکرد.');
    }
  };

  return (
    <Screen>
      <View style={styles.root}>
        <Text style={styles.eyebrow}>RECOVERY</Text>
        <Text style={styles.title}>بازیابی حساب</Text>
        <Text style={styles.subtitle}>با ایمیل یا شماره موبایل کد بازیابی بگیر.</Text>

        {!channel ? (
          <>
            <TextInput value={identifier} onChangeText={setIdentifier} placeholder="ایمیل یا شماره موبایل" placeholderTextColor={palette.textDim} autoCapitalize="none" textAlign="right" style={styles.input} />
            <PressableScale onPress={() => void request()} style={styles.primary}><Text style={styles.primaryText}>ارسال کد بازیابی</Text></PressableScale>
          </>
        ) : (
          <>
            <TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="کد ۶ رقمی" placeholderTextColor={palette.textDim} keyboardType="number-pad" textAlign="center" style={styles.input} />
            <TextInput value={password} onChangeText={setPassword} placeholder="رمز جدید" placeholderTextColor={palette.textDim} secureTextEntry textAlign="right" style={styles.input} />
            <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="تکرار رمز جدید" placeholderTextColor={palette.textDim} secureTextEntry textAlign="right" style={styles.input} />
            <PressableScale onPress={() => void reset()} style={styles.primary}><Text style={styles.primaryText}>ثبت رمز جدید</Text></PressableScale>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PressableScale haptic={false} onPress={() => router.replace('/auth/login')} style={styles.link}>
          <Text style={styles.linkText}>برگشت به ورود</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, gap: spacing.sm },
  eyebrow: { color: palette.cyan, fontSize: typeScale.caption, fontWeight: fontWeight.black, letterSpacing: 1.2, textAlign: 'right' },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, textAlign: 'right' },
  subtitle: { color: palette.textMuted, fontSize: typeScale.bodySm, lineHeight: 22, textAlign: 'right', marginBottom: spacing.xl },
  input: { minHeight: 58, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.045)', color: palette.white, paddingHorizontal: spacing.lg, fontSize: typeScale.bodySm },
  primary: { minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryText: { color: palette.ink, fontWeight: fontWeight.black },
  message: { color: palette.warning, fontSize: typeScale.caption, lineHeight: 20, textAlign: 'right', marginTop: spacing.sm },
  link: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: palette.textMuted, fontWeight: fontWeight.bold },
});
