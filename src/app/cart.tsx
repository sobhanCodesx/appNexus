import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';
import {
  cartRequestItems,
  type LocalCartLine,
  readCart,
  updateCartQuantity,
} from '@/services/cart';

type ResolvedLine = {
  key: string;
  product_id: number;
  variant_id: number | null;
  title: string;
  slug: string;
  variant?: string | null;
  quantity: number;
  stock: number;
  regular_unit_price: number;
  unit_price: number;
  line_total: number;
  cover_url?: string | null;
};

type CartResponse = {
  items: ResolvedLine[];
  summary: {
    regular_subtotal: number;
    product_discount: number;
    subtotal: number;
    requires_shipping: boolean;
  };
  cashback_percent?: number;
  estimated_cashback?: number;
};

const emptyResponse: CartResponse = {
  items: [],
  summary: { regular_subtotal: 0, product_discount: 0, subtotal: 0, requires_shipping: false },
};

function money(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}

export default function CartScreen() {
  const [, setLocal] = useState<LocalCartLine[]>([]);
  const [resolved, setResolved] = useState<CartResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);

  const resolve = async (lines: LocalCartLine[]) => {
    if (!lines.length) {
      setResolved(emptyResponse);
      return;
    }

    try {
      setResolved(await apiRequest<CartResponse>(
        '/cart/resolve',
        { method: 'POST', body: JSON.stringify({ items: cartRequestItems(lines) }) },
      ));
    } catch {
      setResolved({
        ...emptyResponse,
        items: lines.map((line, index) => ({
          key: String(index),
          product_id: line.product_id,
          variant_id: line.variant_id,
          title: line.title,
          slug: '',
          variant: line.variant_name,
          quantity: line.quantity,
          stock: 10,
          regular_unit_price: line.unit_price || 0,
          unit_price: line.unit_price || 0,
          line_total: (line.unit_price || 0) * line.quantity,
          cover_url: line.cover_url,
        })),
        summary: {
          ...emptyResponse.summary,
          subtotal: lines.reduce((sum, line) => sum + (line.unit_price || 0) * line.quantity, 0),
        },
      });
    }
  };

  useEffect(() => {
    let active = true;

    readCart().then((lines) => {
      if (!active) return;
      setLocal(lines);
      void resolve(lines).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const change = async (line: ResolvedLine, delta: number) => {
    const next = await updateCartQuantity(
      line.product_id,
      line.variant_id,
      line.quantity + delta,
    );
    setLocal(next);
    await resolve(next);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>NATIVE CART</Text>
          <Text style={styles.title}>سبد خرید</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? <Text style={styles.emptyText}>در حال بررسی قیمت و موجودی…</Text> : null}

        {!loading && !resolved.items.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>سبدت هنوز خالیه</Text>
            <Text style={styles.emptyText}>از فروشگاه بازی یا محصولی که می‌خوای رو اضافه کن.</Text>
            <PressableScale style={styles.shopButton} onPress={() => router.push('/store')}>
              <Text style={styles.shopButtonText}>رفتن به فروشگاه</Text>
            </PressableScale>
          </View>
        ) : null}

        {resolved.items.map((item) => (
          <View key={item.key} style={styles.line}>
            <Image
              source={item.cover_url ? { uri: item.cover_url } : require('../../assets/images/logo-glow.png')}
              style={styles.cover}
              contentFit="cover"
            />
            <View style={styles.lineCopy}>
              <Text numberOfLines={2} style={styles.lineTitle}>{item.title}</Text>
              {item.variant ? <Text style={styles.variant}>{item.variant}</Text> : null}
              <Text style={styles.price}>{money(item.line_total)}</Text>

              <View style={styles.qty}>
                <PressableScale onPress={() => void change(item, -1)} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>−</Text>
                </PressableScale>
                <Text style={styles.qtyValue}>{item.quantity.toLocaleString('fa-IR')}</Text>
                <PressableScale onPress={() => void change(item, 1)} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>+</Text>
                </PressableScale>
              </View>
            </View>
          </View>
        ))}

        {resolved.items.length ? (
          <View style={styles.summary}>
            <SummaryRow label="جمع محصولات" value={money(resolved.summary.regular_subtotal)} />
            {resolved.summary.product_discount > 0 ? (
              <SummaryRow label="تخفیف" value={'− ' + money(resolved.summary.product_discount)} accent />
            ) : null}
            <View style={styles.divider} />
            <SummaryRow label="قابل پرداخت" value={money(resolved.summary.subtotal)} strong />
            {resolved.estimated_cashback ? (
              <Text style={styles.cashback}>حدود {money(resolved.estimated_cashback)} کش‌بک</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {resolved.items.length ? (
        <View style={styles.dock}>
          <PressableScale style={styles.checkout} onPress={() => router.push('/checkout')}>
            <Text style={styles.checkoutText}>ادامه و ثبت سفارش</Text>
          </PressableScale>
          <Text style={styles.dockPrice}>{money(resolved.summary.subtotal)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function SummaryRow({
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
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryValue, accent && styles.accent, strong && styles.strong]}>{value}</Text>
      <Text style={[styles.summaryLabel, strong && styles.strong]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 46, height: 46, borderRadius: 18,
    borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 130 },
  line: {
    minHeight: 154, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: spacing.md,
    padding: spacing.sm, flexDirection: 'row', gap: spacing.md,
  },
  cover: { width: 108, height: 130, borderRadius: radii.lg, backgroundColor: palette.surface },
  lineCopy: { flex: 1, alignItems: 'flex-end' },
  lineTitle: { color: palette.text, fontSize: typeScale.body, lineHeight: 23, fontWeight: fontWeight.bold, textAlign: 'right' },
  variant: { color: palette.cyan, fontSize: typeScale.micro, marginTop: 4 },
  price: { color: palette.white, fontSize: typeScale.bodySm, fontWeight: fontWeight.black, marginTop: spacing.sm },
  qty: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyButton: {
    width: 34, height: 34, borderRadius: 12,
    borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyButtonText: { color: palette.white, fontSize: 18, fontWeight: fontWeight.bold },
  qtyValue: { color: palette.text, minWidth: 24, textAlign: 'center', fontWeight: fontWeight.bold },
  summary: {
    marginTop: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)', padding: spacing.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryValue: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  summaryLabel: { color: palette.textMuted, fontSize: typeScale.bodySm },
  accent: { color: palette.success },
  strong: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.black },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.sm },
  cashback: { color: palette.success, fontSize: typeScale.caption, textAlign: 'right', marginTop: spacing.sm },
  empty: { paddingTop: 110, alignItems: 'center' },
  emptyTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  emptyText: { color: palette.textMuted, fontSize: typeScale.bodySm, textAlign: 'center', marginTop: spacing.sm },
  shopButton: { marginTop: spacing.xl, backgroundColor: palette.white, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: 13 },
  shopButtonText: { color: palette.ink, fontWeight: fontWeight.black },
  dock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    minHeight: 94, padding: layout.screenPadding, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: 'rgba(5,7,11,0.98)',
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  checkout: { flex: 1, minHeight: 54, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: palette.ink, fontWeight: fontWeight.black },
  dockPrice: { color: palette.white, fontSize: typeScale.bodySm, fontWeight: fontWeight.black },
});
