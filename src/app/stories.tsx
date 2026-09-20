import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard } from '@/types/api';

type StoryItem = ContentCard & {
  body?: string | null;
  feed_slug?: string | null;
  media?: Array<{ type?: string | null; url?: string | null; thumbnail?: string | null }>;
  author?: { name?: string | null; avatar_url?: string | null };
};

const fallback = require('../../assets/images/logo-glow.png');

function slugOf(item: StoryItem) {
  return item.slug || item.feed_slug || String(item.id);
}

function imageOf(item: StoryItem) {
  const media = item.media?.[0];
  return item.thumbnail_url || media?.thumbnail || (media?.type === 'image' ? media.url : null) || item.image_url || item.cover_url || item.channel?.avatar_url;
}

export default function StoriesScreen() {
  const params = useLocalSearchParams<{ start?: string }>();
  const start = Array.isArray(params.start) ? params.start[0] : params.start;
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<StoryItem>>(null);
  const { data, loading } = usePaginatedResource<StoryItem>('/feed?tab=for-you&per_page=20', 15_000);
  const items = useMemo(() => (data.data || []).filter((item) => Boolean(imageOf(item))), [data.data]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!items.length || !start) return;
    const index = items.findIndex((item) => slugOf(item) === start);
    if (index >= 0) {
      setActive(index);
      requestAnimationFrame(() => list.current?.scrollToIndex({ index, animated: false }));
    }
  }, [items, start]);

  if (loading && !items.length) {
    return (
      <Screen edges={['left', 'right']}>
        <View style={styles.loading}>
          <SkeletonBox style={{ width: '100%', height: '100%' }} radius={0} />
          <Text style={styles.loadingText}>NEXUS STORIES</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <FlatList
          ref={list}
          data={items}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(event) => setActive(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index }) => (
            <View style={[styles.page, { width }]}>
              <Image source={imageOf(item) ? { uri: String(imageOf(item)) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={['rgba(3,5,9,0.50)', 'rgba(3,5,9,0.00)', 'rgba(3,5,9,0.10)', 'rgba(3,5,9,0.94)']}
                locations={[0, 0.22, 0.56, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.top}>
                <View style={styles.progressRow}>
                  {items.map((story, storyIndex) => (
                    <View key={story.id} style={styles.progressTrack}>
                      <View style={[styles.progressFill, storyIndex <= active && styles.progressDone, storyIndex === active && styles.progressActive]} />
                    </View>
                  ))}
                </View>

                <View style={styles.topBar}>
                  <PressableScale onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></PressableScale>
                  <View style={styles.authorCopy}>
                    <Text style={styles.authorName}>{item.author?.name || item.channel?.name || 'PlayNexus'}</Text>
                    <Text style={styles.authorMeta}>{index + 1} / {items.length}</Text>
                  </View>
                  <View style={styles.avatarShell}>
                    <Image source={item.author?.avatar_url || item.channel?.avatar_url ? { uri: String(item.author?.avatar_url || item.channel?.avatar_url) } : fallback} style={styles.avatar} contentFit="cover" />
                  </View>
                </View>
              </View>

              <View style={styles.copy}>
                <View style={styles.storyBadge}><View style={styles.storyDot} /><Text style={styles.storyBadgeText}>PLAYNEXUS STORY</Text></View>
                <Text numberOfLines={4} style={styles.title}>{item.title}</Text>
                {item.body || item.excerpt ? <Text numberOfLines={4} style={styles.body}>{item.body || item.excerpt}</Text> : null}
                <PressableScale
                  onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: slugOf(item) } })}
                  style={styles.openButton}>
                  <Text style={styles.openText}>باز کردن کامل</Text>
                  <View style={styles.openArrow} />
                </PressableScale>
              </View>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.black },
  page: { flex: 1, justifyContent: 'space-between', backgroundColor: palette.black },
  top: { paddingTop: 58, paddingHorizontal: 14 },
  progressRow: { flexDirection: 'row', gap: 4 },
  progressTrack: { flex: 1, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  progressFill: { width: 0, height: 2, backgroundColor: palette.white },
  progressDone: { width: '100%' },
  progressActive: { backgroundColor: palette.cyan, ...shadow.cyanGlow },
  topBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10 },
  close: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(3,5,9,0.56)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: palette.white, fontSize: 28, lineHeight: 30 },
  authorCopy: { flex: 1, alignItems: 'flex-end' },
  authorName: { color: palette.white, fontFamily: fontFamily.black, fontSize: 13 },
  authorMeta: { color: 'rgba(255,255,255,0.62)', fontFamily: fontFamily.medium, fontSize: 9, marginTop: 2 },
  avatarShell: { width: 42, height: 42, borderRadius: 15, padding: 1.5, borderWidth: 1, borderColor: 'rgba(88,244,255,0.30)' },
  avatar: { flex: 1, borderRadius: 13 },
  copy: { paddingHorizontal: 20, paddingBottom: 54, alignItems: 'flex-end' },
  storyBadge: { height: 28, paddingHorizontal: 9, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.55)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  storyDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  storyBadgeText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.9 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 30, lineHeight: 39, textAlign: 'right', marginTop: spacing.md },
  body: { maxWidth: 360, color: 'rgba(245,248,252,0.74)', fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 23, textAlign: 'right', marginTop: spacing.sm },
  openButton: { minHeight: 46, marginTop: spacing.lg, paddingHorizontal: 15, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  openText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 11 },
  openArrow: { width: 7, height: 7, borderRightWidth: 1.4, borderTopWidth: 1.4, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  loading: { flex: 1, backgroundColor: palette.black, alignItems: 'center', justifyContent: 'center' },
  loadingText: { position: 'absolute', color: palette.cyan, fontFamily: fontFamily.black, fontSize: 10, letterSpacing: 1.2 },
});
