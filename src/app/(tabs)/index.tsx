import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { ProductCard } from '@/components/cards/product-card';
import { RadarCard } from '@/components/cards/radar-card';
import { StudioCard } from '@/components/cards/studio-card';
import { HomeGameCard } from '@/components/home/home-game-card';
import { NexusLatestSlider } from '@/components/home/nexus-latest-slider';
import { Reveal } from '@/components/ui/motion-primitives';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { QuickPortal } from '@/components/ui/quick-portal';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonHero, SkeletonRail, SkeletonStudioRail } from '@/components/ui/skeleton';
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
import { normalizeContentCards } from '@/utils/content-card';
import type {
  ContentCard as ContentItem,
  HomeContentSection,
  HomeMixedItem,
  HomeGame,
  HomePayload,
  HomeProduct,
  NexusLatestItem,
} from '@/types/api';

type Section =
  | 'hero'
  | 'videos'
  | 'games'
  | 'pulse'
  | 'portals'
  | 'feed'
  | 'featured-products'
  | 'latest-products'
  | 'categories'
  | 'channels'
  | 'radar'
  | 'fresh'
  | 'studios'
  | `dynamic:${number}`;

const initial: HomePayload = {
  slides: [],
  latest_feed: [],
  latest_videos: [],
  latest_games: [],
  nexus_latest: [],
  game_radar: [],
  latest_studios: [],
  personalized_home: null,
  categories: [],
  featured_products: [],
  latest_products: [],
  content_sections: [],
  fresh_content: [],
  channels: [],
};

export default function HomeScreen() {
  const { data, loading, refreshing, error, refresh } = useApiResource<HomePayload>('/home', initial);

  const feed = normalizeContentCards(
    data.personalized_home?.feed?.length
      ? data.personalized_home.feed
      : data.latest_feed || [],
  );

  const storePicks = data.featured_products?.length
    ? data.featured_products
    : data.latest_products || [];

  const latestVideos = normalizeContentCards(
    data.personalized_home?.videos?.length
      ? data.personalized_home.videos
      : data.latest_videos?.length
        ? data.latest_videos
        : feed.filter((item) => item.type === 'video').slice(0, 10),
  );

  const latestGames: HomeGame[] = data.latest_games?.length
    ? data.latest_games
    : (data.channels || []).slice(0, 10).map((game) => ({
        id: game.id,
        name: game.name,
        slug: game.slug,
        cover_url: game.image_url,
        background_url: game.image_url,
      }));

  const fallbackLatest: NexusLatestItem[] = [
    ...feed.slice(0, 3).map((item) => ({
      key: 'feed-' + item.id,
      kind: item.type === 'video' ? 'video' as const : 'feed' as const,
      id: item.id,
      title: item.title,
      subtitle: item.game?.name || item.channel?.name || 'PlayNexus',
      slug: item.slug,
      image_url: item.thumbnail_url || item.image_url || item.cover_url || item.game?.cover_url,
      created_at: item.published_at,
    })),
    ...latestGames.slice(0, 2).map((game) => ({
      key: 'game-' + game.id,
      kind: 'game' as const,
      id: game.id,
      title: game.name,
      subtitle: game.studio?.name || game.developer || 'بازی جدید',
      slug: game.slug,
      image_url: game.background_url || game.cover_url,
      created_at: game.created_at,
    })),
    ...(data.latest_studios || []).slice(0, 2).map((studio) => ({
      key: 'studio-' + studio.id,
      kind: 'studio' as const,
      id: studio.id,
      title: studio.name,
      subtitle: 'استودیو جدید',
      slug: studio.slug,
      image_url: studio.background_url || studio.logo_url,
      created_at: null,
    })),
    ...storePicks.slice(0, 2).map((product) => ({
      key: 'product-' + product.id,
      kind: 'product' as const,
      id: product.id,
      title: product.title,
      subtitle: product.category || 'محصول جدید',
      slug: product.slug,
      image_url: product.cover_url,
      created_at: null,
    })),
  ];

  const latestNexus = data.nexus_latest?.length
    ? data.nexus_latest
    : fallbackLatest.slice(0, 10);

  const radar = data.personalized_home?.radar?.length
    ? data.personalized_home.radar
    : data.game_radar || [];
  const intelligence = data.personalized_home?.intelligence;
  const followedGames = data.personalized_home?.followed_games || [];

  const dynamicSections = (data.content_sections || [])
    .filter((section) => !['products', 'categories', 'games'].includes(section.content_type))
    .slice(0, 2);

  const showPulse = Boolean(
    data.personalized_home?.intelligence?.focus_reason
    || data.personalized_home?.followed_games?.length,
  );

  const feedItems = feed.slice(0, 8);

  const sections: Section[] = [
    'hero',
    ...(loading || latestVideos.length ? ['videos' as const] : []),
    ...(loading || latestGames.length ? ['games' as const] : []),
    ...(loading || feedItems.length ? ['feed' as const] : []),
    ...(loading || radar.length ? ['radar' as const] : []),
    'portals',
    ...(showPulse ? ['pulse' as const] : []),
    ...(storePicks.length ? ['featured-products' as const] : []),
    ...(data.fresh_content?.length ? ['fresh' as const] : []),
    ...dynamicSections.map((section) => `dynamic:${section.id}` as Section),
    ...(loading || (data.latest_studios || []).length ? ['studios' as const] : []),
  ];

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
              <Reveal delay={40}>
                <View style={styles.heroSection}>
                  {loading && !latestNexus.length ? (
                    <SkeletonHero />
                  ) : (
                    <NexusLatestSlider items={latestNexus} />
                  )}
                </View>
              </Reveal>
            );
          }

          if (item === 'videos') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="ویدیوهای جدید"
                    eyebrow="LATEST VIDEOS"
                    action="همه ویدیوها"
                    onAction={() => router.push('/(tabs)/videos')}
                  />
                </View>

                {latestVideos.length ? (
                  <ScrollView
                    horizontal
                    style={styles.rtlScroll}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalRow}>
                    {latestVideos.slice(0, 10).map((video) => (
                      <ContentCard
                        key={video.id}
                        item={video}
                        home
                        width={258}
                        onPress={() => router.push({
                          pathname: '/content/[slug]',
                          params: { slug: video.slug },
                        })}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyRail loading={loading} />
                )}
              </View>
            );
          }

          if (item === 'games') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="بازی‌های تازه"
                    eyebrow="GAME CLOUD"
                    action="همه بازی‌ها"
                    onAction={() => router.push('/games')}
                  />
                </View>

                {latestGames.length ? (
                  <ScrollView
                    horizontal
                    style={styles.rtlScroll}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalRow}>
                    {latestGames.slice(0, 10).map((game) => (
                      <HomeGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push({
                          pathname: '/channel/[slug]',
                          params: { slug: game.slug },
                        })}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyRail loading={loading} />
                )}
              </View>
            );
          }

          if (item === 'pulse') {
            return (
              <Reveal delay={110}>
                <NexusPulse
                  focus={intelligence?.focus_reason}
                  followedGames={followedGames}
                  error={error}
                />
              </Reveal>
            );
          }

          if (item === 'portals') {
            return (
              <Reveal delay={170}>
                <View style={styles.section}>
                  <View style={styles.headerPad}>
                    <SectionHeader
                      compact
                      title="مسیر سریع"
                    eyebrow="JUMP IN"
                  />
                </View>

                <ScrollView
                  horizontal
                  style={styles.rtlScroll}
                  decelerationRate="fast"
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
              </Reveal>
            );
          }

          if (item === 'feed') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="برای تو"
                    eyebrow="SMART FEED"
                    action="مشاهده فید"
                    onAction={() => router.push('/feed')}
                  />
                </View>

                {feedItems.length ? (
                  <>
                    <View style={styles.featuredWrap}>
                      <ContentCard
                        item={feedItems[0]}
                        featured
                        home
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
                        style={styles.rtlScroll}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalRow}>
                        {feedItems.slice(1, 9).map((content) => (
                          <ContentCard
                            key={content.id}
                            item={content}
                            home
                            width={248}
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

          if (item === 'featured-products') {
            return (
              <HomeProductRail
                title="انتخاب PlayNexus"
                eyebrow="FEATURED STORE"
                items={storePicks}
                onAll={() => router.push('/store')}
              />
            );
          }

          if (item === 'latest-products') {
            return (
              <HomeProductRail
                title="تازه‌های فروشگاه"
                eyebrow="NEW IN STORE"
                items={data.latest_products || []}
                onAll={() => router.push('/store')}
              />
            );
          }

          if (item === 'categories') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="دسته‌بندی‌ها"
                    eyebrow="STORE MAP"
                    action="همه دسته‌ها"
                    onAction={() => router.push('/categories')}
                  />
                </View>
                <ScrollView
                  horizontal
                  style={styles.rtlScroll}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.entityRail}>
                  {(data.categories || []).map((category) => (
                    <HomeEntityCard
                      key={category.id}
                      title={category.name}
                      eyebrow="CATEGORY"
                      meta={(category.products_count || 0).toLocaleString('fa-IR') + ' محصول'}
                      imageUrl={category.image_url}
                      onPress={() => router.push({
                        pathname: '/category/[slug]',
                        params: { slug: category.slug },
                      })}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          }

          if (item === 'channels') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="Game Hubs"
                    eyebrow="FOLLOW THE GAME"
                    action="همه کانال‌ها"
                    onAction={() => router.push('/channels')}
                  />
                </View>
                <ScrollView
                  horizontal
                  style={styles.rtlScroll}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.entityRail}>
                  {(data.channels || []).map((channel) => (
                    <HomeEntityCard
                      key={channel.id}
                      title={channel.name}
                      eyebrow="GAME CHANNEL"
                      meta={(channel.subscribers_count || 0).toLocaleString('fa-IR') + ' دنبال‌کننده'}
                      imageUrl={channel.image_url}
                      onPress={() => router.push({
                        pathname: '/channel/[slug]',
                        params: { slug: channel.slug },
                      })}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          }

          if (item === 'radar') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="روی رادار"
                    eyebrow="WHAT'S NEXT"
                    action="مشاهده همه"
                    onAction={() => router.push('/(tabs)/radar')}
                  />
                </View>

                {radar.length ? (
                  <ScrollView
                    horizontal
                    style={styles.rtlScroll}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalRow}>
                    {radar.slice(0, 8).map((game) => (
                      <RadarCard
                        key={String(game.id)}
                        item={game}
                        compact
                        width={228}
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

          if (item === 'fresh') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}>
                  <SectionHeader
                    compact
                    title="تازه وارد Nexus"
                    eyebrow="FRESH 14 DAYS"
                    action="کشف کن"
                    onAction={() => router.push('/(tabs)/explore')}
                  />
                </View>
                <ScrollView
                  horizontal
                  style={styles.rtlScroll}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.entityRail}>
                  {(data.fresh_content || []).map((entry) => (
                    <FreshCard key={entry.key} item={entry} />
                  ))}
                </ScrollView>
              </View>
            );
          }

          if (item.startsWith('dynamic:')) {
            const sectionId = Number(item.split(':')[1]);
            const dynamic = (data.content_sections || []).find((section) => section.id === sectionId);
            return dynamic ? <DynamicHomeSection section={dynamic} /> : null;
          }

          return (
            <View style={[styles.section, styles.lastSection]}>
              <View style={styles.headerPad}>
                <SectionHeader
                  compact
                  title="سازنده‌ها"
                  eyebrow="CREATORS"
                  action="همه استودیوها"
                  onAction={() => router.push('/studios')}
                />
              </View>

              {(data.latest_studios || []).length ? (
                <ScrollView
                  horizontal
                  style={styles.rtlScroll}
                  decelerationRate="fast"
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
              ) : loading ? (
                <SkeletonStudioRail />
              ) : (
                <EmptyRail loading={false} />
              )}
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

function HomeProductRail({
  title,
  eyebrow,
  items,
  onAll,
}: {
  title: string;
  eyebrow: string;
  items: HomeProduct[];
  onAll: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.headerPad}>
        <SectionHeader compact title={title} eyebrow={eyebrow} action="فروشگاه" onAction={onAll} />
      </View>
      <ScrollView
        horizontal
        style={styles.rtlScroll}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productRail}>
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            compact
            width={184}
            onPress={() => router.push({
              pathname: '/product/[slug]',
              params: { slug: product.slug },
            })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function HomeEntityCard({
  title,
  eyebrow,
  meta,
  imageUrl,
  onPress,
}: {
  title: string;
  eyebrow: string;
  meta?: string;
  imageUrl?: string | null;
  onPress?: () => void;
}) {
  return (
    <PressableScale style={styles.entityCard} onPress={onPress}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.entityFallback}>
          <View style={styles.entityFallbackRing}>
            <View style={styles.entityFallbackCore} />
          </View>
        </View>
      )}
      <View style={styles.entityShade} />
      <View style={styles.entityCopy}>
        <Text style={styles.entityKicker}>{eyebrow}</Text>
        <Text numberOfLines={2} style={styles.entityTitle}>{title}</Text>
        {meta ? <Text style={styles.entityMeta}>{meta}</Text> : null}
      </View>
    </PressableScale>
  );
}

function FreshCard({ item }: { item: HomeMixedItem }) {
  const onPress = () => {
    if (item.type === 'product') {
      router.push({ pathname: '/product/[slug]', params: { slug: item.slug } });
    } else {
      router.push({ pathname: '/content/[slug]', params: { slug: item.slug } });
    }
  };

  return (
    <HomeEntityCard
      title={item.title}
      eyebrow={item.eyebrow || (item.type === 'product' ? 'NEW PRODUCT' : 'NEW VIDEO')}
      meta={item.type === 'video'
        ? (item.views || 0).toLocaleString('fa-IR') + ' بازدید'
        : undefined}
      imageUrl={item.image_url}
      onPress={onPress}
    />
  );
}

function DynamicHomeSection({ section }: { section: HomeContentSection }) {
  const isProducts = section.content_type === 'products';
  const isContent = ['posts', 'videos', 'shorts'].includes(section.content_type);

  return (
    <View style={styles.section}>
      <View style={styles.headerPad}>
        <SectionHeader
          compact
          title={section.title}
          eyebrow={(section.subtitle || section.content_type).toUpperCase()}
          action="بیشتر"
        />
      </View>
      <ScrollView
        horizontal
        style={styles.rtlScroll}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isProducts ? styles.productRail : styles.entityRail}>
        {section.items.map((raw) => {
          if (isProducts) {
            const product = raw as HomeProduct;
            return (
              <ProductCard
                key={'p-' + product.id}
                product={product}
                compact
                width={184}
                onPress={() => router.push({
                  pathname: '/product/[slug]',
                  params: { slug: product.slug },
                })}
              />
            );
          }

          if (isContent) {
            const content = raw as ContentItem;
            return (
              <ContentCard
                key={'c-' + content.id}
                item={content}
                onPress={() => router.push({
                  pathname: '/content/[slug]',
                  params: { slug: content.slug },
                })}
              />
            );
          }

          const entity = raw as {
            id: number;
            title: string;
            slug?: string | null;
            eyebrow?: string | null;
            excerpt?: string | null;
            image_url?: string | null;
          };
          const onPress = entity.slug
            ? section.content_type === 'categories'
              ? () => router.push({ pathname: '/category/[slug]', params: { slug: entity.slug! } })
              : section.content_type === 'games'
                ? () => router.push({ pathname: '/channel/[slug]', params: { slug: entity.slug! } })
                : () => router.push('/store')
            : undefined;

          return (
            <HomeEntityCard
              key={'e-' + entity.id}
              title={entity.title}
              eyebrow={entity.eyebrow || section.content_type}
              meta={entity.excerpt || undefined}
              imageUrl={entity.image_url}
              onPress={onPress}
            />
          );
        })}
      </ScrollView>
    </View>
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
    marginBottom: spacing.xl,
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
  rtlScroll: {
    direction: 'rtl',
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  studioRow: {
    gap: spacing.md,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  productRail: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  entityRail: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  entityCard: {
    width: 198,
    height: 136,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  entityFallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(12,26,40,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityFallbackRing: {
    width: 64,
    height: 64,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityFallbackCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  entityShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(3,5,9,0.42)',
  },
  entityCopy: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(3,5,9,0.54)',
  },
  entityKicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  entityTitle: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: typeScale.body,
    textAlign: 'right',
    marginTop: 3,
  },
  entityMeta: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 3,
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
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  pulseTitle: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    lineHeight: 20,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: 6,
  },
  pulseMeta: {
    color: palette.textDim,
    fontFamily: fontFamily.regular,
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
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  emptyTitle: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    marginTop: 5,
  },
});
