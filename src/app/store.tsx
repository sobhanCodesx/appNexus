import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import {
  fontFamily,
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { Paginated } from '@/types/api';

type Mode = 'all' | 'offers' | 'exchange';
type Sort = 'latest' | 'popular' | 'price_asc' | 'price_desc';

type Category = {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
  children?: Category[];
};

export default function StoreScreen() {
  const params = useLocalSearchParams<{ mode?: string; category?: string; sort?: string }>();
  const mode: Mode = params.mode === 'offers' || params.mode === 'exchange' ? params.mode : 'all';
  const initialSort: Sort =
    params.sort === 'popular' || params.sort === 'price_asc' || params.sort === 'price_desc'
      ? params.sort
      : 'latest';

  const [sort, setSort] = useState<Sort>(initialSort);
  const [category, setCategory] = useState<string | null>(
    typeof params.category === 'string' ? params.category : null,
  );

  const categories = useApiResource<{ categories: Category[] }>(
    '/categories',
    { categories: [] },
    60_000,
  );

  const basePath = mode === 'offers'
    ? '/offers'
    : mode === 'exchange'
      ? '/exchange-products'
      : '/products';

  const query = [
    'sort=' + encodeURIComponent(sort),
    category ? 'category=' + encodeURIComponent(category) : null,
    'per_page=30',
  ].filter(Boolean).join('&');

  const path = basePath + '?' + query;

  const {
    data,
    refreshing,
    refresh,
    loadMore,
    loadingMore,
  } = usePaginatedResource<ProductSummary>(path, 15_000);

  const copy = useMemo(() => {
    if (mode === 'offers') {
      return {
        title: 'Deals',
        kicker: 'LIMITED SIGNALS',
        headline: 'پیشنهادهایی که ارزش دیدن دارن',
        body: 'تخفیف‌ها و قیمت‌های ویژه، بدون اینکه بین محصول‌های عادی گم بشن.',
        tone: 'danger' as const,
      };
    }
    if (mode === 'exchange') {
      return {
        title: 'Trade',
        kicker: 'EXCHANGE MODE',
        headline: 'بازی بده، بازی بگیر',
        body: 'محصول‌هایی که برای معاوضه فعالن؛ مستقیم درخواستت رو از داخل اپ ثبت کن.',
        tone: 'cyan' as const,
      };
    }
    return {
      title: 'Store',
      kicker: 'PLAYNEXUS MARKET',
      headline: 'فروشگاه برای گیمر، نه ویترین شلوغ',
      body: 'نسخه‌ها، قیمت‌ها، موجودی و گزینه معاوضه رو سریع ببین و انتخاب کن.',
      tone: 'blue' as const,
    };
  }, [mode]);

  const flatCategories = useMemo(
    () => (categories.data.categories || []).flatMap((item) => [item, ...(item.children || [])]),
    [categories.data.categories],
  );

  return (
    <Screen>
      <PageHeader
        title={copy.title}
        subtitle={copy.kicker}
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={data.data || []}
        numColumns={2}
        ListHeaderComponent={
          <>
            <MarketHero mode={mode} copy={copy} />

            <View style={styles.modeBar}>
              <View style={styles.filters}>
                <Chip label="همه" active={mode === 'all'} onPress={() => router.replace('/store')} />
                <Chip label="تخفیف" active={mode === 'offers'} onPress={() => router.replace('/store?mode=offers')} />
                <Chip label="معاوضه" active={mode === 'exchange'} onPress={() => router.replace('/store?mode=exchange')} />
              </View>

              <PressableScale onPress={() => router.push('/cart')} style={styles.cartButton}>
                <Text style={styles.cartText}>سبد</Text>
                <Text style={styles.cartSymbol}>▣</Text>
              </PressableScale>
            </View>

            <View style={styles.controlBlock}>
              <View style={styles.controlHeading}>
                <Text style={styles.controlKicker}>SORT</Text>
                <Text style={styles.controlTitle}>مرتب‌سازی</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRail}>
                <Chip label="جدیدترین" active={sort === 'latest'} onPress={() => setSort('latest')} />
                <Chip label="محبوب‌ترین" active={sort === 'popular'} onPress={() => setSort('popular')} />
                <Chip label="ارزان‌ترین" active={sort === 'price_asc'} onPress={() => setSort('price_asc')} />
                <Chip label="گران‌ترین" active={sort === 'price_desc'} onPress={() => setSort('price_desc')} />
              </ScrollView>
            </View>

            <View style={styles.controlBlock}>
              <View style={styles.controlHeading}>
                <PressableScale haptic={false} onPress={() => router.push('/categories')}>
                  <Text style={styles.allCategories}>همه دسته‌ها</Text>
                </PressableScale>
                <View style={styles.controlHeadingCopy}>
                  <Text style={styles.controlKicker}>CATEGORY</Text>
                  <Text style={styles.controlTitle}>فیلتر دسته‌بندی</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRail}>
                <Chip label="همه" active={!category} onPress={() => setCategory(null)} />
                {flatCategories.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    active={category === item.slug}
                    onPress={() => setCategory(item.slug)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionCopy}>
              <Text style={styles.sectionKicker}>
                {mode === 'all' ? 'AVAILABLE NOW' : mode === 'offers' ? 'HOT DEALS' : 'TRADE READY'}
              </Text>
              <Text style={styles.sectionTitle}>
                {(data.total ?? data.data.length).toLocaleString('fa-IR')} محصول
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard
              product={item}
              width="100%"
              onPress={() => router.push({
                pathname: '/product/[slug]',
                params: { slug: item.slug },
              })}
            />
          </View>
        )}
        refreshing={refreshing}
        onRefresh={() => {
          void refresh();
          void categories.refresh();
        }}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListFooterComponent={
          loadingMore
            ? <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>محصول‌های بیشتر…</Text></View>
            : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyMark}><View style={styles.emptyCore} /></View>
            <Text style={styles.emptyKicker}>NO STORE SIGNAL</Text>
            <Text style={styles.emptyTitle}>محصولی با این فیلتر نیست</Text>
            <Text style={styles.emptyText}>فیلتر دسته یا مرتب‌سازی رو تغییر بده.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function MarketHero({
  mode,
  copy,
}: {
  mode: Mode;
  copy: {
    title: string;
    kicker: string;
    headline: string;
    body: string;
    tone: 'danger' | 'cyan' | 'blue';
  };
}) {
  const accent = copy.tone === 'danger'
    ? palette.danger
    : copy.tone === 'cyan'
      ? palette.cyan
      : palette.blue;

  return (
    <View style={styles.marketHeroWrap}>
      <View style={styles.marketHero}>
        <LinearGradient
          colors={[accent + '24', 'rgba(167,123,255,0.06)', 'rgba(8,14,23,0.92)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroGrid}>
          <View style={styles.heroRingLarge}>
            <View style={styles.heroRingSmall}>
              <Text style={[styles.heroSymbol, { color: accent }]}>
                {mode === 'offers' ? '%' : mode === 'exchange' ? '⇄' : '▣'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroKicker, { color: accent }]}>{copy.kicker}</Text>
          <Text style={styles.heroHeadline}>{copy.headline}</Text>
          <Text style={styles.heroBody}>{copy.body}</Text>
        </View>
        <View style={[styles.heroSignal, { backgroundColor: accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding - 6, paddingBottom: 90 },
  marketHeroWrap: { paddingHorizontal: 6, paddingBottom: spacing.lg },
  marketHero: {
    minHeight: 202,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(8,14,23,0.88)',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  heroGrid: {
    position: 'absolute',
    left: -22,
    top: 22,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingLarge: {
    width: 136,
    height: 136,
    borderRadius: 136,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingSmall: {
    width: 82,
    height: 82,
    borderRadius: 82,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(3,5,9,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSymbol: { fontSize: 31, fontWeight: fontWeight.black },
  heroCopy: { marginLeft: 112, alignItems: 'flex-end' },
  heroKicker: { fontFamily: fontFamily.black, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  heroHeadline: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, lineHeight: 29, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.xs },
  heroBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: typeScale.caption, lineHeight: 20, textAlign: 'right', marginTop: spacing.xs },
  heroSignal: { position: 'absolute', right: 24, bottom: 0, width: 68, height: 2 },
  modeBar: { paddingHorizontal: 6, paddingBottom: spacing.md, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  filters: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  cartButton: { minWidth: 72, height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', backgroundColor: 'rgba(88,244,255,0.05)', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: spacing.sm },
  cartText: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.caption, fontWeight: fontWeight.black },
  cartSymbol: { color: palette.cyan, fontSize: 15 },
  controlBlock: { paddingHorizontal: 6, paddingBottom: spacing.md },
  controlHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.xs },
  controlHeadingCopy: { alignItems: 'flex-end' },
  controlKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 1 },
  controlTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 14, marginTop: 2 },
  allCategories: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 10 },
  controlRail: { gap: spacing.xs, paddingRight: 1 },
  sectionCopy: { paddingHorizontal: 6, paddingBottom: spacing.sm, alignItems: 'flex-end' },
  sectionKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  sectionTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, fontWeight: fontWeight.black, marginTop: 3 },
  cell: { padding: 6 },
  loadingMore: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadingMoreText: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 10 },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: layout.screenPadding },
  emptyMark: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 18, height: 18, borderRadius: 6, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }], ...shadow.cyanGlow },
  emptyKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1, marginTop: spacing.lg },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, fontWeight: fontWeight.black, marginTop: 5 },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: typeScale.bodySm, marginTop: spacing.sm, textAlign: 'center', maxWidth: 300 },
});
