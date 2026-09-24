import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';

type OrderPayload = {
  order: {
    id: number;
    number: string;
    status: string;
    shipping_address?: Record<string, string | null>;
    regular_subtotal?: number;
    product_discount?: number;
    subtotal?: number;
    coupon_discount?: number;
    delivery_fee?: number;
    grand_total?: number;
    wallet_used?: number;
    payable_amount?: number;
    cashback_amount?: number;
    created_at?: string;
    items?: {
      id: number;
      title: string;
      variant_name?: string | null;
      quantity: number;
      unit_price?: number;
      line_total?: number;
    }[];
  };
};

const empty: OrderPayload = {
  order: { id: 0, number: '', status: '', items: [] },
};

const statusLabel: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
};

const statusStage: Record<string, number> = {
  pending: 1,
  approved: 2,
  processing: 3,
  shipped: 4,
  delivered: 5,
};

function money(value?: number) {
  return (value || 0).toLocaleString('fa-IR') + ' تومان';
}

export default function OrderDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data, refresh } = useApiResource<OrderPayload>(
    '/orders/' + encodeURIComponent(id || ''),
    empty,
  );
  const order = data.order;
  const stage = statusStage[order.status] || 0;

  const cancel = async () => {
    await apiRequest('/orders/' + order.id + '/cancel', {
      method: 'PATCH',
    });
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    );
    await refresh();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.eyebrow}>LIVE ORDER</Text>
          </View>
          <Text style={styles.title}>{order.number || 'سفارش'}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.statusCard}>
          <View style={styles.statusSignal} />

          <View style={styles.statusTop}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>
                {order.status === 'delivered' ? '✓' : '◎'}
              </Text>
            </View>

            <View style={styles.statusCopy}>
              <Text style={styles.statusKicker}>CURRENT STATUS</Text>
              <Text style={styles.status}>
                {statusLabel[order.status] || order.status}
              </Text>
              <Text style={styles.statusMeta}>
                {order.created_at
                  ? new Date(order.created_at).toLocaleString('fa-IR')
                  : 'PlayNexus'}
              </Text>
            </View>
          </View>

          {stage ? <OrderTimeline stage={stage} /> : null}
        </View>

        <SectionTitle kicker="ORDER ITEMS" title="داخل سفارش" />
        <View style={styles.items}>
          {(order.items || []).map((item, index) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemIndex}>
                <Text style={styles.itemIndexText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {item.variant_name
                    ? item.variant_name + ' · '
                    : ''}
                  {item.quantity.toLocaleString('fa-IR')} عدد
                </Text>
              </View>

              <Text style={styles.itemPrice}>
                {money(item.line_total)}
              </Text>
            </View>
          ))}
        </View>

        <SectionTitle kicker="PAYMENT" title="پرداخت" />
        <View style={styles.summary}>
          <View style={styles.summarySignal} />
          <Row label="جمع محصولات" value={money(order.subtotal)} />

          {(order.product_discount || 0) > 0 ? (
            <Row
              label="تخفیف محصول"
              value={'− ' + money(order.product_discount)}
              accent
            />
          ) : null}

          {(order.coupon_discount || 0) > 0 ? (
            <Row
              label="کد تخفیف"
              value={'− ' + money(order.coupon_discount)}
              accent
            />
          ) : null}

          {(order.wallet_used || 0) > 0 ? (
            <Row
              label="کیف پول"
              value={'− ' + money(order.wallet_used)}
              accent
            />
          ) : null}

          {(order.delivery_fee || 0) > 0 ? (
            <Row label="ارسال" value={money(order.delivery_fee)} />
          ) : null}

          <View style={styles.divider} />

          <Row
            label="مبلغ نهایی"
            value={money(order.grand_total)}
            strong
          />
          <Row
            label="قابل پرداخت"
            value={money(order.payable_amount)}
            strong
          />

          {(order.cashback_amount || 0) > 0 ? (
            <View style={styles.cashback}>
              <View style={styles.cashbackDot} />
              <Text style={styles.cashbackText}>
                کش‌بک: {money(order.cashback_amount)}
              </Text>
            </View>
          ) : null}
        </View>

        {order.shipping_address ? (
          <>
            <SectionTitle kicker="DELIVERY" title="تحویل" />
            <View style={styles.address}>
              <View style={styles.addressIcon}>
                <Text style={styles.addressIconText}>⌂</Text>
              </View>
              <View style={styles.addressCopy}>
                <Text style={styles.addressTitle}>
                  {order.shipping_address.recipient_name
                    || 'تحویل‌گیرنده'}
                </Text>
                <Text style={styles.addressText}>
                  {[
                    order.shipping_address.province,
                    order.shipping_address.city,
                    order.shipping_address.address_line,
                  ].filter(Boolean).join('، ')}
                </Text>
                <Text style={styles.addressPhone}>
                  {order.shipping_address.phone}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {order.status === 'delivered' ? (
          <PressableScale
            onPress={() => router.push({
              pathname: '/invoice/[id]',
              params: { id: String(order.id) },
            })}
            style={styles.invoiceButton}>
            <Text style={styles.invoiceText}>مشاهده فاکتور کامل</Text>
          </PressableScale>
        ) : null}

        {order.status === 'pending' ? (
          <View style={styles.dangerSection}>
            <Text style={styles.dangerKicker}>ORDER CONTROL</Text>
            <PressableScale
              onPress={() => void cancel()}
              style={styles.cancel}>
              <Text style={styles.cancelText}>لغو سفارش</Text>
            </PressableScale>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function OrderTimeline({ stage }: { stage: number }) {
  const steps = ['ثبت', 'تأیید', 'پردازش', 'ارسال', 'تحویل'];

  return (
    <View style={styles.timeline}>
      {steps.map((label, index) => {
        const current = index + 1;
        const done = current <= stage;

        return (
          <View key={label} style={styles.timelineStep}>
            <View
              style={[
                styles.timelineDot,
                done && styles.timelineDotDone,
              ]}>
              <Text
                style={[
                  styles.timelineDotText,
                  done && styles.timelineDotTextDone,
                ]}>
                {done ? '✓' : current}
              </Text>
            </View>
            <Text
              style={[
                styles.timelineLabel,
                done && styles.timelineLabelDone,
              ]}>
              {label}
            </Text>
          </View>
        );
      })}
      <View style={styles.timelineLine} />
      <View
        style={[
          styles.timelineLineActive,
          { width: ((((Math.max(1, stage) - 1) / 4) * 100) + '%') as `${number}%` },
        ]}
      />
    </View>
  );
}

function SectionTitle({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionKicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowValue,
          accent && styles.accent,
          strong && styles.strong,
        ]}>
        {value}
      </Text>
      <Text style={[styles.rowLabel, strong && styles.strong]}>
        {label}
      </Text>
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
    backgroundColor: palette.success,
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
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 80,
  },
  statusCard: {
    minHeight: 196,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    backgroundColor: 'rgba(10,16,26,0.78)',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  statusSignal: {
    position: 'absolute',
    top: 0,
    right: 26,
    width: 60,
    height: 2,
    backgroundColor: palette.cyan,
  },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    backgroundColor: 'rgba(88,244,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    color: palette.cyan,
    fontSize: 26,
    fontWeight: fontWeight.black,
  },
  statusCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  status: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  statusMeta: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: 4,
  },
  timeline: {
    height: 58,
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineStep: {
    width: 44,
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.inkRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(88,244,255,0.10)',
  },
  timelineDotText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  timelineDotTextDone: {
    color: palette.cyan,
  },
  timelineLabel: {
    color: palette.textDim,
    fontSize: 8,
    marginTop: 5,
  },
  timelineLabelDone: {
    color: palette.textMuted,
    fontWeight: fontWeight.bold,
  },
  timelineLine: {
    position: 'absolute',
    top: 13,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: palette.line,
  },
  timelineLineActive: {
    position: 'absolute',
    top: 13,
    left: 22,
    height: 1,
    backgroundColor: palette.cyan,
    maxWidth: '88%',
  },
  sectionHeading: {
    alignItems: 'flex-end',
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
  },
  sectionKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  items: {
    gap: spacing.sm,
  },
  item: {
    minHeight: 82,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIndex: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  itemCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  itemMeta: {
    color: palette.textMuted,
    fontSize: typeScale.micro,
    marginTop: 3,
  },
  itemPrice: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  summary: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  summarySignal: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 54,
    height: 2,
    backgroundColor: palette.cyan,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowValue: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.bold,
  },
  rowLabel: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
  },
  accent: {
    color: palette.success,
  },
  strong: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  divider: {
    height: 1,
    backgroundColor: palette.line,
    marginVertical: spacing.sm,
  },
  cashback: {
    minHeight: 42,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(80,232,176,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.14)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  cashbackDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
  },
  cashbackText: {
    color: palette.success,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  address: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addressIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(88,244,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIconText: {
    color: palette.cyan,
    fontSize: 18,
  },
  addressCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addressTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  addressText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: 4,
  },
  addressPhone: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    marginTop: 4,
  },
  invoiceButton: {
    minHeight: 54,
    marginTop: spacing.xxl,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  dangerSection: {
    marginTop: spacing.xxxl,
  },
  dangerKicker: {
    color: palette.danger,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  cancel: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,97,120,0.22)',
    backgroundColor: 'rgba(255,97,120,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: palette.danger,
    fontWeight: fontWeight.black,
  },
});
