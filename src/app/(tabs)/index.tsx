import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { HeroSpotlight } from '@/components/cards/hero-spotlight';
import { RadarCard } from '@/components/cards/radar-card';
import { StudioCard } from '@/components/cards/studio-card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { HomePayload } from '@/types/api';

type Section = 'hero' | 'quick' | 'feed' | 'radar' | 'studios' | 'status';

const initial: HomePayload = {
  slides: [],
  latest_feed: [],
  game_radar: [],
  latest_studios: [],
  personalized_home: null,
};

export default function HomeScreen() {
  const { data, loading, refreshing, error, refresh } = useApiResource<HomePayload>('/home', initial);
  const sections: Section[] = ['hero', 'quick', 'feed', 'radar', 'studios', 'status'];
  const feed = data.personalized_home?.feed?.length ? data.personalized_home.feed : data.latest_feed || [];
  const radar = data.personalized_home?.radar?.length ? data.personalized_home.radar : data.game_radar || [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <PageHeader
        title="PlayNexus"
        subtitle={data.personalized_home?.intelligence?.confidence?.label || 'مرکز گیم شخصی تو'}
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={sections}
        renderItem={({ item }) => {
          if (item === 'hero') {
            return <View style={styles.section}><HeroSpotlight slide={data.slides?.[0]} /></View>;
          }

          if (item === 'quick') {
            return (
              <View style={styles.section}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
                  <Chip label="رادار انتشار" onPress={() => router.push('/(tabs)/radar')} />
                  <Chip label="ویدیوهای تازه" onPress={() => router.push('/(tabs)/videos')} />
                  <Chip label="Explore" onPress={() => router.push('/(tabs)/explore')} />
                  <Chip label="فروشگاه" onPress={() => router.push('/store')} />
                  <Chip label="پیشنهادهای ویژه" onPress={() => router.push('/store?mode=offers')} />
                </ScrollView>
              </View>
            );
          }

          if (item === 'feed') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}><SectionHeader title="برای تو" eyebrow="SMART FEED" action="تازه‌ها" /></View>
                {feed.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                    {feed.slice(0, 8).map((content) => (
                      <ContentCard
                        key={content.id}
                        item={content}
                        onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: content.slug } })}
                      />
                    ))}
                  </ScrollView>
                ) : <EmptyRail loading={loading} />}
              </View>
            );
          }

          if (item === 'radar') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}><SectionHeader title="Game Radar" eyebrow="WHAT'S NEXT" action="همه" /></View>
                {radar.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                    {radar.slice(0, 8).map((game) => <RadarCard key={String(game.id)} item={game} />)}
                  </ScrollView>
                ) : <EmptyRail loading={loading} />}
              </View>
            );
          }

          if (item === 'studios') {
            return (
              <View style={styles.section}>
                <View style={styles.headerPad}><SectionHeader title="استودیوها" eyebrow="CREATORS" /></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studioRow}>
                  {(data.latest_studios || []).map((studio) => (
                    <StudioCard
                      key={studio.id}
                      item={studio}
                      onPress={() => router.push({ pathname: '/studio/[slug]', params: { slug: studio.slug } })}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          }

          return (
            <View style={[styles.section, styles.statusPanel]}>
              <Text style={styles.statusTitle}>{error ? 'API هنوز روی سرور deploy نشده' : 'Native Core Online'}</Text>
              <Text style={styles.statusText}>
                {error || 'این صفحه مستقیم از API موبایل PlayNexus داده می‌گیرد؛ بدون WebView و بدون UI وب.'}
              </Text>
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

function EmptyRail({ loading }: { loading: boolean }) {
  return (
    <View style={styles.emptyRail}>
      <View style={styles.emptyGlow} />
      <Text style={styles.emptyTitle}>{loading ? 'در حال همگام‌سازی…' : 'هنوز چیزی برای نمایش نیست'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 128 },
  section: { marginBottom: spacing.xxl },
  headerPad: { paddingHorizontal: layout.screenPadding },
  quickRow: { gap: spacing.sm, paddingHorizontal: layout.screenPadding },
  horizontalRow: { gap: spacing.md, paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  studioRow: { gap: spacing.md, paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  emptyRail: {
    height: 142,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 120,
    backgroundColor: 'rgba(77,163,255,0.08)',
  },
  emptyTitle: { color: palette.textMuted, fontSize: typeScale.bodySm, fontWeight: fontWeight.semibold },
  statusPanel: {
    marginHorizontal: layout.screenPadding,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(77,163,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.18)',
    alignItems: 'flex-end',
  },
  statusTitle: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  statusText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
