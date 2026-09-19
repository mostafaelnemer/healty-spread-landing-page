
const ORDER_ID_KEY = 'hs_pending_order_id';
const ORDER_COMPLETED_PREFIX = 'order_completed_';

export function getOrCreateOrderId() {
  let id = sessionStorage.getItem(ORDER_ID_KEY);
  if (!id) {
    id = `HS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    sessionStorage.setItem(ORDER_ID_KEY, id);
  }
  return id;
}

export function resetOrderId() {
  sessionStorage.removeItem(ORDER_ID_KEY);
}

export function isOrderCompleted(orderId) {
  return !!sessionStorage.getItem(`${ORDER_COMPLETED_PREFIX}${orderId}`);
}

export function markOrderCompleted(orderId) {
  sessionStorage.setItem(`${ORDER_COMPLETED_PREFIX}${orderId}`, '1');
}

export { ORDER_ID_KEY };
