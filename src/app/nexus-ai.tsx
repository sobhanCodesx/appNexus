import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  fontFamily,
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { ApiError, apiRequest } from '@/services/api';
import { getAppMeta, type MobileAppMeta } from '@/services/app-meta';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  answer: string;
  conversation_id?: string | null;
  remaining_today?: number | null;
};

const QUICK_PROMPTS = [
  { title: 'چی بازی کنم؟', text: 'یه بازی جهان‌باز خفن برای PS5 پیشنهاد بده', glyph: '◈' },
  { title: 'پرفورمنس', text: 'فرق Performance Mode و Quality Mode روی PS5 چیه؟', glyph: '⚡' },
  { title: 'انتخاب دقیق', text: 'بین دو بازی که می‌گم کمکم کن انتخاب کنم', glyph: '◎' },
  { title: 'لور بدون اسپویل', text: 'می‌خوام لور یک بازی رو بدون اسپویل بفهمم', glyph: '◇' },
];

function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    const payload = error.payload as { error?: string } | undefined;
    if (payload?.error === 'daily_limit_reached') {
      return 'سهمیه امروزت تموم شده؛ فردا دوباره خودکار شارژ می‌شه.';
    }
    if (payload?.error === 'upstream_unavailable') {
      return 'Nexus AI موقتاً در دسترس نیست. چند لحظه دیگه دوباره امتحان کن.';
    }
    return error.message;
  }

  return 'یه اختلال کوتاه پیش اومد. دوباره بفرست.';
}

function readableMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .trim();
}

export default function NexusAiScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [meta, setMeta] = useState<MobileAppMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getAppMeta(true)
      .then((value) => {
        if (alive) setMeta(value);
      })
      .catch(() => {
        if (alive) setMeta(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, busy]);

  const ai = meta?.nexus_ai;
  const available = Boolean(ai?.enabled && ai?.page_enabled);
  const title = ai?.title || 'Nexus AI';
  const status = ai?.status_text || 'PLAYNEXUS INTELLIGENCE';

  const history = useMemo(
    () => messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    [messages],
  );

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy || !available) return;

    setInput('');
    setError(null);
    setBusy(true);
    setMessages((current) => [...current, { role: 'user', content: text }]);

    try {
      const result = await apiRequest<ChatResponse>(
        '/nexus-ai/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            history,
            ...(conversationId ? { conversation_id: conversationId } : {}),
          }),
        },
        { timeoutMs: 28_000 },
      );

      setConversationId(result.conversation_id || conversationId);
      setRemaining(typeof result.remaining_today === 'number' ? result.remaining_today : null);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.answer || 'جوابی دریافت نشد.' },
      ]);
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setBusy(false);
    }
  };

  if (meta && !available) {
    return (
      <Screen>
        <View style={styles.disabled}>
          <View style={styles.disabledOrb}><Text style={styles.disabledGlyph}>✦</Text></View>
          <Text style={styles.disabledKicker}>NEXUS AI OFFLINE</Text>
          <Text style={styles.disabledTitle}>هوش مصنوعی فعلاً غیرفعاله</Text>
          <Text style={styles.disabledText}>
            این بخش از تنظیمات PlayNexus کنترل می‌شه و هر وقت دوباره فعالش کنی، همین‌جا برمی‌گرده.
          </Text>
          <PressableScale style={styles.backAction} onPress={() => router.back()}>
            <Text style={styles.backActionText}>برگشت</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backGlyph}>‹</Text>
          </PressableScale>

          <View style={styles.headerCopy}>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.aiMark}>
            <LinearGradient
              colors={['#7C4DFF', '#1CC8FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.aiMarkText}>✦</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {!messages.length ? (
            <View style={styles.welcome}>
              <View style={styles.heroOrb}>
                <LinearGradient
                  colors={['rgba(124,77,255,0.88)', 'rgba(28,200,255,0.88)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.heroOrbGlyph}>✦</Text>
              </View>
              <Text style={styles.welcomeKicker}>YOUR GAMING COPILOT</Text>
              <Text style={styles.welcomeTitle}>{ai?.welcome_title || 'چی تو ذهنت داری؟'}</Text>
              <Text style={styles.welcomeText}>
                {ai?.welcome_text || ai?.description || 'درباره بازی، انتخاب، لور و پرفورمنس ازم بپرس.'}
              </Text>

              <View style={styles.promptGrid}>
                {QUICK_PROMPTS.map((prompt) => (
                  <PressableScale
                    key={prompt.title}
                    disabled={!available || busy}
                    onPress={() => void send(prompt.text)}
                    style={styles.prompt}>
                    <Text style={styles.promptGlyph}>{prompt.glyph}</Text>
                    <View style={styles.promptCopy}>
                      <Text style={styles.promptTitle}>{prompt.title}</Text>
                      <Text numberOfLines={2} style={styles.promptText}>{prompt.text}</Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.thread}>
              {messages.map((message, index) => (
                <View
                  key={message.role + '-' + index}
                  style={[
                    styles.messageRow,
                    message.role === 'user' ? styles.userRow : styles.assistantRow,
                  ]}>
                  {message.role === 'assistant' ? (
                    <View style={styles.miniAi}><Text style={styles.miniAiText}>✦</Text></View>
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}>
                    <Text
                      selectable
                      style={[
                        styles.messageText,
                        message.role === 'user' && styles.userText,
                      ]}>
                      {readableMarkdown(message.content)}
                    </Text>
                  </View>
                </View>
              ))}

              {busy ? (
                <View style={[styles.messageRow, styles.assistantRow]}>
                  <View style={styles.miniAi}><Text style={styles.miniAiText}>✦</Text></View>
                  <View style={[styles.bubble, styles.assistantBubble, styles.thinking]}>
                    <View style={styles.thinkingDot} />
                    <View style={styles.thinkingDot} />
                    <View style={styles.thinkingDot} />
                    <Text style={styles.thinkingText}>داره فکر می‌کنه…</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        <View style={styles.composerWrap}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.composerMeta}>
            <Text style={styles.composerHint}>بدون اسپویل مگر اینکه خودت بخوای</Text>
            {remaining !== null ? (
              <Text style={styles.remaining}>{remaining.toLocaleString('fa-IR')} پیام امروز</Text>
            ) : null}
          </View>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={available && !busy}
              maxLength={1600}
              multiline
              textAlign="right"
              placeholder="مثلاً: برای PS5 یک جهان‌باز اتمسفریک چی بازی کنم؟"
              placeholderTextColor="rgba(222,230,242,0.28)"
              style={styles.input}
            />
            <PressableScale
              disabled={!available || busy || !input.trim()}
              onPress={() => void send()}
              style={[styles.send, (!available || busy || !input.trim()) && styles.sendDisabled]}>
              <LinearGradient
                colors={['#7C4DFF', '#168DFF']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.sendText}>↑</Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 82,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  back: {
    width: 44, height: 44, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center', justifyContent: 'center',
  },
  backGlyph: { color: palette.white, fontSize: 28, lineHeight: 30 },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.success },
  statusText: {
    color: palette.textDim, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.8,
  },
  title: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: 23, marginTop: 2,
  },
  aiMark: {
    width: 48, height: 48, borderRadius: 18, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', ...shadow.cyanGlow,
  },
  aiMarkText: { color: palette.white, fontSize: 22 },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, paddingBottom: spacing.xl },
  welcome: {
    flex: 1, minHeight: 560, paddingHorizontal: layout.screenPadding,
    alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl,
  },
  heroOrb: {
    width: 76, height: 76, borderRadius: 27, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', ...shadow.glow,
  },
  heroOrbGlyph: { color: palette.white, fontSize: 31 },
  welcomeKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8,
    letterSpacing: 1.1, marginTop: spacing.lg,
  },
  welcomeTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: 28, lineHeight: 36, textAlign: 'center', marginTop: 5,
  },
  welcomeText: {
    maxWidth: 330, color: palette.textMuted, fontFamily: fontFamily.regular,
    fontSize: 12, lineHeight: 23, textAlign: 'center', marginTop: spacing.sm,
  },
  promptGrid: { width: '100%', gap: 8, marginTop: spacing.xl },
  prompt: {
    minHeight: 74, borderRadius: radii.xl, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.028)',
    padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  promptGlyph: {
    width: 42, textAlign: 'center', color: palette.cyan, fontSize: 20,
  },
  promptCopy: { flex: 1, alignItems: 'flex-end' },
  promptTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontSize: 12,
  },
  promptText: {
    color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9,
    lineHeight: 16, textAlign: 'right', marginTop: 2,
  },
  thread: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.lg, gap: 14 },
  messageRow: { width: '100%', flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-start' },
  assistantRow: { justifyContent: 'flex-end' },
  miniAi: {
    width: 30, height: 30, borderRadius: 11, backgroundColor: 'rgba(88,244,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  miniAiText: { color: palette.cyan, fontSize: 13 },
  bubble: { maxWidth: '84%', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: {
    backgroundColor: '#6147E8', borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 6,
  },
  messageText: {
    color: '#DDE5F1', fontFamily: fontFamily.regular, fontSize: 13,
    lineHeight: 24, textAlign: 'right',
  },
  userText: { color: palette.white },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48 },
  thinkingDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.violet },
  thinkingText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 9, marginLeft: 4 },
  composerWrap: {
    paddingHorizontal: layout.screenPadding, paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 12 : 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(3,5,9,0.98)',
  },
  error: {
    color: '#FF8799', fontFamily: fontFamily.medium, fontSize: 10,
    textAlign: 'right', marginBottom: 6,
  },
  composerMeta: {
    minHeight: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 5,
  },
  composerHint: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 8 },
  remaining: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 8 },
  composer: {
    minHeight: 58, maxHeight: 132, borderRadius: 21, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 6,
  },
  input: {
    flex: 1, minHeight: 46, maxHeight: 116, color: palette.white,
    fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 20,
    paddingHorizontal: 10, paddingVertical: 12,
  },
  send: {
    width: 46, height: 46, borderRadius: 16, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.35 },
  sendText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 22, lineHeight: 24 },
  disabled: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  disabledOrb: {
    width: 76, height: 76, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center',
  },
  disabledGlyph: { color: palette.textDim, fontSize: 28 },
  disabledKicker: {
    color: palette.textDim, fontFamily: fontFamily.black, fontSize: 8,
    letterSpacing: 1, marginTop: spacing.lg,
  },
  disabledTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title,
    textAlign: 'center', marginTop: 5,
  },
  disabledText: {
    color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 12,
    lineHeight: 23, textAlign: 'center', marginTop: spacing.sm, maxWidth: 330,
  },
  backAction: {
    height: 46, minWidth: 120, borderRadius: radii.pill, backgroundColor: palette.white,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl,
  },
  backActionText: { color: palette.ink, fontFamily: fontFamily.black, fontWeight: fontWeight.black },
});
