import assert from 'node:assert/strict';
import { mapSpreadOffer } from '../src/utils/spreadOffers.js';
import { checkoutSignature, loadCheckoutDraftForItems, saveCheckoutDraft } from '../src/utils/checkoutSession.js';

const updated = { id: 'new-offer', name: 'New offer', description: 'Details', price: 321, units: 6 };
assert.equal(mapSpreadOffer(updated).unitsPerPack, 6);
assert.equal(mapSpreadOffer(updated).title, 'New offer');

const bar = mapSpreadOffer({ ...updated, units: 7 }, { configuration: { type: 'chocoBar', total: 5 } });
assert.equal(bar.configuration.total, 7);
assert.equal(bar.unitsPerPack, undefined);
const combo = mapSpreadOffer({ ...updated, units: 9 }, { configuration: { type: 'spreadAndChocoBar', spreadUnits: 2, chocoBarUnits: 2 } });
assert.equal(combo.unitsPerPack, 2);
assert.equal(combo.configuration.chocoBarUnits, 2);

const values = new Map();
const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
const items = [{ offer: bar, qty: 1 }];
const draft = { signature: checkoutSignature(items), name: 'Customer', itemChocoBar: [{ milkPlain: 7 }] };
saveCheckoutDraft(draft, storage);
assert.deepEqual(loadCheckoutDraftForItems(items, storage).itemChocoBar, draft.itemChocoBar);
assert.deepEqual(loadCheckoutDraftForItems([{ offer: { ...bar, price: 400 }, qty: 1 }], storage).itemChocoBar, draft.itemChocoBar);
const changed = [{ offer: { ...bar, configuration: { ...bar.configuration, total: 8 } }, qty: 1 }];
assert.equal(loadCheckoutDraftForItems(changed, storage).itemChocoBar, undefined);
assert.equal(loadCheckoutDraftForItems(changed, storage).name, 'Customer');
assert.equal(loadCheckoutDraftForItems([], storage).itemChocoBar, undefined);
console.log('All offer mapping and changed-cart draft scenarios passed.');
