import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
  summary: {
    regular_subtotal: 0,
    product_discount: 0,
    subtotal: 0,
    requires_shipping: false,
  },
};

function money(value: number) {
  return value.toLocaleString('fa-IR') + ' تومان';
}

export default function CartScreen() {
  const [local, setLocal] = useState<LocalCartLine[]>([]);
  const [resolved, setResolved] = useState<CartResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const resolve = async (lines: LocalCartLine[]) => {
    if (!lines.length) {
      setResolved(emptyResponse);
      return;
    }

    try {
      const snapshot = await apiRequest<CartResponse>(
        '/cart/resolve',
        {
          method: 'POST',
          body: JSON.stringify({ items: cartRequestItems(lines) }),
        },
      );
      setResolved(snapshot);
      setVerificationError(null);
    } catch (error) {
      setResolved(emptyResponse);
      setVerificationError(
        error instanceof Error
          ? error.message
          : 'قیمت و موجودی از سرور تأیید نشد.',
      );
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

  const totalItems = resolved.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.eyebrow}>LOADOUT TRAY</Text>
          </View>
          <Text style={styles.title}>سبد PlayNexus</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {loading ? <LoadingCart /> : null}

        {!loading && !resolved.items.length && local.length && verificationError ? (
          <UnverifiedCart
            lines={local}
            error={verificationError}
            onRetry={() => void resolve(local)}
          />
        ) : null}

        {!loading && !resolved.items.length && !local.length ? (
          <EmptyCart />
        ) : null}

        {resolved.items.length ? (
          <>
            <View style={styles.overview}>
              <LinearGradient
                colors={[
                  'rgba(24,124,255,0.12)',
                  'rgba(88,244,255,0.035)',
                  'rgba(8,14,23,0.90)',
                ]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.overviewVisual}>
                <View style={styles.overviewRing}>
                  <Text style={styles.overviewCount}>
                    {totalItems.toLocaleString('fa-IR')}
                  </Text>
                  <Text style={styles.overviewUnit}>ITEMS</Text>
                </View>
              </View>

              <View style={styles.overviewCopy}>
                <Text style={styles.overviewKicker}>CURRENT LOADOUT</Text>
                <Text style={styles.overviewTitle}>انتخاب‌هات آماده‌ان</Text>
                <Text style={styles.overviewText}>
                  قیمت و موجودی هر آیتم دوباره از سرور PlayNexus بررسی می‌شه.
                </Text>
              </View>
            </View>

            <View style={styles.listHeading}>
              <Text style={styles.listKicker}>YOUR PICKS</Text>
              <Text style={styles.listTitle}>داخل سبد</Text>
            </View>

            <View style={styles.lines}>
              {resolved.items.map((item, index) => (
                <View key={item.key} style={styles.line}>
                  <View style={styles.lineIndex}>
                    <Text style={styles.lineIndexText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>

                  <Image
                    source={
                      item.cover_url
                        ? { uri: item.cover_url }
                        : require('../../assets/images/logo-glow.png')
                    }
                    style={styles.cover}
                    contentFit="cover"
                  />

                  <View style={styles.lineCopy}>
                    <Text numberOfLines={2} style={styles.lineTitle}>
                      {item.title}
                    </Text>

                    {item.variant ? (
                      <Text style={styles.variant}>{item.variant}</Text>
                    ) : (
                      <Text style={styles.variant}>STANDARD EDITION</Text>
                    )}

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{money(item.line_total)}</Text>
                      {item.regular_unit_price > item.unit_price ? (
                        <Text style={styles.oldPrice}>
                          {money(item.regular_unit_price * item.quantity)}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.qty}>
                      <PressableScale
                        onPress={() => void change(item, -1)}
                        style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>−</Text>
                      </PressableScale>

                      <View style={styles.qtyValueWrap}>
                        <Text style={styles.qtyLabel}>QTY</Text>
                        <Text style={styles.qtyValue}>
                          {item.quantity.toLocaleString('fa-IR')}
                        </Text>
                      </View>

                      <PressableScale
                        onPress={() => void change(item, 1)}
                        style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </PressableScale>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <View style={styles.summarySignal} />
              <Text style={styles.summaryKicker}>ORDER ESTIMATE</Text>
              <Text style={styles.summaryTitle}>خلاصه سبد</Text>

              <View style={styles.summaryRows}>
                <SummaryRow
                  label="جمع محصولات"
                  value={money(resolved.summary.regular_subtotal)}
                />
                {resolved.summary.product_discount > 0 ? (
                  <SummaryRow
                    label="تخفیف محصول"
                    value={'− ' + money(resolved.summary.product_discount)}
                    accent
                  />
                ) : null}
                <View style={styles.divider} />
                <SummaryRow
                  label="قابل پرداخت"
                  value={money(resolved.summary.subtotal)}
                  strong
                />
              </View>

              {resolved.estimated_cashback ? (
                <View style={styles.cashback}>
                  <View style={styles.cashbackDot} />
                  <Text style={styles.cashbackText}>
                    حدود {money(resolved.estimated_cashback)} کش‌بک می‌گیری
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {resolved.items.length ? (
        <View style={styles.dock}>
          <BlurView intensity={82} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.dockSignal} />

          <PressableScale
            style={styles.checkout}
            onPress={() => router.push('/checkout')}>
            <Text style={styles.checkoutText}>ادامه برای Checkout</Text>
            <View style={styles.checkoutArrow} />
          </PressableScale>

          <View style={styles.dockPrice}>
            <Text style={styles.dockPriceLabel}>TOTAL</Text>
            <Text style={styles.dockPriceValue}>
              {money(resolved.summary.subtotal)}
            </Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function LoadingCart() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingRing}>
        <View style={styles.loadingCore} />
      </View>
      <Text style={styles.loadingKicker}>SYNCING CART</Text>
      <Text style={styles.loadingText}>قیمت و موجودی رو بررسی می‌کنیم…</Text>
    </View>
  );
}

function UnverifiedCart({
  lines,
  error,
  onRetry,
}: {
  lines: LocalCartLine[];
  error: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.unverified}>
      <View style={styles.unverifiedSignal} />
      <Text style={styles.unverifiedKicker}>SERVER VERIFICATION REQUIRED</Text>
      <Text style={styles.unverifiedTitle}>سبدت هست؛ قیمت هنوز تأیید نشده</Text>
      <Text style={styles.unverifiedText}>
        برای امنیت خرید، PlayNexus وقتی سرور در دسترس نیست هیچ قیمت یا موجودی حدسی نمایش نمی‌دهد.
      </Text>
      <View style={styles.unverifiedLines}>
        {lines.map((line) => (
          <View key={line.product_id + ':' + String(line.variant_id ?? 'base')} style={styles.unverifiedLine}>
            <Text numberOfLines={1} style={styles.unverifiedLineTitle}>{line.title}</Text>
            <Text style={styles.unverifiedLineMeta}>
              {line.quantity.toLocaleString('fa-IR')} عدد · در انتظار تأیید
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.unverifiedError}>{error}</Text>
      <PressableScale onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>تلاش دوباره برای Sync</Text>
      </PressableScale>
    </View>
  );
}

function EmptyCart() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyVisual}>
        <View style={styles.emptyCardBack} />
        <View style={styles.emptyCardFront}>
          <View style={styles.emptyCore} />
        </View>
      </View>
      <Text style={styles.emptyKicker}>EMPTY LOADOUT</Text>
      <Text style={styles.emptyTitle}>هنوز چیزی انتخاب نکردی</Text>
      <Text style={styles.emptyText}>
        یه سر به Store بزن؛ وقتی چیزی پسندیدی، اینجا منتظرت می‌مونه.
      </Text>
      <PressableScale
        style={styles.shopButton}
        onPress={() => router.push('/store')}>
        <Text style={styles.shopButtonText}>رفتن به Store</Text>
        <View style={styles.shopArrow} />
      </PressableScale>
    </View>
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
      <Text
        style={[
          styles.summaryValue,
          accent && styles.accent,
          strong && styles.strong,
        ]}>
        {value}
      </Text>
      <Text style={[styles.summaryLabel, strong && styles.strong]}>
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
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 136,
  },
  unverified: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,190,85,0.24)',
    backgroundColor: 'rgba(255,190,85,0.045)',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  unverifiedSignal: {
    position: 'absolute',
    top: 0,
    right: 22,
    width: 64,
    height: 2,
    backgroundColor: palette.warning,
  },
  unverifiedKicker: {
    color: palette.warning,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
    textAlign: 'right',
  },
  unverifiedTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  unverifiedText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  unverifiedLines: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  unverifiedLine: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: spacing.sm,
    alignItems: 'flex-end',
  },
  unverifiedLineTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  unverifiedLineMeta: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 3,
  },
  unverifiedError: {
    color: palette.warning,
    fontSize: 10,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  retryButton: {
    minHeight: 46,
    borderRadius: radii.md,
    marginTop: spacing.md,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
    fontSize: typeScale.bodySm,
  },
  overview: {
    minHeight: 156,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(8,14,23,0.88)',
    overflow: 'hidden',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadow.soft,
  },
  overviewVisual: {
    width: 92,
    alignItems: 'center',
  },
  overviewRing: {
    width: 78,
    height: 78,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.22)',
    backgroundColor: 'rgba(88,244,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCount: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
  },
  overviewUnit: {
    color: palette.cyan,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  overviewCopy: {
    flex: 1,
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
    marginTop: 4,
  },
  overviewText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 5,
  },
  listHeading: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  listKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  listTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  lines: {
    gap: spacing.md,
  },
  line: {
    minHeight: 164,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadow.soft,
  },
  lineIndex: {
    width: 28,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  lineIndexText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  cover: {
    width: 104,
    height: 138,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
  },
  lineCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lineTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    lineHeight: 23,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  variant: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
    marginTop: 4,
  },
  priceRow: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  price: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  oldPrice: {
    color: palette.textDim,
    fontSize: 9,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  qty: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: fontWeight.bold,
  },
  qtyValueWrap: {
    minWidth: 46,
    alignItems: 'center',
  },
  qtyLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
  },
  qtyValue: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 1,
  },
  summary: {
    marginTop: spacing.xxxl,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(10,16,26,0.78)',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  summarySignal: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 56,
    height: 2,
    backgroundColor: palette.cyan,
  },
  summaryKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    textAlign: 'right',
  },
  summaryTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 3,
  },
  summaryRows: {
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryValue: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.bold,
  },
  summaryLabel: {
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
    minHeight: 44,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(80,232,176,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.14)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cashbackDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
  },
  cashbackText: {
    flex: 1,
    color: palette.success,
    fontSize: typeScale.caption,
    textAlign: 'right',
    fontWeight: fontWeight.bold,
  },
  loading: {
    paddingTop: 90,
    alignItems: 'center',
  },
  loadingRing: {
    width: 78,
    height: 78,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCore: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  loadingKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    marginTop: spacing.xs,
  },
  empty: {
    paddingTop: 70,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyVisual: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardBack: {
    position: 'absolute',
    width: 76,
    height: 96,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(167,123,255,0.14)',
    backgroundColor: 'rgba(167,123,255,0.04)',
    transform: [{ rotate: '-10deg' }, { translateX: -18 }],
  },
  emptyCardFront: {
    width: 82,
    height: 104,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(88,244,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  emptyTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  shopButton: {
    minHeight: 52,
    marginTop: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shopButtonText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  shopArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  dock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 84,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(7,11,18,0.94)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  dockSignal: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.16)',
  },
  checkout: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkoutText: {
    color: palette.ink,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  checkoutArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  dockPrice: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  dockPriceLabel: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  dockPriceValue: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
});
