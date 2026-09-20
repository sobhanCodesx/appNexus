import { useEventListener } from 'expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentDetailPayload } from '@/types/api';
import { htmlToPlainText } from '@/utils/text';

const empty: ContentDetailPayload = {
  content: { id: 0, title: '', slug: '' },
  channel: null,
  playlist: null,
  related: [],
};

export default function ContentDetailScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const path = '/contents/' + encodeURIComponent(slug || '');
  const { data, loading, error } = useApiResource<ContentDetailPayload>(path, empty);
  const content = data.content;
  const isVideo = Boolean(content.video_url && (content.type === 'video' || content.type === 'short'));
  const body = useMemo(() => htmlToPlainText(content.body), [content.body]);

  useEffect(() => {
    if (!content.id) return;
    void apiRequest<{ views: number }>(path + '/views', { method: 'POST' }, { auth: false }).catch(() => undefined);
  }, [content.id, path]);

  if (loading && !content.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.loading}>در حال ورود به محتوا…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !content.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>این محتوا در دسترس نیست</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>برگشت</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
        {isVideo ? (
          <NativeVideo
            id={content.id}
            source={String(content.video_url)}
            duration={content.duration || undefined}
          />
        ) : (
          <ImageHero uri={content.thumbnail_url || content.image_url || content.cover_url} />
        )}

        <View style={styles.body}>
          <View style={styles.channelRow}>
            <View style={styles.channelCopy}>
              <Text style={styles.channelName}>{data.channel?.name || content.channel?.name || 'PlayNexus'}</Text>
              <Text style={styles.channelMeta}>
                {data.channel?.subscribers_count
                  ? data.channel.subscribers_count.toLocaleString('fa-IR') + ' دنبال‌کننده'
                  : content.type === 'video'
                    ? 'ویدیو'
                    : 'فید گیمینگ'}
              </Text>
            </View>

            {(data.channel?.avatar_url || content.channel?.avatar_url) ? (
              <Image
                source={{ uri: String(data.channel?.avatar_url || content.channel?.avatar_url) }}
                style={styles.channelAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.channelFallback}><View style={styles.channelFallbackCore} /></View>
            )}
          </View>

          <Text style={styles.title}>{content.title}</Text>
          {content.excerpt ? <Text style={styles.excerpt}>{content.excerpt}</Text> : null}

          <ActionBar content={content} />

          {body ? <Text style={styles.article}>{body}</Text> : null}

          {(data.related || []).length ? (
            <View style={styles.related}>
              <Text style={styles.relatedTitle}>بعدی برای تو</Text>
              {(data.related || []).slice(0, 4).map((item) => (
                <View key={item.id} style={styles.relatedCard}>
                  <ContentCard
                    item={item}
                    width="100%"
                    onPress={() => router.replace({ pathname: '/content/[slug]', params: { slug: item.slug } })}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
        </ScrollView>

        <View pointerEvents="box-none" style={styles.topControls}>
          <RoundControl label="‹" onPress={() => router.back()} />
          <RoundControl
            label="↗"
            onPress={() => void Share.share({ title: content.title, message: content.title })}
          />
        </View>
      </View>
    </Screen>
  );
}

function NativeVideo({
  id,
  source,
  duration,
}: {
  id: number;
  source: string;
  duration?: number;
}) {
  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.timeUpdateEventInterval = 15;
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    void apiRequest(
      '/watch-progress/' + id,
      {
        method: 'PUT',
        body: JSON.stringify({
          position_seconds: Math.max(0, Math.floor(currentTime)),
          duration_seconds: Math.max(1, Math.floor(player.duration || duration || 1)),
        }),
      },
    ).catch(() => undefined);
  });

  return (
    <View style={styles.videoFrame}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />
    </View>
  );
}

function ImageHero({ uri }: { uri?: string | null }) {
  return (
    <View style={styles.imageFrame}>
      <Image
        source={uri ? { uri } : require('../../../assets/images/logo-glow.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient colors={['transparent', palette.ink]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function ActionBar({ content }: { content: ContentDetailPayload['content'] }) {
  const [reaction, setReaction] = useState(content.user_reaction || null);
  const [saved, setSaved] = useState(Boolean(content.is_saved));

  const react = async () => {
    try {
      const next = reaction === 'like' ? null : 'like';
      const response = await apiRequest<{ reaction: 'like' | null }>(
        '/contents/' + encodeURIComponent(content.slug) + '/reaction',
        { method: 'POST', body: JSON.stringify({ type: 'like' }) },
      );
      setReaction(response.reaction ?? next);
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const save = async () => {
    try {
      const response = await apiRequest<{ saved: boolean }>(
        '/contents/' + encodeURIComponent(content.slug) + '/save',
        { method: 'POST' },
      );
      setSaved(response.saved);
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={styles.actions}>
      <ActionPill label={reaction === 'like' ? 'پسندیدی' : 'پسند'} active={reaction === 'like'} onPress={() => void react()} />
      <ActionPill label={saved ? 'ذخیره شد' : 'ذخیره'} active={saved} onPress={() => void save()} />
      <ActionPill label={(content.comments_count || 0).toLocaleString('fa-IR') + ' نظر'} />
      <ActionPill label={(content.views || 0).toLocaleString('fa-IR') + ' بازدید'} />
    </View>
  );
}

function ActionPill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale haptic={Boolean(onPress)} onPress={onPress} style={[styles.actionPill, active && styles.actionPillActive]}>
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </PressableScale>
  );
}

function RoundControl({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.roundControl}>
      <Text style={styles.roundControlText}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: palette.black,
  },
  video: { flex: 1 },
  imageFrame: {
    width: '100%',
    height: 390,
    backgroundColor: palette.surface,
  },
  topControls: {
    position: 'absolute',
    zIndex: 10,
    top: 54,
    left: layout.screenPadding,
    right: layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundControl: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: 'rgba(5,7,11,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundControlText: {
    color: palette.white,
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  body: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: palette.ink,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: 60,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  channelCopy: { alignItems: 'flex-end' },
  channelName: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  channelMeta: { color: palette.textDim, fontSize: typeScale.micro, marginTop: 2 },
  channelAvatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: palette.surface },
  channelFallback: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.28)',
    backgroundColor: 'rgba(77,163,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelFallbackCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 40,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  excerpt: {
    color: palette.textMuted,
    fontSize: typeScale.body,
    lineHeight: 26,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  actionPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  actionPillActive: {
    backgroundColor: 'rgba(77,163,255,0.14)',
    borderColor: 'rgba(77,163,255,0.40)',
  },
  actionText: { color: palette.textMuted, fontSize: typeScale.caption, fontWeight: fontWeight.semibold },
  actionTextActive: { color: palette.cyan },
  article: {
    color: '#D8DEE8',
    fontSize: typeScale.body,
    lineHeight: 31,
    textAlign: 'right',
    marginTop: spacing.xl,
  },
  related: { marginTop: spacing.xxxl },
  relatedTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  relatedCard: { marginBottom: spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loading: { color: palette.textMuted, fontSize: typeScale.body },
  errorTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  errorText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  backButton: {
    marginTop: spacing.xl,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backText: { color: palette.ink, fontWeight: fontWeight.black },
});
