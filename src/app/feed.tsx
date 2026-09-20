import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

export default function FeedScreen() {
  const [mode, setMode] = useState<'latest' | 'trending'>('latest');
  const path = mode === 'trending' ? '/feed/trending' : '/feed';
  const { data, refreshing, refresh } = useApiResource<Paginated<ContentItem>>(path, { data: [] }, 15_000);

  return (
    <Screen>
      <PageHeader title="Feed" subtitle={mode === 'trending' ? 'TRENDING NOW' : 'LATEST STORIES'} />
      <View style={styles.filters}>
        <Chip label="جدیدترین" active={mode === 'latest'} onPress={() => setMode('latest')} />
        <Chip label="ترند" active={mode === 'trending'} onPress={() => setMode('trending')} />
      </View>
      <FlashList
        data={data.data || []}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ContentCard
              item={item}
              width="100%"
              onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
            />
          </View>
        )}
        ListEmptyComponent={<Empty />}
      />
    </Screen>
  );
}

function Empty() {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>فعلاً محتوایی نیست</Text><Text style={styles.emptyText}>وقتی محتوای جدید منتشر بشه اینجا ظاهر می‌شه.</Text></View>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row-reverse', gap: spacing.xs, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.md },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 90 },
  card: { marginBottom: spacing.md },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18 },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular, marginTop: 6 },
});
