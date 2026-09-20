import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, setAccessToken } from '@/services/api';

export default function OtpLoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const request = async () => {
    try {
      const result = await apiRequest<{ identifier: string; message: string }>(
        '/auth/passwordless/request',
        { method: 'POST', body: JSON.stringify({ phone }) },
        { auth: false },
      );
      setPhone(result.identifier);
      setRequested(true);
      setMessage(result.message);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'کد ارسال نشد.');
    }
  };

  const verify = async () => {
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/profile');
    } catch (value) {
      setMessage(value instanceof Error ? value.message : 'کد صحیح نیست.');
    }
  };

  return (
    <Screen>
      <View style={styles.root}>
        <Text style={styles.eyebrow}>FAST LOGIN</Text>
        <Text style={styles.title}>ورود با کد یکبارمصرف</Text>
        <Text style={styles.subtitle}>بدون رمز، با شماره موبایل وارد شو.</Text>

        <TextInput
          value={phone}
          onChangeText={setPhone}
          editable={!requested}
          keyboardType="phone-pad"
          placeholder="09xxxxxxxxx"
          placeholderTextColor={palette.textDim}
          textAlign="center"
          style={styles.input}
        />

        {requested ? (
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="کد ۶ رقمی"
            placeholderTextColor={palette.textDim}
            textAlign="center"
            style={styles.input}
          />
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PressableScale
          onPress={() => void (requested ? verify() : request())}
          style={styles.primary}>
          <Text style={styles.primaryText}>{requested ? 'تأیید و ورود' : 'ارسال کد'}</Text>
        </PressableScale>

        {requested ? (
          <PressableScale haptic={false} onPress={() => { setRequested(false); setCode(''); }} style={styles.link}>
            <Text style={styles.linkText}>تغییر شماره</Text>
          </PressableScale>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, alignItems: 'center', gap: spacing.sm },
  eyebrow: { color: palette.cyan, fontSize: typeScale.caption, fontWeight: fontWeight.black, letterSpacing: 1.2 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { color: palette.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  input: { width: '100%', minHeight: 58, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.045)', color: palette.white, paddingHorizontal: spacing.lg, fontSize: typeScale.body },
  message: { color: palette.warning, textAlign: 'center', marginTop: spacing.sm },
  primary: { width: '100%', minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  primaryText: { color: palette.ink, fontWeight: fontWeight.black },
  link: { padding: spacing.md },
  linkText: { color: palette.textMuted, fontWeight: fontWeight.bold },
});
