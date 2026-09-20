import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { apiRequest, getAccessToken } from '@/services/api';
import {
  cartRequestItems,
  clearCart,
  type LocalCartLine,
  readCart,
} from '@/services/cart';

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
        setAddressId(
          data.addresses.find((item) => item.is_default)?.id
            ?? data.addresses[0]?.id
            ?? null,
        );
        setExchangeId(data.selected_exchange_id ?? null);
      } catch (value) {
        if (active) {
          setError(
            value instanceof Error
              ? value.message
              : 'Checkout آماده نشد.',
          );
        }
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

      void Haptics.selectionAsync();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'محاسبه مبلغ انجام نشد.',
      );
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
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'ثبت سفارش انجام نشد.',
      );
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return <OrderSuccess order={order} />;
  }

  const payable = summary?.payable_amount ?? summary?.grand_total;
  const addressReady = Boolean(addressId);
  const creditReady = useWallet
    || Boolean(exchangeId)
    || Boolean(coupon.trim());

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.eyebrow}>SECURE CHECKOUT</Text>
          </View>
          <Text style={styles.title}>تکمیل سفارش</Text>
        </View>
      </View>

      <CheckoutProgress
        addressReady={addressReady}
        creditReady={creditReady}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <CheckoutSection
          number="01"
          kicker="DELIVERY"
          title="کجا تحویل بدیم؟">
          <View style={styles.addresses}>
            {(bootstrap?.addresses || []).map((address) => {
              const selected = address.id === addressId;

              return (
                <PressableScale
                  key={address.id}
                  onPress={() => {
                    setAddressId(address.id);
                    void Haptics.selectionAsync();
                  }}
                  style={[
                    styles.address,
                    selected && styles.addressSelected,
                  ]}>
                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}>
                    {selected ? <View style={styles.radioCore} /> : null}
                  </View>

                  <View style={styles.addressCopy}>
                    <View style={styles.addressTitleRow}>
                      {address.is_default ? (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      ) : null}
                      <Text style={styles.addressTitle}>{address.title}</Text>
                    </View>

                    <Text style={styles.addressText}>
                      {address.recipient_name} · {address.phone}
                    </Text>
                    <Text numberOfLines={2} style={styles.addressText}>
                      {address.city}، {address.address_line}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {!bootstrap?.addresses?.length ? (
            <View style={styles.warning}>
              <View style={styles.warningIcon}>!</View>
              <View style={styles.warningCopy}>
                <Text style={styles.warningTitle}>آدرس لازم داریم</Text>
                <Text style={styles.warningText}>
                  قبل از ثبت سفارش، یک آدرس تحویل اضافه کن.
                </Text>
              </View>
              <PressableScale
                onPress={() => router.push('/addresses')}
                style={styles.warningAction}>
                <Text style={styles.warningActionText}>افزودن</Text>
              </PressableScale>
            </View>
          ) : (
            <PressableScale
              haptic={false}
              onPress={() => router.push('/addresses')}
              style={styles.manageLink}>
              <Text style={styles.manageLinkText}>مدیریت آدرس‌ها</Text>
            </PressableScale>
          )}
        </CheckoutSection>

        <CheckoutSection
          number="02"
          kicker="CREDITS"
          title="اعتبار و تخفیف">
          <View style={styles.creditPanel}>
            <View style={styles.walletRow}>
              <Switch
                value={useWallet}
                onValueChange={(value) => {
                  setUseWallet(value);
                  void Haptics.selectionAsync();
                }}
                trackColor={{
                  false: palette.surfaceBright,
                  true: palette.blueHot,
                }}
                thumbColor={palette.white}
              />

              <View style={styles.walletCopy}>
                <Text style={styles.walletKicker}>PLAYNEXUS WALLET</Text>
                <Text style={styles.walletTitle}>استفاده از کیف پول</Text>
                <Text style={styles.walletMeta}>
                  موجودی: {money(bootstrap?.wallet_balance)}
                </Text>
              </View>

              <View style={styles.walletIcon}>
                <Text style={styles.walletIconText}>₽</Text>
              </View>
            </View>

            <View style={styles.creditDivider} />

            <View style={styles.couponHeading}>
              <Text style={styles.couponKicker}>PROMO SIGNAL</Text>
              <Text style={styles.couponTitle}>کد تخفیف داری؟</Text>
            </View>

            <View style={styles.couponRow}>
              <PressableScale
                onPress={() => void refreshPreview()}
                style={styles.apply}>
                <Text style={styles.applyText}>اعمال</Text>
              </PressableScale>

              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder="PLAYNEXUS CODE"
                placeholderTextColor={palette.textDim}
                autoCapitalize="characters"
                textAlign="right"
                style={styles.coupon}
              />
            </View>
          </View>
        </CheckoutSection>

        {(bootstrap?.available_exchanges || []).length ? (
          <CheckoutSection
            number="03"
            kicker="TRADE CREDIT"
            title="اعتبار معاوضه">
            <View style={styles.exchangeList}>
              {bootstrap!.available_exchanges!.map((exchange, index) => {
                const selected = exchange.id === exchangeId;

                return (
                  <PressableScale
                    key={exchange.id}
                    onPress={() => {
                      setExchangeId(selected ? null : exchange.id);
                      void Haptics.selectionAsync();
                    }}
                    style={[
                      styles.exchange,
                      selected && styles.exchangeSelected,
                    ]}>
                    <View
                      style={[
                        styles.exchangeIndex,
                        selected && styles.exchangeIndexSelected,
                      ]}>
                      <Text
                        style={[
                          styles.exchangeIndexText,
                          selected && styles.exchangeIndexTextSelected,
                        ]}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    <View style={styles.exchangeCopy}>
                      <Text style={styles.exchangeKicker}>
                        {selected ? 'SELECTED CREDIT' : 'AVAILABLE CREDIT'}
                      </Text>
                      <Text style={styles.exchangeTitle}>
                        {exchange.trade_item_title || exchange.number}
                      </Text>
                    </View>

                    <Text style={styles.exchangeAmount}>
                      {money(exchange.amount)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </CheckoutSection>
        ) : null}

        <CheckoutSection
          number={(bootstrap?.available_exchanges || []).length ? '04' : '03'}
          kicker="FINAL CHECK"
          title="خلاصه پرداخت">
          <View style={styles.summary}>
            <View style={styles.summarySignal} />

            <SummaryRow
              label="جمع محصولات"
              value={money(summary?.subtotal)}
            />

            {(summary?.coupon_discount || 0) > 0 ? (
              <SummaryRow
                label="کد تخفیف"
                value={'− ' + money(summary?.coupon_discount)}
                accent
              />
            ) : null}

            {(summary?.exchange_credit_used || 0) > 0 ? (
              <SummaryRow
                label="اعتبار معاوضه"
                value={'− ' + money(summary?.exchange_credit_used)}
                accent
              />
            ) : null}

            {(summary?.delivery_fee || 0) > 0 ? (
              <SummaryRow
                label="ارسال"
                value={money(summary?.delivery_fee)}
              />
            ) : null}

            {(summary?.wallet_used || 0) > 0 ? (
              <SummaryRow
                label="کیف پول"
                value={'− ' + money(summary?.wallet_used)}
                accent
              />
            ) : null}

            <View style={styles.divider} />

            <SummaryRow
              label="قابل پرداخت"
              value={money(payable)}
              strong
            />

            {(summary?.cashback_amount || 0) > 0 ? (
              <View style={styles.cashback}>
                <View style={styles.cashbackDot} />
                <Text style={styles.cashbackText}>
                  بعد از تأیید سفارش {money(summary?.cashback_amount)} کش‌بک می‌گیری.
                </Text>
              </View>
            ) : null}
          </View>
        </CheckoutSection>

        {error ? (
          <View style={styles.errorBox}>
            <View style={styles.errorDot} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.dock}>
        <BlurView intensity={84} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.dockSignal} />

        <PressableScale
          disabled={submitting || !addressId}
          onPress={() => void placeOrder()}
          style={[
            styles.place,
            (!addressId || submitting) && styles.placeDisabled,
          ]}>
          <Text style={styles.placeText}>
            {submitting ? 'در حال ثبت…' : 'ثبت نهایی سفارش'}
          </Text>
          {!submitting ? <View style={styles.placeArrow} /> : null}
        </PressableScale>

        <View style={styles.payableWrap}>
          <Text style={styles.payableLabel}>PAYABLE</Text>
          <Text style={styles.payable}>{money(payable)}</Text>
        </View>
      </View>
    </Screen>
  );
}

function CheckoutProgress({
  addressReady,
  creditReady,
}: {
  addressReady: boolean;
  creditReady: boolean;
}) {
  return (
    <View style={styles.progress}>
      <ProgressStep label="ADDRESS" active done={addressReady} />
      <View style={[styles.progressLine, addressReady && styles.progressLineActive]} />
      <ProgressStep label="CREDITS" active={addressReady} done={creditReady} />
      <View style={[styles.progressLine, addressReady && styles.progressLineActive]} />
      <ProgressStep label="CONFIRM" active={addressReady} />
    </View>
  );
}

function ProgressStep({
  label,
  active,
  done = false,
}: {
  label: string;
  active: boolean;
  done?: boolean;
}) {
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressOrb,
          active && styles.progressOrbActive,
          done && styles.progressOrbDone,
        ]}>
        <Text
          style={[
            styles.progressOrbText,
            active && styles.progressOrbTextActive,
          ]}>
          {done ? '✓' : '•'}
        </Text>
      </View>
      <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function CheckoutSection({
  number,
  kicker,
  title,
  children,
}: {
  number: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionKicker}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function OrderSuccess({
  order,
}: {
  order: OrderResponse['order'];
}) {
  return (
    <Screen>
      <View style={styles.success}>
        <View style={styles.successOrbitOuter}>
          <View style={styles.successOrbitMid}>
            <View style={styles.successMark}>
              <Text style={styles.successMarkText}>✓</Text>
            </View>
          </View>
        </View>

        <Text style={styles.successKicker}>ORDER LOCKED IN</Text>
        <Text style={styles.successTitle}>سفارشت ثبت شد</Text>
        <Text style={styles.successNumber}>{order.number}</Text>
        <Text style={styles.successText}>
          PlayNexus سفارش رو گرفت؛ از Order Center می‌تونی وضعیتش رو تا آخر دنبال کنی.
        </Text>

        <PressableScale
          style={styles.successPrimary}
          onPress={() => router.replace({
            pathname: '/order/[id]',
            params: { id: String(order.id) },
          })}>
          <Text style={styles.successPrimaryText}>مشاهده سفارش</Text>
          <View style={styles.successArrow} />
        </PressableScale>

        <PressableScale
          haptic={false}
          style={styles.successSecondary}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.successSecondaryText}>برگشت به PlayNexus</Text>
        </PressableScale>
      </View>
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
    paddingBottom: spacing.md,
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
  progress: {
    height: 72,
    paddingHorizontal: layout.screenPadding + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    alignItems: 'center',
    gap: 5,
  },
  progressOrb: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOrbActive: {
    borderColor: 'rgba(88,244,255,0.20)',
    backgroundColor: 'rgba(88,244,255,0.055)',
  },
  progressOrbDone: {
    backgroundColor: 'rgba(80,232,176,0.08)',
    borderColor: 'rgba(80,232,176,0.20)',
  },
  progressOrbText: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: fontWeight.black,
  },
  progressOrbTextActive: {
    color: palette.cyan,
  },
  progressLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  progressLabelActive: {
    color: palette.textMuted,
  },
  progressLine: {
    flex: 1,
    height: 1,
    maxWidth: 68,
    backgroundColor: palette.line,
    marginHorizontal: 7,
    marginBottom: 16,
  },
  progressLineActive: {
    backgroundColor: 'rgba(88,244,255,0.20)',
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 138,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionNumber: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(88,244,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  sectionCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionKicker: {
    color: palette.textDim,
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
  addresses: {
    gap: spacing.sm,
  },
  address: {
    minHeight: 112,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addressSelected: {
    borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(88,244,255,0.065)',
    ...shadow.cyanGlow,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: palette.cyan,
  },
  radioCore: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: palette.cyan,
  },
  addressCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  defaultBadge: {
    height: 22,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(80,232,176,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadgeText: {
    color: palette.success,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.6,
  },
  addressTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  addressText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 19,
    textAlign: 'right',
    marginTop: 3,
  },
  warning: {
    minHeight: 82,
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,190,85,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,190,85,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(255,190,85,0.10)',
    color: palette.warning,
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: fontWeight.black,
  },
  warningCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  warningTitle: {
    color: palette.warning,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  warningText: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  warningAction: {
    minWidth: 66,
    height: 40,
    borderRadius: 13,
    backgroundColor: palette.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningActionText: {
    color: palette.ink,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  manageLink: {
    minHeight: 42,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageLinkText: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  creditPanel: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.md,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  walletCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  walletKicker: {
    color: palette.blue,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  walletTitle: {
    color: palette.text,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  walletMeta: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: 3,
  },
  walletIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(85,169,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(85,169,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconText: {
    color: palette.blue,
    fontSize: 18,
    fontWeight: fontWeight.black,
  },
  creditDivider: {
    height: 1,
    backgroundColor: palette.line,
    marginVertical: spacing.md,
  },
  couponHeading: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  couponKicker: {
    color: palette.violet,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  couponTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  couponRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  coupon: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.white,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(3,5,9,0.48)',
  },
  apply: {
    width: 72,
    borderRadius: radii.md,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  exchangeList: {
    gap: spacing.sm,
  },
  exchange: {
    minHeight: 78,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exchangeSelected: {
    borderColor: 'rgba(80,232,176,0.22)',
    backgroundColor: 'rgba(80,232,176,0.055)',
  },
  exchangeIndex: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeIndexSelected: {
    backgroundColor: 'rgba(80,232,176,0.10)',
  },
  exchangeIndexText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  exchangeIndexTextSelected: {
    color: palette.success,
  },
  exchangeCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  exchangeKicker: {
    color: palette.success,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  exchangeTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 3,
  },
  exchangeAmount: {
    color: palette.success,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  summary: {
    borderRadius: radii.xl,
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
    minHeight: 48,
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
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  errorBox: {
    minHeight: 58,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,97,120,0.18)',
    backgroundColor: 'rgba(255,97,120,0.055)',
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.danger,
  },
  error: {
    flex: 1,
    color: palette.danger,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
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
  place: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeDisabled: {
    opacity: 0.42,
  },
  placeText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  placeArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  payableWrap: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  payableLabel: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  payable: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  success: {
    flex: 1,
    paddingHorizontal: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOrbitOuter: {
    width: 188,
    height: 188,
    borderRadius: 188,
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOrbitMid: {
    width: 122,
    height: 122,
    borderRadius: 122,
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMark: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: 'rgba(80,232,176,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMarkText: {
    color: palette.success,
    fontSize: 34,
    fontWeight: fontWeight.black,
  },
  successKicker: {
    color: palette.success,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
    marginTop: spacing.xxxl,
  },
  successTitle: {
    color: palette.white,
    fontSize: typeScale.displaySm,
    fontWeight: fontWeight.black,
    marginTop: spacing.sm,
  },
  successNumber: {
    color: palette.cyan,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
    marginTop: spacing.sm,
  },
  successText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 330,
  },
  successPrimary: {
    width: '100%',
    minHeight: 58,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  successPrimaryText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  successArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  successSecondary: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSecondaryText: {
    color: palette.textMuted,
    fontWeight: fontWeight.bold,
  },
});
