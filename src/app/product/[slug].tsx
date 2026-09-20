import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, shadow, spacing, typeScale } from '@/design';
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
    game?: { id: number; name: string; slug: string; cover_url?: string | null; background_url?: string | null } | null;
    platforms?: { id: number; name: string }[];
    attributes?: { name: string; slug: string; value: string }[];
    media?: { id: number; type: string; url: string; alt?: string; is_primary?: boolean }[];
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
  return typeof value === 'number' ? value.toLocaleString('fa-IR') + ' تومان' : '—';
}

export default function ProductScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const { data, loading, error } = useApiResource<ProductPayload>(
    '/products/' + encodeURIComponent(slug || ''),
    empty,
  );
  const product = data.product;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  }, [product.variants, selectedVariantId]);

  const price = selectedVariant?.pricing?.final_price
    ?? product.pricing?.final_price
    ?? product.pricing?.sale_price
    ?? product.pricing?.regular_price;

  const primaryImage = product.media?.find((item) => item.is_primary)?.url
    || product.media?.find((item) => item.type === 'image')?.url
    || product.game?.cover_url;

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
    return <Screen><View style={styles.center}><Text style={styles.muted}>در حال آماده‌سازی محصول…</Text></View></Screen>;
  }

  if (error && !product.id) {
    return <Screen><View style={styles.center}><Text style={styles.errorTitle}>محصول در دسترس نیست</Text><Text style={styles.muted}>{error}</Text></View></Screen>;
  }

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.gallery}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {(product.media?.filter((item) => item.type === 'image').length
                ? product.media.filter((item) => item.type === 'image')
                : [{ id: -1, type: 'image', url: primaryImage || '' }]
              ).map((media) => (
                <View key={media.id} style={styles.galleryPage}>
                  <Image
                    source={media.url ? { uri: media.url } : require('../../../assets/images/logo-glow.png')}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                </View>
              ))}
            </ScrollView>

            <PressableScale onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>‹</Text>
            </PressableScale>
            <PressableScale onPress={() => router.push('/cart')} style={styles.cartMini}>
              <Text style={styles.cartMiniText}>سبد</Text>
            </PressableScale>
          </View>

          <View style={styles.body}>
            <Text style={styles.eyebrow}>{product.category?.name || 'PLAYNEXUS STORE'}</Text>
            <Text style={styles.title}>{product.title}</Text>
            {product.short_description ? <Text style={styles.short}>{product.short_description}</Text> : null}

            <View style={styles.priceRow}>
              <Text style={styles.price}>{money(price)}</Text>
              {product.pricing?.discount_amount ? <View style={styles.sale}><Text style={styles.saleText}>تخفیف</Text></View> : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {(product.platforms || []).map((platform) => <Chip key={platform.id} label={platform.name} />)}
              {product.trade_enabled ? <Chip label="قابل معاوضه" active /> : null}
              {product.stock !== null && product.stock !== undefined ? <Chip label={'موجودی ' + product.stock.toLocaleString('fa-IR')} /> : null}
            </ScrollView>

            {(product.variants || []).length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>انتخاب نسخه</Text>
                <View style={styles.variantGrid}>
                  {product.variants!.map((variant) => {
                    const active = selectedVariant?.id === variant.id;
                    return (
                      <PressableScale
                        key={variant.id}
                        onPress={() => setSelectedVariantId(variant.id)}
                        style={[styles.variant, active && styles.variantActive]}>
                        <Text style={[styles.variantName, active && styles.variantNameActive]}>
                          {variant.name || 'نسخه ' + variant.id}
                        </Text>
                        <Text style={styles.variantPrice}>{money(variant.pricing?.final_price)}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(product.attributes || []).length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>مشخصات</Text>
                <View style={styles.specs}>
                  {product.attributes!.slice(0, 8).map((attribute) => (
                    <View key={attribute.slug + attribute.value} style={styles.specRow}>
                      <Text style={styles.specValue}>{attribute.value}</Text>
                      <Text style={styles.specName}>{attribute.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {product.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>درباره محصول</Text>
                <Text style={styles.description}>{htmlToPlainText(product.description)}</Text>
              </View>
            ) : null}

            {(data.related_products || []).length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>شاید دوست داشته باشی</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRail}>
                  {data.related_products!.map((related) => (
                    <ProductCard
                      key={related.id}
                      product={related}
                      onPress={() => router.replace({ pathname: '/product/[slug]', params: { slug: related.slug } })}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.buyDock}>
          <PressableScale onPress={() => void add()} style={[styles.buy, added && styles.buyAdded]}>
            <Text style={[styles.buyText, added && styles.buyTextAdded]}>{added ? 'اضافه شد ✓' : 'افزودن به سبد'}</Text>
          </PressableScale>
          <View style={styles.dockPrice}>
            <Text style={styles.dockPriceLabel}>قیمت نهایی</Text>
            <Text style={styles.dockPriceValue}>{money(price)}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 126 },
  gallery: { height: 430, backgroundColor: palette.surface },
  galleryPage: { width: 390, height: 430, backgroundColor: palette.surface },
  back: {
    position: 'absolute', top: 54, left: layout.screenPadding,
    width: 46, height: 46, borderRadius: 18,
    borderWidth: 1, borderColor: palette.lineStrong,
    backgroundColor: 'rgba(5,7,11,0.70)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  cartMini: {
    position: 'absolute', top: 54, right: layout.screenPadding,
    minWidth: 54, height: 46, borderRadius: 18,
    borderWidth: 1, borderColor: palette.lineStrong,
    backgroundColor: 'rgba(5,7,11,0.70)', alignItems: 'center', justifyContent: 'center',
  },
  cartMiniText: { color: palette.white, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  body: {
    marginTop: -24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: palette.ink,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  eyebrow: { color: palette.cyan, fontSize: 10, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 31, lineHeight: 40, fontWeight: fontWeight.black, textAlign: 'right', marginTop: spacing.xs },
  short: { color: palette.textMuted, fontSize: typeScale.body, lineHeight: 26, textAlign: 'right', marginTop: spacing.md },
  priceRow: { marginTop: spacing.lg, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  price: { color: palette.white, fontSize: 24, fontWeight: fontWeight.black },
  sale: { borderRadius: radii.pill, backgroundColor: palette.danger, paddingHorizontal: 9, paddingVertical: 5 },
  saleText: { color: palette.white, fontSize: 10, fontWeight: fontWeight.black },
  chips: { gap: spacing.xs, paddingTop: spacing.md },
  section: { marginTop: spacing.xxxl },
  sectionTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, textAlign: 'right', marginBottom: spacing.md },
  variantGrid: { gap: spacing.sm },
  variant: {
    minHeight: 70, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: spacing.lg,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  variantActive: { borderColor: 'rgba(77,163,255,0.50)', backgroundColor: 'rgba(77,163,255,0.10)' },
  variantName: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  variantNameActive: { color: palette.cyan },
  variantPrice: { color: palette.textMuted, fontSize: typeScale.caption },
  specs: { borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' },
  specRow: {
    minHeight: 54, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: palette.line,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  specName: { color: palette.textMuted, fontSize: typeScale.bodySm },
  specValue: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  description: { color: '#D4DBE6', fontSize: typeScale.body, lineHeight: 30, textAlign: 'right' },
  relatedRail: { gap: spacing.md, paddingBottom: spacing.sm },
  buyDock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    minHeight: 92, paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: palette.line,
    backgroundColor: 'rgba(5,7,11,0.97)',
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    ...shadow.card,
  },
  buy: {
    flex: 1, minHeight: 54, borderRadius: radii.lg,
    backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center',
  },
  buyAdded: { backgroundColor: 'rgba(75,230,169,0.15)', borderWidth: 1, borderColor: 'rgba(75,230,169,0.35)' },
  buyText: { color: palette.ink, fontSize: typeScale.bodySm, fontWeight: fontWeight.black },
  buyTextAdded: { color: palette.success },
  dockPrice: { alignItems: 'flex-end' },
  dockPriceLabel: { color: palette.textDim, fontSize: 10 },
  dockPriceValue: { color: palette.white, fontSize: typeScale.bodySm, fontWeight: fontWeight.black, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  muted: { color: palette.textMuted, textAlign: 'center' },
  errorTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, marginBottom: spacing.sm },
});
