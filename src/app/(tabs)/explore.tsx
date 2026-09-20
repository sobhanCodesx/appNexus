import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { DiscoverItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');
type Filter = 'all' | 'content' | 'store';
type Group = { key: string; items: DiscoverItem[]; flip: boolean };

export default function ExploreScreen() {
  const { items: sourceItems, loading, refreshing, refresh, loadMore, loadingMore } = usePaginatedResource<DiscoverItem>('/discover?per_page=24', 15_000);
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    if (filter === 'content') return sourceItems.filter((item) => item.kind === 'content');
    if (filter === 'store') return sourceItems.filter((item) => item.kind === 'product_media');
    return sourceItems;
  }, [filter, sourceItems]);

  const groups = useMemo<Group[]>(() => {
    const result: Group[] = [];
    for (let index = 0; index < items.length; index += 3) {
      result.push({
        key: items[index]?.key || String(index),
        items: items.slice(index, index + 3),
        flip: Math.floor(index / 3) % 2 === 1,
      });
    }
    return result;
  }, [items]);

  return (
    <Screen>
      <PageHeader title="Explore" subtitle="DISCOVER THE NEXUS" onSearch={() => router.push('/search')} />

      <View style={styles.intro}>
        <Text style={styles.introKicker}>VISUAL DISCOVERY</Text>
        <Text style={styles.introTitle}>مثل Explore، ولی فقط برای گیم</Text>
        <Text style={styles.introBody}>سریع نگاه کن، سریع انتخاب کن؛ هر بلوک یک مسیر مستقیم به چیزی است که ارزش دیدن دارد.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Chip label="همه" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="محتوا" active={filter === 'content'} onPress={() => setFilter('content')} />
        <Chip label="Store" active={filter === 'store'} onPress={() => setFilter('store')} />
      </ScrollView>

      <FlashList
        data={groups}
        renderItem={({ item, index }) => <ExploreGroup group={item} index={index} />}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListEmptyComponent={loading ? <ExploreSkeleton /> : <Empty />}
        ListFooterComponent={loadingMore ? <View style={styles.loadingMore}><View style={styles.loadingDot} /><Text style={styles.loadingMoreText}>در حال کشف بیشتر…</Text></View> : null}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function ExploreGroup({ group, index }: { group: Group; index: number }) {
  const [first, second, third] = group.items;
  if (!first) return null;

  const main = <ExploreTile item={first} big />;
  const side = (
    <View style={styles.sideColumn}>
      {second ? <ExploreTile item={second} /> : <View style={styles.emptyTile} />}
      {third ? <ExploreTile item={third} /> : <View style={styles.emptyTile} />}
    </View>
  );

  return (
    <View style={styles.mosaicRow}>
      {group.flip ? side : main}
      {group.flip ? main : side}
      <View style={[styles.rowSignal, { backgroundColor: index % 2 ? palette.violet : palette.cyan }]} />
    </View>
  );
}

function ExploreTile({ item, big = false }: { item: DiscoverItem; big?: boolean }) {
  const data = item.data || {};
  const uri = data.media_url || data.thumbnail_url || data.image_url || data.cover_url;
  const title = data.title || data.name || 'PlayNexus';
  const slug = typeof data.slug === 'string' ? data.slug : null;
  const contentType = typeof data.type === 'string' ? data.type : null;

  const open = () => {
    if (!slug) return;
    if (item.kind === 'content') {
      router.push({ pathname: '/content/[slug]', params: { slug } });
    } else {
      router.push({ pathname: '/product/[slug]', params: { slug } });
    }
  };

  return (
    <PressableScale onPress={open} pressedScale={0.985} style={[styles.tile, big ? styles.bigTile : styles.smallTile]}>
      <Image source={uri ? { uri: String(uri) } : fallbackImage} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={item.key} transition={140} />
      <LinearGradient colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.06)', 'rgba(3,5,9,0.84)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.tileTop}>
        <View style={styles.typeBadge}>
          <View style={[styles.typeDot, { backgroundColor: item.kind === 'content' ? palette.cyan : palette.magenta }]} />
          <Text style={styles.typeText}>
            {item.kind === 'product_media' ? 'STORE' : contentType === 'video' ? 'VIDEO' : 'FEED'}
          </Text>
        </View>
      </View>

      <View style={styles.tileCopy}>
        <Text numberOfLines={big ? 3 : 2} style={[styles.tileTitle, big && styles.bigTitle]}>{String(title)}</Text>
        {big ? <Text style={styles.tileHint}>برای باز کردن لمس کن</Text> : null}
      </View>
    </PressableScale>
  );
}

function ExploreSkeleton() {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.mosaicRow}>
          <SkeletonBox style={{ flex: 2, height: 320 }} radius={20} />
          <View style={styles.sideColumn}>
            <SkeletonBox style={{ flex: 1, width: '100%' }} radius={20} />
            <SkeletonBox style={{ flex: 1, width: '100%' }} radius={20} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrb}><View style={styles.emptyCore} /></View>
      <Text style={styles.emptyKicker}>NO DISCOVERY YET</Text>
      <Text style={styles.emptyTitle}>فعلاً چیزی برای کشف نیست</Text>
      <Text style={styles.emptyText}>با ورود محتوای تازه، این گرید خودش دوباره جان می‌گیرد.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg, alignItems: 'flex-end' },
  introKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.2 },
  introTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 27, textAlign: 'right', marginTop: 4 },
  introBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 21, textAlign: 'right', marginTop: spacing.xs, maxWidth: 340 },
  filters: { gap: spacing.xs, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.md },
  content: { paddingHorizontal: 10, paddingBottom: 130 },
  mosaicRow: { height: 320, flexDirection: 'row', gap: 7, marginBottom: 7, position: 'relative' },
  sideColumn: { flex: 1, gap: 7 },
  tile: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: palette.surface, ...shadow.soft },
  bigTile: { flex: 2 },
  smallTile: { flex: 1 },
  emptyTile: { flex: 1, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.025)' },
  tileTop: { padding: 8 },
  typeBadge: { alignSelf: 'flex-start', height: 24, paddingHorizontal: 7, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.60)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeDot: { width: 4, height: 4, borderRadius: 4 },
  typeText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  tileCopy: { marginTop: 'auto', padding: 11, alignItems: 'flex-end' },
  tileTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 12, lineHeight: 18, textAlign: 'right' },
  bigTitle: { fontSize: 19, lineHeight: 27 },
  tileHint: { color: palette.textMuted, fontFamily: fontFamily.medium, fontSize: 8, marginTop: 6 },
  rowSignal: { position: 'absolute', width: 42, height: 2, bottom: 0, right: 26, borderRadius: 2 },
  loadingMore: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  loadingMoreText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 10 },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyOrb: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 16, height: 16, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }], ...shadow.cyanGlow },
  emptyKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.2, marginTop: spacing.lg },
  emptyTitle: { color: palette.text, fontFamily: fontFamily.black, fontSize: 18, marginTop: 5 },
  emptyText: { maxWidth: 300, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: spacing.sm },
});
