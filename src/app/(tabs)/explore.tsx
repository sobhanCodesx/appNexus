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
import {
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { DiscoverItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

type Filter = 'all' | 'content' | 'store';

export default function ExploreScreen() {
  const {
    items: sourceItems,
    refreshing,
    refresh,
    loadMore,
    loadingMore,
  } = usePaginatedResource<DiscoverItem>(
    '/discover?per_page=20',
    15_000,
  );
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    if (filter === 'content') return sourceItems.filter((item) => item.kind === 'content');
    if (filter === 'store') return sourceItems.filter((item) => item.kind === 'product_media');
    return sourceItems;
  }, [filter, sourceItems]);

  return (
    <Screen>
      <PageHeader title="کشف" subtitle="DISCOVERY SIGNAL" onSearch={() => router.push('/search')} />

      <View style={styles.intro}>
        <Text style={styles.introKicker}>EXPLORE THE NEXUS</Text>
        <Text style={styles.introTitle}>هر اسکرول، یک چیز تازه</Text>
        <Text style={styles.introBody}>
          محتوا، بازی و چیزهایی که ارزش دیدن دارن؛ بدون اینکه مجبور باشی بین صفحه‌های شلوغ بگردی.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        <Chip label="برای تو" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="محتوا" active={filter === 'content'} onPress={() => setFilter('content')} />
        <Chip label="Store" active={filter === 'store'} onPress={() => setFilter('store')} />
      </ScrollView>

      <FlashList
        data={items}
        numColumns={2}
        masonry
        optimizeItemArrangement
        renderItem={({ item, index }) => (
          <ExploreTile
            item={item}
            tall={index % 6 === 0 || index % 7 === 0}
            accent={index % 3}
          />
        )}
        getItemType={(item) => item.kind}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListFooterComponent={
          loadingMore
            ? <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>در حال کشف سیگنال‌های بیشتر…</Text></View>
            : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Empty />}
      />
    </Screen>
  );
}

function ExploreTile({
  item,
  tall,
  accent,
}: {
  item: DiscoverItem;
  tall: boolean;
  accent: number;
}) {
  const data = item.data || {};
  const uri = data.media_url || data.thumbnail_url || data.image_url || data.cover_url;
  const title = data.title || data.name || 'PlayNexus';
  const slug = typeof data.slug === 'string' ? data.slug : null;
  const typeLabel = item.kind === 'content' ? 'STORY' : 'STORE';

  const accentColor = accent === 0
    ? palette.cyan
    : accent === 1
      ? palette.violet
      : palette.blue;

  const open = () => {
    if (!slug) return;
    if (item.kind === 'content') {
      router.push({ pathname: '/content/[slug]', params: { slug } });
    } else {
      router.push({ pathname: '/product/[slug]', params: { slug } });
    }
  };

  return (
    <View style={styles.cell}>
      <PressableScale
        onPress={open}
        pressedScale={0.985}
        style={[styles.tile, { height: tall ? 302 : 202 }]}>
        <Image
          source={uri ? { uri: String(uri) } : fallbackImage}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={item.key}
          transition={160}
        />

        <LinearGradient
          colors={[
            'rgba(3,5,9,0.00)',
            'rgba(3,5,9,0.16)',
            'rgba(3,5,9,0.94)',
          ]}
          locations={[0, 0.50, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.tileSignal, { backgroundColor: accentColor }]} />

        <View style={styles.tileTop}>
          <View style={styles.kindBadge}>
            <View style={[styles.kindDot, { backgroundColor: accentColor }]} />
            <Text style={styles.kind}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.tileCopy}>
          <Text numberOfLines={tall ? 3 : 2} style={[styles.title, tall && styles.tallTitle]}>
            {String(title)}
          </Text>

          <View style={styles.openRow}>
            <Text style={styles.openLabel}>{item.kind === 'content' ? 'باز کن' : 'مشاهده محصول'}</Text>
            <View style={[styles.openArrow, { borderColor: accentColor }]} />
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrb}>
        <View style={styles.emptyCore} />
      </View>
      <Text style={styles.emptyKicker}>NO DISCOVERY YET</Text>
      <Text style={styles.emptyTitle}>سیگنال تازه‌ای پیدا نشد</Text>
      <Text style={styles.emptyText}>بعداً دوباره سر بزن؛ Explore همیشه در حال تازه شدن است.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  introKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  introTitle: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 4,
  },
  introBody: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: spacing.xs,
    maxWidth: 330,
  },
  filters: {
    gap: spacing.xs,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: layout.screenPadding - 6,
    paddingBottom: 136,
  },
  cell: {
    padding: 6,
  },
  tile: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  tileSignal: {
    position: 'absolute',
    top: 0,
    right: 18,
    width: 42,
    height: 2,
  },
  tileTop: {
    padding: spacing.sm,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    height: 26,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kindDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  kind: {
    color: palette.white,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  tileCopy: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  title: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    lineHeight: 20,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.15,
  },
  tallTitle: {
    fontSize: typeScale.titleSm,
    lineHeight: 25,
  },
  openRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  openLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  openArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    transform: [{ rotate: '45deg' }],
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: palette.textDim,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  empty: {
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyOrb: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(88,244,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 5,
  },
  emptyText: {
    maxWidth: 300,
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
