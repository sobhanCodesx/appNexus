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

type Channel = {
  id: number;
  name: string;
  slug: string;
  developer?: string | null;
  publisher?: string | null;
  cover_url?: string | null;
  background_url?: string | null;
  videos_count?: number;
  subscribers_count?: number;
  is_subscribed?: boolean;
  studio?: { name?: string | null; logo_url?: string | null } | null;
};

const fallback = require('../../assets/images/logo-glow.png');

export default function ChannelsScreen() {
  const { data, loading, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<Channel>('/channels?per_page=24', 20_000);

  return (
    <Screen>
      <PageHeader title="Game Hubs" subtitle="ENTER THE WORLDS" onSearch={() => router.push('/search')} />
      <FlashList
        data={data.data || []}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<GameHubHero total={data.total ?? data.data.length} />}
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <GameHubCard item={item} tall={index % 5 === 0 || index % 7 === 0} />
          </View>
        )}
        ListEmptyComponent={loading ? <HubSkeleton /> : <Empty />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loading}>
              <View style={styles.loadingDot} />
              <Text style={styles.loadingText}>دنیاهای بیشتر…</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function GameHubHero({ total }: { total: number }) {
  return (
    <View style={styles.headerArea}>
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(88,244,255,0.11)', 'rgba(24,124,255,0.045)', 'rgba(3,5,9,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cloud}>
          <CloudTag text="OPEN WORLD" x={0} y={10} />
          <CloudTag text="ACTION" x={96} y={42} />
          <CloudTag text="RPG" x={195} y={6} />
          <CloudTag text="STORY" x={236} y={62} />
        </View>
        <View style={styles.heroRingOne} />
        <View style={styles.heroRingTwo} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>PLAYNEXUS GAME UNIVERSE</Text>
          <Text style={styles.heroTitle}>هر بازی، یک دنیای کامل</Text>
          <Text style={styles.heroBody}>ویدیوها، کالکشن‌ها، استودیو و سیگنال‌های هر بازی را از Game Hub خودش دنبال کن.</Text>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{total.toLocaleString('fa-IR')}</Text>
            <Text style={styles.heroMetricLabel}>ACTIVE HUBS</Text>
          </View>
        </View>
      </View>

      <View style={styles.directoryHead}>
        <Text style={styles.directoryHint}>LATEST WORLDS</Text>
        <View style={styles.directoryCopy}>
          <Text style={styles.directoryKicker}>GAME DIRECTORY</Text>
          <Text style={styles.directoryTitle}>Game Hubs</Text>
        </View>
      </View>
    </View>
  );
}

function CloudTag({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <View style={[styles.cloudTag, { transform: [{ translateX: x }, { translateY: y }] }]}>
      <View style={styles.cloudDot} />
      <Text style={styles.cloudText}>{text}</Text>
    </View>
  );
}

function GameHubCard({ item, tall }: { item: Channel; tall: boolean }) {
  const image = item.background_url || item.cover_url;
  return (
    <PressableScale
      style={[styles.card, tall && styles.cardTall]}
      pressedScale={0.98}
      onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: item.slug } })}>
      <Image source={image ? { uri: String(image) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      <LinearGradient colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.16)', 'rgba(3,5,9,0.96)']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.cardTop}>
        <View style={styles.logoShell}>
          <Image source={item.cover_url ? { uri: String(item.cover_url) } : fallback} style={styles.logo} contentFit="cover" />
        </View>
        {item.is_subscribed ? (
          <View style={styles.following}><View style={styles.followingDot} /><Text style={styles.followingText}>FOLLOWING</Text></View>
        ) : null}
      </View>

      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.cardStudio}>{item.studio?.name || item.developer || 'PLAYNEXUS GAME'}</Text>
        <Text numberOfLines={2} style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardMeta}>
          {(item.subscribers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده · {(item.videos_count || 0).toLocaleString('fa-IR')} ویدیو
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.enterText}>ENTER HUB</Text>
          <View style={styles.enterArrow} />
        </View>
      </View>
      <View style={styles.cardSignal} />
    </PressableScale>
  );
}

function HubSkeleton() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonBox key={index} style={{ width: '47%', height: index % 3 === 0 ? 286 : 232 }} radius={24} />
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrbit}><View style={styles.emptyCore} /></View>
      <Text style={styles.emptyTitle}>فعلاً Game Hubی نیست</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding - 6, paddingBottom: 110 },
  headerArea: { paddingHorizontal: 6, paddingBottom: spacing.lg },
  hero: { minHeight: 290, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.15)', backgroundColor: palette.surface, padding: spacing.lg, ...shadow.soft },
  cloud: { position: 'absolute', left: 18, right: 18, top: 16, height: 96 },
  cloudTag: { position: 'absolute', height: 28, paddingHorizontal: 9, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', backgroundColor: 'rgba(3,5,9,0.56)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  cloudDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: palette.cyan },
  cloudText: { color: palette.text, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  heroRingOne: { position: 'absolute', left: -60, bottom: -64, width: 180, height: 180, borderRadius: 180, borderWidth: 1, borderColor: 'rgba(88,244,255,0.08)' },
  heroRingTwo: { position: 'absolute', right: -28, bottom: -30, width: 110, height: 110, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(167,123,255,0.09)' },
  heroCopy: { marginTop: 'auto', alignItems: 'flex-end' },
  heroKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  heroTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 28, lineHeight: 36, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 5 },
  heroBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'right', maxWidth: 320, marginTop: 6 },
  heroMetric: { marginTop: spacing.md, flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
  heroMetricValue: { color: palette.white, fontFamily: fontFamily.black, fontSize: 22 },
  heroMetricLabel: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  directoryHead: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  directoryHint: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  directoryCopy: { alignItems: 'flex-end' },
  directoryKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  directoryTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 24, marginTop: 3 },
  cell: { padding: 6 },
  card: { height: 232, borderRadius: radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: palette.surface, ...shadow.soft },
  cardTall: { height: 286 },
  cardTop: { padding: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logoShell: { width: 50, height: 50, borderRadius: 16, padding: 1.5, borderWidth: 1, borderColor: 'rgba(88,244,255,0.22)', backgroundColor: 'rgba(3,5,9,0.55)' },
  logo: { flex: 1, borderRadius: 14 },
  following: { height: 25, paddingHorizontal: 7, borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.60)', borderWidth: 1, borderColor: 'rgba(80,232,176,0.16)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  followingDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: palette.success },
  followingText: { color: palette.success, fontFamily: fontFamily.black, fontSize: 6, letterSpacing: 0.6 },
  cardCopy: { marginTop: 'auto', padding: 12, alignItems: 'flex-end' },
  cardStudio: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  cardName: { color: palette.white, fontFamily: fontFamily.black, fontSize: 17, lineHeight: 22, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 3 },
  cardMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 8, marginTop: 4, textAlign: 'right' },
  cardFooter: { width: '100%', marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  enterText: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  enterArrow: { width: 7, height: 7, borderLeftWidth: 1.2, borderBottomWidth: 1.2, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  cardSignal: { position: 'absolute', right: 16, bottom: 0, width: 38, height: 2, backgroundColor: palette.cyan },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: 6 },
  loading: { paddingVertical: spacing.xl, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.cyan },
  loadingText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 10 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyOrbit: { width: 72, height: 72, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  emptyTitle: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 17, marginTop: spacing.md },
});
