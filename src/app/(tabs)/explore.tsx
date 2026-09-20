import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ExploreReelsViewer } from '@/components/explore/explore-reels-viewer';
import { ExpandableText } from '@/components/ui/expandable-text';
import { StoryTray } from '@/components/stories/story-tray';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem, DiscoverItem } from '@/types/api';

const fallback = require('../../../assets/images/logo-glow.png');
const GRID_GAP = 3;

type Mode = 'discover' | 'feed';
type ExploreGroup =
  | { key: string; type: 'hero'; items: DiscoverItem[]; flip: boolean }
  | { key: string; type: 'row'; items: DiscoverItem[] };

type FeedMedia = {
  type?: string | null;
  url?: string | null;
  thumbnail?: string | null;
};

type FeedItem = ContentItem & {
  body?: string | null;
  feed_slug?: string | null;
  created_at?: string | null;
  media?: FeedMedia[];
  author?: { name?: string | null; avatar_url?: string | null };
};

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('discover');
  const [selectedExploreIndex, setSelectedExploreIndex] = useState<number | null>(null);

  const discover = usePaginatedResource<DiscoverItem>('/discover?per_page=30', 15_000);
  const feed = usePaginatedResource<FeedItem>('/feed?tab=for-you&per_page=14', 15_000);

  const groups = useMemo<ExploreGroup[]>(() => {
    const source = discover.items;
    const result: ExploreGroup[] = [];
    let cursor = 0;
    let block = 0;

    while (cursor < source.length) {
      if (block % 2 === 0) {
        const items = source.slice(cursor, cursor + 3);
        if (items.length) {
          result.push({
            key: 'hero-' + (items[0]?.key || cursor),
            type: 'hero',
            items,
            flip: Math.floor(block / 2) % 2 === 1,
          });
        }
        cursor += 3;
      } else {
        const items = source.slice(cursor, cursor + 3);
        if (items.length) {
          result.push({
            key: 'row-' + (items[0]?.key || cursor),
            type: 'row',
            items,
          });
        }
        cursor += 3;
      }
      block += 1;
    }

    return result;
  }, [discover.items]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>PLAYNEXUS</Text>
          <Text style={styles.title}>{mode === 'discover' ? 'Explore' : 'Feed'}</Text>
        </View>

        <PressableScale onPress={() => router.push('/search')} style={styles.searchButton}>
          <View style={styles.searchLens} />
          <View style={styles.searchHandle} />
        </PressableScale>
      </View>

      <StoryTray />

      <View style={styles.switcher}>
        <PressableScale
          onPress={() => setMode('discover')}
          style={[styles.switchButton, mode === 'discover' && styles.switchButtonActive]}>
          <View style={[styles.discoverGlyph, mode === 'discover' && styles.discoverGlyphActive]}>
            <View style={styles.discoverGlyphCore} />
          </View>
          <Text style={[styles.switchText, mode === 'discover' && styles.switchTextActive]}>کشف</Text>
        </PressableScale>

        <PressableScale
          onPress={() => setMode('feed')}
          style={[styles.switchButton, mode === 'feed' && styles.switchButtonActive]}>
          <View style={styles.feedGlyph}>
            <View style={[styles.feedGlyphLine, mode === 'feed' && styles.feedGlyphLineActive]} />
            <View style={[styles.feedGlyphLine, mode === 'feed' && styles.feedGlyphLineActive]} />
            <View style={[styles.feedGlyphLineShort, mode === 'feed' && styles.feedGlyphLineActive]} />
          </View>
          <Text style={[styles.switchText, mode === 'feed' && styles.switchTextActive]}>فید</Text>
        </PressableScale>
      </View>

      {mode === 'discover' ? (
        <DiscoverGrid
          width={width}
          groups={groups}
          loading={discover.loading}
          refreshing={discover.refreshing}
          refresh={discover.refresh}
          loadMore={discover.loadMore}
          loadingMore={discover.loadingMore}
          onOpen={(item) => {
            const index = discover.items.findIndex((entry) => entry.key === item.key);
            if (index >= 0) setSelectedExploreIndex(index);
          }}
        />
      ) : (
        <LinkedFeed
          items={feed.data.data || []}
          loading={feed.loading}
          refreshing={feed.refreshing}
          refresh={feed.refresh}
          loadMore={feed.loadMore}
          loadingMore={feed.loadingMore}
        />
      )}

      <ExploreReelsViewer
        open={selectedExploreIndex !== null}
        items={discover.items}
        initialIndex={selectedExploreIndex ?? 0}
        loadingMore={discover.loadingMore}
        onClose={() => setSelectedExploreIndex(null)}
        onLoadMore={discover.loadMore}
      />
    </Screen>
  );
}

function DiscoverGrid({
  width,
  groups,
  loading,
  refreshing,
  refresh,
  loadMore,
  loadingMore,
  onOpen,
}: {
  width: number;
  groups: ExploreGroup[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  onOpen: (item: DiscoverItem) => void;
}) {
  const unit = Math.floor((width - GRID_GAP * 2) / 3);
  const feature = unit * 2 + GRID_GAP;

  return (
    <FlashList
      data={groups}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        if (item.type === 'row') {
          return (
            <View style={[styles.gridRow, { height: unit }]}>
              {item.items.map((entry) => (
                <ExploreTile key={entry.key} item={entry} width={unit} height={unit} onOpen={onOpen} />
              ))}
              {item.items.length < 3
                ? Array.from({ length: 3 - item.items.length }).map((_, index) => (
                    <View key={'blank-' + index} style={{ width: unit, height: unit }} />
                  ))
                : null}
            </View>
          );
        }

        const [first, second, third] = item.items;
        const big = first ? <ExploreTile item={first} width={feature} height={feature} onOpen={onOpen} /> : null;
        const side = (
          <View style={[styles.sideColumn, { width: unit, height: feature }]}>
            {second ? <ExploreTile item={second} width={unit} height={unit} onOpen={onOpen} /> : <View style={{ width: unit, height: unit }} />}
            {third ? <ExploreTile item={third} width={unit} height={unit} onOpen={onOpen} /> : <View style={{ width: unit, height: unit }} />}
          </View>
        );

        return (
          <View style={[styles.featureRow, { height: feature }]}>
            {item.flip ? side : big}
            {item.flip ? big : side}
          </View>
        );
      }}
      refreshing={refreshing}
      onRefresh={refresh}
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.55}
      ListEmptyComponent={loading ? <ExploreSkeleton width={width} /> : <DiscoverEmpty />}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.gridLoader}>
            <View style={styles.gridLoaderDot} />
          </View>
        ) : null
      }
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ExploreTile({
  item,
  width,
  height,
  onOpen,
}: {
  item: DiscoverItem;
  width: number;
  height: number;
  onOpen: (item: DiscoverItem) => void;
}) {
  const data = item.data || {};
  const uri = data.media_url || data.thumbnail_url || data.image_url || data.cover_url;
  const contentType = typeof data.type === 'string' ? data.type : null;
  const mediaType = typeof data.media_type === 'string' ? data.media_type : null;
  const isVideo = contentType === 'video' || contentType === 'short' || mediaType === 'video';

  return (
    <PressableScale
      onPress={() => onOpen(item)}
      pressedScale={0.99}
      style={[styles.tile, { width, height }]}>
      <Image
        source={uri ? { uri: String(uri) } : fallback}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={item.key}
        transition={100}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.02)', 'rgba(3,5,9,0.18)']}
        locations={[0, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      {isVideo ? (
        <View style={styles.videoIndicator}>
          <View style={styles.playTriangle} />
        </View>
      ) : null}

      {item.kind === 'product_media' ? (
        <View style={styles.storeIndicator}>
          <View style={styles.storeIndicatorLine} />
          <View style={styles.storeIndicatorLine} />
        </View>
      ) : null}
    </PressableScale>
  );
}

function LinkedFeed({
  items,
  loading,
  refreshing,
  refresh,
  loadMore,
  loadingMore,
}: {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}) {
  return (
    <FlashList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <LinkedFeedCard item={item} />}
      refreshing={refreshing}
      onRefresh={refresh}
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.45}
      ListHeaderComponent={
        <View style={styles.feedIntro}>
          <View>
            <Text style={styles.feedIntroKicker}>NETWORK FEED</Text>
            <Text style={styles.feedIntroTitle}>جامعه PlayNexus</Text>
          </View>
          <View style={styles.feedLive}>
            <View style={styles.feedLiveDot} />
            <Text style={styles.feedLiveText}>LIVE</Text>
          </View>
        </View>
      }
      ListEmptyComponent={loading ? <FeedSkeleton /> : <FeedEmpty />}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.feedLoading}>
            <View style={styles.feedLoadingDot} />
            <Text style={styles.feedLoadingText}>پست‌های بیشتر…</Text>
          </View>
        ) : null
      }
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

function LinkedFeedCard({ item }: { item: FeedItem }) {
  const slug = item.slug || item.feed_slug || String(item.id);
  const media = item.media?.[0];
  const image = item.thumbnail_url
    || media?.thumbnail
    || (media?.type === 'image' ? media.url : null)
    || item.image_url
    || item.cover_url;
  const author = item.author?.name || item.channel?.name || item.game?.name || 'PlayNexus';
  const avatar = item.author?.avatar_url || item.channel?.logo_url || item.channel?.avatar_url || item.game?.cover_url;
  const copy = item.body || item.excerpt || '';
  const isVideo = item.type === 'video' || item.type === 'short';

  return (
    <View style={styles.feedCard}>
      <PressableScale
        onPress={() => router.push({ pathname: '/content/[slug]', params: { slug } })}
        pressedScale={0.997}>
        <View style={styles.authorRow}>
          <View style={styles.authorText}>
            <Text numberOfLines={1} style={styles.authorName}>{author}</Text>
            <Text numberOfLines={1} style={styles.authorMeta}>
              {item.feed_type || item.game?.name || 'PlayNexus Community'}
            </Text>
            <Text style={styles.authorTime}>{item.published_at ? 'تازه منتشر شده' : 'PlayNexus'}</Text>
          </View>

          <View style={styles.avatarShell}>
            <Image
              source={avatar ? { uri: String(avatar) } : fallback}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
        </View>

        <View style={styles.postCopy}>
          <Text numberOfLines={3} style={styles.postTitle}>{item.title}</Text>
          {copy ? (
            <ExpandableText
              text={copy}
              collapsedLines={3}
              threshold={180}
              style={styles.postBody}
              accent={palette.cyan}
            />
          ) : null}
        </View>

        {image ? (
          <View style={styles.postMedia}>
            <Image
              source={{ uri: String(image) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {isVideo ? (
              <View style={styles.feedPlayOrb}>
                <View style={styles.feedPlayTriangle} />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.engagementSummary}>
          <View style={styles.engagementLeft}>
            <View style={styles.reactionBubble}><Text style={styles.reactionGlyph}>♥</Text></View>
            <Text style={styles.summaryText}>{(item.likes_count || 0).toLocaleString('fa-IR')}</Text>
          </View>
          <Text style={styles.summaryText}>
            {(item.comments_count || 0).toLocaleString('fa-IR')} نظر · {(item.views || 0).toLocaleString('fa-IR')} بازدید
          </Text>
        </View>

        <View style={styles.actionDivider} />

        <View style={styles.actionRow}>
          <FeedAction label="پسند" glyph="♡" />
          <FeedAction label="نظر" glyph="◌" />
          <FeedAction label="ذخیره" glyph="◇" />
          <FeedAction label="باز کردن" glyph="↗" />
        </View>
      </PressableScale>
    </View>
  );
}

function FeedAction({ label, glyph }: { label: string; glyph: string }) {
  return (
    <View style={styles.actionItem}>
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

function ExploreSkeleton({ width }: { width: number }) {
  const unit = Math.floor((width - GRID_GAP * 2) / 3);
  const feature = unit * 2 + GRID_GAP;

  return (
    <View style={styles.skeletonWrap}>
      <View style={[styles.featureRow, { height: feature }]}>
        <SkeletonBox style={{ width: feature, height: feature }} radius={0} />
        <View style={[styles.sideColumn, { width: unit, height: feature }]}>
          <SkeletonBox style={{ width: unit, height: unit }} radius={0} />
          <SkeletonBox style={{ width: unit, height: unit }} radius={0} />
        </View>
      </View>
      <View style={[styles.gridRow, { height: unit }]}>
        <SkeletonBox style={{ width: unit, height: unit }} radius={0} />
        <SkeletonBox style={{ width: unit, height: unit }} radius={0} />
        <SkeletonBox style={{ width: unit, height: unit }} radius={0} />
      </View>
    </View>
  );
}

function FeedSkeleton() {
  return (
    <View style={styles.feedSkeleton}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.feedSkeletonCard}>
          <View style={styles.feedSkeletonAuthor}>
            <View style={styles.feedSkeletonLines}>
              <SkeletonBox style={{ width: 116, height: 12 }} radius={6} />
              <SkeletonBox style={{ width: 78, height: 9 }} radius={5} />
            </View>
            <SkeletonBox style={{ width: 48, height: 48 }} radius={16} />
          </View>
          <SkeletonBox style={{ width: '88%', height: 18, alignSelf: 'flex-end' }} radius={7} />
          <SkeletonBox style={{ width: '100%', height: 220 }} radius={0} />
        </View>
      ))}
    </View>
  );
}

function DiscoverEmpty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}><View style={styles.emptyMarkCore} /></View>
      <Text style={styles.emptyTitle}>چیزی برای کشف نیست</Text>
      <Text style={styles.emptyText}>با محتوای تازه، این گرید خودش دوباره زنده می‌شود.</Text>
    </View>
  );
}

function FeedEmpty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}><View style={styles.emptyMarkCore} /></View>
      <Text style={styles.emptyTitle}>فید فعلاً ساکته</Text>
      <Text style={styles.emptyText}>با انتشار محتوای تازه دوباره پر می‌شود.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 72,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: { alignItems: 'flex-end' },
  kicker: {
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 1,
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLens: {
    width: 16,
    height: 16,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: palette.white,
  },
  searchHandle: {
    position: 'absolute',
    width: 7,
    height: 1.8,
    borderRadius: 2,
    backgroundColor: palette.white,
    transform: [{ rotate: '-45deg' }, { translateX: -7 }, { translateY: 7 }],
  },
  switcher: {
    height: 52,
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: 'row-reverse',
    gap: 4,
  },
  switchButton: {
    flex: 1,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchButtonActive: {
    backgroundColor: 'rgba(88,244,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.24)',
  },
  switchText: {
    color: palette.textMuted,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 11,
  },
  switchTextActive: { color: palette.white },
  discoverGlyph: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: palette.textDim,
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverGlyphActive: { borderColor: palette.cyan },
  discoverGlyphCore: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  feedGlyph: { width: 17, gap: 3 },
  feedGlyphLine: {
    width: 17,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: palette.textDim,
  },
  feedGlyphLineShort: {
    width: 11,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: palette.textDim,
  },
  feedGlyphLineActive: { backgroundColor: palette.cyan },
  gridContent: {
    paddingTop: GRID_GAP,
    paddingBottom: 120,
  },
  featureRow: {
    width: '100%',
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridRow: {
    width: '100%',
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  sideColumn: {
    gap: GRID_GAP,
  },
  tile: {
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  videoIndicator: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: 'rgba(3,5,9,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: palette.white,
    marginLeft: 2,
  },
  storeIndicator: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: 'rgba(3,5,9,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  storeIndicatorLine: {
    width: 10,
    height: 1.4,
    borderRadius: 2,
    backgroundColor: palette.white,
  },
  skeletonWrap: { gap: GRID_GAP },
  gridLoader: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLoaderDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  feedContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 128,
  },
  feedIntro: {
    minHeight: 68,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedIntroKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 1,
    textAlign: 'right',
  },
  feedIntroTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 21,
    marginTop: 3,
    textAlign: 'right',
  },
  feedLive: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.16)',
    backgroundColor: 'rgba(80,232,176,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  feedLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  feedLiveText: {
    color: palette.success,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  feedCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(10,16,26,0.74)',
    ...shadow.soft,
  },
  authorRow: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorText: { flex: 1, alignItems: 'flex-end' },
  authorName: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 13,
  },
  authorMeta: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'right',
  },
  authorTime: {
    color: palette.textDim,
    fontFamily: fontFamily.medium,
    fontSize: 8,
    marginTop: 2,
  },
  avatarShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    padding: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
  },
  avatar: { flex: 1, borderRadius: 14 },
  postCopy: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'flex-end',
  },
  postTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  postBody: {
    color: '#C9D2DF',
    fontSize: 12,
    lineHeight: 22,
    marginTop: 5,
  },
  postMedia: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: palette.surface,
  },
  feedPlayOrb: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(3,5,9,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedPlayTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: palette.white,
    marginLeft: 3,
  },
  engagementSummary: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reactionBubble: {
    width: 19,
    height: 19,
    borderRadius: 19,
    backgroundColor: palette.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionGlyph: {
    color: palette.ink,
    fontSize: 9,
    fontFamily: fontFamily.black,
  },
  summaryText: {
    color: palette.textDim,
    fontFamily: fontFamily.medium,
    fontSize: 9,
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.md,
  },
  actionRow: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionGlyph: {
    color: palette.textMuted,
    fontFamily: fontFamily.black,
    fontSize: 12,
  },
  actionLabel: {
    color: palette.textMuted,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 9,
  },
  feedLoading: {
    height: 68,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feedLoadingDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.cyan,
  },
  feedLoadingText: {
    color: palette.textDim,
    fontFamily: fontFamily.medium,
    fontSize: 9,
  },
  feedSkeleton: { gap: spacing.md },
  feedSkeletonCard: {
    gap: spacing.sm,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    paddingTop: spacing.sm,
  },
  feedSkeletonAuthor: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedSkeletonLines: { gap: 6, alignItems: 'flex-end' },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyMark: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMarkCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 18,
    marginTop: spacing.md,
  },
  emptyText: {
    maxWidth: 300,
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 5,
  },
});
