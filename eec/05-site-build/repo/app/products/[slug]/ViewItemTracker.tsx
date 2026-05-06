'use client';

import { useEffect } from 'react';
import { track } from '@/lib/gtm';

type Props = {
  skuId: string;
  name: string;
  category: string;
  price: number;
  currency: string;
};

export default function ViewItemTracker({ skuId, name, category, price, currency }: Props) {
  useEffect(() => {
    track('view_item', {
      item_id: skuId,
      item_name: name,
      item_category: category,
      price,
      currency
    });
  }, [skuId, name, category, price, currency]);
  return null;
}
