import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type WatchEntry = { content_id: number; position: number; duration: number; completed: boolean; updated_at?: string | null };
type Payload = { progress: Record<string, WatchEntry> };

export default function WatchProgressScreen() {
  const { data, refreshing, refresh } = useApiResource<Payload>('/watch-progress', { progress: {} });
  const entries = Object.values(data.progress || {}).sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));

  const remove = async (id: number) => {
    await apiRequest('/watch-progress/' + id, { method: 'DELETE' });
    invalidateResource('/watch-progress');
    await refresh();
  };

  return (
    <Screen>
      <PageHeader title="Continue Watching" subtitle="WATCH HISTORY" />
      <FlashList
        data={entries}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const percent = item.duration > 0 ? Math.min(100, Math.round(item.position / item.duration * 100)) : 0;
          return (
            <View style={styles.card}>
              <View style={styles.copy}>
                <Text style={styles.title}>محتوا #{item.content_id.toLocaleString('fa-IR')}</Text>
                <Text style={styles.meta}>{item.completed ? 'تماشا کامل شده' : item.position.toLocaleString('fa-IR') + ' / ' + item.duration.toLocaleString('fa-IR') + ' ثانیه'}</Text>
                <View style={styles.track}><View style={[styles.fill, { width: (percent + '%') as `${number}%` }]} /></View>
              </View>
              <PressableScale onPress={() => void remove(item.content_id)} style={styles.remove}><Text style={styles.removeText}>پاک</Text></PressableScale>
            </View>
          );
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>هنوز پیشرفت تماشایی ثبت نشده.</Text></View>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80 },
  card: { minHeight: 98, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, alignItems: 'flex-end' },
  title: { color: palette.white, fontFamily: fontFamily.black },
  meta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 4 },
  track: { width: '100%', height: 4, borderRadius: 4, backgroundColor: palette.line, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: 4, backgroundColor: palette.cyan },
  remove: { minWidth: 46, height: 38, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,97,120,0.18)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: palette.danger, fontFamily: fontFamily.bold, fontSize: 10 },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular },
});
