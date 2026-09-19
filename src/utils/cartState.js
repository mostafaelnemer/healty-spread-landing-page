
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

export function getItemsShipping(items) {
  return items.reduce((max, item) => Math.max(max, item.offer?.shippingFee ?? 0), 0);
}

export function cartToCheckoutItems(cart, offers) {
  return offers
    .filter((o) => (cart[o.id] || 0) > 0)
    .map((o) => ({ offer: o, qty: cart[o.id] }));
}

export function offerPackUnits(offer) {
  return offer?.configuration?.unitsPerPack ?? offer?.unitsPerPack ?? 1;
}

export function offerNeedsColaConfig(offer) {
  return offer?.configuration?.type === 'colaFlavors';
}

export function offerNeedsFlavors(offer) {
  return (
    offer?.configuration?.type === 'flavors' ||
    (Number.isFinite(offer?.unitsPerPack) && offer.unitsPerPack > 0)
  );
}

export function offerNeedsBundleConfig(offer) {
  return offer?.configuration?.type === 'bundle';
}

export function bundleSpreadUnits(offer) {
  return offer?.configuration?.spread?.unitsPerBundle ?? 0;
}

export function bundleColaShrinks(offer) {
  return offer?.configuration?.cola?.unitsPerBundle ?? 1;
}

export function bundleColaUnitsPerShrink(offer) {
  return offer?.configuration?.cola?.unitsPerShrink ?? 0;
}

export function spreadDistributionTotal(item) {
  if (offerNeedsBundleConfig(item.offer)) {
    return bundleSpreadUnits(item.offer) * item.qty;
  }
  return offerPackUnits(item.offer) * item.qty;
}

export function colaDistributionTotal(item) {
  if (offerNeedsBundleConfig(item.offer)) {
    return bundleColaShrinks(item.offer) * bundleColaUnitsPerShrink(item.offer) * item.qty;
  }
  return offerPackUnits(item.offer) * item.qty;
}

export function itemNeedsColaDistribution(item) {
  return offerNeedsColaConfig(item.offer) || offerNeedsBundleConfig(item.offer);
}
