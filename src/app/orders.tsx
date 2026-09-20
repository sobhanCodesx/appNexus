import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type Order = {
  id: number;
  number: string;
  status: string;
  grand_total: number;
  cashback_amount?: number;
  created_at?: string;
  items?: { id: number; title: string; quantity: number }[];
};

function money(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}

const statusLabel: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
};

export default function OrdersScreen() {
  const { data, refreshing, refresh } = useApiResource<Paginated<Order>>('/orders', { data: [] });

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ORDER CENTER</Text>
          <Text style={styles.title}>سفارش‌های من</Text>
        </View>
      </View>

      <FlashList
        data={data.data || []}
        renderItem={({ item }) => (
          <PressableScale
            style={styles.order}
            onPress={() => router.push({ pathname: '/order/[id]', params: { id: String(item.id) } })}>
            <View style={styles.orderTop}>
              <View style={styles.status}><Text style={styles.statusText}>{statusLabel[item.status] || item.status}</Text></View>
              <View style={styles.orderCopy}>
                <Text style={styles.number}>{item.number}</Text>
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : ''}</Text>
              </View>
            </View>
            <Text style={styles.total}>{money(item.grand_total)}</Text>
            {item.items?.length ? (
              <Text numberOfLines={1} style={styles.items}>{item.items.map((line) => line.title).join('، ')}</Text>
            ) : null}
          </PressableScale>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyTitle}>هنوز سفارشی نداری</Text></View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 60 },
  order: { minHeight: 150, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', padding: spacing.lg, marginBottom: spacing.md, alignItems: 'flex-end' },
  orderTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderCopy: { alignItems: 'flex-end' },
  number: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black },
  date: { color: palette.textDim, fontSize: typeScale.micro, marginTop: 3 },
  status: { borderRadius: radii.pill, backgroundColor: 'rgba(77,163,255,0.10)', borderWidth: 1, borderColor: 'rgba(77,163,255,0.25)', paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: palette.cyan, fontSize: 10, fontWeight: fontWeight.bold },
  total: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black, marginTop: spacing.lg },
  items: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: spacing.xs, textAlign: 'right', width: '100%' },
  empty: { paddingTop: 120, alignItems: 'center' },
  emptyTitle: { color: palette.textMuted, fontSize: typeScale.body, fontWeight: fontWeight.bold },
});
