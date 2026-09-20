import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
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
    if (!firstName.trim() || !lastName.trim() || !identifier.trim() || !password) return;
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
            ...(channel === 'email' ? { email: identifier.trim() } : { phone: identifier.trim() }),
            password,
            password_confirmation: confirmation,
          }),
        },
        { auth: false },
      );

      router.replace({
        pathname: '/auth/verify',
        params: { channel: result.channel, identifier: result.identifier },
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ثبت‌نام انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>NEW PLAYER</Text>
            <Text style={styles.title}>PlayNexus ID بساز</Text>
            <Text style={styles.subtitle}>حساب تو بین وب و اپ مشترکه؛ تجربه موبایل کاملاً جداست.</Text>
          </View>

          <View style={styles.switcher}>
            <Chip label="موبایل" active={channel === 'mobile'} onPress={() => { setChannel('mobile'); setIdentifier(''); }} />
            <Chip label="ایمیل" active={channel === 'email'} onPress={() => { setChannel('email'); setIdentifier(''); }} />
          </View>

          <View style={styles.form}>
            <TextInput value={firstName} onChangeText={setFirstName} placeholder="نام" placeholderTextColor={palette.textDim} textAlign="right" style={styles.input} />
            <TextInput value={lastName} onChangeText={setLastName} placeholder="نام خانوادگی" placeholderTextColor={palette.textDim} textAlign="right" style={styles.input} />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={channel === 'email' ? 'ایمیل' : 'شماره موبایل 09...'}
              placeholderTextColor={palette.textDim}
              keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              textAlign="right"
              style={styles.input}
            />
            <TextInput value={password} onChangeText={setPassword} placeholder="رمز عبور (حداقل ۸ کاراکتر، حرف و عدد)" placeholderTextColor={palette.textDim} secureTextEntry textAlign="right" style={styles.input} />
            <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="تکرار رمز عبور" placeholderTextColor={palette.textDim} secureTextEntry textAlign="right" style={styles.input} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PressableScale disabled={submitting} onPress={() => void register()} style={styles.primary}>
              <Text style={styles.primaryText}>{submitting ? 'در حال ساخت حساب…' : 'ساخت حساب'}</Text>
            </PressableScale>
            <PressableScale haptic={false} onPress={() => router.replace('/auth/login')} style={styles.link}>
              <Text style={styles.linkText}>حساب داری؟ ورود</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 44 },
  header: { alignItems: 'flex-end', marginBottom: spacing.xl },
  eyebrow: { color: palette.cyan, fontSize: typeScale.caption, fontWeight: fontWeight.black, letterSpacing: 1.2 },
  title: { color: palette.white, fontSize: 32, lineHeight: 40, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.sm },
  subtitle: { color: palette.textMuted, fontSize: typeScale.bodySm, lineHeight: 23, textAlign: 'right', marginTop: spacing.sm },
  switcher: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  form: { gap: spacing.sm },
  input: { minHeight: 56, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.045)', color: palette.white, paddingHorizontal: spacing.lg, fontSize: typeScale.bodySm },
  primary: { minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryText: { color: palette.ink, fontWeight: fontWeight.black },
  link: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: palette.textMuted, fontWeight: fontWeight.bold },
  error: { color: palette.danger, fontSize: typeScale.caption, textAlign: 'right' },
});
