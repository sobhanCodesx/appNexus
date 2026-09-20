import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
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
import type { ContentCard as ContentItem, Paginated } from '@/types/api';

export default function VideosScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<ContentItem>>(
    '/videos',
    { data: [] },
  );

  const videos = data.data || [];
  const featured = videos[0];
  const rest = videos.slice(1);

  return (
    <Screen>
      <PageHeader
        title="Watch"
        subtitle="PLAYNEXUS VIDEO"
        onSearch={() => router.push('/search')}
      />

      <FlashList
        data={rest}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <View style={styles.intro}>
              <Text style={styles.introKicker}>WATCH MODE</Text>
              <Text style={styles.introTitle}>ببین، ادامه بده، گم نشو</Text>
              <Text style={styles.introBody}>
                ویدیوهای مهم بازی‌ها، بدون شلوغی یک پلتفرم ویدیویی عمومی.
              </Text>
            </View>

            <PressableScale
              onPress={() => router.push('/shorts')}
              pressedScale={0.985}
              style={styles.shortsPortal}>
              <LinearGradient
                colors={['rgba(255,85,213,0.16)', 'rgba(24,124,255,0.08)', 'rgba(8,14,23,0.88)']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.shortsVisual}>
                <View style={styles.shortFrameBack} />
                <View style={styles.shortFrameMid} />
                <View style={styles.shortFrameFront}>
                  <Text style={styles.playSymbol}>▶</Text>
                </View>
              </View>

              <View style={styles.shortsCopy}>
                <Text style={styles.shortsKicker}>VERTICAL MODE</Text>
                <Text style={styles.shortsTitle}>PlayNexus Shorts</Text>
                <Text style={styles.shortsBody}>سریع برو وسط لحظه‌های مهم</Text>
              </View>

              <View style={styles.shortsArrow}>
                <View style={styles.shortsArrowIcon} />
              </View>
            </PressableScale>

            {featured ? (
              <View style={styles.featuredSection}>
                <SectionHeader
                  title="پیشنهاد اصلی"
                  eyebrow="FEATURED WATCH"
                  action="پخش"
                />
                <View style={styles.featuredCard}>
                  <ContentCard
                    item={featured}
                    featured
                    width="100%"
                    onPress={() => router.push({
                      pathname: '/content/[slug]',
                      params: { slug: featured.slug },
                    })}
                  />
                </View>
              </View>
            ) : null}

            {rest.length ? (
              <View style={styles.latestHeader}>
                <SectionHeader
                  title="تازه‌ترین ویدیوها"
                  eyebrow="LATEST"
                  action={videos.length.toLocaleString('fa-IR') + ' ویدیو'}
                />
              </View>
            ) : null}
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rowIndex}>
              <Text style={styles.rowIndexNumber}>{String(index + 2).padStart(2, '0')}</Text>
            </View>
            <View style={styles.rowCard}>
              <ContentCard
                item={item}
                width="100%"
                onPress={() => router.push({
                  pathname: '/content/[slug]',
                  params: { slug: item.slug },
                })}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          !featured ? (
            <View style={styles.empty}>
              <Text style={styles.emptyKicker}>NO VIDEO SIGNAL</Text>
              <Text style={styles.emptyTitle}>فعلاً ویدیوی تازه‌ای نیست</Text>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  intro: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  introKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  introTitle: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    marginTop: 4,
    textAlign: 'right',
  },
  introBody: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  shortsPortal: {
    minHeight: 142,
    marginHorizontal: layout.screenPadding,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,85,213,0.16)',
    backgroundColor: 'rgba(8,14,23,0.88)',
    overflow: 'hidden',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.soft,
  },
  shortsVisual: {
    width: 88,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortFrameBack: {
    position: 'absolute',
    width: 48,
    height: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.22)',
    backgroundColor: 'rgba(167,123,255,0.06)',
    transform: [{ rotate: '-12deg' }, { translateX: -13 }],
  },
  shortFrameMid: {
    position: 'absolute',
    width: 48,
    height: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,85,213,0.22)',
    backgroundColor: 'rgba(255,85,213,0.06)',
    transform: [{ rotate: '10deg' }, { translateX: 12 }],
  },
  shortFrameFront: {
    width: 52,
    height: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.26)',
    backgroundColor: 'rgba(3,5,9,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSymbol: {
    color: palette.cyan,
    fontSize: 19,
  },
  shortsCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  shortsKicker: {
    color: palette.magenta,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  shortsTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  shortsBody: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  shortsArrow: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortsArrowIcon: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
  },
  featuredSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxxl,
  },
  featuredCard: {
    marginTop: spacing.md,
  },
  latestHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.md,
  },
  row: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rowIndex: {
    width: 30,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  rowIndexNumber: {
    color: palette.textDim,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  rowCard: {
    flex: 1,
  },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  emptyTitle: {
    color: palette.textMuted,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 5,
  },
});
