import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import {
  fontFamily,
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { nativeHrefFromUrl } from '@/services/native-navigation';
import type { GameRadarItem } from '@/types/api';

type RadarPayload = { items?: GameRadarItem[] };
type Filter = 'all' | 'ps' | 'xbox';

const fallback = require('../../../assets/images/logo-glow.png');

function imageOf(item?: GameRadarItem | null) {
  return item?.banner_url || item?.cover_url || null;
}

export default function RadarScreen() {
  const { data, loading, refreshing, refresh } = useApiResource<RadarPayload>(
    '/game-radar',
    { items: [] },
  );
  const [filter, setFilter] = useState<Filter>('all');

  const source = useMemo(() => data.items || [], [data.items]);
  const psCount = source.filter((item) => item.psn?.available).length;
  const xboxCount = source.filter((item) => item.xbox?.available).length;

  const items = useMemo(() => {
    if (filter === 'ps') return source.filter((item) => item.psn?.available);
    if (filter === 'xbox') return source.filter((item) => item.xbox?.available);
    return source;
  }, [filter, source]);

  const lead = items[0] || null;
  const signals = lead ? items.slice(1) : [];

  const openSignal = (item: GameRadarItem) => {
    const nativeHref = nativeHrefFromUrl(item.playnexus_url);
    if (nativeHref) {
      router.push(nativeHref);
      return;
    }

    const storeUrl = filter === 'xbox'
      ? item.xbox?.url || item.psn?.url
      : item.psn?.url || item.xbox?.url;

    if (storeUrl) void Linking.openURL(storeUrl);
  };

  return (
    <Screen>
      <PageHeader
        title="Game Radar"
        subtitle="PLAYNEXUS RELEASE HUB"
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={signals}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <RadarSignalCard
            item={item}
            index={index + 2}
            onPress={() => openSignal(item)}
          />
        )}
        ListHeaderComponent={
          <>
            {loading && !source.length ? (
              <RadarSkeleton />
            ) : lead ? (
              <>
                <RadarHubHero
                  item={lead}
                  total={source.length}
                  psCount={psCount}
                  xboxCount={xboxCount}
                  filter={filter}
                  setFilter={setFilter}
                  onPress={() => openSignal(lead)}
                />
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>{items.length.toLocaleString('fa-IR')}</Text>
                  </View>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.sectionKicker}>LIVE SIGNALS</Text>
                    <Text style={styles.sectionTitle}>روی رادار PlayNexus</Text>
                    <Text style={styles.sectionBody}>بازی‌هایی که همین حالا سیگنال فروشگاهی دارند.</Text>
                  </View>
                </View>
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading && !lead ? (
            <View style={styles.empty}>
              <View style={styles.emptyRadar}>
                <View style={styles.emptyRadarInner}><View style={styles.emptyDot} /></View>
              </View>
              <Text style={styles.emptyKicker}>SCANNING</Text>
              <Text style={styles.emptyTitle}>هنوز سیگنالی پیدا نشده</Text>
              <Text style={styles.emptyText}>Radar مرتب به‌روزرسانی می‌شود؛ دوباره سر بزن.</Text>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function RadarHubHero({
  item,
  total,
  psCount,
  xboxCount,
  filter,
  setFilter,
  onPress,
}: {
  item: GameRadarItem;
  total: number;
  psCount: number;
  xboxCount: number;
  filter: Filter;
  setFilter: (filter: Filter) => void;
  onPress: () => void;
}) {
  const image = imageOf(item);

  return (
    <View style={styles.heroWrap}>
      <PressableScale onPress={onPress} pressedScale={0.992} style={styles.hero}>
        <Image
          source={image ? { uri: image } : fallback}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={180}
        />
        <LinearGradient
          colors={['rgba(3,5,9,0.08)', 'rgba(3,5,9,0.16)', 'rgba(3,5,9,0.97)']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(10,24,38,0.84)', 'rgba(3,5,9,0.00)']}
          start={{ x: 1, y: 0.3 }}
          end={{ x: 0.2, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroTop}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>RADAR ONLINE</Text>
          </View>
          <View style={styles.signalBadge}>
            <Text style={styles.signalBadgeText}>LEAD SIGNAL · 01</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          {item.cover_url ? (
            <View style={styles.coverFrame}>
              <Image
                source={{ uri: item.cover_url }}
                style={styles.cover}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
          ) : null}

          <Text style={styles.heroKicker}>PLAYNEXUS GAME RADAR</Text>
          <Text numberOfLines={3} style={styles.heroTitle}>{item.title}</Text>

          <View style={styles.storeSignals}>
            {item.psn?.available ? <StoreSignal label="PLAYSTATION" tone="blue" /> : null}
            {item.xbox?.available ? <StoreSignal label="XBOX" tone="green" /> : null}
          </View>

          <View style={styles.heroActionRow}>
            <View style={styles.openOrb}><Text style={styles.openOrbText}>‹</Text></View>
            <View style={styles.heroActionCopy}>
              <Text style={styles.heroActionKicker}>OPEN SIGNAL</Text>
              <Text style={styles.heroActionText}>جزئیات بازی یا فروشگاه</Text>
            </View>
          </View>
        </View>
      </PressableScale>

      <View style={styles.metrics}>
        <Metric value={total} label="TOTAL" />
        <Metric value={psCount} label="PLAYSTATION" />
        <Metric value={xboxCount} label="XBOX" />
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.filterCopy}>
          <Text style={styles.filterKicker}>SIGNAL FILTER</Text>
          <Text style={styles.filterTitle}>کدوم اکوسیستم؟</Text>
        </View>
        <View style={styles.filters}>
          <Chip label="همه" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="PlayStation" active={filter === 'ps'} onPress={() => setFilter('ps')} />
          <Chip label="Xbox" active={filter === 'xbox'} onPress={() => setFilter('xbox')} />
        </View>
      </View>
    </View>
  );
}

function RadarSignalCard({
  item,
  index,
  onPress,
}: {
  item: GameRadarItem;
  index: number;
  onPress: () => void;
}) {
  const image = imageOf(item);

  return (
    <PressableScale onPress={onPress} pressedScale={0.99} style={styles.signalCard}>
      <View style={styles.signalMedia}>
        <Image
          source={image ? { uri: image } : fallback}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={String(item.id)}
          transition={140}
        />
        <LinearGradient
          colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.20)', 'rgba(3,5,9,0.94)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.signalTop}>
          <View style={styles.indexPill}>
            <Text style={styles.indexText}>{String(index).padStart(2, '0')}</Text>
          </View>
          <View style={styles.cardPlatforms}>
            {item.psn?.available ? <MiniPlatform label="PS" /> : null}
            {item.xbox?.available ? <MiniPlatform label="XBOX" /> : null}
          </View>
        </View>

        <View style={styles.cardCopy}>
          <Text style={styles.cardKicker}>GAME SIGNAL</Text>
          <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.cardCover} contentFit="cover" />
        ) : (
          <View style={styles.cardCoverFallback}><Text style={styles.cardCoverGlyph}>◎</Text></View>
        )}
        <View style={styles.cardFooterCopy}>
          <Text style={styles.cardFooterLabel}>RELEASE HUB</Text>
          <Text style={styles.cardFooterText}>باز کردن سیگنال و جزئیات</Text>
        </View>
        <View style={styles.cardArrow}><View style={styles.cardArrowGlyph} /></View>
      </View>
    </PressableScale>
  );
}

function StoreSignal({ label, tone }: { label: string; tone: 'blue' | 'green' }) {
  const color = tone === 'blue' ? palette.blue : palette.success;
  return (
    <View style={[styles.storeSignal, { borderColor: color + '55' }]}>
      <View style={[styles.storeDot, { backgroundColor: color }]} />
      <Text style={[styles.storeText, { color }]}>{label}</Text>
    </View>
  );
}

function MiniPlatform({ label }: { label: string }) {
  return (
    <View style={styles.miniPlatform}>
      <Text style={styles.miniPlatformText}>{label}</Text>
    </View>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value.toLocaleString('fa-IR')}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RadarSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBox style={{ width: '100%', height: 470 }} radius={30} />
      <SkeletonBox style={{ width: '100%', height: 86 }} radius={24} />
      <SkeletonBox style={{ width: '100%', height: 130 }} radius={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 150 },
  heroWrap: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
  hero: {
    minHeight: 500, borderRadius: 30, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.15)',
    backgroundColor: palette.surface, ...shadow.card,
  },
  heroTop: {
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    height: 30, paddingHorizontal: 10, borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.64)', borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)', flexDirection: 'row',
    alignItems: 'center', gap: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.success },
  liveText: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.9,
  },
  signalBadge: {
    height: 30, paddingHorizontal: 10, borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.64)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  signalBadgeText: {
    color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7,
  },
  heroCopy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  coverFrame: {
    width: 86, height: 86, borderRadius: 26, padding: 2,
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(3,5,9,0.66)', ...shadow.cyanGlow,
  },
  cover: { flex: 1, borderRadius: 23 },
  heroKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8,
    letterSpacing: 1.1, marginTop: spacing.md,
  },
  heroTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: 34, lineHeight: 42, textAlign: 'right', marginTop: 5, letterSpacing: -0.5,
  },
  storeSignals: { flexDirection: 'row-reverse', gap: 6, marginTop: spacing.sm },
  storeSignal: {
    height: 30, paddingHorizontal: 9, borderRadius: radii.pill, borderWidth: 1,
    backgroundColor: 'rgba(3,5,9,0.58)', flexDirection: 'row-reverse',
    alignItems: 'center', gap: 5,
  },
  storeDot: { width: 5, height: 5, borderRadius: 5 },
  storeText: { fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.6 },
  heroActionRow: {
    width: '100%', marginTop: spacing.lg, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  openOrb: {
    width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(88,244,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  openOrbText: { color: palette.cyan, fontSize: 25, lineHeight: 27 },
  heroActionCopy: { flex: 1, alignItems: 'flex-end' },
  heroActionKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8,
  },
  heroActionText: { color: palette.text, fontFamily: fontFamily.bold, fontSize: 11, marginTop: 2 },
  metrics: {
    minHeight: 86, marginTop: -12, marginHorizontal: 10, borderRadius: radii.xl,
    borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(8,14,23,0.96)',
    flexDirection: 'row-reverse', padding: 6, ...shadow.soft,
  },
  metric: { flex: 1, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  metricValue: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: typeScale.titleSm,
  },
  metricLabel: {
    color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7,
    letterSpacing: 0.65, marginTop: 2,
  },
  filterPanel: {
    marginTop: spacing.lg, borderRadius: radii.xl, borderWidth: 1,
    borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.025)',
    padding: spacing.md,
  },
  filterCopy: { alignItems: 'flex-end', marginBottom: spacing.sm },
  filterKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.9,
  },
  filterTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 3,
  },
  filters: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  sectionHeading: {
    paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  sectionCount: {
    minWidth: 42, height: 34, borderRadius: 12, backgroundColor: 'rgba(88,244,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.13)', alignItems: 'center', justifyContent: 'center',
  },
  sectionCountText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 11 },
  sectionCopy: { alignItems: 'flex-end' },
  sectionKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1,
  },
  sectionTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: 23, marginTop: 3,
  },
  sectionBody: {
    color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3,
  },
  signalCard: {
    marginHorizontal: layout.screenPadding, marginBottom: spacing.lg,
    borderRadius: 27, overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(8,14,23,0.92)',
    ...shadow.soft,
  },
  signalMedia: { height: 245, overflow: 'hidden' },
  signalTop: {
    padding: spacing.sm, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  indexPill: {
    width: 38, height: 30, borderRadius: 11, backgroundColor: 'rgba(3,5,9,0.66)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.17)', alignItems: 'center', justifyContent: 'center',
  },
  indexText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 9 },
  cardPlatforms: { flexDirection: 'row', gap: 5 },
  miniPlatform: {
    height: 28, paddingHorizontal: 8, borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.66)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)', alignItems: 'center', justifyContent: 'center',
  },
  miniPlatformText: { color: palette.white, fontFamily: fontFamily.black, fontSize: 7 },
  cardCopy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  cardKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1,
  },
  cardTitle: {
    color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black,
    fontSize: 24, lineHeight: 31, textAlign: 'right', marginTop: 4,
  },
  cardFooter: {
    minHeight: 76, padding: spacing.sm, flexDirection: 'row',
    alignItems: 'center', gap: spacing.sm,
  },
  cardCover: { width: 52, height: 52, borderRadius: 17 },
  cardCoverFallback: {
    width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(88,244,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  cardCoverGlyph: { color: palette.cyan, fontSize: 19 },
  cardFooterCopy: { flex: 1, alignItems: 'flex-end' },
  cardFooterLabel: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8,
  },
  cardFooterText: { color: palette.textMuted, fontFamily: fontFamily.medium, fontSize: 10, marginTop: 2 },
  cardArrow: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(88,244,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.13)', alignItems: 'center', justifyContent: 'center',
  },
  cardArrowGlyph: {
    width: 7, height: 7, borderLeftWidth: 1.4, borderBottomWidth: 1.4,
    borderColor: palette.cyan, transform: [{ rotate: '45deg' }],
  },
  skeleton: { paddingHorizontal: layout.screenPadding, gap: spacing.md, paddingBottom: spacing.xl },
  empty: { paddingVertical: 90, alignItems: 'center', paddingHorizontal: layout.screenPadding },
  emptyRadar: {
    width: 88, height: 88, borderRadius: 88, borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  emptyRadarInner: {
    width: 50, height: 50, borderRadius: 50, borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)', alignItems: 'center', justifyContent: 'center',
  },
  emptyDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: palette.cyan },
  emptyKicker: {
    color: palette.cyan, fontFamily: fontFamily.black, fontSize: 9,
    letterSpacing: 1, marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.text, fontFamily: fontFamily.black, fontSize: typeScale.title,
    marginTop: 5,
  },
  emptyText: {
    color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: typeScale.bodySm,
    textAlign: 'center', lineHeight: 22, marginTop: spacing.sm, maxWidth: 300,
  },
});
