const CHECKOUT_CART_KEY = 'hs_checkout_cart';
const CHECKOUT_DRAFT_KEY = 'hs_checkout_draft';

function browserSessionStorage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function readJson(key, storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store only stable offer IDs and quantities. Offer data is restored from
 * landingData after a refresh, so a deployment never leaves stale asset URLs
 * or prices inside the saved checkout.
 */
export function saveCheckoutCart(items, storage = browserSessionStorage()) {
  if (!storage) return;
  const lines = items
    .filter((item) => item?.offer?.id && Number.isFinite(item.qty) && item.qty > 0)
    .map((item) => ({ offerId: item.offer.id, qty: item.qty }));

  if (lines.length === 0) {
    storage.removeItem(CHECKOUT_CART_KEY);
    return;
  }

  storage.setItem(CHECKOUT_CART_KEY, JSON.stringify(lines));
}

export function loadCheckoutCart(offers, storage = browserSessionStorage()) {
  const lines = readJson(CHECKOUT_CART_KEY, storage);
  if (!Array.isArray(lines)) return [];

  const offersById = new Map(offers.map((offer) => [offer.id, offer]));
  return lines.flatMap((line) => {
    const offer = offersById.get(line?.offerId);
    const qty = Number(line?.qty);
    return offer && Number.isInteger(qty) && qty > 0 ? [{ offer, qty }] : [];
  });
}

export function saveCheckoutDraft(draft, storage = browserSessionStorage()) {
  if (!storage) return;
  storage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function loadCheckoutDraft(storage = browserSessionStorage()) {
  const draft = readJson(CHECKOUT_DRAFT_KEY, storage);
  return draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : null;
}

export function clearCheckoutDraft(storage = browserSessionStorage()) {
  storage?.removeItem(CHECKOUT_DRAFT_KEY);
}

export function clearCheckoutSession(storage = browserSessionStorage()) {
  if (!storage) return;
  storage.removeItem(CHECKOUT_CART_KEY);
  storage.removeItem(CHECKOUT_DRAFT_KEY);
}

export { CHECKOUT_CART_KEY, CHECKOUT_DRAFT_KEY };
