import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import { apiRequest } from '@/services/api';
import { nativeHrefFromUrl } from '@/services/native-navigation';
import { requestNotificationStateRefresh } from '@/services/notification-state';
import { invalidateResource } from '@/services/resource-cache';

type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  url?: string | null;
  read_at?: string | null;
  created_at?: string | null;
  activity?: string | null;
  content_type?: string | null;
  order_id?: number | null;
  ticket_id?: number | null;
  [key: string]: unknown;
};

type Filter = 'all' | 'unread';

function relativeTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return '';
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return minutes.toLocaleString('fa-IR') + ' دقیقه پیش';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours.toLocaleString('fa-IR') + ' ساعت پیش';
  const days = Math.floor(hours / 24);
  if (days < 7) return days.toLocaleString('fa-IR') + ' روز پیش';
  return date.toLocaleDateString('fa-IR');
}

function signalMeta(item: NotificationItem) {
  const activity = String(item.activity || '');
  if (item.order_id) return { glyph: '▣', label: 'سفارش', accent: '#FFD166' };
  if (item.ticket_id) return { glyph: '⌁', label: 'پشتیبانی', accent: '#A77BFF' };
  if (activity === 'reply' || activity === 'mention' || activity === 'comment') {
    return { glyph: '◌', label: 'گفتگو', accent: '#58F4FF' };
  }
  if (activity === 'reaction' || activity === 'comment_like') {
    return { glyph: '♥', label: 'تعامل', accent: '#FF55D5' };
  }
  if (activity === 'content_published') {
    return { glyph: '▶', label: item.content_type === 'post' ? 'فید' : 'محتوا', accent: '#4DA3FF' };
  }
  return { glyph: '◆', label: 'PlayNexus', accent: '#58F4FF' };
}

export default function NotificationsScreen() {
  const { data, loading, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<NotificationItem>('/notifications');
  const [filter, setFilter] = useState<Filter>('all');

  const items = data.data || [];
  const unreadCount = items.filter((item) => !item.read_at).length;
  const visibleItems = useMemo(
    () => filter === 'unread' ? items.filter((item) => !item.read_at) : items,
    [filter, items],
  );

  const readAll = async () => {
    if (!unreadCount) return;
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    invalidateResource('/notifications');
    invalidateResource('/me');
    requestNotificationStateRefresh();
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
      invalidateResource('/me');
      requestNotificationStateRefresh();
      await refresh();
    }

    const href = nativeHrefFromUrl(target);
    if (href) router.push(href);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.eyebrowRow}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrow}>SIGNAL CENTER</Text>
          </View>
          <Text style={styles.title}>اعلان‌ها</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroStat}>
          <Text style={styles.heroNumber}>{unreadCount.toLocaleString('fa-IR')}</Text>
          <Text style={styles.heroLabel}>خوانده‌نشده</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>NEXUS SIGNALS</Text>
          <Text style={styles.heroTitle}>هیچ اتفاق مهمی رو از دست نده</Text>
          <Text style={styles.heroText}>فید، واکنش‌ها، سفارش‌ها و پشتیبانی در یک مرکز زنده.</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filters}>
          <FilterButton label="همه" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterButton
            label={'جدید ' + unreadCount.toLocaleString('fa-IR')}
            active={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
        </View>

        <PressableScale haptic={false} onPress={() => void readAll()} style={styles.readAll}>
          <Text style={styles.readAllText}>خواندن همه</Text>
        </PressableScale>
      </View>

      <FlashList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationCard item={item} onPress={() => void mark(item)} />}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListEmptyComponent={
          loading ? <NotificationSkeleton /> : (
            <View style={styles.empty}>
              <View style={styles.emptyOrb}><View style={styles.emptyCore} /></View>
              <Text style={styles.emptyTitle}>{filter === 'unread' ? 'همه‌چی دیده شده' : 'فعلاً سیگنالی نیست'}</Text>
              <Text style={styles.emptyText}>وقتی اتفاقی برای حساب یا محتوای مورد علاقه‌ات بیفته، اینجا ظاهر می‌شه.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? <View style={styles.loading}><View style={styles.loadingDot} /><Text style={styles.loadingText}>سیگنال‌های بیشتر…</Text></View> : null
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale haptic={false} onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </PressableScale>
  );
}

function NotificationCard({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const meta = signalMeta(item);
  const unread = !item.read_at;

  return (
    <PressableScale haptic onPress={onPress} style={[styles.card, unread && styles.cardUnread]}>
      <View style={[styles.iconShell, { borderColor: meta.accent + '45', backgroundColor: meta.accent + '12' }]}>
        <Text style={[styles.iconGlyph, { color: meta.accent }]}>{meta.glyph}</Text>
      </View>

      <View style={styles.cardCopy}>
        <View style={styles.cardTop}>
          <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
          <View style={styles.category}>
            <Text style={[styles.categoryText, { color: meta.accent }]}>{meta.label}</Text>
            {unread ? <View style={[styles.unreadDot, { backgroundColor: meta.accent }]} /> : null}
          </View>
        </View>
        <Text numberOfLines={2} style={styles.cardTitle}>{String(item.title || 'PlayNexus')}</Text>
        <Text numberOfLines={3} style={styles.cardBody}>{String(item.message || item.body || '')}</Text>
      </View>

      <View style={styles.chevron} />
    </PressableScale>
  );
}

function NotificationSkeleton() {
  return (
    <View style={styles.skeletons}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <SkeletonBox style={{ width: 48, height: 48 }} radius={16} />
          <View style={styles.skeletonCopy}>
            <SkeletonBox style={{ width: '42%', height: 9 }} radius={5} />
            <SkeletonBox style={{ width: '82%', height: 15 }} radius={6} />
            <SkeletonBox style={{ width: '96%', height: 10 }} radius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 82, paddingHorizontal: layout.screenPadding, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 27, fontFamily: fontFamily.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrowRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan, ...shadow.cyanGlow },
  eyebrow: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 30, marginTop: 2 },
  hero: { marginHorizontal: layout.screenPadding, minHeight: 144, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(88,244,255,0.15)', backgroundColor: 'rgba(10,16,26,0.76)', overflow: 'hidden', padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, ...shadow.soft },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 180, backgroundColor: 'rgba(77,163,255,0.10)', left: -75, top: -70 },
  heroStat: { width: 76, height: 84, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(88,244,255,0.18)', backgroundColor: 'rgba(88,244,255,0.055)', alignItems: 'center', justifyContent: 'center' },
  heroNumber: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 28 },
  heroLabel: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 8, marginTop: 2 },
  heroCopy: { flex: 1, alignItems: 'flex-end' },
  heroKicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  heroTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 17, textAlign: 'right', marginTop: 4 },
  heroText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 4 },
  toolbar: { minHeight: 70, paddingHorizontal: layout.screenPadding, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  filters: { flexDirection: 'row-reverse', gap: 6 },
  filter: { minHeight: 36, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.025)', alignItems: 'center', justifyContent: 'center' },
  filterActive: { borderColor: 'rgba(88,244,255,0.24)', backgroundColor: 'rgba(88,244,255,0.075)' },
  filterText: { color: palette.textMuted, fontFamily: fontFamily.bold, fontSize: 9 },
  filterTextActive: { color: palette.white },
  readAll: { minHeight: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  readAllText: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 9 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 90 },
  card: { minHeight: 112, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.025)', padding: spacing.md, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardUnread: { borderColor: 'rgba(88,244,255,0.14)', backgroundColor: 'rgba(88,244,255,0.035)' },
  iconShell: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconGlyph: { fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 17 },
  cardCopy: { flex: 1, alignItems: 'flex-end' },
  cardTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  categoryText: { fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 0.5 },
  unreadDot: { width: 5, height: 5, borderRadius: 5 },
  time: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 8 },
  cardTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: typeScale.bodySm, textAlign: 'right', marginTop: 5 },
  cardBody: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 3 },
  chevron: { width: 7, height: 7, borderLeftWidth: 1.4, borderBottomWidth: 1.4, borderColor: palette.textDim, transform: [{ rotate: '45deg' }] },
  skeletons: { gap: 9 },
  skeletonCard: { minHeight: 112, borderRadius: 22, borderWidth: 1, borderColor: palette.line, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skeletonCopy: { flex: 1, gap: 8, alignItems: 'flex-end' },
  empty: { paddingTop: 90, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyOrb: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(88,244,255,0.14)', backgroundColor: 'rgba(88,244,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  emptyCore: { width: 15, height: 15, borderRadius: 5, backgroundColor: palette.cyan, transform: [{ rotate: '45deg' }] },
  emptyTitle: { color: palette.white, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: 17, marginTop: spacing.md },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  loading: { minHeight: 60, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  loadingDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.cyan },
  loadingText: { color: palette.textDim, fontFamily: fontFamily.medium, fontSize: 8 },
});
