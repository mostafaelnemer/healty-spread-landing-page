/**
 * metaPixel.js — Single source of truth for all Meta Pixel tracking.
 *
 * KEY CONCEPT: event_id deduplication
 * ────────────────────────────────────
 * When both the browser Pixel AND the server-side CAPI fire for the same
 * conversion (e.g. Purchase), Meta needs a shared `event_id` to merge
 * them into ONE counted event. In this codebase the `orderId` (e.g.
 * "HS-1720612345-A3F2K") IS the event_id — it is generated client-side,
 * sent to Apps Script, and echoed into the CAPI payload's `event_id`
 * field. The same orderId is passed as `eventID` in the browser
 * fbq('track', ...) call.
 *
 * DO NOT generate a separate event_id. orderId must stay identical
 * everywhere (Pixel option, CAPI payload, dedup sheet) for Meta's
 * deduplication to work.
 */

const CURRENCY = 'EGP';

// ---------------------------------------------------------------------------
// Core tracking helper
// ---------------------------------------------------------------------------

/**
 * Fires a browser-side Meta Pixel event.
 * @param {string}      eventName  e.g. 'Purchase', 'AddToCart'
 * @param {Object}      params     custom_data / content fields
 * @param {string|null} eventID    shared event_id for server dedup (orderId)
 */
export function trackMetaEvent(eventName, params = {}, eventID = null) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    // When eventID is provided, Meta will use it to deduplicate this
    // browser event against the matching CAPI event with the same event_id.
    const options = eventID ? { eventID } : {};
    window.fbq('track', eventName, params, options);
  }
}

// ---------------------------------------------------------------------------
// Purchase-specific: fire-once guard
// ---------------------------------------------------------------------------

/**
 * Fires the browser-side Purchase Pixel event exactly ONCE per orderId.
 *
 * Guard strategy (layered):
 *  1. sessionStorage flag keyed by orderId — survives component remount,
 *     page refresh within the same tab, and browser back-button.
 *  2. The flag is written SYNCHRONOUSLY before any async work, so even
 *     a near-simultaneous second call (e.g. React re-render) is blocked.
 *
 * @param {string} orderId   The order/event ID (shared with CAPI).
 * @param {Object} purchaseData  The content/value payload for fbq.
 */
export function trackPurchaseOnce(orderId, purchaseData) {
  // ── event_id: orderId is reused here as the Pixel eventID so that
  // ── Meta can match this browser event with the CAPI event fired by
  // ── Apps Script, which also uses orderId as its event_id.
  const storageKey = `purchase_tracked_${orderId}`;

  if (sessionStorage.getItem(storageKey)) {
    // Already tracked for this orderId in this session — skip.
    return;
  }

  // Set flag IMMEDIATELY (sync) to block any concurrent / re-render call.
  sessionStorage.setItem(storageKey, '1');

  // Fire the Pixel event with the shared event_id (= orderId).
  trackMetaEvent('Purchase', purchaseData, orderId);
}

// ---------------------------------------------------------------------------
// Event ID generation (informational)
// ---------------------------------------------------------------------------

/**
 * Generates a unique event ID. In practice, the codebase uses `orderId`
 * (generated in StepConfirm via getOrCreateOrderId) as the event_id for
 * both Pixel and CAPI, so this function is provided for completeness /
 * future use but is NOT called in the current Purchase flow.
 *
 * If you ever need a standalone event_id (e.g. for Lead or other events
 * that don't have a natural order ID), use this.
 */
export function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Payload helpers
// ---------------------------------------------------------------------------

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

function contentsFromItems(items) {
  return items.map((item) => ({
    id: item.offer.id,
    quantity: item.qty,
    item_price: item.offer.price,
  }));
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
