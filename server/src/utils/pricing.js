const UNIT_PRICE = 299;
const SINGLE_KIT_DELIVERY_CHARGE = 40;
const PRICE_TIERS = {
  1: 299,
  2: 499,
  3: 749,
  4: 999,
};

export function getDiscountedAmount(quantity) {
  const clampedQuantity = Math.max(1, quantity);
  const tierQuantity = Math.min(clampedQuantity, 4);
  const extra = clampedQuantity > 4 ? (clampedQuantity - 4) * UNIT_PRICE : 0;
  const subtotal = PRICE_TIERS[tierQuantity] + extra;
  const deliveryCharge = clampedQuantity === 1 ? SINGLE_KIT_DELIVERY_CHARGE : 0;
  return subtotal + deliveryCharge;
}

export function normalizeItems(items) {
  return items.map((item) => ({
    productId: item.id,
    name: item.name,
    unitPrice: UNIT_PRICE,
    quantity: item.quantity,
  }));
}
