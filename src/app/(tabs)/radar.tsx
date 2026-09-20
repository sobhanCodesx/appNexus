import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { RadarCard } from '@/components/cards/radar-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import {
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

export default function RadarScreen() {
  const { data, refreshing, refresh } = useApiResource<RadarPayload>(
    '/game-radar',
    { items: [] },
  );
  const [filter, setFilter] = useState<'all' | 'ps' | 'xbox'>('all');

  const source = useMemo(() => data.items || [], [data.items]);
  const psCount = source.filter((item) => item.psn?.available).length;
  const xboxCount = source.filter((item) => item.xbox?.available).length;

  const items = useMemo(() => {
    if (filter === 'ps') return source.filter((item) => item.psn?.available);
    if (filter === 'xbox') return source.filter((item) => item.xbox?.available);
    return source;
  }, [filter, source]);

  const openSignal = (item: GameRadarItem) => {
    const nativeHref = nativeHrefFromUrl(item.playnexus_url);
    if (nativeHref) {
      router.push(nativeHref);
      return;
    }

    const storeUrl = filter === 'xbox'
      ? item.xbox?.url || item.psn?.url
      : item.psn?.url || item.xbox?.url;

    if (storeUrl) {
      void Linking.openURL(storeUrl);
    }
  };

  return (
    <Screen>
      <PageHeader
        title="Game Radar"
        subtitle="LIVE RELEASE SIGNALS"
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <RadarCommandCenter
              total={source.length}
              psCount={psCount}
              xboxCount={xboxCount}
            />

            <View style={styles.filterSection}>
              <View style={styles.filterCopy}>
                <Text style={styles.filterKicker}>FILTER SIGNAL</Text>
                <Text style={styles.filterTitle}>چی رو دنبال می‌کنی؟</Text>
              </View>

              <View style={styles.filters}>
                <Chip label="همه" active={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label="PlayStation" active={filter === 'ps'} onPress={() => setFilter('ps')} />
                <Chip label="Xbox" active={filter === 'xbox'} onPress={() => setFilter('xbox')} />
              </View>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.signalRow}>
            <View style={styles.signalIndex}>
              <Text style={styles.signalIndexLabel}>SIGNAL</Text>
              <Text style={styles.signalIndexNumber}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <View style={styles.signalIndexLine} />
            </View>

            <View style={styles.cardWrap}>
              <RadarCard item={item} width="100%" onPress={() => openSignal(item)} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyRadar}>
              <View style={styles.emptyRadarInner}>
                <View style={styles.emptyDot} />
              </View>
            </View>
            <Text style={styles.emptyKicker}>SCANNING</Text>
            <Text style={styles.emptyTitle}>هنوز سیگنالی پیدا نشده</Text>
            <Text style={styles.emptyText}>Radar مرتب به‌روزرسانی می‌شود؛ دوباره سر بزن.</Text>
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

function RadarCommandCenter({
  total,
  psCount,
  xboxCount,
}: {
  total: number;
  psCount: number;
  xboxCount: number;
}) {
  return (
    <View style={styles.commandWrap}>
      <View style={styles.command}>
        <View style={styles.scanner}>
          <View style={styles.scannerRingLarge}>
            <View style={styles.scannerRingMedium}>
              <View style={styles.scannerRingSmall}>
                <View style={styles.scannerCore} />
              </View>
            </View>
          </View>
          <View style={styles.scannerSweep} />
        </View>

        <View style={styles.commandCopy}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>RADAR ONLINE</Text>
          </View>
          <Text style={styles.commandTitle}>سیگنال‌های بعدی دنیای گیم</Text>
          <Text style={styles.commandBody}>
            PlayNexus تازه‌ترین حضور بازی‌ها روی فروشگاه‌ها را یک‌جا جمع می‌کند.
          </Text>
        </View>

        <View style={styles.metrics}>
          <Metric value={total} label="TOTAL" />
          <Metric value={psCount} label="PS" />
          <Metric value={xboxCount} label="XBOX" />
        </View>
      </View>
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

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  commandWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
  },
  command: {
    minHeight: 264,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    backgroundColor: 'rgba(8,14,23,0.82)',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  scanner: {
    position: 'absolute',
    left: -24,
    top: -18,
    width: 188,
    height: 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerRingLarge: {
    width: 164,
    height: 164,
    borderRadius: 164,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerRingMedium: {
    width: 112,
    height: 112,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerRingSmall: {
    width: 62,
    height: 62,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCore: {
    width: 11,
    height: 11,
    borderRadius: 11,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  scannerSweep: {
    position: 'absolute',
    width: 72,
    height: 1,
    left: 94,
    top: 94,
    backgroundColor: 'rgba(88,244,255,0.32)',
    transform: [{ rotate: '-26deg' }],
  },
  commandCopy: {
    marginLeft: 118,
    alignItems: 'flex-end',
  },
  liveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
  },
  liveText: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  commandTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    lineHeight: 30,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  commandBody: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  metrics: {
    marginTop: 'auto',
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  metric: {
    flex: 1,
    minHeight: 62,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
  },
  metricLabel: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
  },
  filterCopy: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  filterKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  filterTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  signalRow: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  signalIndex: {
    width: 42,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  signalIndexLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  signalIndexNumber: {
    color: palette.cyan,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  signalIndexLine: {
    width: 1,
    flex: 1,
    minHeight: 84,
    backgroundColor: 'rgba(88,244,255,0.12)',
    marginTop: spacing.sm,
  },
  cardWrap: {
    flex: 1,
  },
  empty: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyRadar: {
    width: 84,
    height: 84,
    borderRadius: 84,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRadarInner: {
    width: 48,
    height: 48,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.cyan,
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 5,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});
