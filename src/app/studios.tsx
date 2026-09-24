import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { StudioCard as Studio } from '@/types/api';

const fallback = require('../../assets/images/logo-glow.png');

export default function StudiosScreen() {
  const { data, loading, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<Studio>('/studios?per_page=24', 20_000);

  return (
    <Screen>
      <PageHeader title="Studios" subtitle="CREATORS OF WORLDS" onSearch={() => router.push('/search')} />

      <FlashList
        data={data.data || []}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<StudioHero count={data.total ?? data.data.length} />}
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <StudioTile studio={item} tall={index % 5 === 0 || index % 7 === 0} />
          </View>
        )}
        ListEmptyComponent={loading ? <StudiosSkeleton /> : <Empty />}
        ListFooterComponent={loadingMore ? <View style={styles.loading}><View style={styles.loadingDot} /><Text style={styles.loadingText}>استودیوهای بیشتر…</Text></View> : null}
      />
    </Screen>
  );
}

function StudioHero({ count }: { count: number }) {
  return (
    <View style={styles.headerArea}>
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(167,123,255,0.13)', 'rgba(88,244,255,0.035)', 'rgba(3,5,9,0.00)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orbitLarge} />
        <View style={styles.orbitSmall} />
        <View style={styles.wordCloud}>
          <CloudTag text="ROCKSTAR" style={styles.tagOne} />
          <CloudTag text="FROM" style={styles.tagTwo} />
          <CloudTag text="CAPCOM" style={styles.tagThree} />
          <CloudTag text="NAUGHTY DOG" style={styles.tagFour} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>PLAYNEXUS CREATOR INDEX</Text>
          <Text style={styles.heroTitle}>آدم‌هایی که دنیاها را می‌سازند</Text>
          <Text style={styles.heroBody}>از یک استودیو مستقیم برو به بازی‌ها، کالکشن‌ها و تازه‌ترین ویدیوهای همان سازنده.</Text>
          <View style={styles.heroCount}>
            <Text style={styles.heroCountValue}>{count.toLocaleString('fa-IR')}</Text>
            <Text style={styles.heroCountLabel}>ACTIVE STUDIOS</Text>
          </View>
        </View>
      </View>

      <View style={styles.directoryHead}>
        <Text style={styles.directoryHint}>CREATOR CLOUD</Text>
        <View style={styles.directoryCopy}>
          <Text style={styles.directoryKicker}>ALL STUDIOS</Text>
          <Text style={styles.directoryTitle}>استودیوها</Text>
        </View>
      </View>
    </View>
  );
}

function CloudTag({ text, style }: { text: string; style?: object }) {
  return (
    <View style={[styles.cloudTag, style]}>
      <View style={styles.cloudDot} />
      <Text style={styles.cloudText}>{text}</Text>
    </View>
  );
}

function StudioTile({ studio, tall }: { studio: Studio; tall: boolean }) {
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/studio/[slug]', params: { slug: studio.slug } })}
      pressedScale={0.98}
      style={[styles.tile, tall && styles.tileTall]}>
      <Image
        source={studio.background_url ? { uri: String(studio.background_url) } : fallback}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(3,5,9,0.04)', 'rgba(3,5,9,0.16)', 'rgba(3,5,9,0.94)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.tileTop}>
        <View style={styles.logoShell}>
          <Image source={studio.logo_url ? { uri: String(studio.logo_url) } : fallback} style={styles.logo} contentFit="cover" />
        </View>
      </View>

      <View style={styles.tileCopy}>
        <Text style={styles.tileKicker}>CREATOR</Text>
        <Text numberOfLines={2} style={styles.tileName}>{studio.name}</Text>
        <View style={styles.tileFooter}>
          <Text style={styles.tileMeta}>{(studio.channels_count || 0).toLocaleString('fa-IR')} بازی</Text>
          <View style={styles.tileArrow} />
        </View>
      </View>
      <View style={styles.tileSignal} />
    </PressableScale>
  );
}

function StudiosSkeleton() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonBox key={index} style={{ width: '47%', height: index % 3 === 0 ? 280 : 220 }} radius={24} />
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrb}><View style={styles.emptyCore} /></View>
      <Text style={styles.emptyTitle}>استودیویی پیدا نشد</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding - 6, paddingBottom: 110 },
  headerArea: { paddingHorizontal: 6, paddingBottom: spacing.lg },
  hero: { minHeight: 300, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,123,255,0.16)', backgroundColor: palette.surface, padding: spacing.lg, ...shadow.soft },
  orbitLarge: { position: 'absolute', top: -60, left: -42, width: 205, height: 205, borderRadius: 205, borderWidth: 1, borderColor: 'rgba(167,123,255,0.10)', backgroundColor: 'rgba(167,123,255,0.02)' },
  orbitSmall: { position: 'absolute', right: -30, bottom: -34, width: 135, height: 135, borderRadius: 135, borderWidth: 1, borderColor: 'rgba(88,244,255,0.10)' },
  wordCloud: { position: 'absolute', top: 18, left: 18, right: 18, height: 100 },
  cloudTag: { position: 'absolute', height: 28, paddingHorizontal: 9, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(167,123,255,0.18)', backgroundColor: 'rgba(3,5,9,0.56)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagOne: { left: 0, top: 8 },
  tagTwo: { left: 92, top: 36 },
  tagThree: { right: 10, top: 0 },
  tagFour: { right: 62, top: 58 },
  cloudDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: palette.violet },
  cloudText: { color: palette.text, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  heroCopy: { marginTop: 'auto', alignItems: 'flex-end' },
  heroKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  heroTitle: { maxWidth: 320, color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 28, lineHeight: 36, textAlign: 'right', marginTop: 5 },
  heroBody: { maxWidth: 320, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'right', marginTop: 6 },
  heroCount: { marginTop: spacing.md, flexDirection: 'row-reverse', alignItems: 'baseline', gap: 7 },
  heroCountValue: { color: palette.white, fontFamily: fontFamily.black, fontSize: 22 },
  heroCountLabel: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  directoryHead: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  directoryHint: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  directoryCopy: { alignItems: 'flex-end' },
  directoryKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  directoryTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 24, marginTop: 3 },
  cell: { padding: 6 },
  tile: { height: 230, borderRadius: radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: palette.surface, ...shadow.soft },
  tileTall: { height: 286 },
  tileTop: { padding: 10, alignItems: 'flex-end' },
  logoShell: { width: 48, height: 48, borderRadius: 16, padding: 1.5, backgroundColor: 'rgba(3,5,9,0.62)', borderWidth: 1, borderColor: 'rgba(167,123,255,0.22)' },
  logo: { flex: 1, borderRadius: 14 },
  tileCopy: { marginTop: 'auto', padding: 12, alignItems: 'flex-end' },
  tileKicker: { color: palette.violet, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  tileName: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 17, lineHeight: 22, textAlign: 'right', marginTop: 3 },
  tileFooter: { width: '100%', marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  tileMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 8 },
  tileArrow: { width: 7, height: 7, borderLeftWidth: 1.2, borderBottomWidth: 1.2, borderColor: palette.violet, transform: [{ rotate: '45deg' }] },
  tileSignal: { position: 'absolute', right: 16, bottom: 0, width: 38, height: 2, backgroundColor: palette.violet },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: 6 },
  loading: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.violet },
  loadingText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 10 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyOrb: { width: 72, height: 72, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(167,123,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.violet, transform: [{ rotate: '45deg' }] },
  emptyTitle: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 17, marginTop: spacing.md },
});
