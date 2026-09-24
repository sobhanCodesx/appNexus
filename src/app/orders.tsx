import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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
import { usePaginatedResource } from '@/hooks/use-paginated-resource';

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

const statusTone: Record<string, string> = {
  pending: palette.warning,
  approved: palette.blue,
  processing: palette.violet,
  shipped: palette.cyan,
  delivered: palette.success,
  rejected: palette.danger,
  cancelled: palette.danger,
};

export default function OrdersScreen() {
  const { data, refreshing, refresh, loadMore, loadingMore } =
    usePaginatedResource<Order>('/orders');

  const orders = data.data || [];
  const activeCount = orders.filter((order) =>
    ['pending', 'approved', 'processing', 'shipped'].includes(order.status),
  ).length;
  const deliveredCount = orders.filter(
    (order) => order.status === 'delivered',
  ).length;

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.eyebrow}>ORDER CENTER</Text>
          </View>
          <Text style={styles.title}>سفارش‌های من</Text>
        </View>
      </View>

      <FlashList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.overview}>
            <LinearGradient
              colors={[
                'rgba(24,124,255,0.12)',
                'rgba(167,123,255,0.06)',
                'rgba(8,14,23,0.88)',
              ]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.overviewCopy}>
              <Text style={styles.overviewKicker}>YOUR PURCHASE SIGNALS</Text>
              <Text style={styles.overviewTitle}>هر سفارش، یک مسیر قابل پیگیری</Text>
              <Text style={styles.overviewText}>
                وضعیت خریدها از همین‌جا به‌روز می‌شه؛ از تأیید تا تحویل.
              </Text>
            </View>

            <View style={styles.overviewMetrics}>
              <Metric value={orders.length} label="TOTAL" />
              <Metric value={activeCount} label="ACTIVE" />
              <Metric value={deliveredCount} label="DONE" />
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const tone = statusTone[item.status] || palette.blue;

          return (
            <PressableScale
              style={styles.order}
              onPress={() => router.push({
                pathname: '/order/[id]',
                params: { id: String(item.id) },
              })}>
              <View style={[styles.orderSignal, { backgroundColor: tone }]} />

              <View style={styles.orderIndex}>
                <Text style={styles.orderIndexText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.orderBody}>
                <View style={styles.orderTop}>
                  <View
                    style={[
                      styles.status,
                      {
                        borderColor: tone + '44',
                        backgroundColor: tone + '12',
                      },
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: tone },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: tone }]}>
                      {statusLabel[item.status] || item.status}
                    </Text>
                  </View>

                  <View style={styles.orderCopy}>
                    <Text style={styles.number}>{item.number}</Text>
                    <Text style={styles.date}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('fa-IR')
                        : ''}
                    </Text>
                  </View>
                </View>

                <Text style={styles.total}>{money(item.grand_total)}</Text>

                {item.items?.length ? (
                  <Text numberOfLines={1} style={styles.items}>
                    {item.items.map((line) => line.title).join('، ')}
                  </Text>
                ) : null}

                <View style={styles.orderFooter}>
                  <Text style={styles.itemCount}>
                    {(item.items?.length || 0).toLocaleString('fa-IR')} آیتم
                  </Text>
                  <View style={styles.openOrb}>
                    <View style={styles.openArrow} />
                  </View>
                </View>
              </View>
            </PressableScale>
          );
        }}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListFooterComponent={loadingMore ? <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>سفارش‌های بیشتر…</Text></View> : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyOrbit}>
              <View style={styles.emptyCore} />
            </View>
            <Text style={styles.emptyKicker}>NO ORDERS YET</Text>
            <Text style={styles.emptyTitle}>هنوز سفارشی نداری</Text>
            <PressableScale
              onPress={() => router.push('/store')}
              style={styles.storeButton}>
              <Text style={styles.storeButtonText}>رفتن به Store</Text>
            </PressableScale>
          </View>
        }
      />
    </Screen>
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
  headerCopy: {
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
  },
  eyebrow: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 80,
  },
  overview: {
    minHeight: 188,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(8,14,23,0.88)',
    overflow: 'hidden',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.soft,
  },
  overviewCopy: {
    alignItems: 'flex-end',
  },
  overviewKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  overviewTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 4,
  },
  overviewText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 5,
  },
  overviewMetrics: {
    marginTop: spacing.lg,
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  metric: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  metricLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  order: {
    minHeight: 172,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  orderSignal: {
    position: 'absolute',
    top: 0,
    right: 22,
    width: 54,
    height: 2,
  },
  orderIndex: {
    width: 28,
    paddingTop: 4,
    alignItems: 'center',
  },
  orderIndexText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  orderBody: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  orderCopy: {
    alignItems: 'flex-end',
  },
  number: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  date: {
    color: palette.textDim,
    fontSize: typeScale.micro,
    marginTop: 3,
  },
  status: {
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  total: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: spacing.lg,
  },
  items: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.xs,
    textAlign: 'right',
    width: '100%',
  },
  orderFooter: {
    width: '100%',
    marginTop: 'auto',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCount: {
    color: palette.textDim,
    fontSize: 9,
  },
  openOrb: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  loadingMore: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadingMoreText: { color: palette.textDim, fontSize: 10 },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyOrbit: {
    width: 80,
    height: 80,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.textMuted,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  storeButton: {
    minHeight: 48,
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeButtonText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
});
