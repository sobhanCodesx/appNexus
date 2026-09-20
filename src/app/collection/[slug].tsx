import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem } from '@/types/api';

type CollectionPayload = {
  channel?: {
    id: number;
    name: string;
    slug: string;
    cover_url?: string | null;
  } | null;
  studio?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
  playlist: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string | null;
    description?: string | null;
    videos_count?: number;
    videos?: ContentItem[];
  };
};

const empty: CollectionPayload = {
  channel: null,
  studio: null,
  playlist: { id: 0, title: '', slug: '', videos: [] },
};

export default function CollectionScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const { data, loading } = useApiResource<CollectionPayload>(
    '/collections/' + encodeURIComponent(slug || ''),
    empty,
  );
  const playlist = data.playlist;

  if (loading && !playlist.id) {
    return <Screen><View style={styles.center}><Text style={styles.muted}>در حال بارگذاری کالکشن…</Text></View></Screen>;
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>COLLECTION</Text>
            <Text style={styles.title}>{playlist.title}</Text>
            <Text style={styles.meta}>{playlist.videos_count || playlist.videos?.length || 0} ویدیو</Text>
          </View>
        </View>

        {playlist.cover_url ? (
          <Image source={{ uri: playlist.cover_url }} style={styles.cover} contentFit="cover" />
        ) : null}

        {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}

        {data.channel ? (
          <PressableScale
            style={styles.owner}
            onPress={() => router.push({ pathname: '/channel/[slug]', params: { slug: data.channel!.slug } })}>
            <View style={styles.ownerCopy}>
              <Text style={styles.ownerLabel}>CHANNEL</Text>
              <Text style={styles.ownerName}>{data.channel.name}</Text>
            </View>
            {data.channel.cover_url ? <Image source={{ uri: data.channel.cover_url }} style={styles.ownerImage} /> : null}
          </PressableScale>
        ) : data.studio ? (
          <PressableScale
            style={styles.owner}
            onPress={() => router.push({ pathname: '/studio/[slug]', params: { slug: data.studio!.slug } })}>
            <View style={styles.ownerCopy}>
              <Text style={styles.ownerLabel}>STUDIO</Text>
              <Text style={styles.ownerName}>{data.studio.name}</Text>
            </View>
            {data.studio.logo_url ? <Image source={{ uri: data.studio.logo_url }} style={styles.ownerImage} /> : null}
          </PressableScale>
        ) : null}

        <View style={styles.list}>
          {(playlist.videos || []).map((video) => (
            <ContentCard
              key={video.id}
              item={video}
              width="100%"
              onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: video.slug } })}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.lg, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  back: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 10, fontWeight: fontWeight.black, letterSpacing: 1.2 },
  title: { color: palette.white, fontSize: 31, lineHeight: 39, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.xs },
  meta: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 5 },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.xl, marginTop: spacing.xl, backgroundColor: palette.surface },
  description: { color: '#D4DBE6', fontSize: typeScale.body, lineHeight: 28, textAlign: 'right', marginTop: spacing.lg },
  owner: {
    minHeight: 72,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  ownerCopy: { flex: 1, alignItems: 'flex-end' },
  ownerLabel: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  ownerName: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold, marginTop: 3 },
  ownerImage: { width: 48, height: 48, borderRadius: 15, backgroundColor: palette.surface },
  list: { gap: spacing.md, marginTop: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: palette.textMuted },
});
