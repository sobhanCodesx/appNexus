import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
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
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.loadingMark}><View style={styles.loadingCore} /></View>
          <Text style={styles.loadingKicker}>LOADING COLLECTION</Text>
          <Text style={styles.muted}>داریم کالکشن رو آماده می‌کنیم…</Text>
        </View>
      </Screen>
    );
  }

  const count = playlist.videos_count || playlist.videos?.length || 0;

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image
            source={
              playlist.cover_url
                ? { uri: playlist.cover_url }
                : require('../../../assets/images/logo-glow.png')
            }
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(3,5,9,0.12)', 'rgba(3,5,9,0.18)', 'rgba(3,5,9,0.96)']}
            locations={[0, 0.52, 1]}
            style={StyleSheet.absoluteFill}
          />

          <PressableScale onPress={() => router.back()} style={styles.back}>
            <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.backText}>‹</Text>
          </PressableScale>

          <View style={styles.collectionBadge}>
            <View style={styles.collectionDot} />
            <Text style={styles.collectionBadgeText}>CURATED COLLECTION</Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>PLAYNEXUS COLLECTION</Text>
            <Text style={styles.title}>{playlist.title}</Text>
            <Text style={styles.meta}>{count.toLocaleString('fa-IR')} ویدیو</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryVisual}>
              <View style={styles.stackCardBack} />
              <View style={styles.stackCardMid} />
              <View style={styles.stackCardFront}>
                <Text style={styles.stackCount}>{count.toLocaleString('fa-IR')}</Text>
                <Text style={styles.stackLabel}>ITEMS</Text>
              </View>
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryKicker}>CURATED PLAYLIST</Text>
              <Text style={styles.summaryTitle}>یک مسیر آماده برای تماشا</Text>
              <Text style={styles.summaryText}>
                این کالکشن محتوای مرتبط رو کنار هم گذاشته تا بدون گشتن، مستقیم ادامه بدی.
              </Text>
            </View>
          </View>

          {playlist.description ? (
            <View style={styles.descriptionWrap}>
              <View style={styles.descriptionSignal} />
              <Text style={styles.description}>{playlist.description}</Text>
            </View>
          ) : null}

          {data.channel ? (
            <OwnerCard
              type="CHANNEL"
              name={data.channel.name}
              image={data.channel.cover_url}
              onPress={() => router.push({
                pathname: '/channel/[slug]',
                params: { slug: data.channel!.slug },
              })}
            />
          ) : data.studio ? (
            <OwnerCard
              type="STUDIO"
              name={data.studio.name}
              image={data.studio.logo_url}
              onPress={() => router.push({
                pathname: '/studio/[slug]',
                params: { slug: data.studio!.slug },
              })}
            />
          ) : null}

          <View style={styles.listHeading}>
            <Text style={styles.listKicker}>UP NEXT</Text>
            <Text style={styles.listTitle}>داخل این کالکشن</Text>
          </View>

          <View style={styles.list}>
            {(playlist.videos || []).map((video, index) => (
              <View key={video.id} style={styles.videoRow}>
                <View style={styles.videoIndex}>
                  <Text style={styles.videoIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.videoIndexLine} />
                </View>
                <View style={styles.videoCard}>
                  <ContentCard
                    item={video}
                    width="100%"
                    onPress={() => router.push({
                      pathname: '/content/[slug]',
                      params: { slug: video.slug },
                    })}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function OwnerCard({
  type,
  name,
  image,
  onPress,
}: {
  type: 'CHANNEL' | 'STUDIO';
  name: string;
  image?: string | null;
  onPress: () => void;
}) {
  return (
    <PressableScale style={styles.owner} onPress={onPress}>
      <View style={styles.ownerArrow}><View style={styles.ownerArrowIcon} /></View>
      <View style={styles.ownerCopy}>
        <Text style={styles.ownerLabel}>{type}</Text>
        <Text style={styles.ownerName}>{name}</Text>
      </View>
      {image ? (
        <Image source={{ uri: image }} style={styles.ownerImage} contentFit="cover" />
      ) : (
        <View style={styles.ownerFallback}><View style={styles.ownerFallbackCore} /></View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 94 },
  hero: { minHeight: 470, justifyContent: 'flex-end', backgroundColor: palette.surface },
  back: {
    position: 'absolute', top: 54, left: layout.screenPadding, width: 48, height: 48,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(3,5,9,0.54)', alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  backText: { color: palette.white, fontSize: 27, fontWeight: fontWeight.bold },
  collectionBadge: {
    position: 'absolute', top: 64, right: layout.screenPadding, height: 30, paddingHorizontal: 10,
    borderRadius: radii.pill, backgroundColor: 'rgba(3,5,9,0.52)', borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)', flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  collectionDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  collectionBadgeText: { color: palette.textMuted, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.9 },
  heroCopy: { padding: layout.screenPadding, paddingBottom: spacing.xxl, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1.1 },
  title: {
    color: palette.white, fontSize: 38, lineHeight: 47, fontWeight: fontWeight.black,
    textAlign: 'right', letterSpacing: -0.8, marginTop: spacing.xs,
  },
  meta: { color: palette.textMuted, fontSize: typeScale.bodySm, marginTop: 6 },
  body: { paddingHorizontal: layout.screenPadding },
  summaryCard: {
    minHeight: 146, marginTop: -14, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(10,16,26,0.90)', padding: spacing.lg, flexDirection: 'row', alignItems: 'center',
    gap: spacing.lg, ...shadow.soft,
  },
  summaryVisual: { width: 88, height: 100, alignItems: 'center', justifyContent: 'center' },
  stackCardBack: {
    position: 'absolute', width: 54, height: 78, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.18)', backgroundColor: 'rgba(167,123,255,0.05)',
    transform: [{ rotate: '-10deg' }, { translateX: -12 }],
  },
  stackCardMid: {
    position: 'absolute', width: 54, height: 78, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.04)',
    transform: [{ rotate: '9deg' }, { translateX: 12 }],
  },
  stackCardFront: {
    width: 58, height: 84, borderRadius: 17, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(3,5,9,0.62)',
    alignItems: 'center', justifyContent: 'center',
  },
  stackCount: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  stackLabel: { color: palette.cyan, fontSize: 7, fontWeight: fontWeight.black, letterSpacing: 0.8, marginTop: 2 },
  summaryCopy: { flex: 1, alignItems: 'flex-end' },
  summaryKicker: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 0.9 },
  summaryTitle: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 4 },
  summaryText: { color: palette.textMuted, fontSize: typeScale.caption, lineHeight: 20, textAlign: 'right', marginTop: 5 },
  descriptionWrap: { marginTop: spacing.xxxl, flexDirection: 'row-reverse', gap: spacing.md },
  descriptionSignal: { width: 3, borderRadius: 3, backgroundColor: 'rgba(88,244,255,0.28)' },
  description: { flex: 1, color: '#D8DEE8', fontSize: typeScale.body, lineHeight: 29, textAlign: 'right' },
  owner: {
    minHeight: 88, marginTop: spacing.xl, borderRadius: radii.xl, borderWidth: 1,
    borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.028)',
    flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.md,
  },
  ownerArrow: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(88,244,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(88,244,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  ownerArrowIcon: {
    width: 7, height: 7, borderLeftWidth: 1.3, borderBottomWidth: 1.3,
    borderColor: palette.cyan, transform: [{ rotate: '45deg' }],
  },
  ownerCopy: { flex: 1, alignItems: 'flex-end' },
  ownerLabel: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  ownerName: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.black, marginTop: 3 },
  ownerImage: { width: 58, height: 58, borderRadius: 19, backgroundColor: palette.surface },
  ownerFallback: { width: 58, height: 58, borderRadius: 19, backgroundColor: 'rgba(24,124,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  ownerFallbackCore: { width: 16, height: 16, borderRadius: 5, backgroundColor: palette.blue, transform: [{ rotate: '45deg' }] },
  listHeading: { marginTop: spacing.massive, alignItems: 'flex-end', marginBottom: spacing.md },
  listKicker: { color: palette.cyan, fontSize: 8, fontWeight: fontWeight.black, letterSpacing: 1 },
  listTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, marginTop: 3 },
  list: { gap: spacing.md },
  videoRow: { flexDirection: 'row', gap: spacing.sm },
  videoIndex: { width: 30, paddingTop: spacing.sm, alignItems: 'center' },
  videoIndexText: { color: palette.textDim, fontSize: 9, fontWeight: fontWeight.black },
  videoIndexLine: { width: 1, flex: 1, minHeight: 50, backgroundColor: 'rgba(88,244,255,0.10)', marginTop: spacing.xs },
  videoCard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingMark: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  loadingCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }], ...shadow.cyanGlow },
  loadingKicker: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1, marginTop: spacing.lg },
  muted: { color: palette.textMuted, marginTop: spacing.xs },
});
