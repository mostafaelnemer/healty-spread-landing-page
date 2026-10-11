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

// Bind distributions to the offer definitions, not just array positions.
export function checkoutSignature(items) {
  return JSON.stringify(items.map(({ offer, qty }) => ({
    id: offer.id, qty, units: offer.unitsPerPack, configuration: offer.configuration,
    flavors: offer.flavorOptions?.map(({ id, name, group }) => ({ id, name, group })),
  })));
}

export function loadCheckoutDraftForItems(items, storage = browserSessionStorage()) {
  const draft = loadCheckoutDraft(storage);
  if (!draft || draft.signature === checkoutSignature(items)) return draft;
  return { ...draft, itemFlavors: undefined, itemCola: undefined, itemChocoBar: undefined };
}
