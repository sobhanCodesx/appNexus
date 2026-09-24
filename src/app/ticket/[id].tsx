import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type Attachment = {
  id: number;
  original_name?: string | null;
  mime_type?: string | null;
  type?: string | null;
  size?: number | null;
  url?: string | null;
};

type Reply = {
  id: number;
  message: string;
  created_at?: string;
  user?: { id: number; name: string; is_admin?: boolean };
  is_admin?: boolean;
  attachments?: Attachment[];
};

type Ticket = {
  id: number;
  number: string;
  subject?: string | null;
  status: string;
  type?: string;
  message?: string;
  created_at?: string;
  exchange_status?: string | null;
  exchange_offer_amount?: number | null;
  exchange_credit_expires_at?: string | null;
  trade_item_title?: string | null;
  target_product?: { id: number; title: string; slug: string } | null;
  exchange_order?: { id: number; number: string } | null;
  replies?: Reply[];
};

type Payload = { ticket: Ticket };
const empty: Payload = { ticket: { id: 0, number: '', status: '', replies: [] } };

type Picked = { uri: string; name: string; type: string; kind: 'image' | 'video' };

export default function TicketDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const path = '/tickets/' + encodeURIComponent(id || '');
  const { data, refresh } = useApiResource<Payload>(path, empty);
  const [reply, setReply] = useState('');
  const [attachments, setAttachments] = useState<Picked[]>([]);
  const [sending, setSending] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const ticket = data.ticket;

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - attachments.length),
      quality: 0.9,
    });
    if (result.canceled) return;
    const next = result.assets.slice(0, 5 - attachments.length).map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `playnexus-reply-${Date.now()}-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      kind: asset.type === 'video' ? 'video' as const : 'image' as const,
    }));
    setAttachments((current) => [...current, ...next].slice(0, 5));
  };

  const send = async () => {
    const value = reply.trim();
    if (value.length < 2) return;
    setSending(true);
    setMessage(null);
    try {
      if (attachments.length) {
        const form = new FormData();
        form.append('message', value);
        attachments.forEach((item) => {
          form.append('attachments[]', {
            uri: item.uri,
            name: item.name,
            type: item.type,
          } as never);
        });
        await apiRequest(path + '/replies', { method: 'POST', body: form }, { timeoutMs: 90_000 });
      } else {
        await apiRequest(path + '/replies', {
          method: 'POST',
          body: JSON.stringify({ message: value }),
        });
      }
      setReply('');
      setAttachments([]);
      invalidateResource(path);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'پاسخ ثبت نشد.');
    } finally {
      setSending(false);
    }
  };

  const decide = async (decision: 'accepted' | 'rejected') => {
    setDecisionBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>(path + '/exchange-response', {
        method: 'PATCH',
        body: JSON.stringify({ decision }),
      });
      setMessage(result.message);
      invalidateResource(path);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'پاسخ معاوضه ثبت نشد.');
    } finally {
      setDecisionBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </PressableScale>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{ticket.number || 'SUPPORT'}</Text>
            <Text numberOfLines={2} style={styles.title}>{ticket.subject || ticket.trade_item_title || 'پشتیبانی'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.messages}>
          {ticket.type === 'exchange' ? <ExchangePanel ticket={ticket} busy={decisionBusy} onDecision={decide} /> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {ticket.message ? (
            <Bubble name="شما" body={ticket.message} admin={false} date={ticket.created_at} />
          ) : null}

          {(ticket.replies || []).map((item) => (
            <Bubble
              key={item.id}
              name={item.user?.is_admin || item.is_admin ? 'پشتیبانی PlayNexus' : item.user?.name || 'شما'}
              body={item.message}
              admin={Boolean(item.user?.is_admin || item.is_admin)}
              date={item.created_at}
              attachments={item.attachments}
            />
          ))}
        </ScrollView>

        {ticket.status !== 'closed' ? (
          <View style={styles.composerWrap}>
            {attachments.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickedRow}>
                {attachments.map((item) => (
                  <PressableScale
                    key={item.uri}
                    haptic={false}
                    onPress={() => setAttachments((current) => current.filter((row) => row.uri !== item.uri))}
                    style={styles.picked}>
                    {item.kind === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.pickedImage} contentFit="cover" />
                    ) : (
                      <View style={styles.videoPicked}><Text style={styles.videoPickedText}>VIDEO</Text></View>
                    )}
                    <View style={styles.removeBadge}><Text style={styles.removeBadgeText}>×</Text></View>
                  </PressableScale>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.composer}>
              <PressableScale haptic={false} onPress={() => void pick()} style={styles.attachButton}>
                <Text style={styles.attachText}>＋</Text>
              </PressableScale>
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
          </View>
        ) : (
          <View style={styles.closed}><Text style={styles.closedText}>این تیکت بسته شده است.</Text></View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ExchangePanel({
  ticket,
  busy,
  onDecision,
}: {
  ticket: Ticket;
  busy: boolean;
  onDecision: (decision: 'accepted' | 'rejected') => void;
}) {
  const offered = ticket.exchange_status === 'offered';
  return (
    <View style={styles.exchange}>
      <Text style={styles.exchangeKicker}>EXCHANGE STATUS</Text>
      <Text style={styles.exchangeTitle}>
        {ticket.exchange_status || 'pending_review'}
      </Text>
      {ticket.exchange_offer_amount ? (
        <Text style={styles.offer}>{ticket.exchange_offer_amount.toLocaleString('fa-IR')} تومان اعتبار</Text>
      ) : null}
      {ticket.target_product ? <Text style={styles.exchangeMeta}>محصول مقصد: {ticket.target_product.title}</Text> : null}
      {ticket.exchange_credit_expires_at ? (
        <Text style={styles.exchangeMeta}>اعتبار تا {new Date(ticket.exchange_credit_expires_at).toLocaleString('fa-IR')}</Text>
      ) : null}
      {offered ? (
        <View style={styles.decisionRow}>
          <PressableScale disabled={busy} onPress={() => onDecision('accepted')} style={styles.accept}>
            <Text style={styles.acceptText}>پذیرش پیشنهاد</Text>
          </PressableScale>
          <PressableScale disabled={busy} onPress={() => onDecision('rejected')} style={styles.reject}>
            <Text style={styles.rejectText}>رد پیشنهاد</Text>
          </PressableScale>
        </View>
      ) : null}
      {ticket.exchange_order ? (
        <PressableScale
          style={styles.orderLink}
          onPress={() => router.push({ pathname: '/order/[id]', params: { id: String(ticket.exchange_order!.id) } })}>
          <Text style={styles.orderLinkText}>سفارش معاوضه {ticket.exchange_order.number}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

function Bubble({
  name,
  body,
  admin,
  date,
  attachments,
}: {
  name: string;
  body: string;
  admin: boolean;
  date?: string;
  attachments?: Attachment[];
}) {
  return (
    <View style={[styles.bubble, admin ? styles.adminBubble : styles.userBubble]}>
      <Text style={[styles.bubbleName, admin && styles.adminName]}>{name}</Text>
      <Text style={styles.bubbleBody}>{body}</Text>
      {(attachments || []).length ? (
        <View style={styles.attachmentList}>
          {(attachments || []).map((item) => (
            <View key={item.id} style={styles.attachment}>
              {item.type === 'image' && item.url ? (
                <Image source={{ uri: item.url }} style={styles.attachmentImage} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={styles.fileAttachment}>
                  <Text style={styles.fileType}>{item.type === 'video' ? 'VIDEO' : 'FILE'}</Text>
                  <Text numberOfLines={1} style={styles.fileName}>{item.original_name || 'attachment'}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}
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
  eyebrow: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 22, lineHeight: 29, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 3 },
  messages: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: spacing.sm },
  exchange: { borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.05)', padding: spacing.lg, alignItems: 'flex-end', marginBottom: spacing.md },
  exchangeKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  exchangeTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 4 },
  offer: { color: palette.success, fontFamily: fontFamily.black, fontSize: 20, marginTop: spacing.sm },
  exchangeMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 4, textAlign: 'right' },
  decisionRow: { width: '100%', flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  accept: { flex: 1, minHeight: 48, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: palette.ink, fontFamily: fontFamily.black },
  reject: { flex: 1, minHeight: 48, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255,97,120,0.25)', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: palette.danger, fontFamily: fontFamily.black },
  orderLink: { marginTop: spacing.md, minHeight: 42, paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.line, justifyContent: 'center' },
  orderLinkText: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 11 },
  message: { color: palette.warning, fontFamily: fontFamily.regular, textAlign: 'right' },
  bubble: { maxWidth: '88%', borderRadius: radii.xl, padding: spacing.md, borderWidth: 1 },
  adminBubble: { alignSelf: 'flex-start', borderColor: 'rgba(77,163,255,0.30)', backgroundColor: 'rgba(77,163,255,0.08)' },
  userBubble: { alignSelf: 'flex-end', borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)' },
  bubbleName: { color: palette.textMuted, fontFamily: fontFamily.bold, fontSize: typeScale.micro, fontWeight: fontWeight.bold, textAlign: 'right' },
  adminName: { color: palette.cyan },
  bubbleBody: { color: palette.text, fontFamily: fontFamily.regular, fontSize: typeScale.bodySm, lineHeight: 23, textAlign: 'right', marginTop: 5 },
  bubbleDate: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, marginTop: spacing.sm, textAlign: 'left' },
  attachmentList: { gap: spacing.xs, marginTop: spacing.sm },
  attachment: { borderRadius: radii.md, overflow: 'hidden' },
  attachmentImage: { width: 180, height: 130, borderRadius: radii.md, backgroundColor: palette.surface },
  fileAttachment: { minWidth: 180, minHeight: 58, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, padding: spacing.sm, alignItems: 'flex-end' },
  fileType: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8 },
  fileName: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 4 },
  composerWrap: { borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.inkRaised },
  pickedRow: { gap: spacing.xs, paddingHorizontal: layout.screenPadding, paddingTop: spacing.xs },
  picked: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: palette.line },
  pickedImage: { flex: 1 },
  videoPicked: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  videoPickedText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8 },
  removeBadge: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(3,5,9,0.82)', alignItems: 'center', justifyContent: 'center' },
  removeBadgeText: { color: palette.white, fontSize: 15 },
  composer: { minHeight: 84, paddingHorizontal: layout.screenPadding, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, minHeight: 52, maxHeight: 120, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', color: palette.white, fontFamily: fontFamily.regular, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  attachButton: { width: 48, height: 52, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  attachText: { color: palette.cyan, fontSize: 25 },
  send: { minWidth: 68, height: 52, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: palette.ink, fontFamily: fontFamily.black, fontWeight: fontWeight.black },
  closed: { minHeight: 70, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: palette.line },
  closedText: { color: palette.textMuted, fontFamily: fontFamily.regular },
});
