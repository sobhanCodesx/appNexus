import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

type Mode = 'for-you' | 'following' | 'trending';
type TrendingGame = {
  id: number;
  name: string;
  slug: string;
  cover_url?: string | null;
  followers?: number;
  videos_count?: number;
};

export default function FeedScreen() {
  const [mode, setMode] = useState<Mode>('for-you');
  const feedPath = '/feed?tab=' + mode;
  const feed = usePaginatedResource<ContentItem>(
    mode === 'trending' ? '/feed?tab=for-you' : feedPath,
    15_000,
  );
  const trending = useApiResource<{ games: TrendingGame[] }>(
    '/feed/trending',
    { games: [] },
    30_000,
  );

  return (
    <Screen>
      <PageHeader
        title="Feed"
        subtitle={
          mode === 'for-you'
            ? 'FOR YOU'
            : mode === 'following'
              ? 'FOLLOWING'
              : 'TRENDING GAMES'
        }
      />

      <View style={styles.filters}>
        <Chip label="برای تو" active={mode === 'for-you'} onPress={() => setMode('for-you')} />
        <Chip label="دنبال‌شده‌ها" active={mode === 'following'} onPress={() => setMode('following')} />
        <Chip label="بازی‌های ترند" active={mode === 'trending'} onPress={() => setMode('trending')} />
      </View>

      {mode === 'trending' ? (
        <FlashList
          data={trending.data.games || []}
          refreshing={trending.refreshing}
          onRefresh={trending.refresh}
          contentContainerStyle={styles.content}
          renderItem={({ item, index }) => (
            <PressableScale
              style={styles.game}
              onPress={() => router.push({
                pathname: '/channel/[slug]',
                params: { slug: item.slug },
              })}>
              <Text style={styles.rank}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.gameCopy}>
                <Text style={styles.gameKicker}>TRENDING GAME</Text>
                <Text style={styles.gameName}>{item.name}</Text>
                <Text style={styles.gameMeta}>
                  {(item.followers || 0).toLocaleString('fa-IR')} دنبال‌کننده · {(item.videos_count || 0).toLocaleString('fa-IR')} ویدیو
                </Text>
              </View>
              <Image
                source={item.cover_url ? { uri: item.cover_url } : require('../../assets/images/logo.png')}
                style={styles.gameImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </PressableScale>
          )}
          ListEmptyComponent={<Empty />}
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
            <View style={styles.card}>
              <ContentCard
                item={item}
                width="100%"
                onPress={() => router.push({
                  pathname: '/content/[slug]',
                  params: { slug: item.slug },
                })}
              />
            </View>
          )}
          ListEmptyComponent={<Empty />}
        />
      )}
    </Screen>
  );
}

function LoadingMore() {
  return <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>در حال دریافت ادامه…</Text></View>;
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>فعلاً چیزی اینجا نیست</Text>
      <Text style={styles.emptyText}>با انتشار محتوا یا دنبال‌کردن بازی‌ها، این بخش پر می‌شه.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
  },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 90 },
  card: { marginBottom: spacing.md },
  game: {
    minHeight: 98,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 10 },
  gameCopy: { flex: 1, alignItems: 'flex-end' },
  gameKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  gameName: { color: palette.white, fontFamily: fontFamily.black, fontSize: 17, marginTop: 3 },
  gameMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 3, textAlign: 'right' },
  gameImage: { width: 68, height: 68, borderRadius: 20, backgroundColor: palette.surface },
  loadingMore: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadingMoreText: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 10 },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18 },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular, marginTop: 6, textAlign: 'center' },
});
