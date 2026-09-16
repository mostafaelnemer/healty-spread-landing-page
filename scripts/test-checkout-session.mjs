import {
  CHECKOUT_CART_KEY,
  CHECKOUT_DRAFT_KEY,
  clearCheckoutDraft,
  clearCheckoutSession,
  loadCheckoutCart,
  loadCheckoutDraft,
  saveCheckoutCart,
  saveCheckoutDraft,
} from '../src/utils/checkoutSession.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

let failed = 0;
function assert(condition, message) {
  if (condition) {
    console.log('OK:', message);
  } else {
    console.error('FAIL:', message);
    failed += 1;
  }
}

const storage = memoryStorage();
const offers = [
  { id: 'two-jars', price: 450 },
  { id: 'bundle', price: 900 },
];

saveCheckoutCart([{ offer: offers[0], qty: 2 }], storage);
assert(storage.getItem(CHECKOUT_CART_KEY) !== null, 'cart is saved');

const restored = loadCheckoutCart(offers, storage);
assert(restored.length === 1, 'saved cart line is restored');
assert(restored[0].offer === offers[0] && restored[0].qty === 2, 'offer data is rehydrated by ID');

storage.setItem(CHECKOUT_CART_KEY, JSON.stringify([{ offerId: 'removed-offer', qty: 1 }]));
assert(loadCheckoutCart(offers, storage).length === 0, 'removed offers are ignored safely');

const draft = { name: 'Test', phone: '01000000000', itemFlavors: [{ kids: 2 }] };
saveCheckoutDraft(draft, storage);
assert(loadCheckoutDraft(storage).phone === draft.phone, 'form draft is restored');

clearCheckoutDraft(storage);
assert(storage.getItem(CHECKOUT_DRAFT_KEY) === null, 'draft can be cleared independently');

saveCheckoutCart([{ offer: offers[1], qty: 1 }], storage);
saveCheckoutDraft(draft, storage);
clearCheckoutSession(storage);
assert(storage.getItem(CHECKOUT_CART_KEY) === null, 'checkout clear removes cart');
assert(storage.getItem(CHECKOUT_DRAFT_KEY) === null, 'checkout clear removes form draft');

if (failed) process.exit(1);
console.log('\nAll checkout session scenarios passed.');
