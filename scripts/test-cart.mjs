import {
  incrementCartItem,
  setCartItemQty,
  getCartCount,
  getCartSubtotal,
  getGrandTotal,
  cartToCheckoutItems,
} from '../src/utils/cartState.js';

const offers = [
  { id: 'a', price: 100 },
  { id: 'b', price: 200 },
];
const SHIPPING = 50;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK:', msg);
  }
}

// 1–2: add via increment (card or button — same function)
let cart = {};
cart = incrementCartItem(cart, 'a');
assert(cart.a === 1 && getCartCount(cart) === 1, 'first add sets qty 1');

cart = incrementCartItem(cart, 'a');
assert(cart.a === 2 && getCartCount(cart) === 2, 'same product increments qty, not duplicate line');

// 3: multiple adds same product
cart = incrementCartItem(cart, 'a');
assert(cart.a === 3, 'third add → qty 3');

// 4: different products
cart = incrementCartItem(cart, 'b');
assert(cart.a === 3 && cart.b === 1 && getCartCount(cart) === 4, 'two products in cart');

// 5–6: subtotal and grand total
const subtotal = getCartSubtotal(cart, offers);
assert(subtotal === 3 * 100 + 200, `subtotal = ${subtotal} (expected 500)`);

const grand = getGrandTotal(cart, offers, SHIPPING);
assert(grand === 550, `grand total = ${grand} (expected 550)`);

// checkout items shape
const items = cartToCheckoutItems(cart, offers);
assert(items.length === 2 && items.find((i) => i.offer.id === 'a').qty === 3, 'checkout items merged by offer id');

// qty zero removes line
cart = setCartItemQty(cart, 'a', 0);
assert(cart.a === undefined && getCartCount(cart) === 1, 'qty 0 removes offer from cart');

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll cart scenarios passed.');
