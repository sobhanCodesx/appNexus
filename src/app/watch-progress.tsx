import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import type { ContentCard } from '@/types/api';

type WatchEntry = {
  content_id: number;
  position: number;
  duration: number;
  completed: boolean;
  updated_at?: string | null;
  content?: ContentCard | null;
};
type Payload = { progress: Record<string, WatchEntry>; items?: WatchEntry[] };

const fallback = require('../../assets/images/logo-glow.png');

function timeLabel(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes.toLocaleString('fa-IR') + ':' + String(rest).padStart(2, '0');
}

export default function WatchProgressScreen() {
  const { data, loading, refreshing, refresh } = useApiResource<Payload>(
    '/watch-progress',
    { progress: {}, items: [] },
    10_000,
  );

  const entries = (data.items?.length ? data.items : Object.values(data.progress || {}))
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));

  const remove = async (id: number) => {
    await apiRequest('/watch-progress/' + id, { method: 'DELETE' });
    invalidateResource('/watch-progress');
    await refresh();
  };

  return (
    <Screen>
      <PageHeader title="Continue Watching" subtitle="YOUR WATCH LOOP" onSearch={() => router.push('/search')} />

      <FlashList
        data={entries}
        keyExtractor={(item) => String(item.content_id)}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<WatchHero active={entries.filter((item) => !item.completed).length} total={entries.length} />}
        renderItem={({ item, index }) => <WatchCard item={item} index={index} onRemove={() => void remove(item.content_id)} />}
        ListEmptyComponent={loading ? <WatchSkeleton /> : <Empty />}
      />
    </Screen>
  );
}

function WatchHero({ active, total }: { active: number; total: number }) {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(88,244,255,0.12)', 'rgba(24,124,255,0.05)', 'rgba(3,5,9,0.94)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroRingOne} />
      <View style={styles.heroRingTwo} />
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>RESUME ENGINE</Text>
        <Text style={styles.heroTitle}>از همون‌جایی که ولش کردی</Text>
        <Text style={styles.heroBody}>پیشرفت واقعی ویدیوها ذخیره می‌شه؛ یک لمس و ادامه دقیق از همان لحظه.</Text>
        <View style={styles.metrics}>
          <Metric value={active} label="ACTIVE" />
          <Metric value={total} label="HISTORY" />
        </View>
      </View>
      <View style={styles.heroSignal} />
    </View>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value.toLocaleString('fa-IR')}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function WatchCard({ item, index, onRemove }: { item: WatchEntry; index: number; onRemove: () => void }) {
  const content = item.content;
  const percent = item.duration > 0 ? Math.min(100, Math.round(item.position / item.duration * 100)) : 0;
  const image = content?.thumbnail_url || content?.image_url || content?.cover_url || content?.channel?.cover_url || content?.channel?.logo_url;
  const logo = content?.channel?.logo_url || content?.channel?.avatar_url || content?.channel?.cover_url || image;

  return (
    <View style={styles.card}>
      <PressableScale
        disabled={!content?.slug}
        onPress={() => {
          if (!content?.slug) return;
          router.push({
            pathname: '/content/[slug]',
            params: { slug: content.slug, startAt: String(item.position) },
          });
        }}
        pressedScale={0.99}>
        <View style={styles.media}>
          <Image source={image ? { uri: String(image) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          <LinearGradient colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.12)', 'rgba(3,5,9,0.80)']} style={StyleSheet.absoluteFill} />
          <View style={styles.indexBadge}><Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text></View>
          <View style={styles.resumeOrb}><Text style={styles.resumeGlyph}>{item.completed ? '↺' : '▶'}</Text></View>

          <View style={styles.progressOverlay}>
            <View style={styles.progressCopy}>
              <Text style={styles.progressLabel}>{item.completed ? 'COMPLETED' : 'RESUME'}</Text>
              <Text style={styles.progressValue}>{percent.toLocaleString('fa-IR')}٪</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: (percent + '%') as `${number}%` }]} /></View>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.timeBox}>
            <Text style={styles.timeMain}>{timeLabel(item.position)}</Text>
            <Text style={styles.timeSub}>از {timeLabel(item.duration)}</Text>
          </View>

          <View style={styles.cardCopy}>
            <Text numberOfLines={2} style={styles.title}>{content?.title || 'ویدیوی PlayNexus'}</Text>
            <Text numberOfLines={1} style={styles.meta}>{content?.channel?.name || content?.game?.name || 'PlayNexus Watch'}</Text>
          </View>

          <View style={styles.logoShell}>
            <Image source={logo ? { uri: String(logo) } : fallback} style={styles.logo} contentFit="cover" />
          </View>
        </View>
      </PressableScale>

      <View style={styles.actions}>
        <PressableScale
          disabled={!content?.slug}
          onPress={() => {
            if (!content?.slug) return;
            router.push({ pathname: '/content/[slug]', params: { slug: content.slug, startAt: String(item.position) } });
          }}
          style={styles.resumeButton}>
          <Text style={styles.resumeText}>{item.completed ? 'دوباره ببین' : 'ادامه تماشا'}</Text>
          <View style={styles.resumeArrow} />
        </PressableScale>

        <PressableScale onPress={onRemove} style={styles.remove}>
          <Text style={styles.removeText}>حذف از تاریخچه</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function WatchSkeleton() {
  return (
    <View style={styles.skeleton}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <SkeletonBox style={{ width: '100%', height: 210 }} radius={24} />
          <SkeletonBox style={{ width: '80%', height: 18, alignSelf: 'flex-end' }} radius={7} />
          <SkeletonBox style={{ width: '50%', height: 12, alignSelf: 'flex-end' }} radius={6} />
        </View>
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOrbit}><View style={styles.emptyCore} /></View>
      <Text style={styles.emptyKicker}>WATCH LOOP EMPTY</Text>
      <Text style={styles.emptyTitle}>هنوز چیزی نیمه‌کاره نیست</Text>
      <Text style={styles.emptyText}>هر ویدیویی که ببینی، ادامه‌اش اینجا منتظرت می‌مونه.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  hero: { minHeight: 248, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.15)', backgroundColor: palette.surface, padding: spacing.lg, marginBottom: spacing.xl, ...shadow.soft },
  heroRingOne: { position: 'absolute', width: 180, height: 180, borderRadius: 180, borderWidth: 1, borderColor: 'rgba(88,244,255,0.10)', left: -66, top: -54 },
  heroRingTwo: { position: 'absolute', width: 110, height: 110, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(167,123,255,0.10)', right: -22, bottom: -24 },
  heroCopy: { marginTop: 'auto', alignItems: 'flex-end' },
  heroKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  heroTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 27, lineHeight: 35, fontWeight: fontWeight.black, textAlign: 'right', marginTop: 5 },
  heroBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'right', maxWidth: 320, marginTop: 6 },
  metrics: { marginTop: spacing.md, flexDirection: 'row-reverse', gap: spacing.sm },
  metric: { minWidth: 78, height: 58, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(3,5,9,0.30)', alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18 },
  metricLabel: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8, marginTop: 2 },
  heroSignal: { position: 'absolute', right: 28, bottom: 0, width: 72, height: 2, backgroundColor: palette.cyan },
  card: { marginBottom: spacing.xxxl },
  media: { width: '100%', aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: palette.surface, ...shadow.soft },
  indexBadge: { position: 'absolute', top: 11, left: 11, width: 31, height: 27, borderRadius: 10, backgroundColor: 'rgba(3,5,9,0.64)', alignItems: 'center', justifyContent: 'center' },
  indexText: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 8 },
  resumeOrb: { position: 'absolute', top: '39%', alignSelf: 'center', width: 54, height: 54, borderRadius: 20, backgroundColor: 'rgba(3,5,9,0.66)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.22)', alignItems: 'center', justifyContent: 'center', ...shadow.cyanGlow },
  resumeGlyph: { color: palette.white, fontSize: 18, marginLeft: 2 },
  progressOverlay: { position: 'absolute', left: 12, right: 12, bottom: 11 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  progressValue: { color: palette.white, fontFamily: fontFamily.black, fontSize: 9 },
  track: { height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', marginTop: 6 },
  fill: { height: 4, borderRadius: 4, backgroundColor: palette.cyan },
  cardBottom: { minHeight: 74, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timeBox: { minWidth: 58, alignItems: 'flex-start' },
  timeMain: { color: palette.white, fontFamily: fontFamily.black, fontSize: 11 },
  timeSub: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 8, marginTop: 3 },
  cardCopy: { flex: 1, alignItems: 'flex-end' },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 15, lineHeight: 22, fontWeight: fontWeight.black, textAlign: 'right' },
  meta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 4 },
  logoShell: { width: 48, height: 48, borderRadius: 16, padding: 1.5, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)' },
  logo: { flex: 1, borderRadius: 14 },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
  resumeButton: { flex: 1, minHeight: 44, borderRadius: radii.lg, backgroundColor: palette.white, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  resumeText: { color: palette.ink, fontFamily: fontFamily.black, fontSize: 10 },
  resumeArrow: { width: 6, height: 6, borderLeftWidth: 1.3, borderBottomWidth: 1.3, borderColor: palette.ink, transform: [{ rotate: '45deg' }] },
  remove: { minWidth: 108, minHeight: 44, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255,97,120,0.16)', backgroundColor: 'rgba(255,97,120,0.04)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: palette.danger, fontFamily: fontFamily.black, fontSize: 9 },
  skeleton: { gap: spacing.xl },
  skeletonCard: { gap: spacing.sm },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyOrbit: { width: 76, height: 76, borderRadius: 76, borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 16, height: 16, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  emptyKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1, marginTop: spacing.md },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 4 },
  emptyText: { maxWidth: 300, color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});
