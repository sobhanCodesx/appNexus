import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
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

const empty: OrderPayload = { order: { id: 0, number: '', status: '', items: [] } };

const statusLabel: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
};

function money(value?: number) {
  return (value || 0).toLocaleString('fa-IR') + ' تومان';
}

export default function OrderDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data, refresh } = useApiResource<OrderPayload>('/orders/' + encodeURIComponent(id || ''), empty);
  const order = data.order;

  const cancel = async () => {
    await apiRequest('/orders/' + order.id + '/cancel', { method: 'PATCH' });
    await refresh();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ORDER DETAIL</Text>
          <Text style={styles.title}>{order.number || 'سفارش'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statusCard}>
          <Text style={styles.status}>{statusLabel[order.status] || order.status}</Text>
          <Text style={styles.statusMeta}>
            {order.created_at ? new Date(order.created_at).toLocaleString('fa-IR') : 'PlayNexus'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>آیتم‌ها</Text>
        <View style={styles.items}>
          {(order.items || []).map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemPrice}>{money(item.line_total)}</Text>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {item.variant_name ? item.variant_name + ' · ' : ''}{item.quantity.toLocaleString('fa-IR')} عدد
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>پرداخت</Text>
        <View style={styles.summary}>
          <Row label="جمع محصولات" value={money(order.subtotal)} />
          {(order.product_discount || 0) > 0 ? <Row label="تخفیف محصول" value={'− ' + money(order.product_discount)} accent /> : null}
          {(order.coupon_discount || 0) > 0 ? <Row label="کد تخفیف" value={'− ' + money(order.coupon_discount)} accent /> : null}
          {(order.wallet_used || 0) > 0 ? <Row label="کیف پول" value={'− ' + money(order.wallet_used)} accent /> : null}
          {(order.delivery_fee || 0) > 0 ? <Row label="ارسال" value={money(order.delivery_fee)} /> : null}
          <View style={styles.divider} />
          <Row label="مبلغ نهایی" value={money(order.grand_total)} strong />
          <Row label="قابل پرداخت" value={money(order.payable_amount)} strong />
          {(order.cashback_amount || 0) > 0 ? <Text style={styles.cashback}>کش‌بک: {money(order.cashback_amount)}</Text> : null}
        </View>

        {order.shipping_address ? (
          <>
            <Text style={styles.sectionTitle}>تحویل</Text>
            <View style={styles.address}>
              <Text style={styles.addressTitle}>{order.shipping_address.recipient_name || 'تحویل‌گیرنده'}</Text>
              <Text style={styles.addressText}>
                {[order.shipping_address.province, order.shipping_address.city, order.shipping_address.address_line]
                  .filter(Boolean).join('، ')}
              </Text>
              <Text style={styles.addressText}>{order.shipping_address.phone}</Text>
            </View>
          </>
        ) : null}

        {order.status === 'pending' ? (
          <PressableScale onPress={() => void cancel()} style={styles.cancel}>
            <Text style={styles.cancelText}>لغو سفارش</Text>
          </PressableScale>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, accent = false, strong = false }: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowValue, accent && styles.accent, strong && styles.strong]}>{value}</Text>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 26, fontWeight: fontWeight.black, marginTop: 3 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 70 },
  statusCard: { minHeight: 104, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(77,163,255,0.25)', backgroundColor: 'rgba(77,163,255,0.08)', padding: spacing.lg, alignItems: 'flex-end', justifyContent: 'center' },
  status: { color: palette.cyan, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  statusMeta: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 5 },
  sectionTitle: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.xl, marginBottom: spacing.md },
  items: { gap: spacing.sm },
  item: { minHeight: 76, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemCopy: { flex: 1, alignItems: 'flex-end' },
  itemTitle: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold, textAlign: 'right' },
  itemMeta: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 3 },
  itemPrice: { color: palette.white, fontSize: typeScale.caption, fontWeight: fontWeight.black },
  summary: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowValue: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  rowLabel: { color: palette.textMuted, fontSize: typeScale.bodySm },
  accent: { color: palette.success },
  strong: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.sm },
  cashback: { color: palette.success, textAlign: 'right', marginTop: spacing.sm },
  address: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg, alignItems: 'flex-end' },
  addressTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.bold },
  addressText: { color: palette.textMuted, fontSize: typeScale.bodySm, lineHeight: 22, textAlign: 'right', marginTop: 4 },
  cancel: { marginTop: spacing.xxl, minHeight: 52, borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(255,93,115,0.35)', backgroundColor: 'rgba(255,93,115,0.08)', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.danger, fontWeight: fontWeight.black },
});
