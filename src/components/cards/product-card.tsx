import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';

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
  return typeof value === 'number' ? value.toLocaleString('fa-IR') + ' تومان' : '—';
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
  const finalPrice = product.pricing?.final_price ?? product.pricing?.sale_price ?? product.pricing?.regular_price;
  const hasDiscount = Boolean(product.pricing?.discount_amount && product.pricing.discount_amount > 0);

  return (
    <PressableScale onPress={onPress} style={[styles.card, { width } as never]}>
      <View style={styles.imageFrame}>
        <Image
          source={product.cover_url ? { uri: product.cover_url } : require('../../../assets/images/logo-glow.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={String(product.id)}
          transition={180}
        />
        {hasDiscount ? (
          <View style={styles.discount}>
            <Text style={styles.discountText}>SALE</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text style={styles.category}>{product.category || 'PLAYNEXUS STORE'}</Text>
        <Text numberOfLines={2} style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{money(finalPrice)}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    overflow: 'hidden',
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: palette.surface,
  },
  discount: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.danger,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  discountText: { color: palette.white, fontSize: 9, fontWeight: fontWeight.black },
  copy: { padding: spacing.md, alignItems: 'flex-end' },
  category: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 0.8 },
  title: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    lineHeight: 21,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: 5,
    minHeight: 42,
  },
  price: { color: palette.white, fontSize: typeScale.bodySm, fontWeight: fontWeight.black, marginTop: spacing.sm },
});
