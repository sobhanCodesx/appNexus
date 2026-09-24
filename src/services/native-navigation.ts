import type { Href } from 'expo-router';

function pathOf(value: string) {
  try {
    return new URL(value, 'https://playnexus.ir').pathname;
  } catch {
    return value.startsWith('/') ? value : '/' + value;
  }
}

export function nativeHrefFromUrl(value?: string | null): Href | null {
  if (!value) return null;
  const path = pathOf(value);

  const content = path.match(/^\/(?:posts|videos|shorts|feed)\/([^/]+)/);
  if (content?.[1]) {
    return { pathname: '/content/[slug]', params: { slug: decodeURIComponent(content[1]) } };
  }

  const channel = path.match(/^\/channels\/([^/]+)/);
  if (channel?.[1]) {
    return { pathname: '/channel/[slug]', params: { slug: decodeURIComponent(channel[1]) } };
  }

  const studio = path.match(/^\/studios\/([^/]+)/);
  if (studio?.[1]) {
    return { pathname: '/studio/[slug]', params: { slug: decodeURIComponent(studio[1]) } };
  }

  const product = path.match(/^\/products\/([^/]+)/);
  if (product?.[1]) {
    return { pathname: '/product/[slug]', params: { slug: decodeURIComponent(product[1]) } };
  }

  const category = path.match(/^\/(?:categories|shop\/categories)\/([^/]+)/);
  if (category?.[1]) {
    return { pathname: '/category/[slug]', params: { slug: decodeURIComponent(category[1]) } };
  }

  const invoice = path.match(/^\/orders\/(\d+)\/invoice/);
  if (invoice?.[1]) {
    return { pathname: '/invoice/[id]', params: { id: invoice[1] } };
  }

  const order = path.match(/^\/orders\/(\d+)/);
  if (order?.[1]) {
    return { pathname: '/order/[id]', params: { id: order[1] } };
  }

  const ticket = path.match(/^\/account\/tickets\/(\d+)/);
  if (ticket?.[1]) {
    return { pathname: '/ticket/[id]', params: { id: ticket[1] } };
  }

  const collection = path.match(/^\/collections\/([^/]+)/);
  if (collection?.[1]) {
    return { pathname: '/collection/[slug]', params: { slug: decodeURIComponent(collection[1]) } };
  }

  if (path === '/feed' || path.startsWith('/feed?')) return '/feed';
  if (path.startsWith('/channels')) return '/channels';
  if (path.startsWith('/studios')) return '/studios';
  if (path.startsWith('/categories')) return '/categories';
  if (path.startsWith('/game-radar')) return '/(tabs)/radar';
  if (path.startsWith('/discover')) return '/(tabs)/explore';
  if (path.startsWith('/videos')) return '/(tabs)/videos';
  if (path.startsWith('/account/tickets')) return '/tickets';
  if (path.startsWith('/account')) return '/(tabs)/profile';
  if (path.startsWith('/orders')) return '/orders';
  if (path.startsWith('/account/addresses')) return '/addresses';
  if (path.startsWith('/account/notifications')) return '/notifications';
  if (path.startsWith('/account/saved')) return '/saved';
  if (path.startsWith('/shop') || path === '/products') return '/store';

  return '/(tabs)';
}
