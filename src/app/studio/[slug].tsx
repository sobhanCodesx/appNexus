import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { ExpandableText } from '@/components/ui/expandable-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

type StudioPayload = {
  studio: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string | null;
    background_url?: string | null;
    description?: string | null;
    website?: string | null;
    channels_count?: number;
    collections_count?: number;
  };
  channels: Paginated<{
    id: number;
    name: string;
    slug: string;
    cover_url?: string | null;
    background_url?: string | null;
    videos_count?: number;
    followers_count?: number;
  }>;
  collections: Paginated<{
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    cover_url?: string | null;
    channel_name?: string;
    videos_count?: number;
  }>;
  latest_videos?: ContentItem[];
};

const empty: StudioPayload = {
  studio: { id: 0, name: '', slug: '' },
  channels: { data: [] },
  collections: { data: [] },
  latest_videos: [],
};

export default function StudioScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const { data, loading } = useApiResource<StudioPayload>(
    '/studios/' + encodeURIComponent(slug || ''),
    empty,
  );

  const studio = data.studio;

  if (loading && !studio.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.loadingOrbit}><View style={styles.loadingCore} /></View>
          <Text style={styles.loadingKicker}>LOADING CREATOR</Text>
          <Text style={styles.muted}>داریم استودیو رو آماده می‌کنیم…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image
            source={
              studio.background_url
                ? { uri: studio.background_url }
                : require('../../../assets/images/logo-glow.png')
            }
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />

          <LinearGradient
            colors={['rgba(3,5,9,0.12)', 'rgba(3,5,9,0.16)', 'rgba(3,5,9,0.96)']}
            locations={[0, 0.50, 1]}
            style={StyleSheet.absoluteFill}
          />

          <PressableScale onPress={() => router.back()} style={styles.back}>
            <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.backText}>‹</Text>
          </PressableScale>

          <View style={styles.creatorBadge}>
            <View style={styles.creatorDot} />
            <Text style={styles.creatorBadgeText}>CREATOR PROFILE</Text>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.logoShell}>
              <View style={styles.logoHalo} />
              {studio.logo_url ? (
                <Image source={{ uri: studio.logo_url }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={styles.logoFallback}><View style={styles.logoFallbackCore} /></View>
              )}
            </View>

            <Text style={styles.kicker}>PLAYNEXUS STUDIO</Text>
            <Text style={styles.name}>{studio.name}</Text>
            <Text style={styles.meta}>
              {(studio.channels_count || 0).toLocaleString('fa-IR')} بازی
              {'  ·  '}
              {(studio.collections_count || 0).toLocaleString('fa-IR')} کالکشن
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metrics}>
            <Metric value={(studio.channels_count || 0).toLocaleString('fa-IR')} label="GAMES" />
            <Metric value={(studio.collections_count || 0).toLocaleString('fa-IR')} label="COLLECTIONS" />
            <Metric value={(data.channels.total || data.channels.data.length).toLocaleString('fa-IR')} label="ACTIVE" />
          </View>

          {studio.description ? (
            <View style={styles.about}>
              <View style={styles.aboutSignal} />
              <View style={styles.aboutCopy}>
                <Text style={styles.aboutKicker}>ABOUT THE CREATOR</Text>
                <ExpandableText
                  text={studio.description}
                  collapsedLines={5}
                  threshold={260}
                  style={styles.description}
                  accent={palette.violet}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="بازی‌ها و کانال‌ها" eyebrow="GAME UNIVERSE" action="ورود به دنیاها" />
            <View style={styles.grid}>
              {(data.channels.data || []).map((channel, index) => (
                <PressableScale
                  key={channel.id}
                  pressedScale={0.985}
                  style={[styles.channelCard, index % 3 === 0 && styles.channelCardTall]}
                  onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: channel.slug } })}>
                  <Image
                    source={
                      channel.background_url || channel.cover_url
                        ? { uri: String(channel.background_url || channel.cover_url) }
                        : require('../../../assets/images/logo-glow.png')
                    }
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.12)', 'rgba(3,5,9,0.94)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.channelIndex}>
                    <Text style={styles.channelIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>

                  <View style={styles.channelCopy}>
                    <Text style={styles.channelKicker}>GAME CHANNEL</Text>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelMeta}>
                      {(channel.followers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده
                      {'  ·  '}
                      {(channel.videos_count || 0).toLocaleString('fa-IR')} ویدیو
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>

          {(data.collections.data || []).length ? (
            <View style={styles.section}>
              <SectionHeader title="کالکشن‌ها" eyebrow="CURATED BY STUDIO" action="همه" />
              <View style={styles.collectionList}>
                {data.collections.data.map((collection, index) => (
                  <PressableScale
                    key={collection.id}
                    style={styles.collection}
                    onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: collection.slug } })}>
                    <View style={styles.collectionIndex}>
                      <Text style={styles.collectionIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>

                    <View style={styles.collectionCopy}>
                      <Text style={styles.collectionKicker}>{collection.channel_name || 'COLLECTION'}</Text>
                      <Text style={styles.collectionTitle}>{collection.title}</Text>
                      <Text style={styles.collectionMeta}>
                        {(collection.videos_count || 0).toLocaleString('fa-IR')} ویدیو
                      </Text>
                    </View>

                    {collection.cover_url ? (
                      <Image source={{ uri: collection.cover_url }} style={styles.collectionImage} contentFit="cover" />
                    ) : (
                      <View style={styles.collectionFallback}><View style={styles.collectionFallbackCore} /></View>
                    )}
                  </PressableScale>
                ))}
              </View>
            </View>
          ) : null}

          {(data.latest_videos || []).length ? (
            <View style={styles.section}>
              <SectionHeader title="۵ ویدیوی آخر" eyebrow="LATEST FROM STUDIO" action="WATCH" />
              <View style={styles.videoList}>
                {(data.latest_videos || []).slice(0, 5).map((video, index) => (
                  <View key={video.id} style={styles.videoRow}>
                    <View style={styles.videoIndex}>
                      <Text style={styles.videoIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                      <View style={styles.videoIndexLine} />
                    </View>
                    <View style={styles.videoCard}>
                      <ContentCard
                        item={video}
                        width="100%"
                        onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: video.slug } })}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 94 },
  hero: { minHeight: 510, justifyContent: 'flex-end', backgroundColor: palette.surface },
  back: {
    position: 'absolute', top: 54, left: layout.screenPadding, width: 48, height: 48,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(3,5,9,0.54)', alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  backText: { color: palette.white, fontSize: 27, fontWeight: fontWeight.bold },
  creatorBadge: {
    position: 'absolute', top: 64, right: layout.screenPadding, height: 30, paddingHorizontal: 10,
    borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.52)', borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.18)', flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  creatorDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.violet },
  creatorBadgeText: { color: palette.textMuted, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.9 },
  heroCopy: { padding: layout.screenPadding, paddingBottom: spacing.xxl, alignItems: 'flex-end' },
  logoShell: {
    width: 92, height: 92, borderRadius: 29, padding: 2, borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.28)', backgroundColor: 'rgba(3,5,9,0.58)', ...shadow.soft,
  },
  logoHalo: { position: 'absolute', inset: -10, borderRadius: 39, backgroundColor: 'rgba(167,123,255,0.055)' },
  logo: { flex: 1, borderRadius: 26 },
  logoFallback: { flex: 1, borderRadius: 26, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  logoFallbackCore: { width: 24, height: 24, borderRadius: 8, backgroundColor: palette.violet, transform: [{ rotate: '45deg' }] },
  kicker: { color: palette.violet, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1.1, marginTop: spacing.md },
  name: {
    color: palette.white, fontSize: 40, lineHeight: 48, fontWeight: fontWeight.black,
    textAlign: 'right', letterSpacing: -0.9, marginTop: 4,
  },
  meta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 7 },
  body: { paddingHorizontal: layout.screenPadding },
  metrics: {
    minHeight: 84, marginTop: -10, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(10,16,26,0.88)', flexDirection: 'row-reverse', padding: spacing.xs, ...shadow.soft,
  },
  metric: { flex: 1, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  metricLabel: { color: palette.textDim, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.8, marginTop: 2 },
  about: { marginTop: spacing.xxxl, flexDirection: 'row-reverse', gap: spacing.md },
  aboutSignal: { width: 3, borderRadius: 3, backgroundColor: 'rgba(167,123,255,0.30)' },
  aboutCopy: { flex: 1, alignItems: 'flex-end' },
  aboutKicker: { color: palette.violet, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1, marginBottom: spacing.xs },
  description: { color: '#D8DEE8', fontSize: typeScale.body, lineHeight: 29, textAlign: 'right' },
  section: { marginTop: spacing.massive },
  grid: { gap: spacing.md, paddingTop: spacing.md },
  channelCard: {
    height: 206, borderRadius: radii.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', ...shadow.soft,
  },
  channelCardTall: { height: 252 },
  channelIndex: {
    position: 'absolute', top: spacing.sm, left: spacing.sm, width: 32, height: 28,
    borderRadius: 10, backgroundColor: 'rgba(3,5,9,0.58)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  channelIndexText: { color: palette.textMuted, fontSize: 8, fontWeight: fontWeight.black },
  channelCopy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  channelKicker: { color: palette.violet, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  channelName: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, marginTop: 4 },
  channelMeta: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 4, textAlign: 'right' },
  collectionList: { gap: spacing.sm, paddingTop: spacing.md },
  collection: {
    minHeight: 96, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.028)', flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm, gap: spacing.md,
  },
  collectionIndex: {
    width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(167,123,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(167,123,255,0.14)', alignItems: 'center', justifyContent: 'center',
  },
  collectionIndexText: { color: palette.violet, fontSize: 8, fontWeight: fontWeight.black },
  collectionCopy: { flex: 1, alignItems: 'flex-end' },
  collectionKicker: { color: palette.violet, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.8 },
  collectionTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 3 },
  collectionMeta: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 4 },
  collectionImage: { width: 76, height: 72, borderRadius: 17 },
  collectionFallback: { width: 76, height: 72, borderRadius: 17, backgroundColor: 'rgba(167,123,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  collectionFallbackCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.violet, transform: [{ rotate: '45deg' }] },
  videoList: { gap: spacing.md, paddingTop: spacing.md },
  videoRow: { flexDirection: 'row', gap: spacing.sm },
  videoIndex: { width: 30, paddingTop: spacing.sm, alignItems: 'center' },
  videoIndexText: { color: palette.violet, fontSize: 9, fontWeight: fontWeight.black },
  videoIndexLine: { width: 1, flex: 1, minHeight: 45, backgroundColor: 'rgba(167,123,255,0.12)', marginTop: spacing.xs },
  videoCard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOrbit: { width: 78, height: 78, borderRadius: 78, borderWidth: 1, borderColor: 'rgba(167,123,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  loadingCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.violet, transform: [{ rotate: '45deg' }] },
  loadingKicker: { color: palette.violet, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1, marginTop: spacing.lg },
  muted: { color: palette.textMuted, marginTop: spacing.xs },
});
