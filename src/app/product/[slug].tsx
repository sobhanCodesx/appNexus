import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
import { Chip } from '@/components/ui/chip';
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
import { addToCart } from '@/services/cart';
import { htmlToPlainText } from '@/utils/text';

type Variant = {
  id: number;
  name?: string | null;
  stock?: number;
  pricing?: {
    regular_price?: number;
    sale_price?: number;
    final_price?: number;
    discount_amount?: number;
  };
};

type ProductPayload = {
  product: {
    id: number;
    title: string;
    slug: string;
    sku?: string | null;
    short_description?: string | null;
    description?: string | null;
    availability?: string | null;
    stock?: number | null;
    trade_enabled?: boolean;
    release_date?: string | null;
    category?: { id: number; name: string; slug: string } | null;
    brand?: { id: number; name: string } | null;
    game?: {
      id: number;
      name: string;
      slug: string;
      cover_url?: string | null;
      background_url?: string | null;
    } | null;
    platforms?: { id: number; name: string }[];
    attributes?: { name: string; slug: string; value: string }[];
    media?: {
      id: number;
      type: string;
      url: string;
      alt?: string;
      is_primary?: boolean;
    }[];
    variants?: Variant[];
    pricing?: {
      regular_price?: number;
      sale_price?: number;
      final_price?: number;
      discount_amount?: number;
    };
  };
  related_products?: ProductSummary[];
};

const empty: ProductPayload = {
  product: { id: 0, title: '', slug: '', media: [], variants: [] },
  related_products: [],
};

function money(value?: number) {
  return typeof value === 'number'
    ? value.toLocaleString('fa-IR') + ' تومان'
    : '—';
}

export default function ProductScreen() {
  const { width } = useWindowDimensions();
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const { data, loading, error } = useApiResource<ProductPayload>(
    '/products/' + encodeURIComponent(slug || ''),
    empty,
  );

  const product = data.product;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.find((variant) => variant.id === selectedVariantId)
      || product.variants[0];
  }, [product.variants, selectedVariantId]);

  const price = selectedVariant?.pricing?.final_price
    ?? product.pricing?.final_price
    ?? product.pricing?.sale_price
    ?? product.pricing?.regular_price;

  const regularPrice = selectedVariant?.pricing?.regular_price
    ?? product.pricing?.regular_price;

  const discount = selectedVariant?.pricing?.discount_amount
    ?? product.pricing?.discount_amount
    ?? 0;

  const primaryImage = product.media?.find((item) => item.is_primary)?.url
    || product.media?.find((item) => item.type === 'image')?.url
    || product.game?.cover_url;

  const gallery = product.media?.filter((item) => item.type === 'image').length
    ? product.media.filter((item) => item.type === 'image')
    : [{ id: -1, type: 'image', url: primaryImage || '' }];

  const add = async () => {
    if (!product.id) return;

    await addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      title: product.title,
      variant_name: selectedVariant?.name ?? null,
      cover_url: primaryImage,
      unit_price: price,
    });

    setAdded(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (loading && !product.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.loadingOrb}>
            <View style={styles.loadingCore} />
          </View>
          <Text style={styles.loadingKicker}>PREPARING STORE</Text>
          <Text style={styles.muted}>داریم محصول رو آماده می‌کنیم…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !product.id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorKicker}>STORE SIGNAL LOST</Text>
          <Text style={styles.errorTitle}>محصول در دسترس نیست</Text>
          <Text style={styles.muted}>{error}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <View style={styles.gallery}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                setGalleryIndex(
                  Math.max(
                    0,
                    Math.min(
                      gallery.length - 1,
                      Math.round(event.nativeEvent.contentOffset.x / width),
                    ),
                  ),
                );
              }}>
              {gallery.map((media) => (
                <View key={media.id} style={[styles.galleryPage, { width }]}>
                  <Image
                    source={
                      media.url
                        ? { uri: media.url }
                        : require('../../../assets/images/logo-glow.png')
                    }
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={180}
                  />
                  <LinearGradient
                    colors={[
                      'rgba(3,5,9,0.08)',
                      'rgba(3,5,9,0.00)',
                      'rgba(3,5,9,0.88)',
                    ]}
                    locations={[0, 0.56, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.galleryControls}>
              <PressableScale onPress={() => router.back()} style={styles.glassControl}>
                <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.backText}>‹</Text>
              </PressableScale>

              <PressableScale onPress={() => router.push('/cart')} style={styles.glassControl}>
                <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.cartMiniText}>سبد</Text>
              </PressableScale>
            </View>

            <View style={styles.galleryMeta}>
              <View style={styles.galleryCounter}>
                <Text style={styles.galleryCounterText}>
                  {String(galleryIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.galleryDots}>
                {gallery.slice(0, 6).map((media, index) => (
                  <View
                    key={media.id}
                    style={[
                      styles.galleryDot,
                      index === galleryIndex && styles.galleryDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.productSignal}>
              <View style={styles.productSignalLine} />
              <Text style={styles.productSignalText}>
                {product.brand?.name || 'PLAYNEXUS STORE'}
              </Text>
            </View>

            <Text style={styles.eyebrow}>
              {product.category?.name || 'GAMING PRODUCT'}
            </Text>

            <Text style={styles.title}>{product.title}</Text>

            {product.short_description ? (
              <Text style={styles.short}>{product.short_description}</Text>
            ) : null}

            <View style={styles.pricePanel}>
              <View style={styles.priceCopy}>
                <Text style={styles.priceLabel}>قیمت نهایی</Text>
                <Text style={styles.price}>{money(price)}</Text>
                {discount > 0 && regularPrice ? (
                  <Text style={styles.regularPrice}>{money(regularPrice)}</Text>
                ) : null}
              </View>

              {discount > 0 ? (
                <View style={styles.saleOrb}>
                  <Text style={styles.saleValue}>
                    {Math.round((discount / Math.max(1, regularPrice || price || 1)) * 100)}٪
                  </Text>
                  <Text style={styles.saleLabel}>OFF</Text>
                </View>
              ) : (
                <View style={styles.availabilityOrb}>
                  <View style={styles.availabilityDot} />
                  <Text style={styles.availabilityText}>
                    {product.availability || 'READY'}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {(product.platforms || []).map((platform) => (
                <Chip key={platform.id} label={platform.name} />
              ))}
              {product.trade_enabled ? <Chip label="قابل معاوضه" active /> : null}
              {product.stock !== null && product.stock !== undefined ? (
                <Chip label={'موجودی ' + product.stock.toLocaleString('fa-IR')} />
              ) : null}
            </ScrollView>

            {(product.variants || []).length ? (
              <View style={styles.section}>
                <SectionTitle
                  kicker="CHOOSE YOUR EDITION"
                  title="کدوم نسخه برای توئه؟"
                />

                <View style={styles.variantGrid}>
                  {product.variants!.map((variant, index) => {
                    const active = selectedVariant?.id === variant.id;
                    return (
                      <PressableScale
                        key={variant.id}
                        onPress={() => {
                          setSelectedVariantId(variant.id);
                          void Haptics.selectionAsync();
                        }}
                        style={[
                          styles.variant,
                          active && styles.variantActive,
                        ]}>
                        <View
                          style={[
                            styles.variantIndex,
                            active && styles.variantIndexActive,
                          ]}>
                          <Text
                            style={[
                              styles.variantIndexText,
                              active && styles.variantIndexTextActive,
                            ]}>
                            {String(index + 1).padStart(2, '0')}
                          </Text>
                        </View>

                        <View style={styles.variantCopy}>
                          <Text
                            style={[
                              styles.variantName,
                              active && styles.variantNameActive,
                            ]}>
                            {variant.name || 'نسخه ' + variant.id}
                          </Text>
                          <Text style={styles.variantMeta}>
                            موجودی {(variant.stock ?? 0).toLocaleString('fa-IR')}
                          </Text>
                        </View>

                        <View style={styles.variantPriceWrap}>
                          <Text style={styles.variantPrice}>
                            {money(variant.pricing?.final_price)}
                          </Text>
                          {active ? <View style={styles.selectedMark}>✓</View> : null}
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(product.attributes || []).length ? (
              <View style={styles.section}>
                <SectionTitle kicker="DETAILS" title="مشخصات" />
                <View style={styles.specs}>
                  {product.attributes!.slice(0, 8).map((attribute, index) => (
                    <View
                      key={attribute.slug + attribute.value}
                      style={[
                        styles.specRow,
                        index === product.attributes!.slice(0, 8).length - 1
                          && styles.specRowLast,
                      ]}>
                      <Text style={styles.specValue}>{attribute.value}</Text>
                      <Text style={styles.specName}>{attribute.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {product.description ? (
              <View style={styles.section}>
                <SectionTitle kicker="ABOUT" title="درباره این محصول" />
                <Text style={styles.description}>
                  {htmlToPlainText(product.description)}
                </Text>
              </View>
            ) : null}

            {(data.related_products || []).length ? (
              <View style={styles.section}>
                <SectionTitle kicker="MORE FOR YOU" title="بعدی چی؟" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedRail}>
                  {data.related_products!.map((related) => (
                    <ProductCard
                      key={related.id}
                      product={related}
                      onPress={() => router.replace({
                        pathname: '/product/[slug]',
                        params: { slug: related.slug },
                      })}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.buyDock}>
          <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.dockHairline} />

          {product.trade_enabled ? (
            <PressableScale
              onPress={() => router.push({
                pathname: '/ticket/new',
                params: {
                  type: 'exchange',
                  product_id: String(product.id),
                },
              })}
              style={styles.tradeButton}>
              <Text style={styles.tradeButtonKicker}>TRADE</Text>
              <Text style={styles.tradeButtonText}>معاوضه</Text>
            </PressableScale>
          ) : null}

          <PressableScale
            onPress={() => void add()}
            style={[styles.buy, added && styles.buyAdded]}>
            <Text style={[styles.buyText, added && styles.buyTextAdded]}>
              {added ? 'اضافه شد ✓' : 'افزودن به سبد'}
            </Text>
            {!added ? <View style={styles.buyArrow} /> : null}
          </PressableScale>

          <View style={styles.dockPrice}>
            <Text style={styles.dockPriceLabel}>TOTAL</Text>
            <Text style={styles.dockPriceValue}>{money(price)}</Text>
          </View>
        </View>
      </View>
    </Screen>
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
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionSignal} />
      <View style={styles.sectionTitleCopy}>
        <Text style={styles.sectionKicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 136,
  },
  gallery: {
    height: 500,
    backgroundColor: palette.surface,
  },
  galleryPage: {
    height: 500,
    backgroundColor: palette.surface,
  },
  galleryControls: {
    position: 'absolute',
    top: 54,
    left: layout.screenPadding,
    right: layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glassControl: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(3,5,9,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  backText: {
    color: palette.white,
    fontSize: 27,
    fontWeight: fontWeight.bold,
  },
  cartMiniText: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  galleryMeta: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryCounter: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCounterText: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  galleryDots: {
    flexDirection: 'row',
    gap: 5,
  },
  galleryDot: {
    width: 7,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  galleryDotActive: {
    width: 22,
    backgroundColor: palette.cyan,
  },
  body: {
    marginTop: -26,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: palette.ink,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  productSignal: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  productSignalLine: {
    width: 28,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.cyan,
  },
  productSignalText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: 10,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  title: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 43,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.7,
    marginTop: spacing.xs,
  },
  short: {
    color: palette.textMuted,
    fontSize: typeScale.body,
    lineHeight: 26,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  pricePanel: {
    minHeight: 112,
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(10,16,26,0.72)',
    padding: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadow.soft,
  },
  priceCopy: {
    alignItems: 'flex-end',
    flex: 1,
  },
  priceLabel: {
    color: palette.textDim,
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
  },
  price: {
    color: palette.white,
    fontSize: 26,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  regularPrice: {
    color: palette.textDim,
    fontSize: typeScale.caption,
    textDecorationLine: 'line-through',
    marginTop: 3,
  },
  saleOrb: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255,97,120,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,97,120,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleValue: {
    color: palette.danger,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
  },
  saleLabel: {
    color: palette.danger,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: 1,
  },
  availabilityOrb: {
    minWidth: 76,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.20)',
    backgroundColor: 'rgba(80,232,176,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.success,
  },
  availabilityText: {
    color: palette.success,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  chips: {
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionTitleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionSignal: {
    width: 3,
    borderRadius: 3,
    backgroundColor: palette.cyan,
  },
  sectionTitleCopy: {
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
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 3,
  },
  variantGrid: {
    gap: spacing.sm,
  },
  variant: {
    minHeight: 82,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.028)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  variantActive: {
    borderColor: 'rgba(88,244,255,0.38)',
    backgroundColor: 'rgba(88,244,255,0.075)',
    ...shadow.cyanGlow,
  },
  variantIndex: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantIndexActive: {
    borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(88,244,255,0.10)',
  },
  variantIndexText: {
    color: palette.textDim,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  variantIndexTextActive: {
    color: palette.cyan,
  },
  variantCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  variantName: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  variantNameActive: {
    color: palette.white,
  },
  variantMeta: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 3,
  },
  variantPriceWrap: {
    alignItems: 'flex-start',
  },
  variantPrice: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  selectedMark: {
    color: palette.cyan,
    fontSize: 12,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  specs: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  specRow: {
    minHeight: 58,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  specRowLast: {
    borderBottomWidth: 0,
  },
  specName: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
  },
  specValue: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    textAlign: 'left',
    flex: 1,
  },
  description: {
    color: '#D8DEE8',
    fontSize: typeScale.body,
    lineHeight: 31,
    textAlign: 'right',
  },
  relatedRail: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  buyDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 84,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(7,11,18,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  dockHairline: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.16)',
  },
  tradeButton: {
    minWidth: 76,
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    backgroundColor: 'rgba(88,244,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tradeButtonKicker: {
    color: palette.cyan,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  tradeButtonText: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: 2,
  },
  buy: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buyAdded: {
    backgroundColor: 'rgba(80,232,176,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.30)',
  },
  buyText: {
    color: palette.ink,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  buyTextAdded: {
    color: palette.success,
  },
  buyArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  dockPrice: {
    minWidth: 86,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingOrb: {
    width: 78,
    height: 78,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCore: {
    width: 16,
    height: 16,
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
  muted: {
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  errorKicker: {
    color: palette.danger,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  errorTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 5,
    marginBottom: spacing.sm,
  },
});
