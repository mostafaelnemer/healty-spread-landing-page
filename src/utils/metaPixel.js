const CURRENCY = 'EGP';
// Production dataset. For local development, create a separate test dataset
// in Events Manager and set VITE_META_PIXEL_ID in .env.development —
// otherwise all tracking is disabled on localhost so dev traffic never
// pollutes production (Meta support request).
const ENV_PIXEL_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_META_PIXEL_ID) || '';
const PIXEL_ID = ENV_PIXEL_ID || '2211139682969128';

function isLocalDev() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false;
  const host = window.location.hostname || '';
  return host === 'localhost' || host.startsWith('127.');
}

let devNoticeShown = false;
function pixelEnabled() {
  if (typeof window !== 'undefined' && isLocalDev() && !ENV_PIXEL_ID) {
    if (!devNoticeShown) {
      devNoticeShown = true;
      console.info('[Meta Pixel] disabled on localhost (production dataset protected). Set VITE_META_PIXEL_ID to test locally.');
    }
    return false;
  }
  return true;
}

function normalizePhone(raw) {
  let p = String(raw).replace(/[\s\-]/g, '');
  if (p.startsWith('0')) p = '2' + p;
  return p;
}

let lastUserDataKey = '';

function deriveNameParts(name) {
  if (!name) return {};
  const tokens = String(name).trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return {};
  return { fn: tokens[0], ln: tokens[tokens.length - 1] };
}

export function setAdvancedMatching(userData = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (!pixelEnabled()) return;

  const data = {};
  if (userData.ph) data.ph = normalizePhone(userData.ph);
  if (userData.em) data.em = String(userData.em).toLowerCase().trim();
  if (userData.name) {
    const nameParts = deriveNameParts(userData.name);
    if (nameParts.fn) data.fn = nameParts.fn;
    if (nameParts.ln) data.ln = nameParts.ln;
  }

  if (Object.keys(data).length === 0) return;

  const key = JSON.stringify(data);
  if (key === lastUserDataKey) return;
  lastUserDataKey = key;

  window.fbq('init', PIXEL_ID, data);
}

export function trackMetaEvent(eventName, params = {}, eventID = null) {
  if (!pixelEnabled()) return;
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const options = eventID ? { eventID } : {};
    window.fbq('track', eventName, params, options);
  }
}

const LAST_PURCHASE_KEY = 'hs_last_purchase_at';
const PURCHASE_THROTTLE_MS = 30000;

// In-memory fallback (per-tab). localStorage below is the real guard.
let lastPurchaseAtMem = 0;

function readLastPurchaseAt() {
  try {
    const stored = Number(localStorage.getItem(LAST_PURCHASE_KEY));
    if (Number.isFinite(stored) && stored > 0) return stored;
  } catch {
  }
  return lastPurchaseAtMem;
}

function writeLastPurchaseAt(ts) {
  lastPurchaseAtMem = ts;
  try {
    localStorage.setItem(LAST_PURCHASE_KEY, String(ts));
  } catch {
  }
}

export function trackPurchaseOnce(orderId, purchaseData) {
  if (!pixelEnabled()) return false;
  const v = Number(purchaseData?.value);
  if (!Number.isFinite(v) || v <= 0) {
    if (typeof window !== 'undefined') {
      console.warn('[Meta Pixel] Purchase blocked: missing/invalid value', purchaseData);
    }
    return false;
  }

  const now = Date.now();
  // Cross-tab throttle: localStorage is shared across tabs of the same
  // origin, unlike the old in-memory var. Skipping the PIXEL here never
  // loses an order — the sheet + CAPI still run.
  if (now - readLastPurchaseAt() < PURCHASE_THROTTLE_MS) {
    if (typeof window !== 'undefined') {
      console.warn('[Meta Pixel] Purchase blocked: duplicate within 30s', orderId);
    }
    return false;
  }

  const storageKey = `purchase_tracked_${orderId}`;

  try {
    if (sessionStorage.getItem(storageKey)) {
      return false;
    }
    sessionStorage.setItem(storageKey, '1');
  } catch {
  }

  writeLastPurchaseAt(now);

  trackMetaEvent('Purchase', purchaseData, orderId);
  if (typeof window !== 'undefined') {
    console.log('[Meta Pixel] Purchase sent', {
      value: purchaseData.value,
      currency: purchaseData.currency,
      eventID: orderId,
    });
  }
  return true;
}

export function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function toMetaValue(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

function toMetaItemPrice(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

export function metaParamsFromOffer(offer, qty = 1) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  const itemPrice = toMetaItemPrice(offer.price);
  return {
    content_ids: [offer.id],
    content_type: 'product',
    content_category: offer.categoryId || 'general',
    contents: [{ id: offer.id, quantity: q, item_price: itemPrice }],
    num_items: q,
    value: toMetaValue(itemPrice * q),
    currency: CURRENCY,
  };
}

function contentsFromItems(items) {
  return items.map((item) => ({
    id: item.offer.id,
    quantity: item.qty,
    item_price: toMetaItemPrice(item.offer.price),
  }));
}

export function metaParamsFromItems(items, totalValue) {
  const categories = [...new Set(items.map((item) => item.offer.categoryId).filter(Boolean))];
  const value = toMetaValue(totalValue);
  if (!value) {
    if (typeof window !== 'undefined') {
      console.warn('[Meta Pixel] metaParamsFromItems: invalid totalValue', totalValue);
    }
  }
  return {
    content_ids: items.map((item) => item.offer.id),
    content_type: 'product',
    content_category: categories.length === 1 ? categories[0] : 'mixed',
    contents: contentsFromItems(items),
    num_items: items.reduce((sum, item) => sum + item.qty, 0),
    value,
    currency: CURRENCY,
  };
}
