import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { DiscoverItem, Paginated } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo-glow.png');

export default function ExploreScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<DiscoverItem>>('/discover', { data: [] });

  return (
    <Screen>
      <PageHeader title="کشف" subtitle="اسکرول کمتر، کشف بیشتر" />
      <FlashList
        data={data.data || []}
        numColumns={2}
        masonry
        optimizeItemArrangement
        renderItem={({ item, index }) => <ExploreTile item={item} tall={index % 5 === 0 || index % 7 === 0} />}
        getItemType={(item) => item.kind}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Empty />}
      />
    </Screen>
  );
}

function ExploreTile({ item, tall }: { item: DiscoverItem; tall: boolean }) {
  const data = item.data || {};
  const uri = data.media_url || data.thumbnail_url || data.image_url || data.cover_url;
  const title = data.title || data.name || 'PlayNexus';

  return (
    <View style={styles.cell}>
      <PressableScale style={[styles.tile, { height: tall ? 280 : 190 }]}>
        <Image
          source={uri ? { uri: String(uri) } : fallbackImage}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={item.key}
          transition={160}
        />
        <LinearGradient colors={['transparent', 'rgba(5,7,11,0.82)']} style={StyleSheet.absoluteFill} />
        <View style={styles.tileCopy}>
          <Text style={styles.kind}>{item.kind === 'content' ? 'STORY' : 'STORE'}</Text>
          <Text numberOfLines={2} style={styles.title}>{String(title)}</Text>
        </View>
      </PressableScale>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Explore آماده است</Text>
      <Text style={styles.emptyText}>وقتی API روی سرور قرار بگیرد، محتوای زنده اینجا به شکل masonry نمایش داده می‌شود.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding - 5, paddingBottom: 128 },
  cell: { padding: 5 },
  tile: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  tileCopy: { marginTop: 'auto', padding: spacing.md, alignItems: 'flex-end' },
  kind: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: 4,
  },
  empty: { paddingTop: 110, alignItems: 'center' },
  emptyTitle: { color: palette.text, fontSize: typeScale.title, fontWeight: fontWeight.black },
  emptyText: {
    maxWidth: 300,
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
