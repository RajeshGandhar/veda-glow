/** Tiered pricing for VedaGlow 28-Day Kit */
const UNIT_PRICE = 499;

export interface PriceBreakdown {
  discounted: number; // final price to pay
  original: number; // qty × unit price (MRP)
  savings: number; // original − discounted
  isMostPopular: boolean;
  hasFreeDelivery: boolean;
}

/**
 * Returns full price breakdown for a given quantity.
 * For qty > 4, each extra unit is added at unit price on top of the qty-4 tier.
 */
export function getPriceByQty(qty: number): PriceBreakdown {
  const clampedQty = Math.max(1, qty);
  const discounted = clampedQty * UNIT_PRICE;
  const original = discounted;

  return {
    discounted,
    original,
    savings: 0,
    isMostPopular: false,
    hasFreeDelivery: true,
  };
}
