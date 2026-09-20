import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';
import type { ContentCard as ContentItem, SearchPayload } from '@/types/api';

type Row =
  | { type: 'content'; id: string; data: ContentItem }
  | { type: 'channel'; id: string; data: Record<string, unknown> }
  | { type: 'product'; id: string; data: Record<string, unknown> };

export default function SearchScreen() {
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const q = term.trim();
    if (!q) return;
    setLoading(true);

    try {
      const result = await apiRequest<SearchPayload>('/search?q=' + encodeURIComponent(q));
      setRows([
        ...result.content.map((data) => ({ type: 'content' as const, id: 'content-' + data.id, data })),
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

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>جستجو</Text>
        <View style={styles.searchRow}>
          <PressableScale onPress={() => void search()} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>برو</Text>
          </PressableScale>
          <TextInput
            value={term}
            onChangeText={setTerm}
            onSubmitEditing={() => void search()}
            placeholder="بازی، ویدیو، استودیو، محصول…"
            placeholderTextColor={palette.textDim}
            returnKeyType="search"
            autoFocus
            textAlign="right"
            style={styles.input}
          />
        </View>
      </View>

      <FlashList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'content') {
            return (
              <View style={styles.cardRow}>
                <ContentCard
                  item={item.data}
                  width="100%"
                  onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.data.slug } })}
                />
              </View>
            );
          }

          const title = String(item.data.name || item.data.title || 'PlayNexus');
          return (
            <View style={styles.resultRow}>
              <Text style={styles.resultType}>{item.type === 'channel' ? 'CHANNEL' : 'STORE'}</Text>
              <Text style={styles.resultTitle}>{title}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{loading ? 'در حال جستجو…' : 'هر چیزی از دنیای گیم را پیدا کن'}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    color: palette.white,
    fontSize: 32,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.045)',
    color: palette.white,
    paddingHorizontal: spacing.lg,
    fontSize: typeScale.body,
  },
  searchButton: {
    width: 62,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: palette.ink, fontWeight: fontWeight.black },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 64 },
  cardRow: { marginBottom: spacing.md },
  resultRow: {
    minHeight: 76,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  resultType: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  resultTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontWeight: fontWeight.bold,
    marginTop: 4,
  },
  empty: { paddingVertical: 120, alignItems: 'center' },
  emptyTitle: { color: palette.textMuted, fontSize: typeScale.body, fontWeight: fontWeight.semibold },
});
