import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExpandableText } from '@/components/ui/expandable-text';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { VideoPreviewSurface, videoPreviewUrl } from '@/components/video/video-preview-surface';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem } from '@/types/api';

type Mode = 'for-you' | 'following' | 'trending';
type FeedMedia = { type?: string | null; url?: string | null; thumbnail?: string | null };
type FeedItem = ContentItem & {
  body?: string | null;
  feed_slug?: string | null;
  created_at?: string | null;
  media?: FeedMedia[];
  author?: { name?: string | null; avatar_url?: string | null };
};
type TrendingGame = {
  id: number;
  name: string;
  slug: string;
  cover_url?: string | null;
  followers?: number;
  videos_count?: number;
};

const fallback = require('../../assets/images/logo-glow.png');
const feedPreviewViewabilityConfig = { itemVisiblePercentThreshold: 72, minimumViewTime: 700 };

function slugOf(item: FeedItem) {
  return item.slug || item.feed_slug || String(item.id);
}

function mediaOf(item: FeedItem) {
  const media = item.media?.[0];
  return item.thumbnail_url || media?.thumbnail || (media?.type === 'image' ? media.url : null) || item.image_url || item.cover_url;
}

export default function FeedScreen() {
  const [mode, setMode] = useState<Mode>('for-you');
  const [activePreviewId, setActivePreviewId] = useState<number | null>(null);
  const feed = usePaginatedResource<FeedItem>(
    '/feed?tab=' + (mode === 'trending' ? 'for-you' : mode) + '&per_page=12',
    15_000,
  );
  const trending = useApiResource<{ games: TrendingGame[] }>('/feed/trending', { games: [] }, 30_000);

  const onViewableItemsChanged = useCallback(({
    viewableItems,
  }: {
    viewableItems: { item: FeedItem; isViewable?: boolean }[];
  }) => {
    const candidate = viewableItems.find((token) => (
      token.isViewable
      && token.item.type === 'video'
      && Boolean(videoPreviewUrl(token.item))
    ));
    setActivePreviewId(candidate?.item.id ?? null);
  }, []);

  return (
    <Screen>
      <PageHeader title="Feed" subtitle="PLAYNEXUS SIGNAL" onSearch={() => router.push('/search')} />

      <View style={styles.topCopy}>
        <Text style={styles.kicker}>YOUR GAMING PULSE</Text>
        <Text style={styles.heading}>همه‌چیز مهم، بدون شلوغی</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Chip label="برای تو" active={mode === 'for-you'} onPress={() => setMode('for-you')} />
        <Chip label="دنبال‌شده‌ها" active={mode === 'following'} onPress={() => setMode('following')} />
        <Chip label="بازی‌های ترند" active={mode === 'trending'} onPress={() => setMode('trending')} />
      </ScrollView>

      {mode === 'trending' ? (
        <FlashList
          data={trending.data.games || []}
          refreshing={trending.refreshing}
          onRefresh={trending.refresh}
          contentContainerStyle={styles.content}
          renderItem={({ item, index }) => (
            <TrendingCard
              item={item}
              index={index}
              onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: item.slug } })}
            />
          )}
          ListEmptyComponent={trending.loading ? <FeedSkeleton /> : <Empty />}
        />
      ) : (
        <FlashList
          data={feed.data.data || []}
          refreshing={feed.refreshing}
          onRefresh={feed.refresh}
          onEndReached={() => void feed.loadMore()}
          onEndReachedThreshold={0.45}
          ListFooterComponent={feed.loadingMore ? <LoadingMore /> : null}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <FeedCard item={item} previewActive={activePreviewId === item.id} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={feedPreviewViewabilityConfig}
          ListEmptyComponent={feed.loading ? <FeedSkeleton /> : <Empty />}
        />
      )}
    </Screen>
  );
}

function FeedCard({ item, previewActive }: { item: FeedItem; previewActive: boolean }) {
  const image = mediaOf(item);
  const slug = slugOf(item);
  const author = item.author?.name || item.channel?.name || 'PlayNexus';
  const avatar = item.author?.avatar_url || item.channel?.avatar_url;
  const text = item.body || item.excerpt || '';
  const isVideo = item.type === 'video';

  return (
    <View style={styles.feedCard}>
      <PressableScale
        onPress={() => router.push({ pathname: '/content/[slug]', params: { slug } })}
        pressedScale={0.995}>
        <View style={styles.authorRow}>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{author}</Text>
            <Text style={styles.authorSub}>{item.game?.name || item.feed_type || 'PLAYNEXUS ORIGINAL'}</Text>
          </View>
          <View style={styles.avatarShell}>
            <Image source={avatar ? { uri: String(avatar) } : fallback} style={styles.avatar} contentFit="cover" />
          </View>
        </View>

        {image ? (
          <View style={styles.feedMedia}>
            <Image source={{ uri: String(image) }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {isVideo ? <VideoPreviewSurface item={item} active={previewActive} /> : null}
            <LinearGradient
              colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.12)', 'rgba(3,5,9,0.70)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.mediaBadge}>
              <View style={[styles.mediaDot, isVideo && styles.mediaDotVideo]} />
              <Text style={styles.mediaBadgeText}>{isVideo ? 'VIDEO' : 'FEED'}</Text>
            </View>
            {isVideo && !previewActive ? <View style={styles.playOrb}><Text style={styles.playGlyph}>▶</Text></View> : null}
          </View>
        ) : null}

        <View style={styles.feedCopy}>
          <Text numberOfLines={3} style={styles.feedTitle}>{item.title}</Text>
          {text ? <ExpandableText text={text} collapsedLines={3} threshold={150} style={styles.feedBody} /> : null}

          <View style={styles.metricsRow}>
            <Metric glyph="♥" value={item.likes_count || 0} />
            <Metric glyph="◌" value={item.comments_count || 0} />
            <Metric glyph="◎" value={item.views || 0} />
            <View style={styles.openSignal}><View style={styles.openArrow} /></View>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

function Metric({ glyph, value }: { glyph: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricGlyph}>{glyph}</Text>
      <Text style={styles.metricText}>{value ? value.toLocaleString('fa-IR') : '—'}</Text>
    </View>
  );
}

function TrendingCard({ item, index, onPress }: { item: TrendingGame; index: number; onPress: () => void }) {
  return (
    <PressableScale style={styles.game} onPress={onPress}>
      <Text style={styles.rank}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.gameCopy}>
        <Text style={styles.gameKicker}>TRENDING GAME</Text>
        <Text style={styles.gameName}>{item.name}</Text>
        <Text style={styles.gameMeta}>
          {(item.followers || 0).toLocaleString('fa-IR')} دنبال‌کننده · {(item.videos_count || 0).toLocaleString('fa-IR')} ویدیو
        </Text>
      </View>
      <Image source={item.cover_url ? { uri: item.cover_url } : fallback} style={styles.gameImage} contentFit="cover" />
    </PressableScale>
  );
}

function FeedSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonAuthor}>
            <SkeletonBox style={{ width: 132, height: 12 }} radius={6} />
            <SkeletonBox style={{ width: 46, height: 46 }} radius={16} />
          </View>
          <SkeletonBox style={{ width: '100%', height: 220 }} radius={22} />
          <SkeletonBox style={{ width: '84%', height: 18 }} radius={7} />
          <SkeletonBox style={{ width: '62%', height: 12 }} radius={6} />
        </View>
      ))}
    </View>
  );
}

function LoadingMore() {
  return <View style={styles.loadingMore}><View style={styles.loadingDot} /><Text style={styles.loadingMoreText}>در حال دریافت سیگنال‌های بیشتر…</Text></View>;
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrb}><View style={styles.emptyCore} /></View>
      <Text style={styles.emptyTitle}>فعلاً سیگنال تازه‌ای نیست</Text>
      <Text style={styles.emptyText}>با انتشار محتوا یا دنبال‌کردن بازی‌ها، این بخش دوباره زنده می‌شود.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topCopy: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg, alignItems: 'flex-end' },
  kicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.15 },
  heading: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 27, marginTop: 4 },
  filters: { gap: spacing.xs, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.md },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 110 },
  feedCard: { marginBottom: spacing.lg, borderRadius: radii.xxl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,16,26,0.72)', overflow: 'hidden', ...shadow.soft },
  authorRow: { minHeight: 72, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  authorMeta: { alignItems: 'flex-end', flex: 1 },
  authorName: { color: palette.white, fontFamily: fontFamily.black, fontSize: 14 },
  authorSub: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8, marginTop: 3 },
  avatarShell: { width: 48, height: 48, borderRadius: 17, padding: 1.5, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.05)' },
  avatar: { flex: 1, borderRadius: 15 },
  feedMedia: { width: '100%', aspectRatio: 16 / 10, backgroundColor: palette.surface },
  mediaBadge: { position: 'absolute', top: 12, right: 12, height: 28, paddingHorizontal: 9, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.64)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  mediaDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  mediaDotVideo: { backgroundColor: palette.magenta },
  mediaBadgeText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.8 },
  playOrb: { position: 'absolute', alignSelf: 'center', top: '42%', width: 54, height: 54, borderRadius: 20, backgroundColor: 'rgba(3,5,9,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  playGlyph: { color: palette.white, fontSize: 18, marginLeft: 2 },
  feedCopy: { padding: spacing.md, alignItems: 'flex-end' },
  feedTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: typeScale.title, lineHeight: 30, textAlign: 'right' },
  feedBody: { marginTop: spacing.xs, color: '#C6D0DE', fontSize: 13, lineHeight: 24 },
  metricsRow: { width: '100%', minHeight: 44, marginTop: spacing.md, flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  metric: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  metricGlyph: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 11 },
  metricText: { color: palette.textMuted, fontFamily: fontFamily.medium, fontSize: 9 },
  openSignal: { marginRight: 'auto', width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center' },
  openArrow: { width: 7, height: 7, borderLeftWidth: 1.2, borderBottomWidth: 1.2, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  game: { minHeight: 104, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 11 },
  gameCopy: { flex: 1, alignItems: 'flex-end' },
  gameKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  gameName: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 3 },
  gameMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 3, textAlign: 'right' },
  gameImage: { width: 72, height: 72, borderRadius: 22, backgroundColor: palette.surface },
  loadingMore: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  loadingMoreText: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 10 },
  skeletonWrap: { gap: spacing.md },
  skeletonCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyOrb: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 16, height: 16, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: spacing.md },
  emptyText: { maxWidth: 290, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: 5 },
});
