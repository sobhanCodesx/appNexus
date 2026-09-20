import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RadarCard } from '@/components/cards/radar-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { GameRadarItem } from '@/types/api';

type RadarPayload = { items?: GameRadarItem[] };

export default function RadarScreen() {
  const { data, refreshing, refresh } = useApiResource<RadarPayload>('/game-radar', { items: [] });
  const [filter, setFilter] = useState<'all' | 'ps' | 'xbox'>('all');

  const items = useMemo(() => {
    const source = data.items || [];
    if (filter === 'ps') return source.filter((item) => item.psn?.available);
    if (filter === 'xbox') return source.filter((item) => item.xbox?.available);
    return source;
  }, [data.items, filter]);

  return (
    <Screen>
      <PageHeader title="رادار بازی" subtitle="انتشارهای تازه، بدون شلوغی" />
      <View style={styles.filters}>
        <Chip label="همه" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="PlayStation" active={filter === 'ps'} onPress={() => setFilter('ps')} />
        <Chip label="Xbox" active={filter === 'xbox'} onPress={() => setFilter('xbox')} />
      </View>

      <FlashList
        data={items}
        renderItem={({ item }) => <View style={styles.cardWrap}><RadarCard item={item} width="100%" /></View>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>رادار در حال همگام‌سازی است</Text>
            <Text style={styles.emptyText}>بعد از انتشار API روی سرور، این صفحه مستقیم از Game Radar تغذیه می‌شود.</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
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
    paddingBottom: spacing.lg,
  },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 128 },
  cardWrap: { marginBottom: spacing.lg },
  empty: { paddingVertical: 90, alignItems: 'center' },
  emptyTitle: { color: palette.text, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});
