import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem } from '@/types/api';

export default function SavedScreen() {
  const { data, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<ContentItem>('/saved');

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
          <Text style={styles.title}>ذخیره‌شده‌ها</Text>
        </View>
      </View>

      <FlashList
        data={data.data || []}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ContentCard
              item={item}
              width="100%"
              onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
            />
          </View>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListFooterComponent={loadingMore ? <View style={styles.loading}><Text style={styles.loadingText}>بیشتر…</Text></View> : null}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>هنوز چیزی ذخیره نکردی.</Text></View>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 60 },
  card: { marginBottom: spacing.md },
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadingText: { color: palette.textDim, fontSize: 10 },
  empty: { paddingTop: 120, alignItems: 'center' },
  emptyText: { color: palette.textMuted },
});
