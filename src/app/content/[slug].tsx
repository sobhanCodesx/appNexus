import { useEventListener } from 'expo';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { CommentsSection } from '@/components/community/comments-section';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import {
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentDetailPayload } from '@/types/api';
import { htmlToRichBlocks, type RichTextBlock } from '@/utils/text';

const empty: ContentDetailPayload = {
  content: { id: 0, title: '', slug: '' },
  channel: null,
  playlist: null,
  related: [],
};

export default function ContentDetailScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const path = '/contents/' + encodeURIComponent(slug || '');
  const { data, loading, error } = useApiResource<ContentDetailPayload>(path, empty);
  const content = data.content;
  const isVideo = Boolean(
    content.video_url && (content.type === 'video' || content.type === 'short'),
  );
  const body = useMemo(() => htmlToRichBlocks(content.body), [content.body]);

  useEffect(() => {
    if (!content.id) return;
    void apiRequest<{ views: number }>(
      path + '/views',
      { method: 'POST' },
      { auth: false },
    ).catch(() => undefined);
  }, [content.id, path]);

  if (loading && !content.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.loadingOrb}>
            <View style={styles.loadingCore} />
          </View>
          <Text style={styles.loadingKicker}>LOADING STORY</Text>
          <Text style={styles.loading}>داریم محتوا رو آماده می‌کنیم…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !content.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorKicker}>SIGNAL LOST</Text>
          <Text style={styles.errorTitle}>این محتوا در دسترس نیست</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>برگشت</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  const typeLabel = content.type === 'video'
    ? 'VIDEO STORY'
    : content.type === 'short'
      ? 'SHORT'
      : 'EDITORIAL';

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {isVideo ? (
            <NativeVideo
              id={content.id}
              source={String(content.video_url)}
              duration={content.duration || undefined}
            />
          ) : (
            <ImageHero
              uri={content.thumbnail_url || content.image_url || content.cover_url}
            />
          )}

          <View style={styles.body}>
            <View style={styles.storySignalRow}>
              <View style={styles.storySignal} />
              <Text style={styles.storyType}>{typeLabel}</Text>
              <View style={styles.storyMetaDivider} />
              <Text style={styles.storyMeta}>
                {(content.views || 0).toLocaleString('fa-IR')} بازدید
              </Text>
            </View>

            <Text style={styles.title}>{content.title}</Text>

            {content.excerpt ? (
              <Text style={styles.excerpt}>{content.excerpt}</Text>
            ) : null}

            <ChannelCard
              channel={data.channel}
              fallbackChannel={content.channel}
              type={content.type}
            />

            <ActionBar content={content} />

            {body.length ? (
              <View style={styles.articleWrap}>
                <View style={styles.articleSignal}>
                  <View style={styles.articleSignalCore} />
                </View>
                <View style={styles.articleBlocks}>
                  {body.map((block, index) => (
                    <ArticleBlock key={index} block={block} />
                  ))}
                </View>
              </View>
            ) : null}

            <CommentsSection
              slug={content.slug}
              enabled={content.allow_comments !== false}
            />

            {(data.related || []).length ? (
              <View style={styles.related}>
                <SectionHeader
                  title="بعدی برای تو"
                  eyebrow="KEEP EXPLORING"
                  action="ادامه بده"
                />

                <View style={styles.relatedList}>
                  {(data.related || []).slice(0, 4).map((item, index) => (
                    <View key={item.id} style={styles.relatedRow}>
                      <View style={styles.relatedIndex}>
                        <Text style={styles.relatedIndexText}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={styles.relatedCard}>
                        <ContentCard
                          item={item}
                          width="100%"
                          onPress={() => router.replace({
                            pathname: '/content/[slug]',
                            params: { slug: item.slug },
                          })}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View pointerEvents="box-none" style={styles.topControls}>
          <RoundControl label="‹" onPress={() => router.back()} />
          <RoundControl
            label="↗"
            onPress={() => void Share.share({
              title: content.title,
              message: content.title,
            })}
          />
        </View>
      </View>
    </Screen>
  );
}

function ArticleBlock({ block }: { block: RichTextBlock }) {
  if (block.type === 'h1') {
    return <Text style={styles.articleH1}>{block.text}</Text>;
  }

  if (block.type === 'h2') {
    return <Text style={styles.articleH2}>{block.text}</Text>;
  }

  if (block.type === 'h3') {
    return <Text style={styles.articleH3}>{block.text}</Text>;
  }

  if (block.type === 'quote') {
    return (
      <View style={styles.articleQuote}>
        <View style={styles.articleQuoteLine} />
        <Text style={styles.articleQuoteText}>{block.text}</Text>
      </View>
    );
  }

  if (block.type === 'list-item') {
    return (
      <View style={styles.articleListRow}>
        <View style={styles.articleListDot} />
        <Text style={styles.articleListText}>{block.text}</Text>
      </View>
    );
  }

  return <Text style={styles.articleParagraph}>{block.text}</Text>;
}

function ChannelCard({
  channel,
  fallbackChannel,
  type,
}: {
  channel: ContentDetailPayload['channel'];
  fallbackChannel: ContentDetailPayload['content']['channel'];
  type?: ContentDetailPayload['content']['type'];
}) {
  const avatar = channel?.avatar_url || fallbackChannel?.avatar_url;
  const name = channel?.name || fallbackChannel?.name || 'PlayNexus';

  return (
    <View style={styles.channelCard}>
      <View style={styles.channelSignalBox}>
        <Text style={styles.channelSignalText}>
          {type === 'video' ? 'WATCHING' : 'SOURCE'}
        </Text>
        <View style={styles.channelSignalDot} />
      </View>

      <View style={styles.channelCopy}>
        <Text style={styles.channelName}>{name}</Text>
        <Text style={styles.channelMeta}>
          {channel?.subscribers_count
            ? channel.subscribers_count.toLocaleString('fa-IR') + ' دنبال‌کننده'
            : 'PlayNexus Gaming Channel'}
        </Text>
      </View>

      {avatar ? (
        <Image
          source={{ uri: String(avatar) }}
          style={styles.channelAvatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.channelFallback}>
          <View style={styles.channelFallbackCore} />
        </View>
      )}
    </View>
  );
}

function NativeVideo({
  id,
  source,
  duration,
}: {
  id: number;
  source: string;
  duration?: number;
}) {
  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.timeUpdateEventInterval = 15;
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    void apiRequest(
      '/watch-progress/' + id,
      {
        method: 'PUT',
        body: JSON.stringify({
          position_seconds: Math.max(0, Math.floor(currentTime)),
          duration_seconds: Math.max(
            1,
            Math.floor(player.duration || duration || 1),
          ),
        }),
      },
    ).catch(() => undefined);
  });

  return (
    <View style={styles.videoStage}>
      <View style={styles.videoGlow} />
      <View style={styles.videoFrame}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
        />
      </View>

      <View style={styles.videoBadge}>
        <View style={styles.videoBadgeDot} />
        <Text style={styles.videoBadgeText}>NATIVE PLAYER</Text>
      </View>
    </View>
  );
}

function ImageHero({ uri }: { uri?: string | null }) {
  return (
    <View style={styles.imageFrame}>
      <Image
        source={
          uri
            ? { uri }
            : require('../../../assets/images/logo-glow.png')
        }
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={[
          'rgba(3,5,9,0.08)',
          'rgba(3,5,9,0.00)',
          'rgba(3,5,9,0.92)',
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function ActionBar({
  content,
}: {
  content: ContentDetailPayload['content'];
}) {
  const [reaction, setReaction] = useState(content.user_reaction || null);
  const [saved, setSaved] = useState(Boolean(content.is_saved));

  const react = async (type: 'like' | 'dislike') => {
    try {
      const next = reaction === type ? null : type;
      const response = await apiRequest<{ reaction: 'like' | 'dislike' | null }>(
        '/contents/' + encodeURIComponent(content.slug) + '/reaction',
        {
          method: 'POST',
          body: JSON.stringify({ type }),
        },
      );
      setReaction(response.reaction ?? next);
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    }
  };

  const save = async () => {
    try {
      const response = await apiRequest<{ saved: boolean }>(
        '/contents/' + encodeURIComponent(content.slug) + '/save',
        { method: 'POST' },
      );
      setSaved(response.saved);
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    }
  };

  return (
    <View style={styles.actions}>
      <ActionTile
        symbol={reaction === 'like' ? '♥' : '♡'}
        label={reaction === 'like' ? 'پسندیدی' : 'پسند'}
        value={(content.likes_count || 0).toLocaleString('fa-IR')}
        active={reaction === 'like'}
        onPress={() => void react('like')}
      />
      {content.type !== 'post' ? (
        <ActionTile
          symbol={reaction === 'dislike' ? '▼' : '▽'}
          label={reaction === 'dislike' ? 'نپسندیدی' : 'نپسند'}
          value={(content.dislikes_count || 0).toLocaleString('fa-IR')}
          active={reaction === 'dislike'}
          onPress={() => void react('dislike')}
        />
      ) : null}
      <ActionTile
        symbol={saved ? '◆' : '◇'}
        label={saved ? 'ذخیره شد' : 'ذخیره'}
        active={saved}
        onPress={() => void save()}
      />
      <ActionTile
        symbol="◌"
        label="گفتگو"
        value={(content.comments_count || 0).toLocaleString('fa-IR')}
      />
    </View>
  );
}

function ActionTile({
  symbol,
  label,
  value,
  active = false,
  onPress,
}: {
  symbol: string;
  label: string;
  value?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      haptic={Boolean(onPress)}
      onPress={onPress}
      style={[styles.actionTile, active && styles.actionTileActive]}>
      <Text
        style={[
          styles.actionSymbol,
          active && styles.actionSymbolActive,
        ]}>
        {symbol}
      </Text>
      <Text
        style={[
          styles.actionLabel,
          active && styles.actionLabelActive,
        ]}>
        {label}
      </Text>
      {value ? <Text style={styles.actionValue}>{value}</Text> : null}
    </PressableScale>
  );
}

function RoundControl({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.roundControl}>
      <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.roundControlText}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  videoStage: {
    paddingTop: 104,
    paddingHorizontal: 12,
    paddingBottom: 24,
    backgroundColor: palette.black,
  },
  videoGlow: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    width: '76%',
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(24,124,255,0.12)',
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: palette.black,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...shadow.card,
  },
  video: {
    flex: 1,
  },
  videoBadge: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  videoBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  videoBadgeText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  imageFrame: {
    width: '100%',
    height: 454,
    backgroundColor: palette.surface,
  },
  topControls: {
    position: 'absolute',
    zIndex: 10,
    top: 54,
    left: layout.screenPadding,
    right: layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundControl: {
    width: 46,
    height: 46,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(3,5,9,0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  roundControlText: {
    color: palette.white,
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  body: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: palette.ink,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: 60,
  },
  storySignalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.sm,
  },
  storySignal: {
    width: 28,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.cyan,
  },
  storyType: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  storyMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: palette.textDim,
  },
  storyMeta: {
    color: palette.textDim,
    fontSize: 9,
  },
  title: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 44,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.7,
  },
  excerpt: {
    color: palette.textMuted,
    fontSize: typeScale.body,
    lineHeight: 27,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  channelCard: {
    minHeight: 84,
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.028)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  channelSignalBox: {
    minWidth: 70,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(88,244,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelSignalText: {
    color: palette.cyan,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  channelSignalDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
    marginTop: 4,
  },
  channelCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  channelName: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  channelMeta: {
    color: palette.textDim,
    fontSize: typeScale.micro,
    marginTop: 3,
  },
  channelAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  channelFallback: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(24,124,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelFallbackCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionTile: {
    flex: 1,
    minHeight: 86,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.028)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileActive: {
    borderColor: 'rgba(88,244,255,0.26)',
    backgroundColor: 'rgba(88,244,255,0.075)',
    ...shadow.cyanGlow,
  },
  actionSymbol: {
    color: palette.textMuted,
    fontSize: 20,
  },
  actionSymbolActive: {
    color: palette.cyan,
  },
  actionLabel: {
    color: palette.text,
    fontSize: 10,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  actionLabelActive: {
    color: palette.white,
  },
  actionValue: {
    color: palette.textDim,
    fontSize: 8,
    marginTop: 2,
  },
  articleWrap: {
    marginTop: spacing.xxxl,
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  articleSignal: {
    width: 18,
    alignItems: 'center',
  },
  articleSignalCore: {
    width: 2,
    flex: 1,
    minHeight: 160,
    borderRadius: 2,
    backgroundColor: 'rgba(88,244,255,0.16)',
  },
  articleBlocks: {
    flex: 1,
    gap: spacing.md,
  },
  articleParagraph: {
    color: '#D8DEE8',
    fontSize: typeScale.body,
    lineHeight: 31,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  articleH1: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  articleH2: {
    color: palette.white,
    fontSize: 23,
    lineHeight: 33,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.md,
  },
  articleH3: {
    color: palette.text,
    fontSize: 19,
    lineHeight: 29,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  articleQuote: {
    minHeight: 86,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.18)',
    backgroundColor: 'rgba(167,123,255,0.055)',
    padding: spacing.md,
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  articleQuoteLine: {
    width: 3,
    borderRadius: 3,
    backgroundColor: palette.violet,
  },
  articleQuoteText: {
    flex: 1,
    color: palette.text,
    fontSize: typeScale.bodySm,
    lineHeight: 25,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  articleListRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  articleListDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.cyan,
    marginTop: 11,
  },
  articleListText: {
    flex: 1,
    color: '#D8DEE8',
    fontSize: typeScale.body,
    lineHeight: 29,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  related: {
    marginTop: spacing.massive,
  },
  relatedList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  relatedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  relatedIndex: {
    width: 28,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  relatedIndexText: {
    color: palette.textDim,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  relatedCard: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingOrb: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  loadingKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  loading: {
    color: palette.textMuted,
    fontSize: typeScale.body,
    marginTop: spacing.xs,
  },
  errorKicker: {
    color: palette.danger,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  errorTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 5,
  },
  errorText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  backButton: {
    marginTop: spacing.xl,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
});
