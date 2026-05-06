'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';
import { getWishlist } from '@/lib/wishlist';
import SearchBar from '@/components/SearchBar';
import { CCPA_DO_NOT_SELL } from '@/lib/legal';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const refreshCart = () => setCartCount(getCart().lines.reduce((s, l) => s + l.quantity, 0));
    const refreshWishlist = () => setWishlistCount(getWishlist().skuIds.length);
    refreshCart();
    refreshWishlist();
    window.addEventListener('cart:updated', refreshCart);
    window.addEventListener('wishlist:updated', refreshWishlist);
    return () => {
      window.removeEventListener('cart:updated', refreshCart);
      window.removeEventListener('wishlist:updated', refreshWishlist);
    };
  }, []);

  return (
    <header className="border-b border-brand-neutral-3 bg-brand-secondary sticky top-0 z-30">
      <div className="bg-brand-primary text-brand-secondary text-xs">
        <div className="max-w-6xl mx-auto px-4 h-7 flex items-center justify-end gap-4">
          <Link
            href={CCPA_DO_NOT_SELL.routePath}
            className="opacity-90 hover:opacity-100 hover:underline"
            data-ccpa-link
          >
            {CCPA_DO_NOT_SELL.headerLabel}
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 rounded-full border-2 border-brand-primary relative">
            <div className="absolute inset-1 rounded-full border border-brand-primary opacity-50" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Roborock</span>
        </Link>
        <nav className="hidden md:flex gap-5 text-sm font-medium">
          <Link href="/collections/all" className="hover:text-brand-accent transition">Shop</Link>
          <Link href="/collections/pet-households" className="hover:text-brand-accent transition">For Pets</Link>
          <Link href="/compare" className="hover:text-brand-accent transition">Compare</Link>
          <Link href="/products/roborock-replenish-6mo" className="hover:text-brand-accent transition">Accessories</Link>
          <Link href="/blog" className="hover:text-brand-accent transition">Blog</Link>
          <Link href="/about" className="hover:text-brand-accent transition">About</Link>
          <Link href="/help" className="hover:text-brand-accent transition">Help</Link>
        </nav>
        <div className="flex items-center gap-4">
          <SearchBar />
          <Link href="/wishlist" className="relative text-sm font-medium" aria-label="Wishlist">
            <span aria-hidden="true">♥</span>
            <span className="sr-only">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-brand-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative text-sm font-medium">
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-brand-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
