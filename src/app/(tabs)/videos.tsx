import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { VideoPreviewSurface, videoPreviewUrl } from '@/components/video/video-preview-surface';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem } from '@/types/api';

const fallback = require('../../../assets/images/logo-glow.png');
const previewViewabilityConfig = { itemVisiblePercentThreshold: 68, minimumViewTime: 650 };

function thumbnailOf(item: ContentItem) {
  return item.thumbnail_url || item.image_url || item.cover_url || item.game?.cover_url;
}

function logoOf(item: ContentItem) {
  return item.channel?.logo_url || item.channel?.avatar_url || item.channel?.cover_url || item.game?.cover_url || thumbnailOf(item);
}

function durationLabel(seconds?: number | null) {
  if (!seconds) return null;
  const total = Math.max(1, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes + ':' + String(rest).padStart(2, '0');
}

export default function VideosScreen() {
  const [activePreviewId, setActivePreviewId] = useState<number | null>(null);
  const {
    items: videos,
    loading,
    refreshing,
    refresh,
    loadMore,
    loadingMore,
  } = usePaginatedResource<ContentItem>('/videos?per_page=16', 15_000);

  const featured = videos[0];
  const rest = videos.slice(1);

  const onViewableItemsChanged = useCallback(({
    viewableItems,
  }: {
    viewableItems: { item: ContentItem; isViewable?: boolean }[];
  }) => {
    // Inline native video previews are intentionally disabled on Android.
    // Rapidly recycled Media3/Surface instances were the source of the
    // scroll-time native crash on the Watch feed. Android now keeps the list
    // image-only and opens the real player only after the user taps a video.
    if (Platform.OS === 'android') {
      setActivePreviewId(null);
      return;
    }

    const candidate = viewableItems
      .find((token) => token.isViewable && Boolean(videoPreviewUrl(token.item)));
    setActivePreviewId(candidate?.item.id ?? null);
  }, []);

  return (
    <Screen>
      <PageHeader
        title="Watch"
        subtitle="PLAYNEXUS VIDEO"
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={rest}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <VideoRow
            item={item}
            previewActive={Platform.OS !== 'android' && activePreviewId === item.id}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={previewViewabilityConfig}
        ListHeaderComponent={
          <>
            <View style={styles.intro}>
              <Text style={styles.introKicker}>NEXUS WATCH</Text>
              <Text style={styles.introTitle}>ویدیو، فقط وقتی ارزش دیدن دارد</Text>
              <Text style={styles.introBody}>
                یک Watch اختصاصی برای بازی‌ها؛ سریع، تمیز و با هویت هر Game Hub.
              </Text>
            </View>

            {loading && !videos.length ? (
              <VideoPageSkeleton />
            ) : (
              <>
                <GameLogoCloud videos={videos.slice(0, 12)} />

                {featured ? (
                  <View style={styles.featuredWrap}>
                    <View style={styles.sectionHead}>
                      <Text style={styles.sectionAction}>FEATURED</Text>
                      <View style={styles.sectionCopy}>
                        <Text style={styles.sectionKicker}>START HERE</Text>
                        <Text style={styles.sectionTitle}>انتخاب اول</Text>
                      </View>
                    </View>
                    <FeaturedVideo item={featured} />
                  </View>
                ) : null}

                <PressableScale onPress={() => router.push('/shorts')} style={styles.shortsPortal}>
                  <LinearGradient
                    colors={['rgba(255,85,213,0.15)', 'rgba(167,123,255,0.08)', 'rgba(8,14,23,0.94)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.shortsIcon}><Text style={styles.shortsPlay}>▶</Text></View>
                  <View style={styles.shortsCopy}>
                    <Text style={styles.shortsKicker}>VERTICAL WATCH</Text>
                    <Text style={styles.shortsTitle}>Shorts</Text>
                    <Text style={styles.shortsText}>لحظه‌های سریع، تمام‌صفحه</Text>
                  </View>
                  <View style={styles.portalArrow} />
                </PressableScale>

                {rest.length ? (
                  <View style={styles.latestHead}>
                    <Text style={styles.latestCount}>{videos.length.toLocaleString('fa-IR')} SIGNALS</Text>
                    <View style={styles.sectionCopy}>
                      <Text style={styles.sectionKicker}>LATEST WATCH</Text>
                      <Text style={styles.sectionTitle}>تازه‌ترین ویدیوها</Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </>
        }
        ListEmptyComponent={!loading ? <Empty /> : null}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.30}
        drawDistance={520}
        ListFooterComponent={loadingMore ? <LoadingMore /> : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function GameLogoCloud({ videos }: { videos: ContentItem[] }) {
  if (!videos.length) return null;

  return (
    <View style={styles.cloudSection}>
      <View style={styles.cloudHeader}>
        <Text style={styles.cloudCount}>{videos.length.toLocaleString('fa-IR')} GAME SIGNALS</Text>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionKicker}>VIDEO CLOUD</Text>
          <Text style={styles.cloudTitle}>بازی‌های همین صفحه</Text>
        </View>
      </View>

      <View style={styles.cloudFrame}>
        <LinearGradient
          colors={['rgba(88,244,255,0.08)', 'rgba(24,124,255,0.025)', 'rgba(3,5,9,0.00)']}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.logoRail}>
          {videos.map((video, index) => (
            <PressableScale
              key={video.id}
              onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: video.slug } })}
              style={[styles.logoTile, index % 3 === 1 && styles.logoTileLift, index % 3 === 2 && styles.logoTileDrop]}>
              <Image
                source={logoOf(video) ? { uri: String(logoOf(video)) } : fallback}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={'video-cloud-' + String(video.id)}
              />
              <LinearGradient
                colors={['rgba(3,5,9,0.03)', 'rgba(3,5,9,0.70)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.logoTag}><Text style={styles.logoIndex}>{String(index + 1).padStart(2, '0')}</Text></View>
              <Text numberOfLines={1} style={styles.logoName}>{video.game?.name || video.channel?.name || 'PlayNexus'}</Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function FeaturedVideo({ item }: { item: ContentItem }) {
  const thumbnail = thumbnailOf(item);
  const duration = durationLabel(item.duration);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
      pressedScale={0.99}
      style={styles.featured}>
      <Image source={thumbnail ? { uri: String(thumbnail) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(3,5,9,0.04)', 'rgba(3,5,9,0.08)', 'rgba(3,5,9,0.94)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featuredTop}>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>NEXUS FEATURE</Text></View>
        {duration ? <View style={styles.duration}><Text style={styles.durationText}>{duration}</Text></View> : null}
      </View>
      <View style={styles.featuredPlay}><Text style={styles.featuredPlayText}>▶</Text></View>
      <View style={styles.featuredCopy}>
        <Text style={styles.videoGame}>{item.game?.name || item.channel?.name || 'PLAYNEXUS'}</Text>
        <Text numberOfLines={3} style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.videoMeta}>{(item.views || 0).toLocaleString('fa-IR')} بازدید</Text>
      </View>
    </PressableScale>
  );
}

function VideoRow({ item, previewActive }: { item: ContentItem; previewActive: boolean }) {
  const thumbnail = thumbnailOf(item);
  const logo = logoOf(item);
  const duration = durationLabel(item.duration);

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
      pressedScale={0.99}
      style={styles.videoRow}>
      <View style={styles.thumb}>
        <Image
          source={thumbnail ? { uri: String(thumbnail) } : fallback}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={'video-thumb-' + String(item.id)}
        />
        <VideoPreviewSurface item={item} active={previewActive} />
        <LinearGradient colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.36)']} style={StyleSheet.absoluteFill} />
        {!previewActive ? <View style={styles.thumbPlay}><Text style={styles.thumbPlayText}>▶</Text></View> : null}
        {duration ? <View style={styles.thumbDuration}><Text style={styles.thumbDurationText}>{duration}</Text></View> : null}
      </View>

      <View style={styles.videoInfo}>
        <View style={styles.videoText}>
          <Text numberOfLines={2} style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowMeta}>
            {item.game?.name || item.channel?.name || 'PlayNexus'} · {(item.views || 0).toLocaleString('fa-IR')} بازدید
          </Text>
        </View>
        <View style={styles.gameLogoShell}>
          <Image
            source={logo ? { uri: String(logo) } : fallback}
            style={styles.gameLogo}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={'video-logo-' + String(item.id)}
          />
        </View>
      </View>
    </PressableScale>
  );
}

function VideoPageSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <SkeletonBox style={{ width: '100%', height: 104 }} radius={26} />
      <SkeletonBox style={{ width: '100%', height: 300 }} radius={28} />
      <SkeletonBox style={{ width: '100%', height: 220 }} radius={24} />
    </View>
  );
}

function LoadingMore() {
  return (
    <View style={styles.loadingMore}>
      <View style={styles.loadingDot} />
      <Text style={styles.loadingMoreText}>ویدیوهای بیشتر…</Text>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrb}><Text style={styles.emptyGlyph}>▶</Text></View>
      <Text style={styles.emptyKicker}>NO VIDEO SIGNAL</Text>
      <Text style={styles.emptyTitle}>فعلاً ویدیوی تازه‌ای نیست</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 140 },
  intro: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xl, alignItems: 'flex-end' },
  introKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.2 },
  introTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 28, lineHeight: 36, marginTop: 4, textAlign: 'right' },
  introBody: { maxWidth: 340, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 21, textAlign: 'right', marginTop: 6 },
  sectionCopy: { alignItems: 'flex-end' },
  sectionKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  sectionTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 22, marginTop: 3 },
  sectionAction: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.8 },
  cloudSection: { marginBottom: spacing.xl },
  cloudHeader: { paddingHorizontal: layout.screenPadding, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.sm },
  cloudCount: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  cloudTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 19, marginTop: 2 },
  cloudFrame: { minHeight: 134, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(88,244,255,0.10)', overflow: 'hidden' },
  logoRail: { paddingHorizontal: layout.screenPadding, paddingTop: 28, paddingBottom: 22, gap: 8 },
  logoTile: { width: 134, height: 74, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: palette.surface, ...shadow.soft },
  logoTileLift: { transform: [{ translateY: -11 }] },
  logoTileDrop: { transform: [{ translateY: 7 }] },
  logoTag: { position: 'absolute', top: 7, left: 7, width: 25, height: 21, borderRadius: 8, backgroundColor: 'rgba(3,5,9,0.62)', alignItems: 'center', justifyContent: 'center' },
  logoIndex: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7 },
  logoName: { position: 'absolute', bottom: 8, right: 9, left: 9, color: palette.white, fontFamily: fontFamily.black, fontSize: 9, textAlign: 'right' },
  featuredWrap: { paddingHorizontal: layout.screenPadding, marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.md },
  featured: { height: 312, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', backgroundColor: palette.surface, ...shadow.card },
  featuredTop: { padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  livePill: { height: 28, paddingHorizontal: 9, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.62)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  liveText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  duration: { minWidth: 42, height: 28, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(3,5,9,0.70)', alignItems: 'center', justifyContent: 'center' },
  durationText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 9 },
  featuredPlay: { position: 'absolute', top: '39%', alignSelf: 'center', width: 58, height: 58, borderRadius: 22, backgroundColor: 'rgba(3,5,9,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  featuredPlayText: { color: palette.white, fontSize: 20, marginLeft: 3 },
  featuredCopy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  videoGame: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.9 },
  featuredTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 24, lineHeight: 31, textAlign: 'right', marginTop: 5 },
  videoMeta: { color: palette.textMuted, fontFamily: fontFamily.medium, fontSize: 10, marginTop: 6 },
  shortsPortal: { minHeight: 92, marginHorizontal: layout.screenPadding, marginBottom: spacing.xl, borderRadius: radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,85,213,0.14)', padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shortsIcon: { width: 58, height: 66, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,85,213,0.22)', backgroundColor: 'rgba(3,5,9,0.56)', alignItems: 'center', justifyContent: 'center' },
  shortsPlay: { color: palette.magenta, fontSize: 17 },
  shortsCopy: { flex: 1, alignItems: 'flex-end' },
  shortsKicker: { color: palette.magenta, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  shortsTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 2 },
  shortsText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 2 },
  portalArrow: { width: 8, height: 8, borderLeftWidth: 1.4, borderBottomWidth: 1.4, borderColor: palette.magenta, transform: [{ rotate: '45deg' }], marginLeft: 6 },
  latestHead: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  latestCount: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  videoRow: { marginHorizontal: layout.screenPadding, marginBottom: spacing.xl },
  thumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', ...shadow.soft },
  thumbPlay: { position: 'absolute', top: '42%', alignSelf: 'center', width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(3,5,9,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  thumbPlayText: { color: palette.white, fontSize: 15, marginLeft: 2 },
  thumbDuration: { position: 'absolute', bottom: 9, left: 9, minWidth: 38, height: 24, paddingHorizontal: 7, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.76)', alignItems: 'center', justifyContent: 'center' },
  thumbDurationText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 8 },
  videoInfo: { minHeight: 70, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  videoText: { flex: 1, alignItems: 'flex-end' },
  rowTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 15, lineHeight: 22, textAlign: 'right' },
  rowMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 4, textAlign: 'right' },
  gameLogoShell: { width: 46, height: 46, borderRadius: 16, padding: 1.5, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: palette.surface },
  gameLogo: { flex: 1, borderRadius: 14 },
  skeletonWrap: { paddingHorizontal: layout.screenPadding, gap: spacing.md, marginBottom: spacing.xl },
  loadingMore: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  loadingMoreText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 10 },
  empty: { paddingTop: 90, alignItems: 'center' },
  emptyOrb: { width: 72, height: 72, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', backgroundColor: 'rgba(88,244,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  emptyGlyph: { color: palette.cyan, fontSize: 20 },
  emptyKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1, marginTop: spacing.md },
  emptyTitle: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: typeScale.titleSm, marginTop: 4 },
});
