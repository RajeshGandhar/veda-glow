/** Tiered pricing for VedaGlow 28-Day Kit */
const UNIT_PRICE = 299;

const PRICE_TIERS: Record<number, number> = {
  1: 299,
  2: 499,
  3: 749,
  4: 999,
};

export interface PriceBreakdown {
  discounted: number; // final price to pay
  original: number;   // qty × unit price (MRP)
  savings: number;    // original − discounted
  isMostPopular: boolean;
  hasFreeDelivery: boolean;
}

/**
 * Returns full price breakdown for a given quantity.
 * For qty > 4, each extra unit is added at unit price on top of the qty-4 tier.
 */
export function getPriceByQty(qty: number): PriceBreakdown {
  const clampedQty = Math.max(1, qty);
  const tierQty = Math.min(clampedQty, 4) as 1 | 2 | 3 | 4;
  const extra = clampedQty > 4 ? (clampedQty - 4) * UNIT_PRICE : 0;
  const discounted = PRICE_TIERS[tierQty] + extra;
  const original = clampedQty * UNIT_PRICE;

  return {
    discounted,
    original,
    savings: original - discounted,
    isMostPopular: clampedQty === 2,
    hasFreeDelivery: clampedQty >= 2,
  };
}
