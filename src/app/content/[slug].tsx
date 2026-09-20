import { useEventListener } from 'expo';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { CommentsSection } from '@/components/community/comments-section';
import { ExpandableText } from '@/components/ui/expandable-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentDetailPayload, VideoPlaylistContext } from '@/types/api';
import { htmlToRichBlocks, type RichTextBlock } from '@/utils/text';

const fallback = require('../../../assets/images/logo-glow.png');

const empty: ContentDetailPayload = {
  content: { id: 0, title: '', slug: '' },
  channel: null,
  playlist: null,
  related: [],
};

export default function ContentDetailScreen() {
  const params = useLocalSearchParams<{ slug: string; list?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const list = Array.isArray(params.list) ? params.list[0] : params.list;
  const path = '/contents/' + encodeURIComponent(slug || '') + (list ? '?list=' + encodeURIComponent(list) : '');
  const { data, loading, error } = useApiResource<ContentDetailPayload>(path, empty);
  const content = data.content;
  const isVideo = Boolean(content.video_url && (content.type === 'video' || content.type === 'short'));
  const body = useMemo(() => htmlToRichBlocks(content.body), [content.body]);
  const poster = content.thumbnail_url || content.image_url || content.cover_url || content.game?.cover_url || data.channel?.cover_url || data.channel?.logo_url;

  useEffect(() => {
    if (!content.id) return;
    void apiRequest<{ views: number }>(
      '/contents/' + encodeURIComponent(slug || '') + '/views',
      { method: 'POST' },
      { auth: false },
    ).catch(() => undefined);
  }, [content.id, slug]);

  if (loading && !content.id) return <DetailSkeleton />;

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

  const typeLabel = content.type === 'video' ? 'NEXUS VIDEO' : content.type === 'short' ? 'SHORT' : 'EDITORIAL';

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isVideo ? (
            <NativeVideo
              id={content.id}
              source={String(content.video_url)}
              thumbnail={poster ? String(poster) : null}
              duration={content.duration || undefined}
            />
          ) : (
            <ImageHero uri={poster ? String(poster) : null} />
          )}

          <View style={[styles.body, isVideo && styles.videoBody]}>
            <View style={styles.storySignalRow}>
              <View style={[styles.storySignal, content.type === 'video' && styles.storySignalVideo]} />
              <Text style={[styles.storyType, content.type === 'video' && styles.storyTypeVideo]}>{typeLabel}</Text>
              <View style={styles.storyMetaDivider} />
              <Text style={styles.storyMeta}>{(content.views || 0).toLocaleString('fa-IR')} بازدید</Text>
            </View>

            <Text style={styles.title}>{content.title}</Text>

            {content.excerpt ? (
              <ExpandableText
                text={content.excerpt}
                collapsedLines={4}
                threshold={180}
                style={styles.excerpt}
                accent={content.type === 'video' ? palette.magenta : palette.cyan}
              />
            ) : null}

            <ChannelCard channel={data.channel} fallbackChannel={content.channel} type={content.type} />
            <ActionBar content={content} />

            {isVideo && data.playlist ? <PlaylistPanel playlist={data.playlist} /> : null}

            {body.length ? <ArticleContent blocks={body} /> : null}

            <CommentsSection slug={content.slug} enabled={content.allow_comments !== false} />

            {(data.related || []).length ? (
              <View style={styles.related}>
                <SectionHeader title="بعدی برای تو" eyebrow="UP NEXT" action="ادامه بده" />
                <View style={styles.relatedList}>
                  {(data.related || []).slice(0, 5).map((item, index) => (
                    <View key={item.id} style={styles.relatedRow}>
                      <View style={styles.relatedIndex}>
                        <Text style={styles.relatedIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.relatedCard}>
                        <ContentCard
                          item={item}
                          width="100%"
                          onPress={() => router.replace({ pathname: '/content/[slug]', params: { slug: item.slug } })}
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
            onPress={() => void Share.share({ title: content.title, message: content.title })}
          />
        </View>
      </View>
    </Screen>
  );
}

function NativeVideo({
  id,
  source,
  thumbnail,
  duration,
}: {
  id: number;
  source: string;
  thumbnail?: string | null;
  duration?: number;
}) {
  const [posterVisible, setPosterVisible] = useState(true);
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
          duration_seconds: Math.max(1, Math.floor(player.duration || duration || 1)),
        }),
      },
    ).catch(() => undefined);
  });

  const play = () => {
    setPosterVisible(false);
    player.play();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.playerWorld}>
      {thumbnail ? (
        <View pointerEvents="none" style={styles.ambient}>
          <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={32} />
          <BlurView intensity={68} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(3,5,9,0.10)', 'rgba(3,5,9,0.58)', palette.ink]}
            locations={[0, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}

      <View style={styles.playerBrandRow}>
        <View style={styles.playerBrandPill}>
          <View style={styles.playerBrandDot} />
          <Text style={styles.playerBrandText}>AMBIENT NEXUS PLAYER</Text>
        </View>
        <Text style={styles.playerHint}>PIP · FULLSCREEN</Text>
      </View>

      <View style={styles.videoFrame}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
        />

        {posterVisible ? (
          <PressableScale onPress={play} pressedScale={0.995} style={styles.poster}>
            <Image source={thumbnail ? { uri: thumbnail } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.15)', 'rgba(3,5,9,0.58)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.posterPlayOuter}>
              <View style={styles.posterPlayInner}>
                <Text style={styles.posterPlayGlyph}>▶</Text>
              </View>
            </View>
            <View style={styles.posterBottom}>
              <View style={styles.posterSignal} />
              <Text style={styles.posterText}>PLAY WITH NEXUS</Text>
            </View>
          </PressableScale>
        ) : null}
      </View>

      <View style={styles.paletteRail}>
        <View style={[styles.paletteLine, { backgroundColor: palette.cyan }]} />
        <View style={[styles.paletteLine, { backgroundColor: palette.blueHot }]} />
        <View style={[styles.paletteLine, { backgroundColor: palette.violet }]} />
        <View style={[styles.paletteLine, { backgroundColor: palette.magenta }]} />
      </View>
    </View>
  );
}

function PlaylistPanel({ playlist }: { playlist: VideoPlaylistContext }) {
  const items = playlist.items || [];

  return (
    <View style={styles.playlistPanel}>
      <LinearGradient
        colors={['rgba(88,244,255,0.065)', 'rgba(167,123,255,0.035)', 'rgba(255,255,255,0.018)']}
        style={StyleSheet.absoluteFill}
      />
      <PressableScale
        onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: playlist.slug } })}
        style={styles.playlistHeader}>
        <View style={styles.playlistArrow} />
        <View style={styles.playlistHeaderCopy}>
          <Text style={styles.playlistKicker}>PLAYNEXUS COLLECTION</Text>
          <Text numberOfLines={1} style={styles.playlistTitle}>{playlist.title}</Text>
          <Text style={styles.playlistMeta}>{playlist.channel_name || 'PlayNexus'} · {items.length.toLocaleString('fa-IR')} ویدیو</Text>
        </View>
        <View style={styles.playlistStack}>
          <View style={styles.stackBack} />
          <View style={styles.stackFront}><Text style={styles.stackCount}>{items.length.toLocaleString('fa-IR')}</Text></View>
        </View>
      </PressableScale>

      <View style={styles.playlistItems}>
        {items.slice(0, 5).map((item, index) => {
          const current = item.id === playlist.current_id;
          const thumbnail = item.thumbnail_url || item.image_url || item.cover_url || item.game?.cover_url;
          return (
            <PressableScale
              key={item.id}
              onPress={() => {
                if (current) return;
                router.replace({
                  pathname: '/content/[slug]',
                  params: { slug: item.slug, list: playlist.slug },
                });
              }}
              style={[styles.playlistItem, current && styles.playlistItemCurrent]}>
              <View style={styles.playlistThumb}>
                <Image source={thumbnail ? { uri: String(thumbnail) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
                {current ? <View style={styles.nowPlaying}><Text style={styles.nowPlayingText}>▶</Text></View> : null}
              </View>
              <View style={styles.playlistItemCopy}>
                <Text style={[styles.playlistItemIndex, current && styles.playlistItemIndexCurrent]}>
                  {current ? 'NOW PLAYING' : String(index + 1).padStart(2, '0')}
                </Text>
                <Text numberOfLines={2} style={styles.playlistItemTitle}>{item.title}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {items.length > 5 ? (
        <PressableScale
          onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: playlist.slug } })}
          style={styles.playlistMore}>
          <Text style={styles.playlistMoreText}>مشاهده تمام کالکشن</Text>
          <View style={styles.playlistMoreArrow} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function ArticleContent({ blocks }: { blocks: RichTextBlock[] }) {
  const total = blocks.reduce((sum, block) => sum + block.text.length, 0);
  const collapsible = total > 900 || blocks.length > 6;
  const [expanded, setExpanded] = useState(false);
  const visible = collapsible && !expanded ? blocks.slice(0, 5) : blocks;

  return (
    <View style={styles.articleWrap}>
      <View style={styles.articleSignal}><View style={styles.articleSignalCore} /></View>
      <View style={styles.articleBlocks}>
        {visible.map((block, index) => <ArticleBlock key={index} block={block} />)}
        {collapsible ? (
          <PressableScale onPress={() => setExpanded((value) => !value)} style={styles.articleToggle}>
            <View style={styles.articleToggleDot} />
            <Text style={styles.articleToggleText}>{expanded ? 'جمع کردن متن' : 'ادامه متن'}</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

function ArticleBlock({ block }: { block: RichTextBlock }) {
  if (block.type === 'h1') return <Text style={styles.articleH1}>{block.text}</Text>;
  if (block.type === 'h2') return <Text style={styles.articleH2}>{block.text}</Text>;
  if (block.type === 'h3') return <Text style={styles.articleH3}>{block.text}</Text>;
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
  const avatar = channel?.logo_url || channel?.avatar_url || fallbackChannel?.logo_url || fallbackChannel?.avatar_url;
  const name = channel?.name || fallbackChannel?.name || 'PlayNexus';
  const slug = channel?.slug || fallbackChannel?.slug;

  return (
    <PressableScale
      onPress={slug ? () => router.push({ pathname: '/channel/[slug]', params: { slug } }) : undefined}
      style={styles.channelCard}>
      <View style={styles.channelSignalBox}>
        <Text style={styles.channelSignalText}>{type === 'video' ? 'WATCHING' : 'SOURCE'}</Text>
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
        <Image source={{ uri: String(avatar) }} style={styles.channelAvatar} contentFit="cover" />
      ) : (
        <View style={styles.channelFallback}><View style={styles.channelFallbackCore} /></View>
      )}
    </PressableScale>
  );
}

function ImageHero({ uri }: { uri?: string | null }) {
  return (
    <View style={styles.imageFrame}>
      <Image source={uri ? { uri } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(3,5,9,0.08)', 'rgba(3,5,9,0.00)', 'rgba(3,5,9,0.92)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function ActionBar({ content }: { content: ContentDetailPayload['content'] }) {
  const [reaction, setReaction] = useState(content.user_reaction || null);
  const [saved, setSaved] = useState(Boolean(content.is_saved));

  useEffect(() => {
    setReaction(content.user_reaction || null);
    setSaved(Boolean(content.is_saved));
  }, [content.id, content.is_saved, content.user_reaction]);

  const react = async (type: 'like' | 'dislike') => {
    try {
      const next = reaction === type ? null : type;
      const response = await apiRequest<{ reaction: 'like' | 'dislike' | null }>(
        '/contents/' + encodeURIComponent(content.slug) + '/reaction',
        { method: 'POST', body: JSON.stringify({ type }) },
      );
      setReaction(response.reaction ?? next);
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
      <ActionTile symbol={reaction === 'like' ? '♥' : '♡'} label={reaction === 'like' ? 'پسندیدی' : 'پسند'} value={(content.likes_count || 0).toLocaleString('fa-IR')} active={reaction === 'like'} onPress={() => void react('like')} />
      {content.type !== 'post' ? (
        <ActionTile symbol={reaction === 'dislike' ? '▼' : '▽'} label={reaction === 'dislike' ? 'نپسندیدی' : 'نپسند'} value={(content.dislikes_count || 0).toLocaleString('fa-IR')} active={reaction === 'dislike'} onPress={() => void react('dislike')} />
      ) : null}
      <ActionTile symbol={saved ? '◆' : '◇'} label={saved ? 'ذخیره شد' : 'ذخیره'} active={saved} onPress={() => void save()} />
      <ActionTile symbol="◌" label="گفتگو" value={(content.comments_count || 0).toLocaleString('fa-IR')} />
    </ScrollView>
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
    <PressableScale haptic={Boolean(onPress)} onPress={onPress} style={[styles.actionTile, active && styles.actionTileActive]}>
      <Text style={[styles.actionSymbol, active && styles.actionSymbolActive]}>{symbol}</Text>
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
      {value ? <Text style={styles.actionValue}>{value}</Text> : null}
    </PressableScale>
  );
}

function RoundControl({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.roundControl}>
      <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.roundControlText}>{label}</Text>
    </PressableScale>
  );
}

function DetailSkeleton() {
  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.skeletonPage}>
        <SkeletonBox style={{ width: '100%', aspectRatio: 16 / 9 }} radius={0} />
        <View style={styles.skeletonBody}>
          <SkeletonBox style={{ width: 92, height: 10 }} radius={5} />
          <SkeletonBox style={{ width: '92%', height: 34 }} radius={8} />
          <SkeletonBox style={{ width: '72%', height: 34 }} radius={8} />
          <SkeletonBox style={{ width: '100%', height: 82 }} radius={22} />
          <SkeletonBox style={{ width: '100%', height: 150 }} radius={24} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  playerWorld: { minHeight: 330, paddingTop: 102, paddingHorizontal: 12, paddingBottom: 24, backgroundColor: palette.black, overflow: 'hidden' },
  ambient: { position: 'absolute', top: 48, left: -60, right: -60, height: 350, opacity: 0.72 },
  playerBrandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 10 },
  playerBrandPill: { height: 27, paddingHorizontal: 9, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.56)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerBrandDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  playerBrandText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  playerHint: { color: 'rgba(255,255,255,0.42)', fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  videoFrame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden', backgroundColor: palette.black, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', ...shadow.card },
  video: { flex: 1 },
  poster: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  posterPlayOuter: { width: 78, height: 78, borderRadius: 30, backgroundColor: 'rgba(3,5,9,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  posterPlayInner: { width: 58, height: 58, borderRadius: 22, backgroundColor: 'rgba(3,5,9,0.72)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.24)', alignItems: 'center', justifyContent: 'center', ...shadow.cyanGlow },
  posterPlayGlyph: { color: palette.white, fontSize: 20, marginLeft: 3 },
  posterBottom: { position: 'absolute', right: 14, bottom: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  posterSignal: { width: 26, height: 2, borderRadius: 2, backgroundColor: palette.cyan },
  posterText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  paletteRail: { height: 2, marginHorizontal: 20, marginTop: 10, flexDirection: 'row', borderRadius: 2, overflow: 'hidden', opacity: 0.72 },
  paletteLine: { flex: 1 },
  imageFrame: { width: '100%', height: 454, backgroundColor: palette.surface },
  topControls: { position: 'absolute', zIndex: 10, top: 54, left: layout.screenPadding, right: layout.screenPadding, flexDirection: 'row', justifyContent: 'space-between' },
  roundControl: { width: 46, height: 46, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(3,5,9,0.54)', alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  roundControlText: { color: palette.white, fontSize: 24, fontWeight: fontWeight.bold },
  body: { flex: 1, marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: palette.ink, paddingHorizontal: layout.screenPadding, paddingTop: spacing.xl, paddingBottom: 60 },
  videoBody: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  storySignalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginBottom: spacing.sm },
  storySignal: { width: 28, height: 2, borderRadius: 2, backgroundColor: palette.cyan },
  storySignalVideo: { backgroundColor: palette.magenta },
  storyType: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  storyTypeVideo: { color: palette.magenta },
  storyMetaDivider: { width: 3, height: 3, borderRadius: 3, backgroundColor: palette.textDim },
  storyMeta: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 9 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 32, lineHeight: 42, fontWeight: fontWeight.black, textAlign: 'right', letterSpacing: -0.6 },
  excerpt: { color: palette.textMuted, fontSize: 14, lineHeight: 26, marginTop: spacing.sm },
  channelCard: { minHeight: 84, marginTop: spacing.xl, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.028)', padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  channelSignalBox: { minWidth: 70, height: 44, borderRadius: radii.md, backgroundColor: 'rgba(88,244,255,0.055)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  channelSignalText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  channelSignalDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.success, marginTop: 4 },
  channelCopy: { flex: 1, alignItems: 'flex-end' },
  channelName: { color: palette.text, fontFamily: fontFamily.black, fontSize: 14 },
  channelMeta: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3 },
  channelAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  channelFallback: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(24,124,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  channelFallbackCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  actions: { gap: spacing.sm, marginTop: spacing.lg, paddingRight: 1 },
  actionTile: { width: 92, minHeight: 80, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.028)', alignItems: 'center', justifyContent: 'center' },
  actionTileActive: { borderColor: 'rgba(88,244,255,0.26)', backgroundColor: 'rgba(88,244,255,0.075)', ...shadow.cyanGlow },
  actionSymbol: { color: palette.textMuted, fontSize: 19 },
  actionSymbolActive: { color: palette.cyan },
  actionLabel: { color: palette.text, fontFamily: fontFamily.black, fontSize: 9, marginTop: 4 },
  actionLabelActive: { color: palette.white },
  actionValue: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 8, marginTop: 2 },
  playlistPanel: { marginTop: spacing.xxxl, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.12)', backgroundColor: 'rgba(10,16,26,0.74)', padding: spacing.sm, ...shadow.soft },
  playlistHeader: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  playlistArrow: { width: 8, height: 8, borderLeftWidth: 1.4, borderBottomWidth: 1.4, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  playlistHeaderCopy: { flex: 1, alignItems: 'flex-end' },
  playlistKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.9 },
  playlistTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 17, marginTop: 3 },
  playlistMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3 },
  playlistStack: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  stackBack: { position: 'absolute', width: 42, height: 50, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(167,123,255,0.20)', backgroundColor: 'rgba(167,123,255,0.06)', transform: [{ rotate: '-10deg' }, { translateX: -7 }] },
  stackFront: { width: 44, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(88,244,255,0.22)', backgroundColor: 'rgba(3,5,9,0.64)', alignItems: 'center', justifyContent: 'center' },
  stackCount: { color: palette.white, fontFamily: fontFamily.black, fontSize: 14 },
  playlistItems: { gap: 7, paddingTop: 4 },
  playlistItem: { minHeight: 72, borderRadius: 18, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)' },
  playlistItemCurrent: { backgroundColor: 'rgba(88,244,255,0.055)', borderColor: 'rgba(88,244,255,0.16)' },
  playlistThumb: { width: 92, aspectRatio: 16 / 9, borderRadius: 13, overflow: 'hidden', backgroundColor: palette.surface },
  nowPlaying: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,5,9,0.44)', alignItems: 'center', justifyContent: 'center' },
  nowPlayingText: { color: palette.cyan, fontSize: 13 },
  playlistItemCopy: { flex: 1, alignItems: 'flex-end' },
  playlistItemIndex: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  playlistItemIndexCurrent: { color: palette.cyan },
  playlistItemTitle: { color: palette.text, fontFamily: fontFamily.black, fontSize: 12, lineHeight: 18, textAlign: 'right', marginTop: 3 },
  playlistMore: { minHeight: 44, marginTop: spacing.sm, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9 },
  playlistMoreText: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 9 },
  playlistMoreArrow: { width: 6, height: 6, borderLeftWidth: 1.2, borderBottomWidth: 1.2, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  articleWrap: { marginTop: spacing.xxxl, flexDirection: 'row-reverse', gap: spacing.md },
  articleSignal: { width: 18, alignItems: 'center' },
  articleSignalCore: { width: 2, flex: 1, minHeight: 160, borderRadius: 2, backgroundColor: 'rgba(88,244,255,0.16)' },
  articleBlocks: { flex: 1, gap: spacing.md },
  articleParagraph: { color: '#D8DEE8', fontFamily: fontFamily.regular, fontSize: typeScale.body, lineHeight: 31, textAlign: 'right', writingDirection: 'rtl' },
  articleH1: { color: palette.white, fontFamily: fontFamily.black, fontSize: 28, lineHeight: 38, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.sm },
  articleH2: { color: palette.white, fontFamily: fontFamily.black, fontSize: 23, lineHeight: 33, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.md },
  articleH3: { color: palette.text, fontFamily: fontFamily.black, fontSize: 19, lineHeight: 29, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.sm },
  articleQuote: { minHeight: 86, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(167,123,255,0.18)', backgroundColor: 'rgba(167,123,255,0.055)', padding: spacing.md, flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'stretch' },
  articleQuoteLine: { width: 3, borderRadius: 3, backgroundColor: palette.violet },
  articleQuoteText: { flex: 1, color: palette.text, fontFamily: fontFamily.bold, fontSize: typeScale.bodySm, lineHeight: 25, fontWeight: fontWeight.bold, textAlign: 'right', writingDirection: 'rtl' },
  articleListRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  articleListDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: palette.cyan, marginTop: 11 },
  articleListText: { flex: 1, color: '#D8DEE8', fontFamily: fontFamily.regular, fontSize: typeScale.body, lineHeight: 29, textAlign: 'right', writingDirection: 'rtl' },
  articleToggle: { minHeight: 44, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', backgroundColor: 'rgba(88,244,255,0.04)', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  articleToggleDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  articleToggleText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 10 },
  related: { marginTop: spacing.massive },
  relatedList: { marginTop: spacing.md, gap: spacing.md },
  relatedRow: { flexDirection: 'row', gap: spacing.sm },
  relatedIndex: { width: 28, paddingTop: spacing.sm, alignItems: 'center' },
  relatedIndexText: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 9 },
  relatedCard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorKicker: { color: palette.danger, fontFamily: fontFamily.black, fontSize: 9, letterSpacing: 1 },
  errorTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, marginTop: 5 },
  errorText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: typeScale.bodySm, textAlign: 'center', marginTop: spacing.sm },
  backButton: { marginTop: spacing.xl, backgroundColor: palette.white, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  backText: { color: palette.ink, fontFamily: fontFamily.black },
  skeletonPage: { flex: 1, backgroundColor: palette.ink },
  skeletonBody: { padding: layout.screenPadding, gap: spacing.md },
});
