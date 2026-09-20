import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import {
  fontFamily,
  fontWeight,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';

export type ProductSummary = {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  badge?: string | null;
  availability?: string | null;
  stock?: number | null;
  trade_enabled?: boolean;
  cover_url?: string | null;
  pricing?: {
    regular_price?: number;
    sale_price?: number;
    final_price?: number;
    discount_amount?: number;
    is_partner_price?: boolean;
  };
};

function money(value?: number) {
  return typeof value === 'number'
    ? value.toLocaleString('fa-IR') + ' تومان'
    : '—';
}

export function ProductCard({
  product,
  onPress,
  width = 208,
}: {
  product: ProductSummary;
  onPress?: () => void;
  width?: number | string;
}) {
  const finalPrice = product.pricing?.final_price
    ?? product.pricing?.sale_price
    ?? product.pricing?.regular_price;

  const regularPrice = product.pricing?.regular_price;
  const hasDiscount = Boolean(
    product.pricing?.discount_amount
      && product.pricing.discount_amount > 0,
  );

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.982}
      style={[styles.card, { width } as never]}>
      <View style={styles.imageFrame}>
        <Image
          source={
            product.cover_url
              ? { uri: product.cover_url }
              : require('../../../assets/images/logo-glow.png')
          }
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={String(product.id)}
          transition={180}
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={[
            'rgba(3,5,9,0.00)',
            'rgba(3,5,9,0.02)',
            'rgba(3,5,9,0.78)',
          ]}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topMeta}>
          {hasDiscount ? (
            <View style={styles.discount}>
              <Text style={styles.discountText}>SALE</Text>
            </View>
          ) : (
            <View style={styles.storeBadge}>
              <View style={styles.storeDot} />
              <Text style={styles.storeBadgeText}>STORE</Text>
            </View>
          )}

          {product.trade_enabled ? (
            <View style={styles.tradeBadge}>
              <Text style={styles.tradeBadgeText}>TRADE</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.imageBottom}>
          <Text style={styles.category}>
            {product.category || 'PLAYNEXUS STORE'}
          </Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{product.title}</Text>

        <View style={styles.priceRow}>
          <View style={styles.openOrb}>
            <View style={styles.openArrow} />
          </View>

          <View style={styles.priceCopy}>
            <Text style={styles.price}>{money(finalPrice)}</Text>
            {hasDiscount && regularPrice ? (
              <Text style={styles.regularPrice}>{money(regularPrice)}</Text>
            ) : (
              <Text style={styles.stock}>
                {product.stock !== null && product.stock !== undefined
                  ? product.stock.toLocaleString('fa-IR') + ' موجود'
                  : product.availability || 'Available'}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.signalLine} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.026)',
    overflow: 'hidden',
    ...shadow.soft,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 0.80,
    backgroundColor: palette.surface,
  },
  topMeta: {
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  discount: {
    height: 27,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,97,120,0.90)',
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    color: palette.white,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  storeBadge: {
    height: 27,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  storeBadgeText: {
    color: palette.white,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  tradeBadge: {
    height: 27,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(88,244,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeBadgeText: {
    color: palette.cyan,
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  imageBottom: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    alignItems: 'flex-end',
  },
  category: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 8,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  copy: {
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  title: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    lineHeight: 21,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    minHeight: 42,
  },
  priceRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  priceCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  price: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
  },
  regularPrice: {
    color: palette.textDim,
    fontSize: 9,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  stock: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 2,
  },
  openOrb: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(88,244,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
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
  signalLine: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    width: 40,
    height: 2,
    backgroundColor: palette.cyan,
    opacity: 0.55,
  },
});
