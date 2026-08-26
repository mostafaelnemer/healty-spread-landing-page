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

/**
 * Order-level shipping fee for a list of checkout items.
 * Applied ONCE per order: the highest declared offer.shippingFee among
 * the items, 0 when no offer declares a fee. Quantity never multiplies
 * the fee — it is a single per-order charge regardless of cart size.
 */
export function getItemsShipping(items) {
  return items.reduce((max, item) => Math.max(max, item.offer?.shippingFee ?? 0), 0);
}

export function cartToCheckoutItems(cart, offers) {
  return offers
    .filter((o) => (cart[o.id] || 0) > 0)
    .map((o) => ({ offer: o, qty: cart[o.id] }));
}

/**
 * Number of sellable units an offer ships per 1 quantity.
 * Reads the offer's declared configuration first, then falls back to the
 * legacy top-level `unitsPerPack` field (spread offers). Products without
 * any pack declaration (e.g. bundles) default to 1.
 */
export function offerPackUnits(offer) {
  return offer?.configuration?.unitsPerPack ?? offer?.unitsPerPack ?? 1;
}

/**
 * True for offers that ship with a cola/lemon flavor distribution step at
 * checkout (declared via configuration.type === 'colaFlavors'). The
 * customer picks how many bottles are كولا vs ليمون نعناع within the pack.
 */
export function offerNeedsColaConfig(offer) {
  return offer?.configuration?.type === 'colaFlavors';
}

/**
 * True for offers that are spread jars the customer must distribute
 * across flavors at checkout. Kept as a separate check from the cola
 * distribution: spread offers declare configuration.type === 'flavors'
 * (and define top-level unitsPerPack); non-spread products skip it.
 */
export function offerNeedsFlavors(offer) {
  return (
    offer?.configuration?.type === 'flavors' ||
    (Number.isFinite(offer?.unitsPerPack) && offer.unitsPerPack > 0)
  );
}

/**
 * True for offers sold as a bundle (configuration.type === 'bundle'):
 * a fixed set of spread jars PLUS a cola shrink, both configured at
 * checkout by reusing the spread FlavorPicker and ColaFlavorDist.
 */
export function offerNeedsBundleConfig(offer) {
  return offer?.configuration?.type === 'bundle';
}

/** Spread jars included per 1 bundle quantity (bundle configuration). */
export function bundleSpreadUnits(offer) {
  return offer?.configuration?.spread?.unitsPerBundle ?? 0;
}

/** Cola shrinks included per 1 bundle quantity (bundle configuration). */
export function bundleColaShrinks(offer) {
  return offer?.configuration?.cola?.unitsPerBundle ?? 0;
}

/** Bottles inside 1 bundle cola shrink (matches the existing shrink size). */
export function bundleColaUnitsPerShrink(offer) {
  return offer?.configuration?.cola?.unitsPerShrink ?? 0;
}

/**
 * Total spread units the customer must distribute for this cart line:
 * spread units per bundle × bundle quantity (or pack units × qty for a
 * regular spread offer). Derived from data — never hardcoded.
 */
export function spreadDistributionTotal(item) {
  if (offerNeedsBundleConfig(item.offer)) {
    return bundleSpreadUnits(item.offer) * item.qty;
  }
  return offerPackUnits(item.offer) * item.qty;
}

/**
 * Total cola bottles the customer must distribute for this cart line:
 * shrinks × bottles-per-shrink × bundle quantity (or pack units × qty
 * for a regular cola offer).
 */
export function colaDistributionTotal(item) {
  if (offerNeedsBundleConfig(item.offer)) {
    return bundleColaShrinks(item.offer) * bundleColaUnitsPerShrink(item.offer) * item.qty;
  }
  return offerPackUnits(item.offer) * item.qty;
}

/**
 * True when this cart line carries a cola distribution to configure:
 * a colaFlavors offer OR the cola half of a bundle.
 */
export function itemNeedsColaDistribution(item) {
  return offerNeedsColaConfig(item.offer) || offerNeedsBundleConfig(item.offer);
}
