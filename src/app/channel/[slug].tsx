import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

type ChannelPayload = {
  channel: {
    id: number;
    name: string;
    slug: string;
    developer?: string | null;
    publisher?: string | null;
    description?: string | null;
    cover_url?: string | null;
    background_url?: string | null;
    platforms?: string[];
    subscribers_count?: number;
    videos_count?: number;
    is_subscribed?: boolean;
    studio?: {
      id?: number;
      name: string;
      slug: string;
      logo_url?: string | null;
    } | null;
  };
  videos: Paginated<ContentItem>;
  playlists: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string | null;
    videos_count?: number;
  }[];
  feed?: ContentItem[] | Paginated<ContentItem>;
  store_info?: {
    psn?: { available?: boolean; url?: string | null };
    xbox?: { available?: boolean; url?: string | null };
  } | null;
};

const empty: ChannelPayload = {
  channel: { id: 0, name: '', slug: '' },
  videos: { data: [] },
  playlists: [],
};

export default function ChannelScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const { data, loading, error } = useApiResource<ChannelPayload>(
    '/channels/' + encodeURIComponent(slug || ''),
    empty,
  );
  const channel = data.channel;
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const isSubscribed = subscribed ?? Boolean(channel.is_subscribed);

  const toggleFollow = async () => {
    try {
      const result = await apiRequest<{ subscribed: boolean; subscribers_count: number }>(
        '/channels/' + encodeURIComponent(channel.slug) + '/subscription',
        { method: 'POST' },
      );
      setSubscribed(result.subscribed);
      void Haptics.selectionAsync();
    } catch {
      router.push('/auth/login');
    }
  };

  if (loading && !channel.id) {
    return <Screen><View style={styles.center}><Text style={styles.muted}>در حال باز کردن کانال…</Text></View></Screen>;
  }

  if (error && !channel.id) {
    return <Screen><View style={styles.center}><Text style={styles.titleSmall}>کانال پیدا نشد</Text><Text style={styles.muted}>{error}</Text></View></Screen>;
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image
            source={channel.background_url || channel.cover_url
              ? { uri: String(channel.background_url || channel.cover_url) }
              : require('../../../assets/images/logo-glow.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient colors={['rgba(5,7,11,0.10)', 'rgba(5,7,11,0.54)', palette.ink]} style={StyleSheet.absoluteFill} />
          <PressableScale onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </PressableScale>

          <View style={styles.heroCopy}>
            <View style={styles.avatarFrame}>
              <Image
                source={channel.cover_url ? { uri: channel.cover_url } : require('../../../assets/images/logo.png')}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <Text style={styles.name}>{channel.name}</Text>
            <Text style={styles.meta}>
              {(channel.subscribers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده
              {'  ·  '}
              {(channel.videos_count || 0).toLocaleString('fa-IR')} ویدیو
            </Text>
            <View style={styles.platforms}>
              {(channel.platforms || []).slice(0, 4).map((platform) => (
                <View key={platform} style={styles.platform}><Text style={styles.platformText}>{platform}</Text></View>
              ))}
            </View>
            <PressableScale
              onPress={() => void toggleFollow()}
              style={[styles.follow, isSubscribed && styles.followActive]}>
              <Text style={[styles.followText, isSubscribed && styles.followTextActive]}>
                {isSubscribed ? 'دنبال می‌کنی' : 'دنبال کن'}
              </Text>
            </PressableScale>
          </View>
        </View>

        <View style={styles.body}>
          {channel.description ? <Text style={styles.description}>{channel.description}</Text> : null}

          {channel.studio ? (
            <PressableScale
              style={styles.studio}
              onPress={() => router.push({ pathname: '/studio/[slug]', params: { slug: channel.studio!.slug } })}>
              <View style={styles.studioCopy}>
                <Text style={styles.studioLabel}>STUDIO</Text>
                <Text style={styles.studioName}>{channel.studio.name}</Text>
              </View>
              {channel.studio.logo_url ? (
                <Image source={{ uri: channel.studio.logo_url }} style={styles.studioLogo} contentFit="cover" />
              ) : null}
            </PressableScale>
          ) : null}

          {data.playlists.length ? (
            <View style={styles.section}>
              <SectionHeader title="کالکشن‌ها" eyebrow="PLAYLISTS" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {data.playlists.map((playlist) => (
                  <PressableScale
                    key={playlist.id}
                    style={styles.playlist}
                    onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: playlist.slug } })}>
                    <Image
                      source={playlist.cover_url ? { uri: playlist.cover_url } : require('../../../assets/images/logo-glow.png')}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <LinearGradient colors={['transparent', 'rgba(5,7,11,0.92)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.playlistCopy}>
                      <Text numberOfLines={2} style={styles.playlistTitle}>{playlist.title}</Text>
                      <Text style={styles.playlistMeta}>{playlist.videos_count || 0} ویدیو</Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="ویدیوهای کانال" eyebrow="LATEST" />
            <View style={styles.videoList}>
              {(data.videos.data || []).map((video) => (
                <ContentCard
                  key={video.id}
                  item={video}
                  width="100%"
                  onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: video.slug } })}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 80 },
  hero: { minHeight: 500, justifyContent: 'flex-end', backgroundColor: palette.surface },
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
  avatarFrame: {
    width: 80,
    height: 80,
    borderRadius: 24,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.40)',
    backgroundColor: 'rgba(5,7,11,0.65)',
  },
  avatar: { flex: 1, borderRadius: 21 },
  name: {
    color: palette.white,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  meta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 6 },
  platforms: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  platform: {
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: 'rgba(5,7,11,0.55)',
  },
  platformText: { color: palette.text, fontSize: 10, fontWeight: fontWeight.bold },
  follow: {
    marginTop: spacing.lg,
    minWidth: 126,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
  },
  followActive: {
    backgroundColor: 'rgba(77,163,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.40)',
  },
  followText: { color: palette.ink, fontWeight: fontWeight.black },
  followTextActive: { color: palette.cyan },
  body: { paddingHorizontal: layout.screenPadding },
  description: {
    color: '#D4DBE6',
    fontSize: typeScale.body,
    lineHeight: 28,
    textAlign: 'right',
    marginTop: spacing.xl,
  },
  studio: {
    minHeight: 76,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  studioCopy: { alignItems: 'flex-end', flex: 1 },
  studioLabel: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  studioName: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.bold, marginTop: 3 },
  studioLogo: { width: 48, height: 48, borderRadius: 15 },
  section: { marginTop: spacing.xxxl },
  rail: { gap: spacing.md, paddingTop: spacing.md, paddingRight: 1 },
  playlist: {
    width: 230,
    height: 150,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
  },
  playlistCopy: { marginTop: 'auto', padding: spacing.md, alignItems: 'flex-end' },
  playlistTitle: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black, textAlign: 'right' },
  playlistMeta: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 4 },
  videoList: { gap: spacing.md, paddingTop: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  muted: { color: palette.textMuted, fontSize: typeScale.bodySm, textAlign: 'center' },
  titleSmall: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, marginBottom: spacing.sm },
});
