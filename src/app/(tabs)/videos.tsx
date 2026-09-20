import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { layout, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

export default function VideosScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<ContentItem>>('/videos', { data: [] });

  return (
    <Screen>
      <PageHeader title="ویدیو" subtitle="تماشا، ادامه بده، ذخیره کن" onSearch={() => router.push('/search')} />
      <FlashList
        data={data.data || []}
        renderItem={({ item }) => <View style={styles.row}><ContentCard item={item} width="100%" /></View>}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 128 },
  row: { marginBottom: spacing.lg },
});
