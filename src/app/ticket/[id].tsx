import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type Reply = {
  id: number;
  message: string;
  created_at?: string;
  user?: { id: number; name: string; is_admin?: boolean };
};

type Payload = {
  ticket: {
    id: number;
    number: string;
    subject: string;
    status: string;
    type?: string;
    message?: string;
    created_at?: string;
    replies?: Reply[];
  };
};

const empty: Payload = { ticket: { id: 0, number: '', subject: '', status: '', replies: [] } };

export default function TicketDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const path = '/tickets/' + encodeURIComponent(id || '');
  const { data, refresh } = useApiResource<Payload>(path, empty);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const ticket = data.ticket;

  const send = async () => {
    const value = reply.trim();
    if (value.length < 2) return;
    setSending(true);
    try {
      await apiRequest(path + '/replies', {
        method: 'POST',
        body: JSON.stringify({ message: value }),
      });
      setReply('');
      invalidateResource(path);
      await refresh();
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
            <Text style={styles.eyebrow}>{ticket.number || 'SUPPORT'}</Text>
            <Text numberOfLines={2} style={styles.title}>{ticket.subject || 'پشتیبانی'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.messages}>
          {ticket.message ? (
            <Bubble name="شما" body={ticket.message} admin={false} date={ticket.created_at} />
          ) : null}
          {(ticket.replies || []).map((item) => (
            <Bubble
              key={item.id}
              name={item.user?.is_admin ? 'پشتیبانی PlayNexus' : item.user?.name || 'شما'}
              body={item.message}
              admin={Boolean(item.user?.is_admin)}
              date={item.created_at}
            />
          ))}
        </ScrollView>

        {ticket.status !== 'closed' ? (
          <View style={styles.composer}>
            <PressableScale disabled={sending} onPress={() => void send()} style={styles.send}>
              <Text style={styles.sendText}>{sending ? '…' : 'ارسال'}</Text>
            </PressableScale>
            <TextInput
              value={reply}
              onChangeText={setReply}
              multiline
              placeholder="پاسخ بنویس…"
              placeholderTextColor={palette.textDim}
              textAlign="right"
              style={styles.input}
            />
          </View>
        ) : (
          <View style={styles.closed}><Text style={styles.closedText}>این تیکت بسته شده است.</Text></View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ name, body, admin, date }: { name: string; body: string; admin: boolean; date?: string }) {
  return (
    <View style={[styles.bubble, admin ? styles.adminBubble : styles.userBubble]}>
      <Text style={[styles.bubbleName, admin && styles.adminName]}>{name}</Text>
      <Text style={styles.bubbleBody}>{body}</Text>
      {date ? <Text style={styles.bubbleDate}>{new Date(date).toLocaleString('fa-IR')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 22, lineHeight: 29, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 3 },
  messages: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: spacing.sm },
  bubble: { maxWidth: '88%', borderRadius: radii.xl, padding: spacing.md, borderWidth: 1 },
  adminBubble: { alignSelf: 'flex-start', borderColor: 'rgba(77,163,255,0.30)', backgroundColor: 'rgba(77,163,255,0.08)' },
  userBubble: { alignSelf: 'flex-end', borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)' },
  bubbleName: { color: palette.textMuted, fontSize: typeScale.micro, fontWeight: fontWeight.bold, textAlign: 'right' },
  adminName: { color: palette.cyan },
  bubbleBody: { color: palette.text, fontSize: typeScale.bodySm, lineHeight: 23, textAlign: 'right', marginTop: 5 },
  bubbleDate: { color: palette.textDim, fontSize: 9, marginTop: spacing.sm, textAlign: 'left' },
  composer: { minHeight: 84, borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: layout.screenPadding, paddingVertical: spacing.sm, backgroundColor: palette.inkRaised, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, minHeight: 52, maxHeight: 120, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', color: palette.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  send: { minWidth: 68, height: 52, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: palette.ink, fontWeight: fontWeight.black },
  closed: { minHeight: 70, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: palette.line },
  closedText: { color: palette.textMuted },
});
