import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type MediaAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  type?: 'image' | 'video';
};

type CreateContext = {
  exchange_product?: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string | null;
  } | null;
};

export default function NewTicketScreen() {
  const params = useLocalSearchParams<{ type?: string; product_id?: string }>();
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const rawProductId = Array.isArray(params.product_id) ? params.product_id[0] : params.product_id;
  const productId = Number(rawProductId || 0) || null;
  const exchange = requestedType === 'exchange' && Boolean(productId);

  const contextPath = exchange
    ? '/tickets/create-context?exchange_product=' + productId
    : '/tickets/create-context';

  const { data: context } = useApiResource<CreateContext>(contextPath, {
    exchange_product: null,
  });

  const [subject, setSubject] = useState('');
  const [tradeTitle, setTradeTitle] = useState('');
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (message.trim().length < 10) return false;
    if (exchange) return tradeTitle.trim().length >= 2 && media.length > 0;
    return subject.trim().length > 0;
  }, [exchange, media.length, message, subject, tradeTitle]);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - media.length),
      quality: 0.9,
    });

    if (result.canceled) return;

    const next = result.assets.slice(0, 5 - media.length).map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      type: asset.type === 'video' ? 'video' as const : 'image' as const,
    }));

    setMedia((current) => [...current, ...next].slice(0, 5));
  };

  const removeMedia = (uri: string) => {
    setMedia((current) => current.filter((item) => item.uri !== uri));
  };

  const send = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError(null);

    try {
      let result: { ticket: { id: number } };

      if (exchange && productId) {
        const form = new FormData();
        form.append('type', 'exchange');
        form.append('product_id', String(productId));
        form.append('trade_item_title', tradeTitle.trim());
        form.append('message', message.trim());

        media.forEach((asset, index) => {
          const extension = asset.fileName?.split('.').pop()
            || (asset.type === 'video' ? 'mp4' : 'jpg');
          const name = asset.fileName || `playnexus-exchange-${Date.now()}-${index}.${extension}`;
          const type = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

          form.append('attachments[]', {
            uri: asset.uri,
            name,
            type,
          } as never);
        });

        result = await apiRequest<{ ticket: { id: number } }>(
          '/tickets',
          { method: 'POST', body: form },
          { timeoutMs: 90_000 },
        );
      } else {
        result = await apiRequest<{ ticket: { id: number } }>('/tickets', {
          method: 'POST',
          body: JSON.stringify({
            type: 'support',
            subject: subject.trim(),
            message: message.trim(),
          }),
        });
      }

      invalidateResource('/tickets');
      router.replace({
        pathname: '/ticket/[id]',
        params: { id: String(result.ticket.id) },
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'درخواست ثبت نشد.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </PressableScale>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{exchange ? 'TRADE REQUEST' : 'NEW TICKET'}</Text>
            <Text style={styles.title}>{exchange ? 'درخواست معاوضه' : 'درخواست پشتیبانی'}</Text>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}>
          {exchange && context.exchange_product ? (
            <View style={styles.target}>
              <View style={styles.targetCopy}>
                <Text style={styles.targetLabel}>محصول مقصد</Text>
                <Text style={styles.targetTitle}>{context.exchange_product.title}</Text>
              </View>
              {context.exchange_product.cover_url ? (
                <Image
                  source={{ uri: context.exchange_product.cover_url }}
                  style={styles.targetImage}
                  contentFit="cover"
                />
              ) : null}
            </View>
          ) : null}

          {exchange ? (
            <TextInput
              value={tradeTitle}
              onChangeText={setTradeTitle}
              placeholder="چی می‌خوای معاوضه کنی؟ مثلاً دیسک RDR2 PS5"
              placeholderTextColor={palette.textDim}
              textAlign="right"
              style={styles.input}
            />
          ) : (
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="موضوع"
              placeholderTextColor={palette.textDim}
              textAlign="right"
              style={styles.input}
            />
          )}

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={
              exchange
                ? 'وضعیت کالا، ریجن، خط‌وخش یا هر چیزی که باید بدانیم را دقیق بنویس…'
                : 'مشکل یا سوال رو دقیق بنویس…'
            }
            placeholderTextColor={palette.textDim}
            multiline
            textAlign="right"
            textAlignVertical="top"
            style={[styles.input, styles.message]}
          />

          {exchange ? (
            <>
              <View style={styles.mediaHeader}>
                <Chip label={media.length + ' / 5'} active={media.length > 0} />
                <View style={styles.mediaHeaderCopy}>
                  <Text style={styles.mediaTitle}>عکس یا ویدیو واقعی کالا</Text>
                  <Text style={styles.mediaHint}>حداقل یک فایل؛ حداکثر ۵ فایل</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaRail}>
                <PressableScale onPress={() => void pickMedia()} style={styles.addMedia}>
                  <Text style={styles.addMediaPlus}>+</Text>
                  <Text style={styles.addMediaText}>انتخاب فایل</Text>
                </PressableScale>

                {media.map((asset) => (
                  <View key={asset.uri} style={styles.mediaItem}>
                    {asset.type === 'image' ? (
                      <Image source={{ uri: asset.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Text style={styles.videoIcon}>▶</Text>
                        <Text style={styles.videoLabel}>VIDEO</Text>
                      </View>
                    )}
                    <PressableScale
                      haptic={false}
                      onPress={() => removeMedia(asset.uri)}
                      style={styles.removeMedia}>
                      <Text style={styles.removeMediaText}>×</Text>
                    </PressableScale>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PressableScale
            disabled={sending || !canSubmit}
            style={[styles.send, (!canSubmit || sending) && styles.sendDisabled]}
            onPress={() => void send()}>
            <Text style={styles.sendText}>
              {sending
                ? 'در حال ارسال…'
                : exchange
                  ? 'ارسال درخواست معاوضه'
                  : 'ثبت تیکت'}
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 28, fontWeight: fontWeight.black, marginTop: 3 },
  form: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 80,
    gap: spacing.sm,
  },
  target: {
    minHeight: 90,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.28)',
    backgroundColor: 'rgba(77,163,255,0.07)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  targetCopy: { flex: 1, alignItems: 'flex-end' },
  targetLabel: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  targetTitle: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: 4,
  },
  targetImage: { width: 66, height: 66, borderRadius: 16, backgroundColor: palette.surface },
  input: {
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: palette.white,
    paddingHorizontal: spacing.lg,
    fontSize: typeScale.body,
  },
  message: { minHeight: 164, paddingTop: spacing.lg },
  mediaHeader: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mediaHeaderCopy: { flex: 1, alignItems: 'flex-end' },
  mediaTitle: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.black },
  mediaHint: { color: palette.textDim, fontSize: typeScale.micro, marginTop: 3 },
  mediaRail: { gap: spacing.sm, paddingVertical: spacing.sm },
  addMedia: {
    width: 116,
    height: 116,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(77,163,255,0.38)',
    backgroundColor: 'rgba(77,163,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaPlus: { color: palette.cyan, fontSize: 30, fontWeight: fontWeight.regular },
  addMediaText: { color: palette.textMuted, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  mediaItem: {
    width: 116,
    height: 116,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  removeMedia: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(5,7,11,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: { color: palette.white, fontSize: 20, lineHeight: 22 },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  videoIcon: { color: palette.cyan, fontSize: 24 },
  videoLabel: { color: palette.textMuted, fontSize: 9, fontWeight: fontWeight.black },
  error: { color: palette.danger, textAlign: 'right', fontSize: typeScale.caption, marginTop: spacing.sm },
  send: {
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  sendDisabled: { opacity: 0.42 },
  sendText: { color: palette.ink, fontWeight: fontWeight.black },
});
