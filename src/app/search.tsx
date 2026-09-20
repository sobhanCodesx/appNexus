import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { apiRequest } from '@/services/api';
import type { ContentCard as ContentItem, SearchPayload } from '@/types/api';

type Row =
  | { type: 'content'; id: string; data: ContentItem }
  | { type: 'channel'; id: string; data: Record<string, unknown> }
  | { type: 'product'; id: string; data: Record<string, unknown> };

type Suggestion = {
  id: string;
  kind: 'product' | 'post' | 'video' | 'short' | 'channel' | 'category';
  kind_label: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  url?: string | null;
};

export default function SearchScreen() {
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState('');

  useEffect(() => {
    const q = term.trim();

    if (q.length < 2) {
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      setSuggesting(true);

      void apiRequest<{ suggestions: Suggestion[] }>(
        '/search/suggestions?q=' + encodeURIComponent(q),
        {},
        { auth: false },
      )
        .then((result) => {
          if (active) setSuggestions(result.suggestions || []);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setSuggesting(false);
        });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  const search = async (value?: string) => {
    const q = (value ?? term).trim();
    if (!q) return;

    Keyboard.dismiss();
    setLoading(true);
    setSearchedTerm(q);

    try {
      const result = await apiRequest<SearchPayload>(
        '/search?q=' + encodeURIComponent(q),
        {},
        { auth: false },
      );

      setRows([
        ...result.content.map((data) => ({
          type: 'content' as const,
          id: 'content-' + data.id,
          data,
        })),
        ...result.channels.map((data) => ({
          type: 'channel' as const,
          id: 'channel-' + String(data.id),
          data,
        })),
        ...result.products.map((data) => ({
          type: 'product' as const,
          id: 'product-' + String(data.id),
          data,
        })),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    content: rows.filter((item) => item.type === 'content').length,
    games: rows.filter((item) => item.type === 'channel').length,
    products: rows.filter((item) => item.type === 'product').length,
  }), [rows]);

  const showSuggestions = term.trim().length >= 2 && searchedTerm !== term.trim();

  return (
    <Screen>
      <View style={styles.top}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.heading}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.kicker}>NEXUS SEARCH</Text>
          </View>
          <Text style={styles.title}>چی تو ذهنت هست؟</Text>
        </View>
      </View>

      <View style={styles.searchShell}>
        <View style={styles.searchIcon}>
          <View style={styles.searchLens} />
          <View style={styles.searchHandle} />
        </View>

        <TextInput
          value={term}
          onChangeText={(value) => {
            setTerm(value);
            if (value.trim() !== searchedTerm) setRows([]);
          }}
          onSubmitEditing={() => void search()}
          placeholder="بازی، ویدیو، استودیو، محصول…"
          placeholderTextColor={palette.textDim}
          returnKeyType="search"
          autoFocus
          autoCapitalize="none"
          textAlign="right"
          style={styles.input}
        />

        {term ? (
          <PressableScale
            haptic={false}
            onPress={() => {
              setTerm('');
              setRows([]);
              setSuggestions([]);
              setSearchedTerm('');
            }}
            style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </PressableScale>
        ) : null}
      </View>

      {!term.trim() ? (
        <DiscoveryPrompt />
      ) : showSuggestions ? (
        <SuggestionPanel
          items={suggestions}
          loading={suggesting}
          onSelect={(item) => {
            if (item.kind === 'product') {
              const slug = item.url?.split('/').filter(Boolean).pop();
              if (slug) router.push({ pathname: '/product/[slug]', params: { slug } });
              return;
            }

            if (item.kind === 'channel') {
              const slug = item.url?.split('/').filter(Boolean).pop();
              if (slug) router.push({ pathname: '/channel/[slug]', params: { slug } });
              return;
            }

            if (item.kind === 'post' || item.kind === 'video' || item.kind === 'short') {
              const slug = item.url?.split('/').filter(Boolean).pop();
              if (slug) router.push({ pathname: '/content/[slug]', params: { slug } });
              return;
            }

            setTerm(item.title);
            void search(item.title);
          }}
          onSearchAll={() => void search()}
        />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <ResultHeader
              term={searchedTerm}
              loading={loading}
              stats={stats}
            />
          }
          renderItem={({ item, index }) => {
            if (item.type === 'content') {
              return (
                <View style={styles.contentResult}>
                  <View style={styles.resultIndex}>
                    <Text style={styles.resultIndexText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.contentCard}>
                    <ContentCard
                      item={item.data}
                      width="100%"
                      onPress={() => router.push({
                        pathname: '/content/[slug]',
                        params: { slug: item.data.slug },
                      })}
                    />
                  </View>
                </View>
              );
            }

            const title = String(item.data.name || item.data.title || 'PlayNexus');
            const slug = typeof item.data.slug === 'string' ? item.data.slug : '';
            const image = typeof item.data.cover_url === 'string'
              ? item.data.cover_url
              : typeof item.data.image_url === 'string'
                ? item.data.image_url
                : null;

            return (
              <PressableScale
                style={styles.entityResult}
                onPress={() => {
                  if (!slug) return;
                  if (item.type === 'channel') {
                    router.push({ pathname: '/channel/[slug]', params: { slug } });
                  } else {
                    router.push({ pathname: '/product/[slug]', params: { slug } });
                  }
                }}>
                <View style={styles.entityArrow}>
                  <View style={styles.entityArrowIcon} />
                </View>

                <View style={styles.entityCopy}>
                  <Text style={styles.entityKind}>
                    {item.type === 'channel' ? 'GAME CHANNEL' : 'STORE ITEM'}
                  </Text>
                  <Text numberOfLines={2} style={styles.entityTitle}>{title}</Text>
                </View>

                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.entityImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.entityFallback}>
                    <View style={styles.entityFallbackCore} />
                  </View>
                )}
              </PressableScale>
            );
          }}
          ListEmptyComponent={
            !loading && searchedTerm ? (
              <View style={styles.empty}>
                <View style={styles.emptyOrbit}>
                  <View style={styles.emptyCore} />
                </View>
                <Text style={styles.emptyKicker}>NO MATCH FOUND</Text>
                <Text style={styles.emptyTitle}>چیزی پیدا نکردیم</Text>
                <Text style={styles.emptyText}>
                  عبارت کوتاه‌تر یا اسم بازی/محصول رو امتحان کن.
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.results}
        />
      )}
    </Screen>
  );
}

function DiscoveryPrompt() {
  return (
    <View style={styles.prompt}>
      <View style={styles.promptVisual}>
        <View style={styles.orbitLarge}>
          <View style={styles.orbitMid}>
            <View style={styles.orbitCore} />
          </View>
        </View>
      </View>

      <Text style={styles.promptKicker}>SEARCH THE NEXUS</Text>
      <Text style={styles.promptTitle}>از هرجای PlayNexus شروع کن</Text>
      <Text style={styles.promptBody}>
        اسم بازی، استودیو، ویدیو یا محصول رو بزن؛ نتیجه‌ها رو از کل PlayNexus یک‌جا می‌بینی.
      </Text>

      <View style={styles.promptChips}>
        <View style={styles.promptChip}><Text style={styles.promptChipText}>GAME</Text></View>
        <View style={styles.promptChip}><Text style={styles.promptChipText}>VIDEO</Text></View>
        <View style={styles.promptChip}><Text style={styles.promptChipText}>STORE</Text></View>
      </View>
    </View>
  );
}

function SuggestionPanel({
  items,
  loading,
  onSelect,
  onSearchAll,
}: {
  items: Suggestion[];
  loading: boolean;
  onSelect: (item: Suggestion) => void;
  onSearchAll: () => void;
}) {
  return (
    <View style={styles.suggestionPanel}>
      <View style={styles.suggestionHeading}>
        <Text style={styles.suggestionKicker}>LIVE SUGGESTIONS</Text>
        <Text style={styles.suggestionTitle}>
          {loading ? 'دارم می‌گردم…' : 'شاید منظورت اینه'}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.suggestionList}>
        {items.map((item) => (
          <PressableScale
            key={item.id}
            onPress={() => onSelect(item)}
            style={styles.suggestion}>
            <View style={styles.suggestionArrow}>
              <View style={styles.entityArrowIcon} />
            </View>

            <View style={styles.suggestionCopy}>
              <Text style={styles.suggestionKind}>{item.kind_label}</Text>
              <Text numberOfLines={1} style={styles.suggestionName}>{item.title}</Text>
              {item.subtitle ? (
                <Text numberOfLines={1} style={styles.suggestionSubtitle}>{item.subtitle}</Text>
              ) : null}
            </View>

            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.suggestionImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.suggestionFallback}>
                <View style={styles.suggestionFallbackCore} />
              </View>
            )}
          </PressableScale>
        ))}

        {!loading ? (
          <PressableScale onPress={onSearchAll} style={styles.searchAll}>
            <Text style={styles.searchAllText}>نمایش همه نتایج</Text>
            <View style={styles.searchAllArrow} />
          </PressableScale>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultHeader({
  term,
  loading,
  stats,
}: {
  term: string;
  loading: boolean;
  stats: { content: number; games: number; products: number };
}) {
  return (
    <View style={styles.resultHeader}>
      <View style={styles.resultHeading}>
        <Text style={styles.resultKicker}>SEARCH RESULT</Text>
        <Text style={styles.resultTitle}>
          {loading ? 'در حال پیدا کردن…' : 'نتیجه برای «' + term + '»'}
        </Text>
      </View>

      {!loading ? (
        <View style={styles.resultStats}>
          <MiniStat value={stats.content} label="CONTENT" />
          <MiniStat value={stats.games} label="GAMES" />
          <MiniStat value={stats.products} label="STORE" />
        </View>
      ) : null}
    </View>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value.toLocaleString('fa-IR')}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: palette.white,
    fontSize: 27,
    fontWeight: fontWeight.bold,
  },
  heading: {
    flex: 1,
    alignItems: 'flex-end',
  },
  signalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  kicker: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  searchShell: {
    height: 64,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(10,16,26,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadow.soft,
  },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(88,244,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLens: {
    width: 13,
    height: 13,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: palette.cyan,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  searchHandle: {
    position: 'absolute',
    width: 7,
    height: 1.6,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }, { translateX: 5 }, { translateY: 5 }],
  },
  input: {
    flex: 1,
    height: 62,
    color: palette.white,
    fontSize: typeScale.body,
    textAlign: 'right',
  },
  clear: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: palette.textMuted,
    fontSize: 22,
    lineHeight: 23,
  },
  prompt: {
    flex: 1,
    paddingHorizontal: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  promptVisual: {
    marginBottom: spacing.xxl,
  },
  orbitLarge: {
    width: 180,
    height: 180,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitMid: {
    width: 112,
    height: 112,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCore: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  promptKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  promptTitle: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  promptBody: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  promptChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  promptChip: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  suggestionPanel: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  suggestionHeading: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  suggestionKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  suggestionTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  suggestionList: {
    gap: spacing.sm,
    paddingBottom: 60,
  },
  suggestion: {
    minHeight: 78,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  suggestionArrow: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  suggestionKind: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  suggestionName: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 2,
    textAlign: 'right',
  },
  suggestionSubtitle: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 2,
  },
  suggestionImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.surface,
  },
  suggestionFallback: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(24,124,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionFallbackCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  searchAll: {
    minHeight: 54,
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    backgroundColor: 'rgba(88,244,255,0.05)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  searchAllText: {
    color: palette.cyan,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  searchAllArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  results: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 70,
  },
  resultHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  resultHeading: {
    alignItems: 'flex-end',
  },
  resultKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  resultTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 4,
    textAlign: 'right',
  },
  resultStats: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  miniStat: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  miniStatLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  contentResult: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultIndex: {
    width: 28,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  resultIndexText: {
    color: palette.textDim,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  contentCard: {
    flex: 1,
  },
  entityResult: {
    minHeight: 86,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  entityArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityArrowIcon: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  entityCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  entityKind: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  entityTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 3,
  },
  entityImage: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: palette.surface,
  },
  entityFallback: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: 'rgba(24,124,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityFallbackCore: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyOrbit: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
