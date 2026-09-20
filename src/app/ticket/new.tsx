import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

export default function NewTicketScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || message.trim().length < 10) return;
    setSending(true);
    setError(null);

    try {
      const result = await apiRequest<{ ticket: { id: number } }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'support',
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      invalidateResource('/tickets');
      router.replace({ pathname: '/ticket/[id]', params: { id: String(result.ticket.id) } });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'تیکت ثبت نشد.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>NEW TICKET</Text>
            <Text style={styles.title}>درخواست پشتیبانی</Text>
          </View>
        </View>

        <View style={styles.form}>
          <TextInput value={subject} onChangeText={setSubject} placeholder="موضوع" placeholderTextColor={palette.textDim} textAlign="right" style={styles.input} />
          <TextInput value={message} onChangeText={setMessage} placeholder="مشکل یا سوال رو دقیق بنویس…" placeholderTextColor={palette.textDim} multiline textAlign="right" textAlignVertical="top" style={[styles.input, styles.message]} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PressableScale disabled={sending} style={styles.send} onPress={() => void send()}>
            <Text style={styles.sendText}>{sending ? 'در حال ثبت…' : 'ثبت تیکت'}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 28, fontWeight: fontWeight.black, marginTop: 3 },
  form: { flex: 1, paddingHorizontal: layout.screenPadding, gap: spacing.sm },
  input: { minHeight: 58, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', color: palette.white, paddingHorizontal: spacing.lg, fontSize: typeScale.body },
  message: { minHeight: 190, paddingTop: spacing.lg },
  error: { color: palette.danger, textAlign: 'right', fontSize: typeScale.caption },
  send: { minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  sendText: { color: palette.ink, fontWeight: fontWeight.black },
});
