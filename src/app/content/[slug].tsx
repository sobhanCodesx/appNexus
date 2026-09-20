import { useEvent, useEventListener } from 'expo';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer, type VideoThumbnail } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { CommentsSection } from '@/components/community/comments-section';
import { ExpandableText } from '@/components/ui/expandable-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import type { ContentDetailPayload, VideoPlaylistContext } from '@/types/api';
import { htmlToRichBlocks, type RichTextBlock } from '@/utils/text';

const fallback = require('../../../assets/images/logo-glow.png');

const empty: ContentDetailPayload = {
  content: { id: 0, title: '', slug: '' },
  channel: null,
  playlist: null,
  related: [],
};

export default function ContentDetailScreen() {
  const params = useLocalSearchParams<{ slug: string; list?: string; startAt?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const list = Array.isArray(params.list) ? params.list[0] : params.list;
  const startAtRaw = Array.isArray(params.startAt) ? params.startAt[0] : params.startAt;
  const startAt = Math.max(0, Number.parseInt(startAtRaw || '0', 10) || 0);
  const path = '/contents/' + encodeURIComponent(slug || '') + (list ? '?list=' + encodeURIComponent(list) : '');
  const { data, loading, error } = useApiResource<ContentDetailPayload>(path, empty);
  const content = data.content;
  const isVideo = Boolean(content.video_url && (content.type === 'video' || content.type === 'short'));
  const body = useMemo(() => htmlToRichBlocks(content.body), [content.body]);
  const poster = content.thumbnail_url || content.image_url || content.cover_url || content.game?.cover_url || data.channel?.cover_url || data.channel?.logo_url;

  useEffect(() => {
    if (!content.id) return;
    void apiRequest<{ views: number }>(
      '/contents/' + encodeURIComponent(slug || '') + '/views',
      { method: 'POST' },
      { auth: false },
    ).catch(() => undefined);
  }, [content.id, slug]);

  if (loading && !content.id) return <DetailSkeleton />;

  if (error && !content.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorKicker}>SIGNAL LOST</Text>
          <Text style={styles.errorTitle}>این محتوا در دسترس نیست</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>برگشت</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  const typeLabel = content.type === 'video' ? 'NEXUS VIDEO' : content.type === 'short' ? 'SHORT' : 'EDITORIAL';

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isVideo ? (
            <NativeVideo
              id={content.id}
              title={content.title}
              source={String(content.video_url)}
              thumbnail={poster ? String(poster) : null}
              duration={content.duration || undefined}
              initialPosition={startAt}
            />
          ) : (
            <ImageHero uri={poster ? String(poster) : null} />
          )}

          <View style={[styles.body, isVideo && styles.videoBody]}>
            <View style={styles.storySignalRow}>
              <View style={[styles.storySignal, content.type === 'video' && styles.storySignalVideo]} />
              <Text style={[styles.storyType, content.type === 'video' && styles.storyTypeVideo]}>{typeLabel}</Text>
              <View style={styles.storyMetaDivider} />
              <Text style={styles.storyMeta}>{(content.views || 0).toLocaleString('fa-IR')} بازدید</Text>
            </View>

            <Text style={styles.title}>{content.title}</Text>

            {content.excerpt ? (
              <ExpandableText
                text={content.excerpt}
                collapsedLines={4}
                threshold={180}
                style={styles.excerpt}
                accent={content.type === 'video' ? palette.magenta : palette.cyan}
              />
            ) : null}

            <ChannelCard channel={data.channel} fallbackChannel={content.channel} type={content.type} />
            <ActionBar key={content.id} content={content} />

            {isVideo && data.playlist ? <PlaylistPanel playlist={data.playlist} /> : null}

            {body.length ? <ArticleContent blocks={body} /> : null}

            <CommentsSection slug={content.slug} enabled={content.allow_comments !== false} />

            {(data.related || []).length ? (
              <View style={styles.related}>
                <SectionHeader title="بعدی برای تو" eyebrow="UP NEXT" action="ادامه بده" />
                <View style={styles.relatedList}>
                  {(data.related || []).slice(0, 5).map((item, index) => (
                    <View key={item.id} style={styles.relatedRow}>
                      <View style={styles.relatedIndex}>
                        <Text style={styles.relatedIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.relatedCard}>
                        <ContentCard
                          item={item}
                          width="100%"
                          onPress={() => router.replace({ pathname: '/content/[slug]', params: { slug: item.slug } })}
                        />
                      </View>
                    </View>
                  ))}
                </View>
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

function formatPlayerTime(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, '0'))
      .join(':');
  }

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

/* eslint-disable react-hooks/immutability -- expo-video exposes an imperative native player API. */
function NativeVideo({
  id,
  title,
  source,
  thumbnail,
  duration,
  initialPosition = 0,
}: {
  id: number;
  title: string;
  source: string;
  thumbnail?: string | null;
  duration?: number;
  initialPosition?: number;
}) {
  const videoRef = useRef<VideoView>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressReport = useRef(0);
  const [neonRotation] = useState(() => new Animated.Value(0));
  const [neonOpacity] = useState(() => new Animated.Value(0));
  const [ambientMotion] = useState(() => new Animated.Value(0));
  const [ambientOpacity] = useState(() => new Animated.Value(0.72));

  const [posterVisible, setPosterVisible] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [progressWidth, setProgressWidth] = useState(1);
  const [ambientFrame, setAmbientFrame] = useState<VideoThumbnail | null>(null);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);

  const player = useVideoPlayer({ uri: source, useCaching: true }, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
    instance.preservesPitch = true;
    if (initialPosition > 0) instance.currentTime = initialPosition;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const totalDuration = Math.max(1, player.duration || duration || 1);
  const progress = Math.max(0, Math.min(1, currentTime / totalDuration));

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  }, []);

  const revealControls = useCallback((autohide = true) => {
    clearControlsTimer();
    setControlsVisible(true);

    if (autohide && player.playing) {
      controlsTimer.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3600);
    }
  }, [clearControlsTimer, player]);

  useEffect(() => clearControlsTimer, [clearControlsTimer]);

  useEffect(() => {
    clearControlsTimer();

    if (!isPlaying) return;

    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 1100);

    return clearControlsTimer;
  }, [clearControlsTimer, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    neonRotation.setValue(0);
    neonOpacity.setValue(1);

    const spin = Animated.loop(
      Animated.timing(neonRotation, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    spin.start();

    const stopTimer = setTimeout(() => {
      Animated.timing(neonOpacity, {
        toValue: 0.14,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => spin.stop());
    }, 32_000);

    return () => {
      clearTimeout(stopTimer);
      spin.stop();
    };
  }, [isPlaying, neonOpacity, neonRotation]);

  useEffect(() => {
    if (!isPlaying) return;

    ambientMotion.setValue(0);
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientMotion, {
          toValue: 1,
          duration: 6200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientMotion, {
          toValue: 0,
          duration: 6200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    drift.start();
    return () => drift.stop();
  }, [ambientMotion, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    let active = true;
    let sampling = false;

    const sample = async () => {
      if (!active || sampling || player.currentTime <= 0) return;
      sampling = true;

      try {
        const [frame] = await player.generateThumbnailsAsync(
          [Math.max(0, player.currentTime)],
          { maxWidth: 144, maxHeight: 82 },
        );

        if (!active || !frame) return;

        Animated.timing(ambientOpacity, {
          toValue: 0.16,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          if (!active) return;
          setAmbientFrame(frame);
          Animated.timing(ambientOpacity, {
            toValue: 0.78,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      } catch {
        // Some remote streams do not support thumbnail extraction.
      } finally {
        sampling = false;
      }
    };

    const first = setTimeout(() => void sample(), 900);
    const interval = setInterval(() => void sample(), 4200);

    return () => {
      active = false;
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [ambientOpacity, isPlaying, player]);

  useEventListener(player, 'timeUpdate', ({ currentTime: nextTime }) => {
    setCurrentTime(nextTime);

    if (nextTime - lastProgressReport.current < 15) return;
    lastProgressReport.current = nextTime;

    void apiRequest(
      '/watch-progress/' + id,
      {
        method: 'PUT',
        body: JSON.stringify({
          position_seconds: Math.max(0, Math.floor(nextTime)),
          duration_seconds: Math.max(1, Math.floor(player.duration || duration || 1)),
        }),
      },
    ).catch(() => undefined);
  });

  const togglePlayback = () => {
    setPosterVisible(false);
    revealControls(true);

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const seekBy = (seconds: number) => {
    const next = Math.max(0, Math.min(totalDuration, player.currentTime + seconds));
    player.currentTime = next;
    setCurrentTime(next);
    revealControls(true);
    void Haptics.selectionAsync();
  };

  const seekTo = (ratio: number) => {
    const next = Math.max(0, Math.min(totalDuration, totalDuration * ratio));
    player.currentTime = next;
    setCurrentTime(next);
    revealControls(true);
  };

  const toggleMute = () => {
    const next = !player.muted;
    player.muted = next;
    setMuted(next);
    revealControls(true);
  };

  const cycleRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const index = rates.findIndex((item) => item === rate);
    const next = rates[(index + 1) % rates.length];
    player.playbackRate = next;
    setRate(next);
    revealControls(true);
    void Haptics.selectionAsync();
  };

  const ambientSource = ambientFrame || (thumbnail ? { uri: thumbnail } : fallback);
  const neonRotate = neonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.playerWorld}>
      <View pointerEvents="none" style={styles.ambientStage}>
        <Animated.View
          style={[
            styles.ambientFrame,
            {
              opacity: ambientOpacity,
              transform: [
                {
                  scale: ambientMotion.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.12, 1.28],
                  }),
                },
                {
                  translateX: ambientMotion.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 12],
                  }),
                },
                {
                  translateY: ambientMotion.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, -9],
                  }),
                },
              ],
            },
          ]}>
          <Image
            source={ambientSource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={52}
            transition={620}
          />
        </Animated.View>
        <LinearGradient
          colors={[
            'rgba(2,4,8,0.05)',
            'rgba(3,5,9,0.17)',
            'rgba(3,5,9,0.48)',
            palette.ink,
          ]}
          locations={[0, 0.40, 0.84, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientBloomLeft} />
        <View style={styles.ambientBloomRight} />
      </View>

      <View style={styles.neonShell}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.neonRotor,
            {
              opacity: neonOpacity,
              transform: [{ rotate: neonRotate }],
            },
          ]}>
          <LinearGradient
            colors={[
              palette.cyan,
              palette.blueHot,
              palette.violet,
              palette.magenta,
              palette.cyan,
            ]}
            locations={[0, 0.24, 0.5, 0.76, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.videoFrame}>
          <VideoView
            ref={videoRef}
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            onFirstFrameRender={() => {
              if (player.playing) setPosterVisible(false);
            }}
          />

          <View pointerEvents="none" style={styles.glassRim}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.16)',
                'rgba(255,255,255,0.035)',
                'rgba(255,255,255,0.00)',
                'rgba(88,244,255,0.045)',
              ]}
              locations={[0, 0.22, 0.58, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlightTop} />
            <View style={styles.glassHighlightLeft} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="نمایش یا مخفی کردن کنترل‌های ویدیو"
            onPress={() => {
              if (controlsVisible) {
                setControlsVisible(false);
                clearControlsTimer();
              } else {
                revealControls(true);
              }
            }}
            style={StyleSheet.absoluteFill}
          />

          {!posterVisible && controlsVisible ? (
            <View pointerEvents="box-none" style={styles.cinemaControls}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(2,4,8,0.66)', 'transparent', 'rgba(2,4,8,0.88)']}
                locations={[0, 0.43, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.cinemaTopRow}>
                <View style={styles.nowPlayingPill}>
                  <View style={styles.nowPlayingPulse} />
                  <Text numberOfLines={1} style={styles.nowPlayingTitle}>{title}</Text>
                </View>

                <View style={styles.cinemaTopActions}>
                  <MiniPlayerButton label={rate === 1 ? '1×' : String(rate) + '×'} onPress={cycleRate} />
                  <MiniPlayerButton label={muted ? 'MUTE' : 'VOL'} onPress={toggleMute} />
                  <MiniPlayerButton
                    label="PIP"
                    onPress={() => void videoRef.current?.startPictureInPicture().catch(() => undefined)}
                  />
                  <MiniPlayerButton
                    label="⛶"
                    onPress={() => void videoRef.current?.enterFullscreen().catch(() => undefined)}
                  />
                </View>
              </View>

              <View style={styles.cinemaCenterControls}>
                <PlayerRoundButton label="−10" compact onPress={() => seekBy(-10)} />
                <PlayerRoundButton
                  label={isPlaying ? 'Ⅱ' : '▶'}
                  primary
                  onPress={togglePlayback}
                />
                <PlayerRoundButton label="+10" compact onPress={() => seekBy(10)} />
              </View>

              <View style={styles.cinemaBottom}>
                <Pressable
                  onLayout={(event) => setProgressWidth(Math.max(1, event.nativeEvent.layout.width))}
                  onPress={(event) => {
                    seekTo(Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth)));
                  }}
                  style={styles.progressHitArea}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: (progress * 100 + '%') as `${number}%` }]} />
                    <View style={[styles.progressKnob, { left: Math.max(0, progress * progressWidth - 5) }]} />
                  </View>
                </Pressable>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatPlayerTime(currentTime)}</Text>
                  <View style={styles.timeDivider} />
                  <Text style={styles.timeDuration}>{formatPlayerTime(totalDuration)}</Text>
                  <View style={styles.cinemaSignalLine} />
                  <Text style={styles.cinemaSignalText}>PLAYNEXUS // CINEMA</Text>
                </View>
              </View>
            </View>
          ) : null}

          {posterVisible ? (
            <PressableScale onPress={togglePlayback} pressedScale={0.995} style={styles.poster}>
              <Image
                source={thumbnail ? { uri: thumbnail } : fallback}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(3,5,9,0.02)', 'rgba(3,5,9,0.13)', 'rgba(3,5,9,0.72)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.posterPlayAura}>
                <View style={styles.posterPlayOrbit} />
                <View style={styles.posterPlayOuter}>
                  <View style={styles.posterPlayInner}>
                    <Text style={styles.posterPlayGlyph}>▶</Text>
                  </View>
                </View>
              </View>
              <View style={styles.posterBottom}>
                <View style={styles.posterSignal} />
                <View>
                  <Text style={styles.posterText}>ENTER NEXUS CINEMA</Text>
                  <Text style={styles.posterSubtext}>AMBIENT FRAME ENGINE · 4K READY</Text>
                </View>
              </View>
            </PressableScale>
          ) : null}
        </View>
      </View>

      <View pointerEvents="none" style={styles.afterglow}>
        <LinearGradient
          colors={[
            'rgba(88,244,255,0)',
            'rgba(88,244,255,0.34)',
            'rgba(167,123,255,0.22)',
            'rgba(255,85,213,0.32)',
            'rgba(255,85,213,0)',
          ]}
          locations={[0, 0.22, 0.5, 0.78, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

function MiniPlayerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale
      haptic={false}
      onPress={onPress}
      pressedScale={0.94}
      style={styles.miniPlayerButton}>
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.miniPlayerButtonText}>{label}</Text>
    </PressableScale>
  );
}

function PlayerRoundButton({
  label,
  primary = false,
  compact = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.92}
      style={[
        styles.playerRoundButton,
        compact && styles.playerRoundButtonCompact,
        primary && styles.playerRoundButtonPrimary,
      ]}>
      {primary ? (
        <LinearGradient
          colors={['rgba(88,244,255,0.24)', 'rgba(77,163,255,0.13)', 'rgba(255,85,213,0.12)']}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView intensity={54} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <Text
        style={[
          styles.playerRoundButtonText,
          compact && styles.playerRoundButtonTextCompact,
        ]}>
        {label}
      </Text>
    </PressableScale>
  );
}

/* eslint-enable react-hooks/immutability */
function PlaylistPanel({ playlist }: { playlist: VideoPlaylistContext }) {
  const items = playlist.items || [];
  const [open, setOpen] = useState(false);
  const collectionImage = playlist.image_url || items[0]?.thumbnail_url || items[0]?.image_url || items[0]?.cover_url || null;
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === playlist.current_id));

  return (
    <View style={styles.playlistPanel}>
      {collectionImage ? (
        <View pointerEvents="none" style={styles.playlistBackdrop}>
          <Image
            source={{ uri: String(collectionImage) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[
              'rgba(4,7,12,0.30)',
              'rgba(4,7,12,0.56)',
              'rgba(4,7,12,0.88)',
              'rgba(4,7,12,0.96)',
            ]}
            locations={[0, 0.28, 0.66, 1]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        <LinearGradient
          colors={['rgba(88,244,255,0.065)', 'rgba(167,123,255,0.035)', 'rgba(255,255,255,0.018)']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <PressableScale
        onPress={() => setOpen((value) => !value)}
        style={styles.playlistHeader}>
        <View style={styles.playlistArrow} />
        <View style={styles.playlistHeaderCopy}>
          <Text style={styles.playlistKicker}>PLAYNEXUS COLLECTION</Text>
          <Text numberOfLines={1} style={styles.playlistTitle}>{playlist.title}</Text>
          <Text style={styles.playlistMeta}>
            {playlist.channel_name || 'PlayNexus'} · {(currentIndex + 1).toLocaleString('fa-IR')} / {items.length.toLocaleString('fa-IR')}
          </Text>
        </View>
        <View style={styles.playlistStack}>
          <View style={styles.stackBack} />
          <View style={styles.stackFront}><Text style={styles.stackCount}>{open ? '−' : '+'}</Text></View>
        </View>
      </PressableScale>

      {open ? <View style={styles.playlistItems}>
        {items.slice(0, 7).map((item, index) => {
          const current = item.id === playlist.current_id;
          const thumbnail = item.thumbnail_url || item.image_url || item.cover_url || item.game?.cover_url;
          return (
            <PressableScale
              key={item.id}
              onPress={() => {
                if (current) return;
                router.replace({
                  pathname: '/content/[slug]',
                  params: { slug: item.slug, list: playlist.slug },
                });
              }}
              style={[styles.playlistItem, current && styles.playlistItemCurrent]}>
              <View style={styles.playlistThumb}>
                <Image source={thumbnail ? { uri: String(thumbnail) } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
                {current ? <View style={styles.nowPlaying}><Text style={styles.nowPlayingText}>▶</Text></View> : null}
              </View>
              <View style={styles.playlistItemCopy}>
                <Text style={[styles.playlistItemIndex, current && styles.playlistItemIndexCurrent]}>
                  {current ? 'NOW PLAYING' : String(index + 1).padStart(2, '0')}
                </Text>
                <Text numberOfLines={2} style={styles.playlistItemTitle}>{item.title}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View> : null}

      {open && items.length > 7 ? (
        <PressableScale
          onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: playlist.slug } })}
          style={styles.playlistMore}>
          <Text style={styles.playlistMoreText}>مشاهده تمام کالکشن</Text>
          <View style={styles.playlistMoreArrow} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function ArticleContent({ blocks }: { blocks: RichTextBlock[] }) {
  const total = blocks.reduce((sum, block) => sum + block.text.length, 0);
  const collapsible = total > 900 || blocks.length > 6;
  const [expanded, setExpanded] = useState(false);
  const visible = collapsible && !expanded ? blocks.slice(0, 5) : blocks;

  return (
    <View style={styles.articleWrap}>
      <View style={styles.articleSignal}><View style={styles.articleSignalCore} /></View>
      <View style={styles.articleBlocks}>
        {visible.map((block, index) => <ArticleBlock key={index} block={block} />)}
        {collapsible ? (
          <PressableScale onPress={() => setExpanded((value) => !value)} style={styles.articleToggle}>
            <View style={styles.articleToggleDot} />
            <Text style={styles.articleToggleText}>{expanded ? 'جمع کردن متن' : 'ادامه متن'}</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

function ArticleBlock({ block }: { block: RichTextBlock }) {
  if (block.type === 'h1') return <Text style={styles.articleH1}>{block.text}</Text>;
  if (block.type === 'h2') return <Text style={styles.articleH2}>{block.text}</Text>;
  if (block.type === 'h3') return <Text style={styles.articleH3}>{block.text}</Text>;
  if (block.type === 'quote') {
    return (
      <View style={styles.articleQuote}>
        <View style={styles.articleQuoteLine} />
        <Text style={styles.articleQuoteText}>{block.text}</Text>
      </View>
    );
  }
  if (block.type === 'list-item') {
    return (
      <View style={styles.articleListRow}>
        <View style={styles.articleListDot} />
        <Text style={styles.articleListText}>{block.text}</Text>
      </View>
    );
  }
  return <Text style={styles.articleParagraph}>{block.text}</Text>;
}

function ChannelCard({
  channel,
  fallbackChannel,
  type,
}: {
  channel: ContentDetailPayload['channel'];
  fallbackChannel: ContentDetailPayload['content']['channel'];
  type?: ContentDetailPayload['content']['type'];
}) {
  const avatar = channel?.logo_url || channel?.avatar_url || fallbackChannel?.logo_url || fallbackChannel?.avatar_url;
  const name = channel?.name || fallbackChannel?.name || 'PlayNexus';
  const slug = channel?.slug || fallbackChannel?.slug;
  const [subscribed, setSubscribed] = useState(Boolean(channel?.is_subscribed));
  const [subscriberCount, setSubscriberCount] = useState(Number(channel?.subscribers_count || 0));

  const subscribe = async () => {
    if (!slug) return;
    try {
      const response = await apiRequest<{ subscribed: boolean; subscribers_count?: number }>(
        '/channels/' + encodeURIComponent(slug) + '/subscription',
        { method: 'POST' },
      );
      setSubscribed(response.subscribed);
      if (typeof response.subscribers_count === 'number') {
        setSubscriberCount(response.subscribers_count);
      } else {
        setSubscriberCount((count) => Math.max(0, count + (response.subscribed ? 1 : -1)));
      }
      void Haptics.selectionAsync();
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={styles.channelCard}>
      <PressableScale
        onPress={slug ? () => router.push({ pathname: '/channel/[slug]', params: { slug } }) : undefined}
        style={styles.channelIdentity}>
        {avatar ? (
          <Image source={{ uri: String(avatar) }} style={styles.channelAvatar} contentFit="cover" />
        ) : (
          <View style={styles.channelFallback}><View style={styles.channelFallbackCore} /></View>
        )}
        <View style={styles.channelCopy}>
          <Text style={styles.channelName}>{name}</Text>
          <Text style={styles.channelMeta}>
            {subscriberCount
              ? subscriberCount.toLocaleString('fa-IR') + ' دنبال‌کننده'
              : 'PlayNexus Gaming Channel'}
          </Text>
        </View>
      </PressableScale>

      {slug && type === 'video' ? (
        <PressableScale
          onPress={() => void subscribe()}
          style={[styles.subscribeButton, subscribed && styles.subscribeButtonActive]}>
          <Text style={[styles.subscribeText, subscribed && styles.subscribeTextActive]}>
            {subscribed ? 'دنبال می‌کنی' : 'دنبال کردن'}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

function ImageHero({ uri }: { uri?: string | null }) {
  return (
    <View style={styles.imageFrame}>
      <Image source={uri ? { uri } : fallback} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(3,5,9,0.08)', 'rgba(3,5,9,0.00)', 'rgba(3,5,9,0.92)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function ActionBar({ content }: { content: ContentDetailPayload['content'] }) {
  const [reaction, setReaction] = useState(content.user_reaction || null);
  const [saved, setSaved] = useState(Boolean(content.is_saved));

  const react = async (type: 'like' | 'dislike') => {
    try {
      const next = reaction === type ? null : type;
      const response = await apiRequest<{ reaction: 'like' | 'dislike' | null }>(
        '/contents/' + encodeURIComponent(content.slug) + '/reaction',
        { method: 'POST', body: JSON.stringify({ type }) },
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
      <ActionTile symbol={reaction === 'like' ? '♥' : '♡'} label={reaction === 'like' ? 'پسندیدی' : 'پسند'} value={(content.likes_count || 0).toLocaleString('fa-IR')} active={reaction === 'like'} onPress={() => void react('like')} />
      {content.type !== 'post' ? (
        <ActionTile symbol={reaction === 'dislike' ? '▼' : '▽'} label={reaction === 'dislike' ? 'نپسندیدی' : 'نپسند'} value={(content.dislikes_count || 0).toLocaleString('fa-IR')} active={reaction === 'dislike'} onPress={() => void react('dislike')} />
      ) : null}
      <ActionTile symbol={saved ? '◆' : '◇'} label={saved ? 'ذخیره شد' : 'ذخیره'} active={saved} onPress={() => void save()} />
      <ActionTile symbol="◌" label="گفتگو" value={(content.comments_count || 0).toLocaleString('fa-IR')} />
    </ScrollView>
  );
}

function ActionTile({
  symbol,
  label,
  value,
  active = false,
  onPress,
}: {
  symbol: string;
  label: string;
  value?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale haptic={Boolean(onPress)} onPress={onPress} style={[styles.actionTile, active && styles.actionTileActive]}>
      <Text style={[styles.actionSymbol, active && styles.actionSymbolActive]}>{symbol}</Text>
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
      {value ? <Text style={styles.actionValue}>{value}</Text> : null}
    </PressableScale>
  );
}

function RoundControl({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.roundControl}>
      <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.roundControlText}>{label}</Text>
    </PressableScale>
  );
}

function DetailSkeleton() {
  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.skeletonPage}>
        <SkeletonBox style={{ width: '100%', aspectRatio: 16 / 9 }} radius={0} />
        <View style={styles.skeletonBody}>
          <SkeletonBox style={{ width: 92, height: 10 }} radius={5} />
          <SkeletonBox style={{ width: '92%', height: 34 }} radius={8} />
          <SkeletonBox style={{ width: '72%', height: 34 }} radius={8} />
          <SkeletonBox style={{ width: '100%', height: 82 }} radius={22} />
          <SkeletonBox style={{ width: '100%', height: 150 }} radius={24} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  playerWorld: {
    minHeight: 418,
    paddingTop: 90,
    paddingHorizontal: 10,
    paddingBottom: 24,
    backgroundColor: palette.black,
    overflow: 'hidden',
  },
  ambientStage: {
    position: 'absolute',
    top: -2,
    left: -126,
    right: -126,
    height: 520,
    overflow: 'hidden',
  },
  ambientFrame: {
    position: 'absolute',
    top: -8,
    left: -48,
    right: -48,
    height: 430,
  },
  ambientBloomLeft: {
    position: 'absolute',
    left: -72,
    top: 72,
    width: 294,
    height: 294,
    borderRadius: 294,
    backgroundColor: 'rgba(88,244,255,0.10)',
  },
  ambientBloomRight: {
    position: 'absolute',
    right: -76,
    top: 92,
    width: 310,
    height: 310,
    borderRadius: 310,
    backgroundColor: 'rgba(255,85,213,0.09)',
  },
  playerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  playerBrandPill: {
    height: 27,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerBrandDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  playerBrandText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.85,
  },
  playerLiveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  playerLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.success,
  },
  playerHint: {
    color: 'rgba(255,255,255,0.44)',
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  neonShell: {
    width: '100%',
    aspectRatio: 1.68,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,19,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 3,
    ...shadow.card,
  },
  neonRotor: {
    position: 'absolute',
    width: '175%',
    height: '310%',
    left: '-37.5%',
    top: '-105%',
  },
  videoFrame: {
    flex: 1,
    borderRadius: 27,
    overflow: 'hidden',
    backgroundColor: 'rgba(1,4,8,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  glassRim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  glassHighlightTop: {
    position: 'absolute',
    top: 1,
    left: 22,
    right: 22,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  glassHighlightLeft: {
    position: 'absolute',
    top: 18,
    bottom: 42,
    left: 1,
    width: 1,
    backgroundColor: 'rgba(88,244,255,0.20)',
  },
  video: {
    flex: 1,
    backgroundColor: palette.black,
  },
  cinemaControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  cinemaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nowPlayingPill: {
    flex: 1,
    maxWidth: '48%',
    minHeight: 28,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(3,5,9,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nowPlayingPulse: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.magenta,
    ...shadow.cyanGlow,
  },
  nowPlayingTitle: {
    flex: 1,
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 8,
    textAlign: 'left',
  },
  cinemaTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniPlayerButton: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(3,5,9,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayerButtonText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.3,
  },
  cinemaCenterControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 19,
  },
  playerRoundButton: {
    width: 62,
    height: 62,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(3,5,9,0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  playerRoundButtonCompact: {
    width: 46,
    height: 46,
    borderRadius: 18,
  },
  playerRoundButtonPrimary: {
    width: 64,
    height: 64,
    borderColor: 'rgba(88,244,255,0.36)',
    backgroundColor: 'rgba(3,5,9,0.70)',
    ...shadow.cyanGlow,
  },
  playerRoundButtonText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 20,
    lineHeight: 24,
  },
  playerRoundButtonTextCompact: {
    color: palette.text,
    fontSize: 9,
  },
  cinemaBottom: {
    gap: 3,
  },
  progressHitArea: {
    height: 24,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'visible',
  },
  progressFill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  progressKnob: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.cyan,
  },
  timeRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 8,
    fontVariant: ['tabular-nums'],
  },
  timeDivider: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: palette.textDim,
  },
  timeDuration: {
    color: palette.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 8,
    fontVariant: ['tabular-nums'],
  },
  cinemaSignalLine: {
    flex: 1,
    height: 1,
    marginLeft: 4,
    backgroundColor: 'rgba(88,244,255,0.20)',
  },
  cinemaSignalText: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: fontFamily.black,
    fontSize: 6,
    letterSpacing: 0.6,
  },
  poster: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlayAura: {
    width: 106,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlayOrbit: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.15)',
    transform: [{ rotate: '45deg' }],
  },
  posterPlayOuter: {
    width: 80,
    height: 80,
    borderRadius: 31,
    backgroundColor: 'rgba(3,5,9,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlayInner: {
    width: 59,
    height: 59,
    borderRadius: 22,
    backgroundColor: 'rgba(3,5,9,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cyanGlow,
  },
  posterPlayGlyph: {
    color: palette.white,
    fontSize: 20,
    marginLeft: 3,
  },
  posterBottom: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  posterSignal: {
    width: 30,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.cyan,
  },
  posterText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontSize: 7,
    letterSpacing: 0.9,
    textAlign: 'right',
  },
  posterSubtext: {
    color: 'rgba(255,255,255,0.40)',
    fontFamily: fontFamily.medium,
    fontSize: 6,
    letterSpacing: 0.45,
    marginTop: 2,
    textAlign: 'right',
  },
  afterglow: {
    width: '90%',
    height: 4,
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 4,
    overflow: 'hidden',
    opacity: 0.88,
  },
  imageFrame: { width: '100%', height: 454, backgroundColor: palette.surface },
  topControls: { position: 'absolute', zIndex: 10, top: 54, left: layout.screenPadding, right: layout.screenPadding, flexDirection: 'row', justifyContent: 'space-between' },
  roundControl: { width: 46, height: 46, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(3,5,9,0.54)', alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  roundControlText: { color: palette.white, fontSize: 24, fontWeight: fontWeight.bold },
  body: { flex: 1, marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: palette.ink, paddingHorizontal: layout.screenPadding, paddingTop: spacing.xl, paddingBottom: 72 },
  videoBody: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  storySignalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginBottom: spacing.sm },
  storySignal: { width: 28, height: 2, borderRadius: 2, backgroundColor: palette.cyan },
  storySignalVideo: { backgroundColor: palette.magenta },
  storyType: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  storyTypeVideo: { color: palette.magenta },
  storyMetaDivider: { width: 3, height: 3, borderRadius: 3, backgroundColor: palette.textDim },
  storyMeta: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 9 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 27, lineHeight: 38, fontWeight: fontWeight.black, textAlign: 'right', letterSpacing: -0.5 },
  excerpt: { color: palette.textMuted, fontSize: 14, lineHeight: 26, marginTop: spacing.sm },
  channelCard: { minHeight: 78, marginTop: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.032)', padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  channelIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subscribeButton: { minWidth: 92, height: 40, borderRadius: 14, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  subscribeButtonActive: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: palette.line },
  subscribeText: { color: palette.ink, fontFamily: fontFamily.black, fontSize: 9 },
  subscribeTextActive: { color: palette.text },
  channelSignalBox: { minWidth: 70, height: 44, borderRadius: radii.md, backgroundColor: 'rgba(88,244,255,0.055)', borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  channelSignalText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.8 },
  channelSignalDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.success, marginTop: 4 },
  channelCopy: { flex: 1, alignItems: 'flex-end' },
  channelName: { color: palette.text, fontFamily: fontFamily.black, fontSize: 14 },
  channelMeta: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3 },
  channelAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  channelFallback: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(24,124,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  channelFallbackCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  actions: { gap: spacing.sm, marginTop: spacing.lg, paddingRight: 1 },
  actionTile: { minWidth: 92, minHeight: 48, paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionTileActive: { borderColor: 'rgba(88,244,255,0.26)', backgroundColor: 'rgba(88,244,255,0.075)', ...shadow.cyanGlow },
  actionSymbol: { color: palette.textMuted, fontSize: 19 },
  actionSymbolActive: { color: palette.cyan },
  actionLabel: { color: palette.text, fontFamily: fontFamily.black, fontSize: 9 },
  actionLabelActive: { color: palette.white },
  actionValue: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 8 },
  playlistPanel: { marginTop: spacing.xxxl, borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.16)', backgroundColor: 'rgba(10,16,26,0.82)', padding: spacing.sm, ...shadow.soft },
  playlistBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.92 },
  playlistHeader: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  playlistArrow: { width: 8, height: 8, borderLeftWidth: 1.4, borderBottomWidth: 1.4, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  playlistHeaderCopy: { flex: 1, alignItems: 'flex-end' },
  playlistKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.9 },
  playlistTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 17, marginTop: 3 },
  playlistMeta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3 },
  playlistStack: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  stackBack: { position: 'absolute', width: 42, height: 50, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(167,123,255,0.20)', backgroundColor: 'rgba(167,123,255,0.06)', transform: [{ rotate: '-10deg' }, { translateX: -7 }] },
  stackFront: { width: 44, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(88,244,255,0.22)', backgroundColor: 'rgba(3,5,9,0.64)', alignItems: 'center', justifyContent: 'center' },
  stackCount: { color: palette.white, fontFamily: fontFamily.black, fontSize: 14 },
  playlistItems: { gap: 7, paddingTop: 4 },
  playlistItem: { minHeight: 72, borderRadius: 18, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)' },
  playlistItemCurrent: { backgroundColor: 'rgba(88,244,255,0.055)', borderColor: 'rgba(88,244,255,0.16)' },
  playlistThumb: { width: 92, aspectRatio: 16 / 9, borderRadius: 13, overflow: 'hidden', backgroundColor: palette.surface },
  nowPlaying: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,5,9,0.44)', alignItems: 'center', justifyContent: 'center' },
  nowPlayingText: { color: palette.cyan, fontSize: 13 },
  playlistItemCopy: { flex: 1, alignItems: 'flex-end' },
  playlistItemIndex: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 7, letterSpacing: 0.7 },
  playlistItemIndexCurrent: { color: palette.cyan },
  playlistItemTitle: { color: palette.text, fontFamily: fontFamily.black, fontSize: 12, lineHeight: 18, textAlign: 'right', marginTop: 3 },
  playlistMore: { minHeight: 44, marginTop: spacing.sm, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9 },
  playlistMoreText: { color: palette.textMuted, fontFamily: fontFamily.black, fontSize: 9 },
  playlistMoreArrow: { width: 6, height: 6, borderLeftWidth: 1.2, borderBottomWidth: 1.2, borderColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  articleWrap: { marginTop: spacing.xxxl, flexDirection: 'row-reverse', gap: spacing.md },
  articleSignal: { width: 18, alignItems: 'center' },
  articleSignalCore: { width: 2, flex: 1, minHeight: 160, borderRadius: 2, backgroundColor: 'rgba(88,244,255,0.16)' },
  articleBlocks: { flex: 1, gap: spacing.md },
  articleParagraph: { color: '#D8DEE8', fontFamily: fontFamily.regular, fontSize: typeScale.body, lineHeight: 31, textAlign: 'right', writingDirection: 'rtl' },
  articleH1: { color: palette.white, fontFamily: fontFamily.black, fontSize: 28, lineHeight: 38, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.sm },
  articleH2: { color: palette.white, fontFamily: fontFamily.black, fontSize: 23, lineHeight: 33, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.md },
  articleH3: { color: palette.text, fontFamily: fontFamily.black, fontSize: 19, lineHeight: 29, fontWeight: fontWeight.black, textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.sm },
  articleQuote: { minHeight: 86, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(167,123,255,0.18)', backgroundColor: 'rgba(167,123,255,0.055)', padding: spacing.md, flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'stretch' },
  articleQuoteLine: { width: 3, borderRadius: 3, backgroundColor: palette.violet },
  articleQuoteText: { flex: 1, color: palette.text, fontFamily: fontFamily.bold, fontSize: typeScale.bodySm, lineHeight: 25, fontWeight: fontWeight.bold, textAlign: 'right', writingDirection: 'rtl' },
  articleListRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  articleListDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: palette.cyan, marginTop: 11 },
  articleListText: { flex: 1, color: '#D8DEE8', fontFamily: fontFamily.regular, fontSize: typeScale.body, lineHeight: 29, textAlign: 'right', writingDirection: 'rtl' },
  articleToggle: { minHeight: 44, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', backgroundColor: 'rgba(88,244,255,0.04)', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  articleToggleDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  articleToggleText: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 10 },
  related: { marginTop: spacing.massive },
  relatedList: { marginTop: spacing.md, gap: spacing.md },
  relatedRow: { flexDirection: 'row', gap: spacing.sm },
  relatedIndex: { width: 28, paddingTop: spacing.sm, alignItems: 'center' },
  relatedIndexText: { color: palette.textDim, fontFamily: fontFamily.black, fontSize: 9 },
  relatedCard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorKicker: { color: palette.danger, fontFamily: fontFamily.black, fontSize: 9, letterSpacing: 1 },
  errorTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, marginTop: 5 },
  errorText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: typeScale.bodySm, textAlign: 'center', marginTop: spacing.sm },
  backButton: { marginTop: spacing.xl, backgroundColor: palette.white, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  backText: { color: palette.ink, fontFamily: fontFamily.black },
  skeletonPage: { flex: 1, backgroundColor: palette.ink },
  skeletonBody: { padding: layout.screenPadding, gap: spacing.md },
});
