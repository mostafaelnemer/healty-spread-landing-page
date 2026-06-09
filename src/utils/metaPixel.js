const CURRENCY = 'EGP';

export function trackMetaEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

function contentsFromItems(items) {
  return items.map((item) => ({
    id: item.offer.id,
    quantity: item.qty,
    item_price: item.offer.price,
  }));
}

export function metaParamsFromOffer(offer, qty = 1) {
  return {
    content_ids: [offer.id],
    content_type: 'product',
    contents: [{ id: offer.id, quantity: qty, item_price: offer.price }],
    num_items: qty,
    value: offer.price * qty,
    currency: CURRENCY,
  };
}

export function metaParamsFromItems(items, totalValue) {
  return {
    content_ids: items.map((item) => item.offer.id),
    content_type: 'product',
    contents: contentsFromItems(items),
    num_items: items.reduce((sum, item) => sum + item.qty, 0),
    value: totalValue,
    currency: CURRENCY,
  };
}
