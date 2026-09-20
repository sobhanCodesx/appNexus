import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

export default function SavedScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<ContentItem>>('/saved', { data: [] });

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
  empty: { paddingTop: 120, alignItems: 'center' },
  emptyText: { color: palette.textMuted },
});
