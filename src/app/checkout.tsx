import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest, getAccessToken } from '@/services/api';
import { cartRequestItems, clearCart, type LocalCartLine, readCart } from '@/services/cart';

type Address = {
  id: number;
  title: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code?: string | null;
  address_line: string;
  plaque?: string | null;
  unit?: string | null;
  is_default?: boolean;
};

type Summary = {
  regular_subtotal?: number;
  product_discount?: number;
  subtotal?: number;
  exchange_credit_used?: number;
  coupon_discount?: number;
  delivery_fee?: number;
  grand_total?: number;
  wallet_used?: number;
  payable_amount?: number;
  cashback_amount?: number;
};

type Bootstrap = Summary & {
  addresses: Address[];
  wallet_balance: number;
  available_exchanges?: {
    id: number;
    number: string;
    amount: number;
    trade_item_title?: string | null;
    expires_at?: string | null;
  }[];
  selected_exchange_id?: number | null;
};

type OrderResponse = {
  message: string;
  order: {
    id: number;
    number: string;
    status: string;
    payable_amount?: number;
    grand_total?: number;
  };
};

function money(value?: number) {
  return (value || 0).toLocaleString('fa-IR') + ' تومان';
}

export default function CheckoutScreen() {
  const [lines, setLines] = useState<LocalCartLine[]>([]);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [exchangeId, setExchangeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResponse['order'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([readCart(), getAccessToken()]).then(async ([cart, token]) => {
      if (!active) return;
      if (!cart.length) {
        router.replace('/cart');
        return;
      }
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      setLines(cart);

      try {
        const data = await apiRequest<Bootstrap>('/checkout/bootstrap', {
          method: 'POST',
          body: JSON.stringify({ items: cartRequestItems(cart) }),
        });
        if (!active) return;
        setBootstrap(data);
        setSummary(data);
        setAddressId(data.addresses.find((item) => item.is_default)?.id ?? data.addresses[0]?.id ?? null);
        setExchangeId(data.selected_exchange_id ?? null);
      } catch (value) {
        if (active) setError(value instanceof Error ? value.message : 'Checkout آماده نشد.');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const refreshPreview = async () => {
    if (!lines.length) return;
    setError(null);

    try {
      setSummary(await apiRequest<Summary>('/checkout/preview', {
        method: 'POST',
        body: JSON.stringify({
          items: cartRequestItems(lines),
          coupon_code: coupon.trim() || null,
          use_wallet: useWallet,
          exchange_request_id: exchangeId,
        }),
      }));
    } catch (value) {
      setError(value instanceof Error ? value.message : 'محاسبه مبلغ انجام نشد.');
    }
  };

  const placeOrder = async () => {
    if (!addressId || !lines.length) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<OrderResponse>('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cartRequestItems(lines),
          address_mode: 'saved',
          address_id: addressId,
          coupon_code: coupon.trim() || null,
          use_wallet: useWallet,
          exchange_request_id: exchangeId,
          save_address: false,
        }),
      });

      await clearCart();
      setOrder(result.order);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'ثبت سفارش انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <Screen>
        <View style={styles.success}>
          <View style={styles.successMark}><Text style={styles.successMarkText}>✓</Text></View>
          <Text style={styles.successTitle}>سفارش ثبت شد</Text>
          <Text style={styles.successNumber}>{order.number}</Text>
          <Text style={styles.successText}>سفارش داخل PlayNexus ثبت شده و وضعیتش از بخش سفارش‌ها قابل پیگیریه.</Text>
          <PressableScale
            style={styles.primary}
            onPress={() => router.replace({ pathname: '/order/[id]', params: { id: String(order.id) } })}>
            <Text style={styles.primaryText}>مشاهده سفارش</Text>
          </PressableScale>
          <PressableScale style={styles.secondary} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.secondaryText}>برگشت به خانه</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>SECURE CHECKOUT</Text>
          <Text style={styles.title}>ثبت سفارش</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>آدرس تحویل</Text>
        <View style={styles.addresses}>
          {(bootstrap?.addresses || []).map((address) => {
            const selected = address.id === addressId;
            return (
              <PressableScale
                key={address.id}
                onPress={() => setAddressId(address.id)}
                style={[styles.address, selected && styles.addressSelected]}>
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioCore} /> : null}</View>
                <View style={styles.addressCopy}>
                  <Text style={styles.addressTitle}>{address.title}</Text>
                  <Text style={styles.addressText}>{address.recipient_name} · {address.phone}</Text>
                  <Text style={styles.addressText}>{address.city}، {address.address_line}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        {!bootstrap?.addresses?.length ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>برای Checkout باید حداقل یک آدرس در حساب داشته باشی.</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>اعتبار و تخفیف</Text>
        <View style={styles.panel}>
          <View style={styles.walletRow}>
            <Switch
              value={useWallet}
              onValueChange={(value) => setUseWallet(value)}
              trackColor={{ false: palette.surfaceBright, true: palette.blueHot }}
              thumbColor={palette.white}
            />
            <View style={styles.walletCopy}>
              <Text style={styles.walletTitle}>استفاده از کیف پول</Text>
              <Text style={styles.walletMeta}>موجودی: {money(bootstrap?.wallet_balance)}</Text>
            </View>
          </View>

          <View style={styles.couponRow}>
            <PressableScale onPress={() => void refreshPreview()} style={styles.apply}>
              <Text style={styles.applyText}>اعمال</Text>
            </PressableScale>
            <TextInput
              value={coupon}
              onChangeText={setCoupon}
              placeholder="کد تخفیف"
              placeholderTextColor={palette.textDim}
              autoCapitalize="characters"
              textAlign="right"
              style={styles.coupon}
            />
          </View>
        </View>

        {(bootstrap?.available_exchanges || []).length ? (
          <>
            <Text style={styles.sectionTitle}>اعتبار معاوضه</Text>
            <View style={styles.addresses}>
              {bootstrap!.available_exchanges!.map((exchange) => {
                const selected = exchange.id === exchangeId;
                return (
                  <PressableScale
                    key={exchange.id}
                    onPress={() => setExchangeId(selected ? null : exchange.id)}
                    style={[styles.exchange, selected && styles.addressSelected]}>
                    <Text style={styles.exchangeAmount}>{money(exchange.amount)}</Text>
                    <Text style={styles.exchangeTitle}>{exchange.trade_item_title || exchange.number}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>خلاصه پرداخت</Text>
        <View style={styles.summary}>
          <SummaryRow label="جمع محصولات" value={money(summary?.subtotal)} />
          {(summary?.coupon_discount || 0) > 0 ? <SummaryRow label="کد تخفیف" value={'− ' + money(summary?.coupon_discount)} accent /> : null}
          {(summary?.exchange_credit_used || 0) > 0 ? <SummaryRow label="اعتبار معاوضه" value={'− ' + money(summary?.exchange_credit_used)} accent /> : null}
          {(summary?.delivery_fee || 0) > 0 ? <SummaryRow label="ارسال" value={money(summary?.delivery_fee)} /> : null}
          {(summary?.wallet_used || 0) > 0 ? <SummaryRow label="کیف پول" value={'− ' + money(summary?.wallet_used)} accent /> : null}
          <View style={styles.divider} />
          <SummaryRow label="قابل پرداخت" value={money(summary?.payable_amount ?? summary?.grand_total)} strong />
          {(summary?.cashback_amount || 0) > 0 ? (
            <Text style={styles.cashback}>بعد از تأیید سفارش {money(summary?.cashback_amount)} کش‌بک می‌گیری.</Text>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.dock}>
        <PressableScale
          disabled={submitting || !addressId}
          onPress={() => void placeOrder()}
          style={[styles.place, (!addressId || submitting) && styles.placeDisabled]}>
          <Text style={styles.placeText}>{submitting ? 'در حال ثبت…' : 'ثبت نهایی سفارش'}</Text>
        </PressableScale>
        <Text style={styles.payable}>{money(summary?.payable_amount ?? summary?.grand_total)}</Text>
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, accent = false, strong = false }: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryValue, accent && styles.accent, strong && styles.strong]}>{value}</Text>
      <Text style={[styles.summaryLabel, strong && styles.strong]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  back: {
    width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 128 },
  sectionTitle: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.xl, marginBottom: spacing.md },
  addresses: { gap: spacing.sm },
  address: {
    minHeight: 104, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  addressSelected: { borderColor: 'rgba(77,163,255,0.55)', backgroundColor: 'rgba(77,163,255,0.08)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.textDim, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: palette.blue },
  radioCore: { width: 10, height: 10, borderRadius: 6, backgroundColor: palette.blue },
  addressCopy: { flex: 1, alignItems: 'flex-end' },
  addressTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.bold },
  addressText: { color: palette.textMuted, fontSize: typeScale.caption, lineHeight: 19, textAlign: 'right', marginTop: 3 },
  warning: { borderRadius: radii.lg, padding: spacing.md, backgroundColor: 'rgba(255,184,77,0.10)', borderWidth: 1, borderColor: 'rgba(255,184,77,0.25)' },
  warningText: { color: palette.warning, textAlign: 'right', lineHeight: 21 },
  panel: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  walletCopy: { flex: 1, alignItems: 'flex-end' },
  walletTitle: { color: palette.text, fontSize: typeScale.body, fontWeight: fontWeight.bold },
  walletMeta: { color: palette.textMuted, fontSize: typeScale.caption, marginTop: 3 },
  couponRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  coupon: { flex: 1, minHeight: 50, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, color: palette.white, paddingHorizontal: spacing.md, backgroundColor: 'rgba(5,7,11,0.55)' },
  apply: { width: 70, borderRadius: radii.md, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: palette.ink, fontWeight: fontWeight.black },
  exchange: {
    minHeight: 72, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  exchangeAmount: { color: palette.success, fontWeight: fontWeight.black },
  exchangeTitle: { color: palette.text, fontWeight: fontWeight.bold, maxWidth: '65%', textAlign: 'right' },
  summary: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.035)', padding: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryValue: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  summaryLabel: { color: palette.textMuted, fontSize: typeScale.bodySm },
  accent: { color: palette.success },
  strong: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.sm },
  cashback: { color: palette.success, fontSize: typeScale.caption, textAlign: 'right', marginTop: spacing.sm },
  error: { color: palette.danger, fontSize: typeScale.caption, textAlign: 'right', marginTop: spacing.lg },
  dock: {
    position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 94,
    paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: 'rgba(5,7,11,0.98)',
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  place: { flex: 1, minHeight: 54, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  placeDisabled: { opacity: 0.45 },
  placeText: { color: palette.ink, fontWeight: fontWeight.black },
  payable: { color: palette.white, fontSize: typeScale.bodySm, fontWeight: fontWeight.black },
  success: { flex: 1, paddingHorizontal: 34, alignItems: 'center', justifyContent: 'center' },
  successMark: { width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(75,230,169,0.12)', borderWidth: 1, borderColor: 'rgba(75,230,169,0.30)', alignItems: 'center', justifyContent: 'center' },
  successMarkText: { color: palette.success, fontSize: 38, fontWeight: fontWeight.black },
  successTitle: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: spacing.xl },
  successNumber: { color: palette.cyan, fontSize: typeScale.body, fontWeight: fontWeight.bold, marginTop: spacing.sm },
  successText: { color: palette.textMuted, fontSize: typeScale.bodySm, lineHeight: 23, textAlign: 'center', marginTop: spacing.md },
  primary: { marginTop: spacing.xl, minWidth: 190, backgroundColor: palette.white, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: palette.ink, fontWeight: fontWeight.black },
  secondary: { marginTop: spacing.sm, padding: spacing.md },
  secondaryText: { color: palette.textMuted, fontWeight: fontWeight.bold },
});
