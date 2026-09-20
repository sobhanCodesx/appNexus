import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type Mode = 'all' | 'offers' | 'exchange';

export default function StoreScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = params.mode === 'offers' || params.mode === 'exchange' ? params.mode : 'all';
  const path = mode === 'offers' ? '/offers' : mode === 'exchange' ? '/exchange-products' : '/products';
  const { data, refreshing, refresh } = useApiResource<Paginated<ProductSummary>>(path, { data: [] });

  const title = useMemo(() => {
    if (mode === 'offers') return 'پیشنهادها';
    if (mode === 'exchange') return 'معاوضه';
    return 'فروشگاه';
  }, [mode]);

  return (
    <Screen>
      <PageHeader title={title} subtitle="فروشگاه بومی PlayNexus" onSearch={() => router.push('/search')} />
      <View style={styles.filters}>
        <Chip label="همه" active={mode === 'all'} onPress={() => router.replace('/store')} />
        <Chip label="تخفیف" active={mode === 'offers'} onPress={() => router.replace('/store?mode=offers')} />
        <Chip label="معاوضه" active={mode === 'exchange'} onPress={() => router.replace('/store?mode=exchange')} />
        <Chip label="سبد خرید" onPress={() => router.push('/cart')} />
      </View>

      <FlashList
        data={data.data || []}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard
              product={item}
              width="100%"
              onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })}
            />
          </View>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>فروشگاه آماده اتصال است</Text>
            <Text style={styles.emptyText}>محصولات مستقیماً از API موبایل PlayNexus می‌آیند.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
  },
  content: { paddingHorizontal: layout.screenPadding - 6, paddingBottom: 70 },
  cell: { padding: 6 },
  empty: { paddingTop: 120, alignItems: 'center' },
  emptyTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  emptyText: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: spacing.sm },
});
