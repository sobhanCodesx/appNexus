import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { nativeHrefFromUrl } from '@/services/native-navigation';
import { invalidateResource } from '@/services/resource-cache';
import type { Paginated } from '@/types/api';

type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  url?: string | null;
  read_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export default function NotificationsScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<NotificationItem>>('/notifications', { data: [] });

  const readAll = async () => {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    invalidateResource('/notifications');
    await refresh();
  };

  const mark = async (item: NotificationItem) => {
    let target = item.url || null;

    if (!item.read_at) {
      const result = await apiRequest<{ read: boolean; id: string; url?: string | null }>(
        '/notifications/' + item.id,
        { method: 'PATCH' },
      );
      target = result.url ?? target;
      invalidateResource('/notifications');
      await refresh();
    }

    const href = nativeHrefFromUrl(target);
    if (href) router.push(href);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <PressableScale onPress={() => void readAll()} style={styles.readAll}><Text style={styles.readAllText}>خواندن همه</Text></PressableScale>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>SIGNALS</Text>
          <Text style={styles.title}>اعلان‌ها</Text>
        </View>
      </View>

      <FlashList
        data={data.data || []}
        renderItem={({ item }) => (
          <PressableScale
            haptic
            onPress={() => void mark(item)}
            style={[styles.notification, !item.read_at && styles.unread]}>
            {!item.read_at ? <View style={styles.dot} /> : null}
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationTitle}>{String(item.title || 'PlayNexus')}</Text>
              <Text style={styles.notificationBody}>{String(item.message || item.body || '')}</Text>
              <Text style={styles.notificationDate}>
                {item.created_at ? new Date(item.created_at).toLocaleString('fa-IR') : ''}
              </Text>
            </View>
          </PressableScale>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>فعلاً اعلان جدیدی نیست.</Text></View>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  readAll: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  readAllText: { color: palette.textMuted, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 60 },
  notification: {
    minHeight: 112, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)', padding: spacing.lg,
    marginBottom: spacing.sm, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
  },
  unread: { borderColor: 'rgba(77,163,255,0.30)', backgroundColor: 'rgba(77,163,255,0.06)' },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: palette.cyan, marginTop: 7 },
  notificationCopy: { flex: 1, alignItems: 'flex-end' },
  notificationTitle: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black, textAlign: 'right' },
  notificationBody: { color: palette.textMuted, fontSize: typeScale.bodySm, lineHeight: 21, textAlign: 'right', marginTop: 5 },
  notificationDate: { color: palette.textDim, fontSize: 10, marginTop: spacing.sm },
  empty: { paddingTop: 120, alignItems: 'center' },
  emptyText: { color: palette.textMuted },
});
