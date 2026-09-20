import * as SecureStore from 'expo-secure-store';

const CART_KEY = 'playnexus.native-cart.v1';

export type LocalCartLine = {
  product_id: number;
  variant_id: number | null;
  quantity: number;
  title: string;
  cover_url?: string | null;
  variant_name?: string | null;
  unit_price?: number | null;
};

export async function readCart(): Promise<LocalCartLine[]> {
  const raw = await SecureStore.getItemAsync(CART_KEY);
  if (!raw) return [];

  try {
    const value = JSON.parse(raw) as LocalCartLine[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function writeCart(lines: LocalCartLine[]) {
  if (!lines.length) {
    await SecureStore.deleteItemAsync(CART_KEY);
    return;
  }

  await SecureStore.setItemAsync(CART_KEY, JSON.stringify(lines));
}

export async function addToCart(line: Omit<LocalCartLine, 'quantity'> & { quantity?: number }) {
  const cart = await readCart();
  const key = line.product_id + ':' + (line.variant_id ?? 'base');
  const existing = cart.find(
    (item) => item.product_id + ':' + (item.variant_id ?? 'base') === key,
  );

  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + (line.quantity ?? 1));
  } else {
    cart.push({ ...line, quantity: line.quantity ?? 1 });
  }

  await writeCart(cart);
  return cart;
}

export async function updateCartQuantity(
  productId: number,
  variantId: number | null,
  quantity: number,
) {
  const cart = await readCart();
  const next = quantity <= 0
    ? cart.filter((item) => !(item.product_id === productId && item.variant_id === variantId))
    : cart.map((item) => (
      item.product_id === productId && item.variant_id === variantId
        ? { ...item, quantity: Math.min(10, quantity) }
        : item
    ));

  await writeCart(next);
  return next;
}

export async function clearCart() {
  await SecureStore.deleteItemAsync(CART_KEY);
}

export function cartRequestItems(lines: LocalCartLine[]) {
  return lines.map(({ product_id, variant_id, quantity }) => ({
    product_id,
    variant_id,
    quantity,
  }));
}
