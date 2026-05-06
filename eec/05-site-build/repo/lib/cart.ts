'use client';

// Mock cart — uses localStorage. Real impl would call Medusa.
import { getSkuById, type Sku } from './products';

const KEY = 'roborock_cart_v1';

export type CartLine = { skuId: string; quantity: number };
export type Cart = { lines: CartLine[]; updatedAt: number };

function read(): Cart {
  if (typeof window === 'undefined') return { lines: [], updatedAt: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { lines: [], updatedAt: 0 };
    return JSON.parse(raw) as Cart;
  } catch {
    return { lines: [], updatedAt: 0 };
  }
}

function write(cart: Cart) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

export function getCart(): Cart {
  return read();
}

export function addLine(skuId: string, quantity = 1) {
  const cart = read();
  const existing = cart.lines.find((l) => l.skuId === skuId);
  const nextLines = existing
    ? cart.lines.map((l) => (l.skuId === skuId ? { ...l, quantity: l.quantity + quantity } : l))
    : [...cart.lines, { skuId, quantity }];
  write({ lines: nextLines, updatedAt: Date.now() });
}

export function removeLine(skuId: string) {
  const cart = read();
  write({ lines: cart.lines.filter((l) => l.skuId !== skuId), updatedAt: Date.now() });
}

export function setQuantity(skuId: string, quantity: number) {
  if (quantity <= 0) return removeLine(skuId);
  const cart = read();
  write({
    lines: cart.lines.map((l) => (l.skuId === skuId ? { ...l, quantity } : l)),
    updatedAt: Date.now()
  });
}

export function clearCart() {
  write({ lines: [], updatedAt: Date.now() });
}

export type ResolvedLine = CartLine & { sku: Sku };

export function resolveCart(): { lines: ResolvedLine[]; subtotal: number; currency: string } {
  const cart = read();
  const lines: ResolvedLine[] = cart.lines
    .map((l) => {
      const sku = getSkuById(l.skuId);
      if (!sku) return null;
      return { ...l, sku };
    })
    .filter((l): l is ResolvedLine => l !== null);
  const subtotal = lines.reduce((s, l) => s + l.sku.price.amount * l.quantity, 0);
  const currency = lines[0]?.sku.price.currency || 'USD';
  return { lines, subtotal, currency };
}
