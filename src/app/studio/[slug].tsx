import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

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
};

const empty: StudioPayload = {
  studio: { id: 0, name: '', slug: '' },
  channels: { data: [] },
  collections: { data: [] },
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
    return <Screen><View style={styles.center}><Text style={styles.muted}>در حال باز کردن استودیو…</Text></View></Screen>;
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image
            source={studio.background_url
              ? { uri: studio.background_url }
              : require('../../../assets/images/logo-glow.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient colors={['rgba(5,7,11,0.15)', 'rgba(5,7,11,0.62)', palette.ink]} style={StyleSheet.absoluteFill} />
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </PressableScale>

          <View style={styles.heroCopy}>
            {studio.logo_url ? <Image source={{ uri: studio.logo_url }} style={styles.logo} contentFit="cover" /> : null}
            <Text style={styles.name}>{studio.name}</Text>
            <Text style={styles.meta}>
              {studio.channels_count || 0} کانال · {studio.collections_count || 0} کالکشن
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {studio.description ? <Text style={styles.description}>{studio.description}</Text> : null}

          <View style={styles.section}>
            <SectionHeader title="بازی‌ها و کانال‌ها" eyebrow="GAMES" />
            <View style={styles.grid}>
              {(data.channels.data || []).map((channel) => (
                <PressableScale
                  key={channel.id}
                  style={styles.channelCard}
                  onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: channel.slug } })}>
                  <Image
                    source={channel.background_url || channel.cover_url
                      ? { uri: String(channel.background_url || channel.cover_url) }
                      : require('../../../assets/images/logo-glow.png')}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(5,7,11,0.92)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.channelCopy}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelMeta}>{channel.followers_count || 0} دنبال‌کننده</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>

          {(data.collections.data || []).length ? (
            <View style={styles.section}>
              <SectionHeader title="کالکشن‌ها" eyebrow="COLLECTIONS" />
              <View style={styles.collectionList}>
                {data.collections.data.map((collection) => (
                  <PressableScale
                    key={collection.id}
                    style={styles.collection}
                    onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: collection.slug } })}>
                    <View style={styles.collectionCopy}>
                      <Text style={styles.collectionTitle}>{collection.title}</Text>
                      <Text style={styles.collectionMeta}>{collection.videos_count || 0} ویدیو</Text>
                    </View>
                    {collection.cover_url ? (
                      <Image source={{ uri: collection.cover_url }} style={styles.collectionImage} contentFit="cover" />
                    ) : null}
                  </PressableScale>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 80 },
  hero: { minHeight: 440, justifyContent: 'flex-end', backgroundColor: palette.surface },
  back: {
    position: 'absolute',
    top: 54,
    left: layout.screenPadding,
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: 'rgba(5,7,11,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  heroCopy: { padding: layout.screenPadding, alignItems: 'flex-end' },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: palette.surface },
  name: { color: palette.white, fontSize: 36, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.md },
  meta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 5 },
  body: { paddingHorizontal: layout.screenPadding },
  description: { color: '#D4DBE6', fontSize: typeScale.body, lineHeight: 29, textAlign: 'right', marginTop: spacing.xl },
  section: { marginTop: spacing.xxxl },
  grid: { gap: spacing.md, paddingTop: spacing.md },
  channelCard: {
    height: 190,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
  },
  channelCopy: { marginTop: 'auto', padding: spacing.lg, alignItems: 'flex-end' },
  channelName: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  channelMeta: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 4 },
  collectionList: { gap: spacing.sm, paddingTop: spacing.md },
  collection: {
    minHeight: 88,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.md,
  },
  collectionCopy: { flex: 1, alignItems: 'flex-end' },
  collectionTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.bold, textAlign: 'right' },
  collectionMeta: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 4 },
  collectionImage: { width: 74, height: 64, borderRadius: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: palette.textMuted },
});
