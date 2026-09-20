import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { ExpandableText } from '@/components/ui/expandable-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

type ChannelPayload = {
  channel: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    cover_url?: string | null;
    background_url?: string | null;
    platforms?: string[];
    subscribers_count?: number;
    videos_count?: number;
    is_subscribed?: boolean;
    studio?: { id?: number; name: string; slug: string; logo_url?: string | null } | null;
  };
  videos: Paginated<ContentItem>;
  playlists: { id: number; title: string; slug: string; cover_url?: string | null; videos_count?: number }[];
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
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.loadingRing}><View style={styles.loadingCore} /></View>
          <Text style={styles.loadingKicker}>LOADING GAME HUB</Text>
          <Text style={styles.muted}>داریم کانال بازی رو آماده می‌کنیم…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !channel.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorKicker}>GAME SIGNAL LOST</Text>
          <Text style={styles.errorTitle}>کانال پیدا نشد</Text>
          <Text style={styles.muted}>{error}</Text>
        </View>
      </Screen>
    );
  }

  const videoCountLabel = (data.videos.data || []).length.toLocaleString('fa-IR') + ' ویدیو';

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
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
            colors={['rgba(3,5,9,0.10)', 'rgba(3,5,9,0.08)', 'rgba(3,5,9,0.95)']}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(3,5,9,0.78)', 'rgba(3,5,9,0.00)']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0.25, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <PressableScale onPress={() => router.back()} style={styles.back}>
            <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.backText}>‹</Text>
          </PressableScale>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>GAME CHANNEL ONLINE</Text>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.avatarFrame}>
              <Image
                source={channel.cover_url ? { uri: channel.cover_url } : require('../../../assets/images/logo.png')}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>

            <Text style={styles.gameKicker}>PLAYNEXUS GAME HUB</Text>
            <Text style={styles.name}>{channel.name}</Text>
            <Text style={styles.meta}>
              {(channel.subscribers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده
              {'  ·  '}
              {(channel.videos_count || 0).toLocaleString('fa-IR')} ویدیو
            </Text>

            <View style={styles.platforms}>
              {(channel.platforms || []).slice(0, 4).map((platform) => (
                <View key={platform} style={styles.platform}>
                  <Text style={styles.platformText}>{platform}</Text>
                </View>
              ))}
            </View>

            <View style={styles.heroActions}>
              <PressableScale
                onPress={() => void toggleFollow()}
                style={[styles.follow, isSubscribed && styles.followActive]}>
                <Text style={[styles.followText, isSubscribed && styles.followTextActive]}>
                  {isSubscribed ? '✓ دنبال می‌کنی' : '+ دنبال کن'}
                </Text>
              </PressableScale>

              <View style={styles.storeSignals}>
                {data.store_info?.psn?.available ? <StoreSignal label="PS STORE" color={palette.blue} /> : null}
                {data.store_info?.xbox?.available ? <StoreSignal label="XBOX" color={palette.success} /> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metrics}>
            <Metric value={(channel.videos_count || 0).toLocaleString('fa-IR')} label="VIDEO" />
            <Metric value={data.playlists.length.toLocaleString('fa-IR')} label="COLLECTION" />
            <Metric value={(channel.platforms?.length || 0).toLocaleString('fa-IR')} label="PLATFORM" />
          </View>

          {channel.description ? (
            <View style={styles.about}>
              <View style={styles.aboutSignal} />
              <View style={styles.aboutCopy}>
                <Text style={styles.aboutKicker}>ABOUT THIS GAME</Text>
                <ExpandableText
                  text={channel.description}
                  collapsedLines={5}
                  threshold={260}
                  style={styles.description}
                  accent={palette.cyan}
                />
              </View>
            </View>
          ) : null}

          {channel.studio ? (
            <PressableScale
              style={styles.studio}
              onPress={() => router.push({ pathname: '/studio/[slug]', params: { slug: channel.studio!.slug } })}>
              <View style={styles.studioArrow}><View style={styles.studioArrowIcon} /></View>
              <View style={styles.studioCopy}>
                <Text style={styles.studioLabel}>CREATED BY</Text>
                <Text style={styles.studioName}>{channel.studio.name}</Text>
              </View>
              {channel.studio.logo_url ? (
                <Image source={{ uri: channel.studio.logo_url }} style={styles.studioLogo} contentFit="cover" />
              ) : null}
            </PressableScale>
          ) : null}

          {data.playlists.length ? (
            <View style={styles.section}>
              <SectionHeader title="کالکشن‌ها" eyebrow="PLAYLISTS" action="ادامه بده" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {data.playlists.map((playlist, index) => (
                  <PressableScale
                    key={playlist.id}
                    style={styles.playlist}
                    onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: playlist.slug } })}>
                    <Image
                      source={playlist.cover_url ? { uri: playlist.cover_url } : require('../../../assets/images/logo-glow.png')}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(3,5,9,0.00)', 'rgba(3,5,9,0.16)', 'rgba(3,5,9,0.94)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.playlistIndex}>
                      <Text style={styles.playlistIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.playlistCopy}>
                      <Text style={styles.playlistKicker}>COLLECTION</Text>
                      <Text numberOfLines={2} style={styles.playlistTitle}>{playlist.title}</Text>
                      <Text style={styles.playlistMeta}>{(playlist.videos_count || 0).toLocaleString('fa-IR')} ویدیو</Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="۵ ویدیوی آخر" eyebrow="LATEST WATCH" action={videoCountLabel} />
            <View style={styles.videoList}>
              {(data.videos.data || []).slice(0, 5).map((video, index) => (
                <View key={video.id} style={styles.videoRow}>
                  <View style={styles.videoIndex}>
                    <Text style={styles.videoIndexText}>{String(index + 1).padStart(2, '0')}</Text>
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

function StoreSignal({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.storeSignal, { borderColor: color + '44' }]}>
      <View style={[styles.storeSignalDot, { backgroundColor: color }]} />
      <Text style={[styles.storeSignalText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 94 },
  hero: { minHeight: 580, justifyContent: 'flex-end', backgroundColor: palette.surface },
  back: {
    position: 'absolute', top: 54, left: layout.screenPadding, width: 48, height: 48,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(3,5,9,0.54)', alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  backText: { color: palette.white, fontSize: 27, fontWeight: fontWeight.bold },
  liveBadge: {
    position: 'absolute', top: 64, right: layout.screenPadding, height: 30, paddingHorizontal: 10,
    borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.52)', borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)', flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  liveDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.success },
  liveText: { color: palette.textMuted, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.9 },
  heroCopy: { padding: layout.screenPadding, paddingBottom: spacing.xxl, alignItems: 'flex-end' },
  avatarFrame: {
    width: 88, height: 88, borderRadius: 28, padding: 2, borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.26)', backgroundColor: 'rgba(3,5,9,0.58)', ...shadow.glow,
  },
  avatar: { flex: 1, borderRadius: 25 },
  gameKicker: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1.1, marginTop: spacing.md },
  name: {
    color: palette.white, fontSize: 40, lineHeight: 48, fontWeight: fontWeight.black,
    textAlign: 'right', letterSpacing: -0.9, marginTop: 4,
  },
  meta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 7 },
  platforms: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  platform: {
    borderRadius: radii.pill, paddingHorizontal: 9, height: 28, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(3,5,9,0.46)',
    alignItems: 'center', justifyContent: 'center',
  },
  platformText: { color: palette.text, fontSize: 9, fontWeight: fontWeight.bold },
  heroActions: {
    width: '100%', marginTop: spacing.lg, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  follow: {
    minWidth: 138, height: 46, paddingHorizontal: spacing.lg, borderRadius: radii.pill,
    backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center',
  },
  followActive: { backgroundColor: 'rgba(88,244,255,0.10)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.28)' },
  followText: { color: palette.ink, fontWeight: fontWeight.black },
  followTextActive: { color: palette.cyan },
  storeSignals: { flexDirection: 'row', gap: 6 },
  storeSignal: {
    height: 32, borderRadius: radii.pill, borderWidth: 1, backgroundColor: 'rgba(3,5,9,0.46)',
    paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  storeSignalDot: { width: 5, height: 5, borderRadius: 5 },
  storeSignalText: { fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.7 },
  body: { paddingHorizontal: layout.screenPadding },
  metrics: {
    minHeight: 84, marginTop: -10, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(10,16,26,0.88)', flexDirection: 'row-reverse', padding: spacing.xs, ...shadow.soft,
  },
  metric: { flex: 1, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  metricLabel: { color: palette.textDim, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.8, marginTop: 2 },
  about: { marginTop: spacing.xxxl, flexDirection: 'row-reverse', gap: spacing.md },
  aboutSignal: { width: 3, borderRadius: 3, backgroundColor: 'rgba(88,244,255,0.30)' },
  aboutCopy: { flex: 1, alignItems: 'flex-end' },
  aboutKicker: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1, marginBottom: spacing.xs },
  description: { color: '#D8DEE8', fontSize: typeScale.body, lineHeight: 29, textAlign: 'right' },
  studio: {
    minHeight: 88, marginTop: spacing.xl, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.028)', flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm, gap: spacing.md,
  },
  studioArrow: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(88,244,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  studioArrowIcon: {
    width: 7, height: 7, borderLeftWidth: 1.3, borderBottomWidth: 1.3,
    borderColor: palette.cyan, transform: [{ rotate: '45deg' }],
  },
  studioCopy: { alignItems: 'flex-end', flex: 1 },
  studioLabel: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  studioName: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black, marginTop: 3 },
  studioLogo: { width: 58, height: 58, borderRadius: 19 },
  section: { marginTop: spacing.massive },
  rail: { gap: spacing.md, paddingTop: spacing.md, paddingRight: 1 },
  playlist: {
    width: 242, height: 178, borderRadius: radii.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', ...shadow.soft,
  },
  playlistIndex: {
    position: 'absolute', top: spacing.sm, left: spacing.sm, width: 32, height: 28, borderRadius: 10,
    backgroundColor: 'rgba(3,5,9,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  playlistIndexText: { color: palette.textMuted, fontSize: 8, fontWeight: fontWeight.black },
  playlistCopy: { marginTop: 'auto', padding: spacing.md, alignItems: 'flex-end' },
  playlistKicker: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.9 },
  playlistTitle: {
    color: palette.white, fontSize: typeScale.body, lineHeight: 23, fontWeight: fontWeight.black,
    textAlign: 'right', marginTop: 4,
  },
  playlistMeta: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 4 },
  videoList: { gap: spacing.md, paddingTop: spacing.md },
  videoRow: { flexDirection: 'row', gap: spacing.sm },
  videoIndex: { width: 30, paddingTop: spacing.sm, alignItems: 'center' },
  videoIndexText: { color: palette.textDim, fontSize: 9, fontWeight: fontWeight.black },
  videoCard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingRing: {
    width: 78, height: 78, borderRadius: 78, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingCore: { width: 12, height: 12, borderRadius: 12, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  loadingKicker: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1, marginTop: spacing.lg },
  muted: { color: palette.textMuted, fontSize: typeScale.bodySm, textAlign: 'center', marginTop: spacing.xs },
  errorKicker: { color: palette.danger, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  errorTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, marginTop: 4 },
});
