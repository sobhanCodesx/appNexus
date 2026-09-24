import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import {
  currentAppMeta,
  getAppMeta,
  type MobileAppMeta,
} from '@/services/app-meta';

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
  {
    title: 'چی بازی کنم؟',
    text: 'یه بازی جهان‌باز اتمسفریک برای PS5 پیشنهاد بده',
    glyph: '◈',
  },
  {
    title: 'مقایسه بازی',
    text: 'می‌خوام دو بازی رو از نظر گیم‌پلی و ارزش خرید مقایسه کنم',
    glyph: '◇',
  },
  {
    title: 'پرفورمنس',
    text: 'برای بازی‌ای که می‌گم بهترین تنظیمات Performance رو توضیح بده',
    glyph: '⚡',
  },
  {
    title: 'لور بدون اسپویل',
    text: 'لور یک بازی رو بدون اسپویل برام توضیح بده',
    glyph: '◎',
  },
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

  return 'یه اختلال کوتاه پیش اومد. دوباره امتحان کن.';
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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [meta, setMeta] = useState<MobileAppMeta | null>(() => currentAppMeta());
  const [metaLoading, setMetaLoading] = useState(!currentAppMeta());
  const [metaError, setMetaError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = async () => {
    setMetaLoading(true);
    setMetaError(false);
    try {
      const value = await getAppMeta(true);
      setMeta(value);
    } catch {
      setMetaError(true);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    void getAppMeta(true)
      .then((value) => {
        if (!alive) return;
        setMeta(value);
        setMetaError(false);
      })
      .catch(() => {
        if (alive) setMetaError(true);
      })
      .finally(() => {
        if (alive) setMetaLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: messages.length > 0 });
    });
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
        { timeoutMs: 30_000 },
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

  const resetConversation = () => {
    if (busy) return;
    setMessages([]);
    setConversationId(null);
    setRemaining(null);
    setInput('');
    setError(null);
  };

  if (metaLoading && !meta) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingState}>
          <View style={styles.loadingOrb}>
            <LinearGradient
              colors={['#7C4DFF', '#1CC8FF']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.loadingGlyph}>✦</Text>
          </View>
          <ActivityIndicator color={palette.cyan} size="small" />
          <Text style={styles.loadingText}>در حال اتصال به Nexus AI…</Text>
        </View>
      </Screen>
    );
  }

  if (metaError && !meta) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.disabled}>
          <View style={styles.disabledOrb}><Text style={styles.disabledGlyph}>!</Text></View>
          <Text style={styles.disabledKicker}>CONNECTION LOST</Text>
          <Text style={styles.disabledTitle}>تنظیمات AI دریافت نشد</Text>
          <Text style={styles.disabledText}>
            اتصال اینترنت یا سرویس PlayNexus رو بررسی کن و دوباره تلاش کن.
          </Text>
          <View style={styles.disabledActions}>
            <PressableScale style={styles.secondaryAction} onPress={() => router.back()}>
              <Text style={styles.secondaryActionText}>برگشت</Text>
            </PressableScale>
            <PressableScale style={styles.backAction} onPress={() => void loadMeta()}>
              <Text style={styles.backActionText}>تلاش دوباره</Text>
            </PressableScale>
          </View>
        </View>
      </Screen>
    );
  }

  if (meta && !available) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.disabled}>
          <View style={styles.disabledOrb}><Text style={styles.disabledGlyph}>✦</Text></View>
          <Text style={styles.disabledKicker}>NEXUS AI OFFLINE</Text>
          <Text style={styles.disabledTitle}>هوش مصنوعی فعلاً غیرفعاله</Text>
          <Text style={styles.disabledText}>
            این بخش از تنظیمات PlayNexus کنترل می‌شه. در منوی اصلی، Game Radar به‌صورت خودکار جاش رو می‌گیره.
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.backGlyph}>‹</Text>
          </PressableScale>

          <View style={styles.headerCopy}>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text numberOfLines={1} style={styles.statusText}>{status}</Text>
            </View>
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
          </View>

          <PressableScale
            disabled={!messages.length || busy}
            onPress={resetConversation}
            style={[styles.headerButton, (!messages.length || busy) && styles.headerButtonDisabled]}>
            <Text style={styles.newChatGlyph}>＋</Text>
          </PressableScale>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messagesContent,
            !messages.length && styles.messagesContentEmpty,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => {
            if (messages.length) scrollRef.current?.scrollToEnd({ animated: true });
          }}
          showsVerticalScrollIndicator={false}>
          {!messages.length ? (
            <View style={styles.welcome}>
              <View style={styles.hero}>
                <View style={styles.heroGlowOne} />
                <View style={styles.heroGlowTwo} />

                <View style={styles.heroTop}>
                  <View style={styles.heroStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.heroStatusText}>ONLINE</Text>
                  </View>
                  <View style={styles.heroMark}>
                    <LinearGradient
                      colors={['#7C4DFF', '#1CC8FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.heroMarkGlyph}>✦</Text>
                  </View>
                </View>

                <Text style={styles.welcomeKicker}>PLAYNEXUS COPILOT</Text>
                <Text style={styles.welcomeTitle}>
                  {ai?.welcome_title || 'درباره بازی‌ها ازم بپرس'}
                </Text>
                <Text style={styles.welcomeText}>
                  {ai?.welcome_text
                    || ai?.description
                    || 'انتخاب بازی، مقایسه، لور، پرفورمنس و هر چیزی که برای بازی کردنت لازم داری.'}
                </Text>
              </View>

              <View style={styles.promptHeader}>
                <Text style={styles.promptHint}>برای شروع یکی رو بزن</Text>
                <Text style={styles.promptKicker}>QUICK START</Text>
              </View>

              <View style={styles.promptGrid}>
                {QUICK_PROMPTS.map((prompt) => (
                  <PressableScale
                    key={prompt.title}
                    disabled={!available || busy}
                    onPress={() => void send(prompt.text)}
                    style={styles.prompt}>
                    <View style={styles.promptGlyphShell}>
                      <Text style={styles.promptGlyph}>{prompt.glyph}</Text>
                    </View>
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
              <View style={styles.threadStamp}>
                <Text style={styles.threadStampText}>NEXUS SESSION</Text>
              </View>

              {messages.map((message, index) => (
                <View
                  key={message.role + '-' + index}
                  style={[
                    styles.messageRow,
                    message.role === 'user' ? styles.userRow : styles.assistantRow,
                  ]}>
                  {message.role === 'assistant' ? (
                    <View style={styles.miniAi}>
                      <Text style={styles.miniAiText}>✦</Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.bubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}>
                    {message.role === 'assistant' ? (
                      <Text style={styles.bubbleLabel}>NEXUS AI</Text>
                    ) : null}
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
                    <View style={styles.thinkingDots}>
                      <View style={styles.thinkingDot} />
                      <View style={styles.thinkingDot} />
                      <View style={styles.thinkingDot} />
                    </View>
                    <Text style={styles.thinkingText}>دارم بررسی می‌کنم…</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.composerWrap,
            { paddingBottom: Math.max(insets.bottom, 10) + 8 },
          ]}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.composerMeta}>
            <Text style={styles.composerHint}>Enter برای ارسال نیست؛ دکمه بفرست رو بزن</Text>
            <View style={styles.composerStatus}>
              <View style={styles.composerStatusDot} />
              <Text style={styles.composerStatusText}>
                {remaining !== null
                  ? remaining.toLocaleString('fa-IR') + ' پیام امروز'
                  : 'آماده گفتگو'}
              </Text>
            </View>
          </View>

          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={available && !busy}
              maxLength={1600}
              multiline
              blurOnSubmit={false}
              autoCorrect
              autoCapitalize="sentences"
              keyboardAppearance="dark"
              selectionColor={palette.cyan}
              cursorColor={palette.cyan}
              textAlign="right"
              textAlignVertical="center"
              placeholder="پیامت رو بنویس…"
              placeholderTextColor="rgba(222,230,242,0.30)"
              style={styles.input}
            />

            <PressableScale
              disabled={!available || busy || !input.trim()}
              onPress={() => void send()}
              style={[
                styles.send,
                (!available || busy || !input.trim()) && styles.sendDisabled,
              ]}>
              <LinearGradient
                colors={['#7C4DFF', '#168DFF']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {busy ? (
                <ActivityIndicator color={palette.white} size="small" />
              ) : (
                <Text style={styles.sendText}>↑</Text>
              )}
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.055)',
    backgroundColor: 'rgba(3,5,9,0.72)',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.28,
  },
  backGlyph: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 30,
  },
  newChatGlyph: {
    color: palette.cyan,
    fontFamily: fontFamily.regular,
    fontSize: 24,
    lineHeight: 26,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusRow: {
    maxWidth: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
    ...shadow.cyanGlow,
  },
  statusText: {
    maxWidth: 210,
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontSize: 7.5,
    letterSpacing: 0.75,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 22,
    marginTop: 2,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  messagesContentEmpty: {
    justifyContent: 'center',
  },
  welcome: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  hero: {
    minHeight: 232,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.13)',
    backgroundColor: 'rgba(10,15,26,0.88)',
    padding: spacing.lg,
    alignItems: 'flex-end',
    ...shadow.soft,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: 'rgba(124,77,255,0.17)',
    top: -95,
    left: -55,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: 'rgba(28,200,255,0.11)',
    right: -70,
    bottom: -88,
  },
  heroTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatus: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.13)',
    backgroundColor: 'rgba(3,5,9,0.48)',
  },
  heroStatusText: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  heroMark: {
    width: 54,
    height: 54,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cyanGlow,
  },
  heroMarkGlyph: {
    color: palette.white,
    fontSize: 24,
  },
  welcomeKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: spacing.xl,
  },
  welcomeTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'right',
    marginTop: 4,
  },
  welcomeText: {
    maxWidth: 330,
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 7,
  },
  promptHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  promptHint: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
    fontSize: 8,
  },
  promptKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  promptGrid: {
    width: '100%',
    gap: 8,
  },
  prompt: {
    minHeight: 68,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    backgroundColor: 'rgba(255,255,255,0.027)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promptGlyphShell: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptGlyph: {
    color: palette.cyan,
    fontSize: 18,
  },
  promptCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  promptTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 11,
  },
  promptText: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
    fontSize: 8.5,
    lineHeight: 15,
    textAlign: 'right',
    marginTop: 2,
  },
  thread: {
    width: '100%',
    gap: 14,
  },
  threadStamp: {
    alignSelf: 'center',
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  threadStampText: {
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  miniAi: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: 'rgba(88,244,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAiText: {
    color: palette.cyan,
    fontSize: 13,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userBubble: {
    backgroundColor: '#5B45D8',
    borderBottomRightRadius: 7,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.042)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    borderBottomLeftRadius: 7,
  },
  bubbleLabel: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.7,
    marginBottom: 5,
    textAlign: 'right',
  },
  messageText: {
    color: '#E2E9F3',
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 23,
    textAlign: 'right',
  },
  userText: {
    color: palette.white,
  },
  thinking: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  thinkingDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.violet,
  },
  thinkingText: {
    color: palette.textDim,
    fontFamily: fontFamily.medium,
    fontSize: 9,
  },
  composerWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.055)',
    backgroundColor: 'rgba(3,5,9,0.98)',
  },
  errorBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,98,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,98,122,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 7,
  },
  error: {
    color: '#FF9BAD',
    fontFamily: fontFamily.medium,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'right',
  },
  composerMeta: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  composerHint: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
    fontSize: 7,
  },
  composerStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  composerStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  composerStatusText: {
    color: palette.cyan,
    fontFamily: fontFamily.bold,
    fontSize: 7.5,
  },
  composer: {
    minHeight: 60,
    maxHeight: 136,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  input: {
    flex: 1,
    minHeight: 47,
    maxHeight: 120,
    color: palette.white,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 21,
    paddingHorizontal: 11,
    paddingVertical: 12,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cyanGlow,
  },
  sendDisabled: {
    opacity: 0.30,
  },
  sendText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 23,
    lineHeight: 25,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingOrb: {
    width: 68,
    height: 68,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadow.cyanGlow,
  },
  loadingGlyph: {
    color: palette.white,
    fontSize: 28,
  },
  loadingText: {
    color: palette.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 10,
  },
  disabled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  disabledOrb: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledGlyph: {
    color: palette.textDim,
    fontSize: 28,
  },
  disabledKicker: {
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  disabledTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: typeScale.title,
    textAlign: 'center',
    marginTop: 5,
  },
  disabledText: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  disabledActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
  },
  backAction: {
    height: 46,
    minWidth: 126,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionText: {
    color: palette.ink,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  secondaryAction: {
    height: 46,
    minWidth: 100,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: palette.text,
    fontFamily: fontFamily.bold,
  },
});
