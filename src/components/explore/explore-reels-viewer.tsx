import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentsSection } from '@/components/community/comments-section';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, shadow, spacing } from '@/design';
import { apiRequest } from '@/services/api';
import type { DiscoverItem } from '@/types/api';

const fallback = require('../../../assets/images/logo-glow.png');

type ExploreData = {
  id?: number;
  type?: string | null;
  title?: string | null;
  slug?: string | null;
  url?: string | null;
  excerpt?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  media_alt?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  likes_count?: number;
  comments_count?: number;
  views?: number;
  is_liked?: boolean;
  allow_comments?: boolean;
  channel?: {
    name?: string | null;
    avatar_url?: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
  } | null;
  game?: {
    name?: string | null;
    slug?: string | null;
    cover_url?: string | null;
  } | null;
  pricing?: {
    final_price?: number | null;
  } | null;
  category?: string | null;
  product_type?: string | null;
};

function dataOf(item: DiscoverItem) {
  return item.data as ExploreData;
}

function videoOf(item: DiscoverItem) {
  const data = dataOf(item);
  if (item.kind === 'product_media') {
    return data.media_type === 'video' ? data.media_url || null : null;
  }

  return data.video_url || null;
}

function imageOf(item: DiscoverItem) {
  const data = dataOf(item);

  if (item.kind === 'product_media') {
    return data.media_type === 'image'
      ? data.media_url || data.cover_url || null
      : data.cover_url || data.thumbnail_url || null;
  }

  return data.thumbnail_url || data.image_url || data.cover_url || data.game?.cover_url || null;
}

function titleOf(item: DiscoverItem) {
  return String(dataOf(item).title || 'PlayNexus');
}

function slugOf(item: DiscoverItem) {
  const slug = dataOf(item).slug;
  return typeof slug === 'string' && slug.trim() ? slug : null;
}

export function ExploreReelsViewer({
  open,
  items,
  initialIndex,
  loadingMore,
  onClose,
  onLoadMore,
}: {
  open: boolean;
  items: DiscoverItem[];
  initialIndex: number;
  loadingMore: boolean;
  onClose: () => void;
  onLoadMore: () => Promise<void>;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<DiscoverItem>>(null);
  const viewability = useRef({ itemVisiblePercentThreshold: 72, minimumViewTime: 120 }).current;
  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialIndex));
  const [comments, setComments] = useState<{ slug: string; enabled: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = Math.max(0, Math.min(initialIndex, Math.max(0, items.length - 1)));
    setActiveIndex(next);
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: next, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialIndex, items.length, open]);

  const onViewableItemsChanged = useRef(({
    viewableItems,
  }: {
    viewableItems: { index: number | null; isViewable: boolean }[];
  }) => {
    const active = viewableItems.find((token) => token.isViewable && token.index !== null);
    if (active?.index !== null && active?.index !== undefined) {
      setActiveIndex(active.index);
    }
  }).current;

  return (
    <Modal
      visible={open}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.modal}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={({ item, index }) => (
            <ExploreReelSlide
              item={item}
              active={index === activeIndex}
              height={height}
              bottomInset={Math.max(insets.bottom, 12)}
              onComments={(slug, enabled) => setComments({ slug, enabled })}
            />
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          initialScrollIndex={Math.max(0, Math.min(initialIndex, Math.max(0, items.length - 1)))}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewability}
          onScrollToIndexFailed={({ index }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: Math.max(0, index) * height,
                animated: false,
              });
            });
          }}
          onEndReached={() => void onLoadMore()}
          onEndReachedThreshold={0.7}
          windowSize={5}
          maxToRenderPerBatch={3}
          removeClippedSubviews
        />

        <PressableScale
          haptic={false}
          onPress={onClose}
          style={[styles.close, { top: Math.max(insets.top, 12) + 8 }]}>
          <Text style={styles.closeText}>×</Text>
        </PressableScale>

        {loadingMore ? (
          <View style={[styles.loadingMore, { bottom: Math.max(insets.bottom, 10) + 16 }]}>
            <View style={styles.loadingDot} />
            <Text style={styles.loadingText}>در حال دریافت…</Text>
          </View>
        ) : null}

        {comments ? (
          <Pressable style={styles.sheetBackdrop} onPress={() => setComments(null)}>
            <Pressable
              style={[styles.commentsSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
              onPress={(event) => event.stopPropagation()}>
              <View style={styles.sheetHandle} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                <CommentsSection slug={comments.slug} enabled={comments.enabled} />
              </ScrollView>
            </Pressable>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

function ExploreReelSlide({
  item,
  active,
  height,
  bottomInset,
  onComments,
}: {
  item: DiscoverItem;
  active: boolean;
  height: number;
  bottomInset: number;
  onComments: (slug: string, enabled: boolean) => void;
}) {
  const data = dataOf(item);
  const video = videoOf(item);
  const image = imageOf(item);
  const slug = slugOf(item);
  const [liked, setLiked] = useState(Boolean(data.is_liked));
  const [likes, setLikes] = useState(Number(data.likes_count || 0));
  const [muted, setMuted] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (!active || item.kind !== 'content' || !slug || viewed.current) return;

    const timer = setTimeout(() => {
      viewed.current = true;
      void apiRequest(
        '/contents/' + encodeURIComponent(slug) + '/views',
        { method: 'POST' },
        { auth: false },
      ).catch(() => {
        viewed.current = false;
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [active, item.kind, slug]);

  const toggleLike = async () => {
    if (item.kind !== 'content' || !slug) return;
    const beforeLiked = liked;
    const beforeLikes = likes;
    const nextLiked = !beforeLiked;

    setLiked(nextLiked);
    setLikes(Math.max(0, beforeLikes + (nextLiked ? 1 : -1)));

    try {
      const result = await apiRequest<{ reaction?: 'like' | null }>(
        '/contents/' + encodeURIComponent(slug) + '/reaction',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'like' }),
        },
      );
      const serverLiked = result.reaction === 'like';
      setLiked(serverLiked);
      setLikes(Math.max(0, beforeLikes + (serverLiked ? (beforeLiked ? 0 : 1) : (beforeLiked ? -1 : 0))));
    } catch {
      setLiked(beforeLiked);
      setLikes(beforeLikes);
    }
  };

  const share = () => {
    const rawUrl = typeof data.url === 'string' ? data.url : null;
    const url = rawUrl
      ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://playnexus.ir' + rawUrl)
      : 'https://playnexus.ir';

    void Share.share({
      title: titleOf(item),
      message: titleOf(item) + '\n' + url,
    });
  };

  const openFull = () => {
    if (!slug) return;

    if (item.kind === 'product_media') {
      router.push({ pathname: '/product/[slug]', params: { slug } });
      return;
    }

    router.push({ pathname: '/content/[slug]', params: { slug } });
  };

  const identity = data.channel?.name || data.game?.name || (item.kind === 'product_media' ? 'PlayNexus Store' : 'PlayNexus');
  const avatar = data.channel?.logo_url || data.channel?.avatar_url || data.channel?.cover_url || data.game?.cover_url || image;
  const comments = Number(data.comments_count || 0);
  const views = Number(data.views || 0);

  return (
    <View style={[styles.slide, { height }]}>
      {video ? (
        <ExploreReelVideo
          source={String(video)}
          poster={image ? String(image) : null}
          active={active}
          muted={muted}
        />
      ) : (
        <Image
          source={image ? { uri: String(image) } : fallback}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(0,0,0,0.10)',
          'rgba(0,0,0,0.00)',
          'rgba(0,0,0,0.18)',
          'rgba(0,0,0,0.92)',
        ]}
        locations={[0, 0.45, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.identity, { top: 64 }]}>
        <View style={styles.identityCopy}>
          <Text numberOfLines={1} style={styles.identityName}>{identity}</Text>
          <Text style={styles.identityMeta}>
            {item.kind === 'product_media'
              ? 'STORE'
              : data.type === 'video'
                ? 'VIDEO'
                : 'POST'}
          </Text>
        </View>
        <Image
          source={avatar ? { uri: String(avatar) } : fallback}
          style={styles.identityAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>

      <View style={[styles.copy, { bottom: bottomInset + 70 }]}>
        <Text numberOfLines={3} style={styles.title}>{titleOf(item)}</Text>
        {data.excerpt ? <Text numberOfLines={2} style={styles.excerpt}>{data.excerpt}</Text> : null}

        {item.kind === 'product_media' && data.pricing?.final_price ? (
          <Text style={styles.price}>{Number(data.pricing.final_price).toLocaleString('fa-IR')} تومان</Text>
        ) : null}

        <PressableScale onPress={openFull} style={styles.fullButton}>
          <Text style={styles.fullButtonText}>
            {item.kind === 'product_media' ? 'مشاهده محصول' : 'مشاهده کامل'}
          </Text>
          <Text style={styles.fullArrow}>↗</Text>
        </PressableScale>
      </View>

      <View style={[styles.actions, { bottom: bottomInset + 86 }]}>
        {item.kind === 'content' ? (
          <>
            <ReelAction
              glyph={liked ? '♥' : '♡'}
              value={likes}
              active={liked}
              onPress={() => void toggleLike()}
            />
            <ReelAction
              glyph="◌"
              value={comments}
              onPress={() => {
                if (slug) onComments(slug, data.allow_comments !== false);
              }}
            />
          </>
        ) : null}

        <ReelAction glyph="↗" onPress={share} />

        {item.kind === 'content' ? (
          <View style={styles.passiveAction}>
            <Text style={styles.passiveGlyph}>◉</Text>
            <Text style={styles.actionValue}>{views.toLocaleString('fa-IR')}</Text>
          </View>
        ) : null}

        {video ? (
          <ReelAction glyph={muted ? '×♪' : '♪'} onPress={() => setMuted((value) => !value)} />
        ) : null}
      </View>

      <View pointerEvents="none" style={styles.swipeHint}>
        <View style={styles.swipeLine} />
        <Text style={styles.swipeText}>برای محتوای بعدی بالا بکش</Text>
      </View>
    </View>
  );
}

function ExploreReelVideo({
  source,
  poster,
  active,
  muted,
}: {
  source: string;
  poster: string | null;
  active: boolean;
  muted: boolean;
}) {
  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.loop = true;
    instance.muted = muted;
    instance.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  useEventListener(player, 'playToEnd', () => {
    if (active) player.play();
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {poster ? (
        <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" />
      ) : null}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

function ReelAction({
  glyph,
  value,
  active = false,
  onPress,
}: {
  glyph: string;
  value?: number;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.action}>
      <View style={[styles.actionOrb, active && styles.actionOrbActive]}>
        <Text style={[styles.actionGlyph, active && styles.actionGlyphActive]}>{glyph}</Text>
      </View>
      {value !== undefined ? <Text style={styles.actionValue}>{value.toLocaleString('fa-IR')}</Text> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: palette.black,
  },
  slide: {
    width: '100%',
    backgroundColor: palette.black,
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    zIndex: 80,
    left: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 31,
    fontFamily: fontFamily.regular,
  },
  identity: {
    position: 'absolute',
    zIndex: 20,
    right: 14,
    maxWidth: '72%',
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  identityCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  identityName: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 12,
  },
  identityMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  identityAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  copy: {
    position: 'absolute',
    zIndex: 20,
    left: 16,
    right: 78,
    alignItems: 'flex-end',
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 20,
    lineHeight: 29,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowRadius: 5,
  },
  excerpt: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'right',
    marginTop: 5,
  },
  price: {
    color: '#55E7AE',
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 14,
    marginTop: 7,
  },
  fullButton: {
    minHeight: 40,
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  fullButtonText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 9,
  },
  fullArrow: {
    color: palette.white,
    fontSize: 13,
  },
  actions: {
    position: 'absolute',
    zIndex: 24,
    right: 10,
    gap: 13,
    alignItems: 'center',
  },
  action: {
    minWidth: 48,
    alignItems: 'center',
  },
  actionOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  actionOrbActive: {
    borderColor: 'rgba(255,85,213,0.42)',
    backgroundColor: 'rgba(255,85,213,0.16)',
  },
  actionGlyph: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 19,
  },
  actionGlyphActive: {
    color: palette.magenta,
  },
  actionValue: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 8,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  passiveAction: {
    alignItems: 'center',
  },
  passiveGlyph: {
    width: 46,
    height: 46,
    borderRadius: 23,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: palette.white,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    fontSize: 16,
  },
  swipeHint: {
    position: 'absolute',
    zIndex: 18,
    top: 14,
    alignSelf: 'center',
    alignItems: 'center',
    opacity: 0.54,
  },
  swipeLine: {
    width: 32,
    height: 3,
    borderRadius: 3,
    backgroundColor: palette.white,
  },
  swipeText: {
    color: palette.white,
    fontFamily: fontFamily.medium,
    fontSize: 7,
    marginTop: 5,
  },
  loadingMore: {
    position: 'absolute',
    zIndex: 70,
    alignSelf: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.70)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  loadingDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  loadingText: {
    color: palette.white,
    fontFamily: fontFamily.medium,
    fontSize: 8,
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    maxHeight: '72%',
    minHeight: '48%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: palette.ink,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
