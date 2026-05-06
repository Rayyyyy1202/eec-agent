'use client';

import { getSkuById, type Sku } from './products';

const KEY = 'roborock_wishlist_v2';

export type Wishlist = { skuIds: string[]; updatedAt: number };

function read(): Wishlist {
  if (typeof window === 'undefined') return { skuIds: [], updatedAt: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { skuIds: [], updatedAt: 0 };
    return JSON.parse(raw) as Wishlist;
  } catch {
    return { skuIds: [], updatedAt: 0 };
  }
}

function write(next: Wishlist) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: next }));
}

export function getWishlist(): Wishlist {
  return read();
}

export function isWishlisted(skuId: string): boolean {
  return read().skuIds.includes(skuId);
}

export function toggleWishlist(skuId: string): boolean {
  const current = read();
  const has = current.skuIds.includes(skuId);
  const nextIds = has ? current.skuIds.filter((id) => id !== skuId) : [...current.skuIds, skuId];
  write({ skuIds: nextIds, updatedAt: Date.now() });
  return !has;
}

export function clearWishlist() {
  write({ skuIds: [], updatedAt: Date.now() });
}

export type ResolvedWishlistItem = { skuId: string; sku: Sku };

export function resolveWishlist(): ResolvedWishlistItem[] {
  return read()
    .skuIds.map((id) => {
      const sku = getSkuById(id);
      return sku ? { skuId: id, sku } : null;
    })
    .filter((x): x is ResolvedWishlistItem => x !== null);
}
