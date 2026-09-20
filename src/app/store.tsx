import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
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
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type Mode = 'all' | 'offers' | 'exchange';

export default function StoreScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = params.mode === 'offers' || params.mode === 'exchange'
    ? params.mode
    : 'all';

  const path = mode === 'offers'
    ? '/offers'
    : mode === 'exchange'
      ? '/exchange-products'
      : '/products';

  const { data, refreshing, refresh } = useApiResource<Paginated<ProductSummary>>(
    path,
    { data: [] },
  );

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
                <Chip
                  label="همه"
                  active={mode === 'all'}
                  onPress={() => router.replace('/store')}
                />
                <Chip
                  label="تخفیف"
                  active={mode === 'offers'}
                  onPress={() => router.replace('/store?mode=offers')}
                />
                <Chip
                  label="معاوضه"
                  active={mode === 'exchange'}
                  onPress={() => router.replace('/store?mode=exchange')}
                />
              </View>

              <PressableScale
                onPress={() => router.push('/cart')}
                style={styles.cartButton}>
                <View style={styles.cartGlyph}>
                  <View style={styles.cartHandle} />
                  <View style={styles.cartBody} />
                </View>
                <Text style={styles.cartText}>سبد</Text>
              </PressableScale>
            </View>

            <View style={styles.sectionCopy}>
              <Text style={styles.sectionKicker}>
                {mode === 'all'
                  ? 'AVAILABLE NOW'
                  : mode === 'offers'
                    ? 'HOT DEALS'
                    : 'TRADE READY'}
              </Text>
              <Text style={styles.sectionTitle}>
                {mode === 'all'
                  ? 'محصولات'
                  : mode === 'offers'
                    ? 'پیشنهادهای ویژه'
                    : 'قابل معاوضه'}
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
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyMark}>
              <View style={styles.emptyCore} />
            </View>
            <Text style={styles.emptyKicker}>NO STORE SIGNAL</Text>
            <Text style={styles.emptyTitle}>فعلاً چیزی اینجا نیست</Text>
            <Text style={styles.emptyText}>
              فروشگاه به‌صورت زنده از PlayNexus به‌روزرسانی می‌شود.
            </Text>
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
          colors={[
            accent + '24',
            'rgba(167,123,255,0.06)',
            'rgba(8,14,23,0.92)',
          ]}
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
          <View style={styles.heroKickerRow}>
            <View style={[styles.heroDot, { backgroundColor: accent }]} />
            <Text style={[styles.heroKicker, { color: accent }]}>
              {copy.kicker}
            </Text>
          </View>

          <Text style={styles.heroHeadline}>{copy.headline}</Text>
          <Text style={styles.heroBody}>{copy.body}</Text>
        </View>

        <View style={[styles.heroSignal, { backgroundColor: accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding - 6,
    paddingBottom: 90,
  },
  marketHeroWrap: {
    paddingHorizontal: 6,
    paddingBottom: spacing.lg,
  },
  marketHero: {
    minHeight: 218,
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
    top: 24,
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingLarge: {
    width: 142,
    height: 142,
    borderRadius: 142,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingSmall: {
    width: 86,
    height: 86,
    borderRadius: 86,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(3,5,9,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSymbol: {
    fontSize: 32,
    fontWeight: fontWeight.black,
  },
  heroCopy: {
    marginLeft: 118,
    alignItems: 'flex-end',
  },
  heroKickerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  heroKicker: {
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  heroHeadline: {
    color: palette.white,
    fontSize: typeScale.title,
    lineHeight: 29,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  heroSignal: {
    position: 'absolute',
    right: 24,
    bottom: 0,
    width: 68,
    height: 2,
  },
  modeBar: {
    paddingHorizontal: 6,
    paddingBottom: spacing.xl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  filters: {
    flex: 1,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cartButton: {
    minWidth: 72,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    backgroundColor: 'rgba(88,244,255,0.05)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.sm,
  },
  cartGlyph: {
    width: 18,
    height: 18,
  },
  cartHandle: {
    position: 'absolute',
    top: 2,
    left: 1,
    width: 5,
    height: 2,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '18deg' }],
  },
  cartBody: {
    position: 'absolute',
    left: 4,
    bottom: 2,
    width: 12,
    height: 10,
    borderWidth: 1.3,
    borderColor: palette.cyan,
    borderRadius: 3,
  },
  cartText: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  sectionCopy: {
    paddingHorizontal: 6,
    paddingBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  sectionKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  cell: {
    padding: 6,
  },
  empty: {
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyMark: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 5,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 300,
  },
});
