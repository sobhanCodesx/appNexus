import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard as ContentItem } from '@/types/api';

type Filter = 'all' | 'video' | 'post' | 'short';
const fallback = require('../../assets/images/logo-glow.png');

export default function SavedScreen() {
  const { data, loading, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<ContentItem>('/saved?per_page=24', 15_000);
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const source = data.data || [];
    return filter === 'all' ? source : source.filter((item) => item.type === filter);
  }, [data.data, filter]);

  const counts = useMemo(() => {
    const source = data.data || [];
    return {
      all: source.length,
      video: source.filter((item) => item.type === 'video').length,
      post: source.filter((item) => item.type === 'post').length,
      short: source.filter((item) => item.type === 'short').length,
    };
  }, [data.data]);

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>YOUR NEXUS LIBRARY</Text>
          <Text style={styles.title}>ذخیره‌شده‌ها</Text>
        </View>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <LibraryHero total={data.total ?? counts.all} />
            <View style={styles.filters}>
              <Chip label={'همه ' + counts.all.toLocaleString('fa-IR')} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={'ویدیو ' + counts.video.toLocaleString('fa-IR')} active={filter === 'video'} onPress={() => setFilter('video')} />
              <Chip label={'فید ' + counts.post.toLocaleString('fa-IR')} active={filter === 'post'} onPress={() => setFilter('post')} />
              <Chip label={'Short ' + counts.short.toLocaleString('fa-IR')} active={filter === 'short'} onPress={() => setFilter('short')} />
            </View>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionHint}>SAVED FOR LATER</Text>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionKicker}>LIBRARY</Text>
                <Text style={styles.sectionTitle}>برای بعد نگه داشتی</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item, index }) => <SavedCard item={item} index={index} />}
        ListEmptyComponent={
          loading ? <SavedSkeleton /> : (
            <View style={styles.empty}>
              <View style={styles.emptyOrbit}><View style={styles.emptyCore} /></View>
              <Text style={styles.emptyKicker}>EMPTY LIBRARY</Text>
              <Text style={styles.emptyTitle}>چیزی اینجا نیست</Text>
              <Text style={styles.emptyText}>از Feed یا Watch هر چیزی رو ذخیره کنی، اینجا منتظرت می‌مونه.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loading}>
              <View style={styles.loadingDot} />
              <Text style={styles.loadingText}>کتابخانه بیشتر…</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function LibraryHero({ total }: { total: number }) {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(167,123,255,0.13)', 'rgba(88,244,255,0.05)', 'rgba(6,10,18,0.94)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOrbitOne} />
      <View style={styles.heroOrbitTwo} />
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>PERSONAL VAULT</Text>
        <Text style={styles.heroTitle}>هر چیزی که نمی‌خوای گمش کنی</Text>
        <Text style={styles.heroBody}>ویدیوها، فیدها و Shortهایی که ذخیره کردی، مرتب و آماده برگشتن.</Text>
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricValue}>{total.toLocaleString('fa-IR')}</Text>
          <Text style={styles.heroMetricLabel}>SAVED SIGNALS</Text>
        </View>
      </View>
      <View style={styles.heroSignal} />
    </View>
  );
}

function SavedCard({ item, index }: { item: ContentItem; index: number }) {
  const image = item.thumbnail_url || item.image_url || item.cover_url || item.channel?.cover_url || item.channel?.logo_url;
  const logo = item.channel?.logo_url || item.channel?.avatar_url || item.channel?.cover_url || image;
  const type = item.type === 'video' ? 'VIDEO' : item.type === 'short' ? 'SHORT' : 'FEED';

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
      pressedScale={0.99}
      style={styles.card}>
      <View style={styles.media}>
        <Image source={image ? { uri: String(image) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
        <LinearGradient colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.12)', 'rgba(3,5,9,0.76)']} style={StyleSheet.absoluteFill} />
        <View style={styles.mediaIndex}><Text style={styles.mediaIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
        <View style={styles.typeBadge}><View style={styles.typeDot} /><Text style={styles.typeText}>{type}</Text></View>
        {item.type === 'video' || item.type === 'short' ? (
          <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
        ) : null}
      </View>

      <View style={styles.cardCopy}>
        <View style={styles.cardText}>
          <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
          <Text numberOfLines={1} style={styles.cardMeta}>
            {item.channel?.name || item.game?.name || 'PlayNexus'} · {(item.views || 0).toLocaleString('fa-IR')} بازدید
          </Text>
        </View>
        <View style={styles.logoShell}>
          <Image source={logo ? { uri: String(logo) } : fallback} style={styles.logo} contentFit="cover" />
        </View>
      </View>
    </PressableScale>
  );
}

function SavedSkeleton() {
  return (
    <View style={styles.skeleton}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <SkeletonBox style={{ width: '100%', height: 210 }} radius={22} />
          <View style={styles.skeletonCopy}>
            <SkeletonBox style={{ width: '72%', height: 16 }} radius={6} />
            <SkeletonBox style={{ width: 48, height: 48 }} radius={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  hero: { minHeight: 240, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,123,255,0.15)', backgroundColor: palette.surface, padding: spacing.lg, ...shadow.soft },
  heroOrbitOne: { position: 'absolute', width: 180, height: 180, borderRadius: 180, borderWidth: 1, borderColor: 'rgba(167,123,255,0.10)', left: -64, top: -55 },
  heroOrbitTwo: { position: 'absolute', width: 112, height: 112, borderRadius: 112, borderWidth: 1, borderColor: 'rgba(88,244,255,0.09)', right: -26, bottom: -30 },
  heroCopy: { marginTop: 'auto', alignItems: 'flex-end' },
  heroKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  heroTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 27, lineHeight: 35, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 5 },
  heroBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'right', marginTop: 6, maxWidth: 320 },
  heroMetric: { marginTop: spacing.md, flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
  heroMetricValue: { color: palette.white, fontFamily: fontFamily.black, fontSize: 22 },
  heroMetricLabel: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  heroSignal: { position: 'absolute', right: 28, bottom: 0, width: 68, height: 2, backgroundColor: palette.violet },
  filters: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionHint: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  sectionCopy: { alignItems: 'flex-end' },
  sectionKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  sectionTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 20, marginTop: 3 },
  card: { marginBottom: spacing.xl },
  media: { width: '100%', aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', ...shadow.soft },
  mediaIndex: { position: 'absolute', top: 10, left: 10, width: 30, height: 26, borderRadius: 10, backgroundColor: 'rgba(3,5,9,0.62)', alignItems: 'center', justifyContent: 'center' },
  mediaIndexText: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 8 },
  typeBadge: { position: 'absolute', top: 10, right: 10, height: 26, paddingHorizontal: 8, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.62)', borderWidth: 1, borderColor: 'rgba(167,123,255,0.16)', flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  typeDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: palette.violet },
  typeText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  play: { position: 'absolute', top: '41%', alignSelf: 'center', width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(3,5,9,0.64)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  playText: { color: palette.white, fontSize: 16, marginLeft: 2 },
  cardCopy: { minHeight: 70, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardText: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 15, lineHeight: 22, fontWeight: fontWeight.black, textAlign: 'right' },
  cardMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 4, textAlign: 'right' },
  logoShell: { width: 48, height: 48, borderRadius: 16, padding: 1.5, borderWidth: 1, borderColor: 'rgba(167,123,255,0.18)' },
  logo: { flex: 1, borderRadius: 14 },
  skeleton: { gap: spacing.xl },
  skeletonCard: { gap: spacing.sm },
  skeletonCopy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loading: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.violet },
  loadingText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 10 },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyOrbit: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(167,123,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 16, height: 16, borderRadius: 5, backgroundColor: palette.violet, transform: [{ rotate: '45deg' }] },
  emptyKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1, marginTop: spacing.md },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 4 },
  emptyText: { maxWidth: 300, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});
