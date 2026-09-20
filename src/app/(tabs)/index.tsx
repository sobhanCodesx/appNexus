import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { HeroSpotlight } from '@/components/cards/hero-spotlight';
import { RadarCard } from '@/components/cards/radar-card';
import { StudioCard } from '@/components/cards/studio-card';
import { PageHeader } from '@/components/ui/page-header';
import { QuickPortal } from '@/components/ui/quick-portal';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonRail } from '@/components/ui/skeleton';
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
import type { HomePayload, HomeSlide } from '@/types/api';

type Section = 'hero' | 'pulse' | 'portals' | 'feed' | 'radar' | 'studios';

const initial: HomePayload = {
  slides: [],
  latest_feed: [],
  game_radar: [],
  latest_studios: [],
  personalized_home: null,
};

export default function HomeScreen() {
  const { data, loading, refreshing, error, refresh } = useApiResource<HomePayload>('/home', initial);

  const sections: Section[] = ['hero', 'pulse', 'portals', 'feed', 'radar', 'studios'];
  const feed = data.personalized_home?.feed?.length
    ? data.personalized_home.feed
    : data.latest_feed || [];
  const radar = data.personalized_home?.radar?.length
    ? data.personalized_home.radar
    : data.game_radar || [];
  const intelligence = data.personalized_home?.intelligence;
  const followedGames = data.personalized_home?.followed_games || [];

  const primarySlide = data.slides?.[0];
  const heroContent = primarySlide ? undefined : feedItems[0];
  const heroSlide: HomeSlide | undefined = primarySlide ?? (heroContent
    ? {
        id: heroContent.id,
        title: heroContent.title,
        eyebrow: heroContent.game?.name
          || heroContent.channel?.name
          || 'FEATURED NOW',
        description: heroContent.excerpt,
        mobile_image_url: heroContent.thumbnail_url
          || heroContent.image_url
          || heroContent.cover_url
          || heroContent.game?.cover_url,
      }
    : undefined);

  const feedItems = heroContent && feedItems.length > 1
    ? feed.slice(1)
    : feed;

  const openHero = () => {
    if (primarySlide?.button_url) {
      const href = nativeHrefFromUrl(primarySlide.button_url);
      if (href) router.push(href);
      return;
    }

    if (heroContent) {
      router.push({
        pathname: '/content/[slug]',
        params: { slug: heroContent.slug },
      });
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <PageHeader
        title="PlayNexus"
        subtitle={intelligence?.confidence?.label || 'NEXUS SIGNAL ONLINE'}
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={sections}
        renderItem={({ item }) => {
          if (item === 'hero') {
            return (
              <View style={styles.heroSection}>
                <HeroSpotlight
                  slide={heroSlide}
                  onPress={heroSlide ? openHero : undefined}
                />
              </View>
            );
          }

          if (item === 'pulse') {
            return (
              <NexusPulse
                focus={intelligence?.focus_reason}
                followedGames={followedGames}
                error={error}
              />
            );
          }

          if (item === 'portals') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    title="مسیر سریع"
                    eyebrow="JUMP IN"
                    action="همه‌چی نزدیکه"
                  />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.portalRail}>
                  <QuickPortal
                    title="Game Radar"
                    caption="چی داره میاد؟"
                    symbol="◎"
                    tone="cyan"
                    onPress={() => router.push('/(tabs)/radar')}
                  />
                  <QuickPortal
                    title="Shorts"
                    caption="سریع ببین"
                    symbol="▶"
                    tone="magenta"
                    onPress={() => router.push('/shorts')}
                  />
                  <QuickPortal
                    title="Explore"
                    caption="چیز تازه کشف کن"
                    symbol="◇"
                    tone="violet"
                    onPress={() => router.push('/(tabs)/explore')}
                  />
                  <QuickPortal
                    title="Store"
                    caption="خرید و پیشنهادها"
                    symbol="▣"
                    tone="blue"
                    onPress={() => router.push('/store')}
                  />
                </ScrollView>
              </View>
            );
          }

          if (item === 'feed') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    title="برای تو"
                    eyebrow="SMART FEED"
                    action="تازه‌ها"
                  />
                </View>

                {feedItems.length ? (
                  <>
                    <View style={styles.featuredWrap}>
                      <ContentCard
                        item={feedItems[0]}
                        featured
                        width="100%"
                        onPress={() => router.push({
                          pathname: '/content/[slug]',
                          params: { slug: feedItems[0].slug },
                        })}
                      />
                    </View>

                    {feedItems.length > 1 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalRow}>
                        {feedItems.slice(1, 9).map((content) => (
                          <ContentCard
                            key={content.id}
                            item={content}
                            onPress={() => router.push({
                              pathname: '/content/[slug]',
                              params: { slug: content.slug },
                            })}
                          />
                        ))}
                      </ScrollView>
                    ) : null}
                  </>
                ) : (
                  <EmptyRail loading={loading} />
                )}
              </View>
            );
          }

          if (item === 'radar') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    title="روی رادار"
                    eyebrow="WHAT'S NEXT"
                    action="مشاهده همه"
                  />
                </View>

                {radar.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalRow}>
                    {radar.slice(0, 8).map((game) => (
                      <RadarCard
                        key={String(game.id)}
                        item={game}
                        onPress={() => router.push('/(tabs)/radar')}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyRail loading={loading} />
                )}
              </View>
            );
          }

          return (
            <View style={[styles.section, styles.lastSection]}>
              <View style={styles.headerPad}>
                <SectionHeader
                  title="سازنده‌ها"
                  eyebrow="CREATORS"
                  action="دنیای بازی‌ها"
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.studioRow}>
                {(data.latest_studios || []).map((studio) => (
                  <StudioCard
                    key={studio.id}
                    item={studio}
                    onPress={() => router.push({
                      pathname: '/studio/[slug]',
                      params: { slug: studio.slug },
                    })}
                  />
                ))}
              </ScrollView>
            </View>
          );
        }}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function NexusPulse({
  focus,
  followedGames,
  error,
}: {
  focus?: string | null;
  followedGames: NonNullable<HomePayload['personalized_home']>['followed_games'];
  error: string | null;
}) {
  const gameNames = (followedGames || []).slice(0, 3).map((game) => game.name);

  return (
    <View style={styles.pulseWrap}>
      <View style={styles.pulseCard}>
        <View style={styles.pulseOrb}>
          <View style={styles.pulseRing}>
            <View style={styles.pulseCore} />
          </View>
        </View>

        <View style={styles.pulseCopy}>
          <View style={styles.pulseTitleRow}>
            <View style={styles.pulseLiveDot} />
            <Text style={styles.pulseKicker}>NEXUS PULSE</Text>
          </View>

          <Text style={styles.pulseTitle}>
            {error
              ? 'محتوای ذخیره‌شده آماده‌ست'
              : focus || 'PlayNexus داره سیگنال‌های مهم دنیای گیم رو برای تو مرتب می‌کنه.'}
          </Text>

          <Text style={styles.pulseMeta}>
            {gameNames.length
              ? gameNames.join('  ·  ')
              : 'Radar  ·  Feed  ·  Video  ·  Store'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyRail({ loading }: { loading: boolean }) {
  if (loading) return <SkeletonRail />;

  return (
    <View style={styles.emptyRail}>
      <View style={styles.emptyGlow} />
      <Text style={styles.emptyEyebrow}>NO SIGNAL YET</Text>
      <Text style={styles.emptyTitle}>هنوز چیزی اینجا نیست</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 132,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  lastSection: {
    marginBottom: spacing.massive,
  },
  headerPad: {
    paddingHorizontal: layout.screenPadding,
  },
  portalRail: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  featuredWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  horizontalRow: {
    gap: spacing.md,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  studioRow: {
    gap: spacing.md,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  pulseWrap: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.xxl,
  },
  pulseCard: {
    minHeight: 102,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(10,16,26,0.72)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    ...shadow.soft,
  },
  pulseOrb: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 48,
    height: 48,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.22)',
    backgroundColor: 'rgba(88,244,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCore: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  pulseCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  pulseTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pulseLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  pulseKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  pulseTitle: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: 6,
  },
  pulseMeta: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 6,
    textAlign: 'right',
  },
  emptyRail: {
    height: 150,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 130,
    backgroundColor: 'rgba(24,124,255,0.07)',
  },
  emptyEyebrow: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  emptyTitle: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.bold,
    marginTop: 5,
  },
});
