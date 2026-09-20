import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';

type GameRow = {
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
  studio?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
};

const fallback = require('../../assets/images/logo-glow.png');

export default function GamesScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(timer);
  }, [query]);

  const path = useMemo(() => {
    const search = debounced ? '&q=' + encodeURIComponent(debounced) : '';
    return '/channels?sort=latest&per_page=24' + search;
  }, [debounced]);

  const {
    data,
    refreshing,
    refresh,
    loadMore,
    loadingMore,
  } = usePaginatedResource<GameRow>(path, 20_000);

  return (
    <Screen>
      <PageHeader
        title="Games"
        subtitle="PLAYNEXUS GAME CLOUD"
        onSearch={() => undefined}
      />

      <FlashList
        data={data.data || []}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <CloudHeader total={data.total ?? data.data.length} />

            <View style={styles.searchWrap}>
              <View style={styles.searchSignal} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="اسم بازی، سازنده یا ناشر..."
                placeholderTextColor={palette.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
                style={styles.search}
              />
              <Text style={styles.searchGlyph}>⌕</Text>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.headingAction}>NEWEST FIRST</Text>
              </View>
              <View style={styles.headingCopy}>
                <Text style={styles.headingKicker}>GAME DIRECTORY</Text>
                <Text style={styles.headingTitle}>همه بازی‌ها</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <GameCloudCard
              game={item}
              onPress={() => router.push({
                pathname: '/channel/[slug]',
                params: { slug: item.slug },
              })}
            />
          </View>
        )}
        ListFooterComponent={
          loadingMore
            ? <View style={styles.loading}><Text style={styles.loadingText}>بازی‌های بیشتر…</Text></View>
            : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCloud}><View style={styles.emptyCore} /></View>
            <Text style={styles.emptyTitle}>بازی‌ای پیدا نشد</Text>
            <Text style={styles.emptyText}>عبارت جستجو رو عوض کن.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function CloudHeader({ total }: { total: number }) {
  return (
    <View style={styles.cloudHero}>
      <LinearGradient
        colors={['rgba(88,244,255,0.10)', 'rgba(35,111,255,0.04)', 'rgba(6,10,18,0.94)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cloudOrbLarge} />
      <View style={styles.cloudOrbSmall} />

      <View style={styles.cloudLabels}>
        <CloudLabel text="NEW" x={4} y={2} />
        <CloudLabel text="PS5" x={78} y={26} />
        <CloudLabel text="XBOX" x={150} y={0} />
        <CloudLabel text="PC" x={226} y={32} />
      </View>

      <View style={styles.cloudCopy}>
        <Text style={styles.cloudKicker}>PLAYNEXUS CLOUD INDEX</Text>
        <Text style={styles.cloudTitle}>دنیای بازی‌ها، یک‌جا</Text>
        <Text style={styles.cloudBody}>
          جدیدترین بازی‌های ثبت‌شده در PlayNexus؛ از اینجا وارد هاب هر بازی شو.
        </Text>
        <View style={styles.cloudCount}>
          <Text style={styles.cloudCountValue}>{total.toLocaleString('fa-IR')}</Text>
          <Text style={styles.cloudCountLabel}>GAME SIGNALS</Text>
        </View>
      </View>
    </View>
  );
}

function CloudLabel({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <View style={[styles.cloudLabel, { transform: [{ translateX: x }, { translateY: y }] }]}>
      <View style={styles.cloudLabelDot} />
      <Text style={styles.cloudLabelText}>{text}</Text>
    </View>
  );
}

function GameCloudCard({
  game,
  onPress,
}: {
  game: GameRow;
  onPress: () => void;
}) {
  const image = game.background_url || game.cover_url;

  return (
    <PressableScale onPress={onPress} pressedScale={0.98} style={styles.gameCard}>
      <Image
        source={image ? { uri: image } : fallback}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.18)', 'rgba(3,5,9,0.96)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.gameBadge}>
        <View style={styles.gameBadgeDot} />
        <Text style={styles.gameBadgeText}>CLOUD</Text>
      </View>

      <View style={styles.gameCopy}>
        <Text numberOfLines={1} style={styles.gameStudio}>
          {game.studio?.name || game.developer || 'PLAYNEXUS'}
        </Text>
        <Text numberOfLines={2} style={styles.gameTitle}>{game.name}</Text>
        <View style={styles.gameMetaRow}>
          <Text style={styles.gameMeta}>
            {(game.subscribers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده
          </Text>
          <View style={styles.gameArrow} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding - 6,
    paddingBottom: 110,
  },
  headerArea: {
    paddingHorizontal: 6,
    paddingBottom: spacing.lg,
  },
  cloudHero: {
    minHeight: 260,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    backgroundColor: palette.surface,
    padding: spacing.lg,
    ...shadow.soft,
  },
  cloudOrbLarge: {
    position: 'absolute',
    top: -54,
    left: -34,
    width: 190,
    height: 190,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.10)',
    backgroundColor: 'rgba(88,244,255,0.025)',
  },
  cloudOrbSmall: {
    position: 'absolute',
    right: -34,
    bottom: -44,
    width: 140,
    height: 140,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.10)',
  },
  cloudLabels: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    height: 72,
  },
  cloudLabel: {
    position: 'absolute',
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(3,5,9,0.58)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cloudLabelDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.cyan,
  },
  cloudLabelText: {
    color: palette.text,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  cloudCopy: {
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  cloudKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  cloudTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 28,
    lineHeight: 35,
    marginTop: 5,
    textAlign: 'right',
  },
  cloudBody: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 19,
    maxWidth: 300,
    textAlign: 'right',
    marginTop: 6,
  },
  cloudCount: {
    marginTop: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 6,
  },
  cloudCountValue: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 22,
  },
  cloudCountLabel: {
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  searchWrap: {
    height: 58,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  searchSignal: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 52,
    height: 2,
    backgroundColor: palette.cyan,
  },
  search: {
    flex: 1,
    color: palette.white,
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  searchGlyph: {
    color: palette.cyan,
    fontSize: 22,
    marginLeft: spacing.sm,
  },
  sectionHeading: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headingCopy: {
    alignItems: 'flex-end',
  },
  headingKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  headingTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 24,
    marginTop: 3,
  },
  headingAction: {
    color: palette.textDim,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  cell: {
    padding: 6,
  },
  gameCard: {
    height: 248,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  gameBadge: {
    alignSelf: 'flex-start',
    margin: spacing.sm,
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gameBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.cyan,
  },
  gameBadgeText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  gameCopy: {
    marginTop: 'auto',
    padding: spacing.sm,
    alignItems: 'flex-end',
  },
  gameStudio: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.6,
  },
  gameTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: 3,
  },
  gameMetaRow: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameMeta: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 8,
  },
  gameArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.2,
    borderBottomWidth: 1.2,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
  empty: {
    paddingTop: 70,
    alignItems: 'center',
  },
  emptyCloud: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 18,
    marginTop: spacing.md,
  },
  emptyText: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 4,
  },
});
