const UNIT_PRICE = 499;

export function getDiscountedAmount(quantity) {
  const clampedQuantity = Math.max(1, quantity);
  return clampedQuantity * UNIT_PRICE;
}

export function normalizeItems(items) {
  return items.map((item) => ({
    productId: item.id,
    name: item.name,
    unitPrice: UNIT_PRICE,
    quantity: 1,
  }));
}
