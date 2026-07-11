import { useEffect, useRef, useState } from 'react';
import { egyptGovs, formatPrice, SHIPPING_FEE, spreadFlavors } from '../data/landingData.js';
import { emptyFlavors } from './FlavorPicker.jsx';
import CartFlavors from './CartFlavors.jsx';
import OfferImage from './OfferImage.jsx';
import { trackPurchaseOnce, metaParamsFromItems } from '../utils/metaPixel.js';
import {
  getOrCreateOrderId,
  resetOrderId,
  markOrderCompleted,
} from '../utils/orderSession.js';

const ORDER_API_URL = 'https://script.google.com/macros/s/AKfycbwmCSkvnrX6Ow09kNwJXJoQvRSD-WPQvENWjsGIjSwiSewN40EjbxDmPT6P1A8kRPQl/exec';

function initialItemFlavors(items) {
  return items.map(() => ({ ...emptyFlavors() }));
}

function describeFlavors(flavors) {
  return spreadFlavors
    .filter((f) => (flavors[f.id] ?? 0) > 0)
    .map((f) => `${flavors[f.id]} ${f.shortLabel}`)
    .join(' + ');
}

function flavorsComplete(items, itemFlavors) {
  return items.every((item, i) => {
    const total = item.offer.unitsPerPack * item.qty;
    const used = spreadFlavors.reduce((s, f) => s + (itemFlavors[i][f.id] ?? 0), 0);
    return used === total;
  });
}

// Re-export isOrderCompleted from the shared session utility so that
// App.jsx can import it without triggering a static load of this module.
// (This module is also lazy-loaded; dual imports caused double submissions.)
export { isOrderCompleted } from '../utils/orderSession.js';

export default function StepConfirm({ form, cartItems: initialItems, onBack, onSuccess }) {
  const titleRef = useRef(null);
  // orderId is stable for the entire checkout session. It's the primary
  // deduplication key — Apps Script will reject any duplicate submission.
  const orderIdRef = useRef(getOrCreateOrderId());
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitState, setSubmitState] = useState('idle');
  const submitGuardRef = useRef(false);
  const [touched, setTouched] = useState({});
  const [flavorTouched, setFlavorTouched] = useState(false);
  const [itemFlavors, setItemFlavors] = useState(() => initialItemFlavors(initialItems));

  useEffect(() => {
    if (items.length === 0) onBack();
  }, [items.length, onBack]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  if (items.length === 0) return null;

  const totalPrice    = items.reduce((sum, item) => sum + item.offer.price    * item.qty, 0);
  const totalOriginal = items.reduce((sum, item) => sum + item.offer.originalPrice * item.qty, 0);
  const totalSaving   = totalOriginal - totalPrice;
  const grandTotal    = totalPrice + SHIPPING_FEE;
  const flavorsOk = flavorsComplete(items, itemFlavors);

  const errors = {
    name: !name.trim() ? 'الاسم مطلوب' : '',
    phone: !phone.trim()
      ? 'رقم الموبايل مطلوب'
      : !/^01[0-9]{9}$/.test(phone.trim())
        ? 'رقم غير صحيح، مثال: 01XXXXXXXXX'
        : '',
    gov: !gov ? 'اختر محافظتك' : '',
    address: !address.trim()
      ? 'العنوان مطلوب'
      : address.trim().length < 10
        ? 'اكتب العنوان بتفصيل أكتر'
        : '',
  };

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setItemFlavors((prev) => prev.filter((_, i) => i !== index));
  };

  const buildOfferSummary = () =>
    items.map((item) => `${item.offer.title} ×${item.qty}`).join(' | ');

  const buildFlavorSummary = () =>
    items.map((item, i) => describeFlavors(itemFlavors[i])).join(' | ');

  const handleSubmit = async () => {
    setTouched({ name: true, phone: true, gov: true, address: true });
    setFlavorTouched(true);

    if (!flavorsOk) {
      document.getElementById('cart-flavors')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const firstError = Object.keys(errors).find((key) => errors[key]);
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Synchronous guard using ref — blocks duplicate submission instantly
    if (submitGuardRef.current) return;
    submitGuardRef.current = true;
    setSubmitState('sending');

    const orderId = orderIdRef.current;

    // Extract Meta's first-party cookies so the CAPI event can include
    // them for proper server-side deduplication. Without fbp/fbc, Meta
    // cannot reliably match the CAPI event to the browser Pixel event
    // even when event_id is identical — resulting in 2 counted purchases.
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : '';
    };

    const body = {
      orderId,
      name,
      phone,
      gov,
      address,
      notes: notes || '',
      bundle: buildOfferSummary(),
      flavors: buildFlavorSummary(),
      quantity: String(items.reduce((s, item) => s + item.qty, 0)),
      price: `${grandTotal} جنيه (منتجات: ${totalPrice} + شحن: مجاناً)`,
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
    };

    try {
      const orderResponse = await fetch(ORDER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'follow',
      });
      const response = await orderResponse.json();

      if (response.result !== 'success' && response.result !== 'duplicate') {
        throw new Error(response.error || 'Order request failed');
      }

      // ── event_id: Fire the browser Pixel Purchase event with orderId as
      // ── the eventID. Apps Script already fired the CAPI event with the
      // ── same orderId as event_id, so Meta will deduplicate them into
      // ── one counted conversion. trackPurchaseOnce uses sessionStorage
      // ── to guarantee this only fires once per orderId, even on remount.
      //
      // Honour the server's explicit shouldTrackPixel flag — Apps Script
      // sets it to false when it detects a duplicate orderId, meaning the
      // CAPI event was NOT re-fired and we must not fire the browser
      // Pixel either. Falling back to true keeps backward-compatibility
      // with older deployments that don't send the flag.
      const shouldTrackPixel = response.shouldTrackPixel !== false;
      if (response.result === 'success' && shouldTrackPixel) {
        trackPurchaseOnce(orderId, metaParamsFromItems(items, grandTotal));
      }

      // Mark this order as completed so back-button navigation to
      // /add_to_cart can detect it and redirect home instead of showing
      // the checkout form again.
      markOrderCompleted(orderId);

      // Reset the session order ID so a future order (after going back
      // home) gets a fresh ID.
      resetOrderId();
      setSubmitState('done');
      onSuccess();
    } catch (err) {
      console.error('Order submit failed:', err);
      submitGuardRef.current = false;
      setSubmitState('idle');
    }
  };

  return (
    <section className="step-screen" aria-labelledby="checkout-title">
      <h1 id="checkout-title" ref={titleRef} tabIndex={-1} className="visually-hidden">
        إتمام الطلب
      </h1>

      <div className="cart-summary-header">
        <span className="cart-summary-title">🛒 ملخص طلبك</span>
        <span className="cart-summary-total">{formatPrice(grandTotal)}</span>
      </div>

      {items.map((item, i) => (
        <div key={`${item.offer.id}-${i}`} className="confirm-line">
          <div className="confirm-summary" style={{ '--accent': item.offer.accent }}>
            <div className="confirm-img">
              <OfferImage offerId={item.offer.id} alt={item.offer.title} width={96} height={96} />
            </div>
            <div className="confirm-info">
              <div className="confirm-info-top">
                <h2 className="confirm-line-title">
                  {item.offer.title}
                  {item.qty > 1 ? ` × ${item.qty}` : ''}
                </h2>
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => removeItem(i)}
                  aria-label="إزالة من السلة"
                >
                  ✕
                </button>
              </div>
              <p>{item.offer.description}</p>
              <div className="confirm-price">
                <strong>{formatPrice(item.offer.price * item.qty)}</strong>
                <s>{formatPrice(item.offer.originalPrice * item.qty)}</s>
              </div>
              <div className="confirm-badges">
                <span className="confirm-badge green">وفرت {formatPrice(item.offer.saving * item.qty)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div id="cart-flavors" className={flavorTouched && !flavorsOk ? 'fp-cart-panel--error' : ''}>
        <CartFlavors items={items} itemFlavors={itemFlavors} onItemFlavorsChange={setItemFlavors} />
        {flavorTouched && !flavorsOk && (
          <p className="field-msg error fp-flavor-error">من فضلك وزّع كل البرطمانات على النكهات</p>
        )}
      </div>

      <div className="cart-total-bar">
        <div className="cart-total-rows">
          <div className="cart-total-row">
            <span>الاوردر</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="cart-total-row">
            <span>🚚 الشحن</span>
            <span>مجاناً</span>
          </div>
          <div className="cart-total-row cart-total-grand">
            <span>الإجمالي</span>
            <strong>{formatPrice(grandTotal)}</strong>
          </div>
        </div>
        {totalSaving > 0 && (
          <span className="saving-tag">وفرت {formatPrice(totalSaving)}</span>
        )}
      </div>

      <div className="form-section">
        <h2>{form.title}</h2>
        <p className="form-subtitle">{form.subtitle}</p>
        <div className="form-card">
          <div
            id="field-name"
            className={`field ${touched.name && errors.name ? 'field-error' : touched.name && !errors.name ? 'field-ok' : ''}`}
          >
            <label htmlFor="input-name">الاسم <span className="req">*</span></label>
            <input
              id="input-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => touch('name')}
              placeholder="اكتب اسمك الكامل"
            />
            {touched.name && errors.name && <p className="field-msg error">{errors.name}</p>}
          </div>

          <div
            id="field-phone"
            className={`field ${touched.phone && errors.phone ? 'field-error' : touched.phone && !errors.phone ? 'field-ok' : ''}`}
          >
            <label htmlFor="input-phone">رقم الموبايل <span className="req">*</span></label>
            <input
              id="input-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              placeholder="01XXXXXXXXX"
              type="tel"
              inputMode="numeric"
              maxLength={11}
            />
            {touched.phone && errors.phone && <p className="field-msg error">{errors.phone}</p>}
          </div>

          <div
            id="field-gov"
            className={`field ${touched.gov && errors.gov ? 'field-error' : touched.gov && !errors.gov ? 'field-ok' : ''}`}
          >
            <label htmlFor="input-gov">المحافظة <span className="req">*</span></label>
            <select
              id="input-gov"
              value={gov}
              onChange={(e) => setGov(e.target.value)}
              onBlur={() => touch('gov')}
              className="select-field"
            >
              <option value="">اختر محافظتك</option>
              {egyptGovs.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {touched.gov && errors.gov && <p className="field-msg error">{errors.gov}</p>}
          </div>

          <div
            id="field-address"
            className={`field ${touched.address && errors.address ? 'field-error' : touched.address && !errors.address ? 'field-ok' : ''}`}
          >
            <label htmlFor="input-address">العنوان بالتفصيل <span className="req">*</span></label>
            <textarea
              id="input-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => touch('address')}
              placeholder="المدينة / الشارع / رقم المنزل / أي تفاصيل تساعد في التوصيل"
              rows={3}
            />
            {touched.address && errors.address && (
              <p className="field-msg error">{errors.address}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="input-notes">ملاحظات <span className="opt">(اختياري)</span></label>
            <textarea
              id="input-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية على الطلب"
              rows={2}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="confirm-order-btn"
        onClick={handleSubmit}
        disabled={submitState === 'sending' || submitState === 'done'}
      >
        {submitState === 'sending' ? '⏳ جاري تسجيل الطلب…' : form.submitLabel}
      </button>
      <button type="button" className="back-btn" onClick={onBack}>
        رجوع
      </button>
    </section>
  );
}
