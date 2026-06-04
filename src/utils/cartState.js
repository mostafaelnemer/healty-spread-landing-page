/** Pure cart helpers — single source of truth for qty / totals logic */

export function incrementCartItem(cart, offerId) {
  return { ...cart, [offerId]: (cart[offerId] || 0) + 1 };
}

export function setCartItemQty(cart, offerId, qty) {
  if (qty <= 0) {
    const next = { ...cart };
    delete next[offerId];
    return next;
  }
  return { ...cart, [offerId]: qty };
}

export function getCartCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

export function getCartSubtotal(cart, offers) {
  return offers.reduce((sum, o) => sum + o.price * (cart[o.id] || 0), 0);
}

export function getGrandTotal(cart, offers, shippingFee) {
  const subtotal = getCartSubtotal(cart, offers);
  const count = getCartCount(cart);
  return subtotal + (count > 0 ? shippingFee : 0);
}

export function cartToCheckoutItems(cart, offers) {
  return offers
    .filter((o) => (cart[o.id] || 0) > 0)
    .map((o) => ({ offer: o, qty: cart[o.id] }));
}
