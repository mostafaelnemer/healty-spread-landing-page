import { useEffect, useRef, useState } from 'react';
import { egyptGovs, formatPrice, spreadFlavors } from '../data/landingData.js';
import { emptyFlavors } from './FlavorPicker.jsx';
import { defaultColaFlavors } from './ColaFlavorDist.jsx';
import CartFlavors from './CartFlavors.jsx';
import OfferImage from './OfferImage.jsx';
import {
  offerNeedsFlavors,
  offerNeedsColaConfig,
  offerNeedsBundleConfig,
  spreadDistributionTotal,
  colaDistributionTotal,
  itemNeedsColaDistribution,
} from '../utils/cartState.js';
import { trackPurchaseOnce, metaParamsFromItems, setAdvancedMatching } from '../utils/metaPixel.js';
import {
  getOrCreateOrderId,
  resetOrderId,
  markOrderCompleted,
} from '../utils/orderSession.js';
import {
  loadCheckoutDraft,
  saveCheckoutCart,
  saveCheckoutDraft,
} from '../utils/checkoutSession.js';

const ORDER_API_URL = 'https://script.google.com/macros/s/AKfycbwmCSkvnrX6Ow09kNwJXJoQvRSD-WPQvENWjsGIjSwiSewN40EjbxDmPT6P1A8kRPQl/exec';

function initialItemFlavors(items) {
  return items.map(() => ({ ...emptyFlavors() }));
}

function initialItemColaFlavors(items) {
  return items.map((item) =>
    itemNeedsColaDistribution(item)
      ? defaultColaFlavors(colaDistributionTotal(item))
      : null,
  );
}

function restoredItemFlavors(items, saved) {
  if (!Array.isArray(saved) || saved.length !== items.length) {
    return initialItemFlavors(items);
  }
  return saved.map((flavors) => (
    flavors && typeof flavors === 'object'
      ? { ...emptyFlavors(), ...flavors }
      : { ...emptyFlavors() }
  ));
}

function restoredItemColaFlavors(items, saved) {
  if (!Array.isArray(saved) || saved.length !== items.length) {
    return initialItemColaFlavors(items);
  }
  return items.map((item, index) => {
    if (!itemNeedsColaDistribution(item)) return null;
    const distribution = saved[index];
    return distribution && typeof distribution === 'object'
      ? distribution
      : defaultColaFlavors(colaDistributionTotal(item));
  });
}

export function describeFlavors(flavors) {
  return spreadFlavors
    .filter((f) => (flavors[f.id] ?? 0) > 0)
    .map((f) => `${flavors[f.id]} ${f.shortLabel}`)
    .join(' + ');
}

export function flavorsComplete(items, itemFlavors, itemCola) {
  return items.every((item, i) => {
    if (offerNeedsFlavors(item.offer) || offerNeedsBundleConfig(item.offer)) {
      const total = spreadDistributionTotal(item);
      const used = spreadFlavors.reduce((s, f) => s + (itemFlavors[i][f.id] ?? 0), 0);
      if (used !== total) return false;
    }
    if (offerNeedsBundleConfig(item.offer)) {
      const total = colaDistributionTotal(item);
      const dist = itemCola[i];
      if ((dist?.cola ?? 0) + (dist?.lemon ?? 0) !== total) return false;
    }
    return true;
  });
}

export function buildFlavorSummary(items, itemFlavors, itemCola) {
  return items
    .map((item, i) => {
      if (offerNeedsBundleConfig(item.offer)) {
        const spreadDesc = describeFlavors(itemFlavors[i]);
        const total = colaDistributionTotal(item);
        const cola = itemCola[i]?.cola ?? 0;
        const lemon = Math.max(0, total - cola);
        return `${item.offer.title} ×${item.qty} (سبريد: ${spreadDesc} | كولا: ${cola} كولا + ${lemon} ليمون نعناع)`;
      }
      if (offerNeedsFlavors(item.offer)) return describeFlavors(itemFlavors[i]);
      if (offerNeedsColaConfig(item.offer)) {
        const total = colaDistributionTotal(item);
        const cola = itemCola[i]?.cola ?? 0;
        const lemon = Math.max(0, total - cola);
        return `${item.offer.title} ×${item.qty} (${cola} كولا + ${lemon} ليمون)`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' | ');
}

export { isOrderCompleted } from '../utils/orderSession.js';

export default function StepConfirm({ form, cartItems: initialItems, onBack, onSuccess }) {
  const titleRef = useRef(null);
  const [initialDraft] = useState(() => loadCheckoutDraft() || {});
  const orderIdRef = useRef(getOrCreateOrderId());
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState(() => initialDraft.name || '');
  const [phone, setPhone] = useState(() => initialDraft.phone || '');
  const [gov, setGov] = useState(() => initialDraft.gov || '');
  const [address, setAddress] = useState(() => initialDraft.address || '');
  const [notes, setNotes] = useState(() => initialDraft.notes || '');
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [slowSubmit, setSlowSubmit] = useState(false);
  const submitGuardRef = useRef(false);
  const abortControllerRef = useRef(null);
  const [touched, setTouched] = useState({});
  const [flavorTouched, setFlavorTouched] = useState(false);
  const [itemFlavors, setItemFlavors] = useState(() => (
    restoredItemFlavors(initialItems, initialDraft.itemFlavors)
  ));
  const [itemCola, setItemCola] = useState(() => (
    restoredItemColaFlavors(initialItems, initialDraft.itemCola)
  ));

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // A previous submit attempt may have died with an older page (reload or
  // tab close) leaving its sessionStorage flag behind. The orderId is stable
  // per tab, so a flag for the CURRENT orderId at mount time is always
  // stale — clear it so the button never appears dead.
  useEffect(() => {
    try {
      sessionStorage.removeItem(`order_submit_started_${orderIdRef.current}`);
    } catch {
    }
  }, []);

  // Warm up the Apps Script instance while the user fills the form, so the
  // real submit doesn't pay the cold-start cost (often 5-15s on first hit).
  // Fire-and-forget: failures are silently ignored and never affect UX.
  // The warm request carries no orderId, so the server answers a tiny fast
  // error JSON without writing anything.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        fetch(`${ORDER_API_URL}?warm=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
        }).catch(() => {});
      } catch {
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // After ~6s of sending, switch the button copy so the user knows progress
  // is happening instead of staring at a frozen spinner.
  useEffect(() => {
    if (submitState !== 'sending') {
      setSlowSubmit(false);
      return;
    }
    const timer = setTimeout(() => setSlowSubmit(true), 6000);
    return () => clearTimeout(timer);
  }, [submitState]);

  useEffect(() => {
    if (items.length === 0) onBack();
  }, [items.length, onBack]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    saveCheckoutCart(items);
    saveCheckoutDraft({
      name,
      phone,
      gov,
      address,
      notes,
      itemFlavors,
      itemCola,
    });
  }, [items, name, phone, gov, address, notes, itemFlavors, itemCola]);

  if (items.length === 0) return null;

  const totalPrice    = items.reduce((sum, item) => sum + item.offer.price    * item.qty, 0);
  const totalOriginal = items.reduce((sum, item) => sum + item.offer.originalPrice * item.qty, 0);
  const totalSaving   = totalOriginal - totalPrice;
  const grandTotal    = totalPrice;
  const flavorsOk = flavorsComplete(items, itemFlavors, itemCola);

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
    setItemCola((prev) => prev.filter((_, i) => i !== index));
  };

  const buildOfferSummary = () =>
    items.map((item) => `${item.offer.title} ×${item.qty}`).join(' | ');

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

    if (submitGuardRef.current) return;
    submitGuardRef.current = true;
    // Remount-proof guard: the ref above dies if the component remounts
    // between two quick taps. sessionStorage survives remounts in the tab.
    // Cleared on genuine failure and on mount (stale flags), so legit
    // retries always work.
    const orderId = orderIdRef.current;
    const submitKey = `order_submit_started_${orderId}`;
    try {
      if (sessionStorage.getItem(submitKey)) {
        // A previous attempt is still in flight elsewhere — never leave the
        // user staring at a dead button.
        submitGuardRef.current = false;
        setSubmitError('الطلب بيتبعت بالفعل، استنى ثواني ولو متحلش اعمل refresh وحاول تاني.');
        return;
      }
      sessionStorage.setItem(submitKey, '1');
    } catch {
    }
    console.log('[Order] submit started', { orderId });
    const t0 = Date.now();
    setSubmitError('');
    setSubmitState('sending');

    // Everything below runs inside try/catch: ANY failure (payload crash,
    // network hang, server error) must reset the button and show a message
    // instead of spinning forever.
    let timedOut = false;
    let timeoutId = 0;
    try {
      setAdvancedMatching({ ph: phone.trim(), name: name.trim() });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      // 25s ceiling: Apps Script cold starts are slow, but the request must
      // never hang forever. On timeout the fetch aborts and lands in catch
      // below as a retryable error (see `timedOut`).
      timeoutId = setTimeout(() => {
        timedOut = true;
        try {
          abortControllerRef.current.abort();
        } catch {
        }
      }, 25000);

      const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
      };

      const payload = {
        orderId,
        name,
        phone,
        gov,
        address,
        notes: notes || '',
        bundle: buildOfferSummary(),
        flavors: buildFlavorSummary(items, itemFlavors, itemCola),
        quantity: String(items.reduce((s, item) => s + (offerNeedsFlavors(item.offer) ? item.offer.unitsPerPack * item.qty : item.qty), 0)),
        price: String(grandTotal),
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      };

      const orderResponse = await fetch(ORDER_API_URL, {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        body: JSON.stringify(payload),
      });
      const response = await orderResponse.json();

      if (orderId !== orderIdRef.current || abortControllerRef.current.signal.aborted) {
        // Superseded by a newer attempt or a navigation — release everything
        // instead of leaving the button stuck on "sending".
        try {
          sessionStorage.removeItem(submitKey);
        } catch {
        }
        submitGuardRef.current = false;
        setSubmitState('idle');
        return;
      }

      if (response.result !== 'success' && response.result !== 'duplicate') {
        throw new Error(response.error || 'Order request failed');
      }

      const shouldTrackPixel = response.shouldTrackPixel !== false;
      if (response.result === 'success' && shouldTrackPixel) {
        const safeTotal = Math.round(Number(grandTotal) * 100) / 100;
        if (Number.isFinite(safeTotal) && safeTotal > 0) {
          trackPurchaseOnce(orderId, metaParamsFromItems(items, safeTotal));
        } else {
          console.warn('[Meta Pixel] Purchase skipped: invalid grandTotal', grandTotal);
        }
      }

      markOrderCompleted(orderId);

      resetOrderId();
      setSubmitState('done');
      console.log('[Order] submit finished', { orderId, ms: Date.now() - t0 });
      onSuccess();
    } catch (err) {
      // Unmount cleanup aborts are silent; a TIMEOUT abort is a real,
      // retryable failure and must behave like one.
      if (err && err.name === 'AbortError' && !timedOut) {
        return;
      }
      console.error('Order submit failed:', err);
      console.log('[Order] submit failed', { orderId: orderIdRef.current, ms: Date.now() - t0 });
      // Allow a genuine retry: clear both guards for this orderId only.
      try {
        sessionStorage.removeItem(submitKey);
      } catch {
      }
      submitGuardRef.current = false;
      setSubmitState('idle');
      setSubmitError(
        timedOut
          ? 'الطلب أخد وقت أطول من المعتاد (السيرفر مشغول)، دوس تأكيد الطلب تاني.'
          : 'حصلت مشكلة أثناء تسجيل الطلب، اتأكد من الإنترنت ودوس تأكيد الطلب تاني.'
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
            <button
              type="button"
              className="remove-item-btn"
              onClick={() => removeItem(i)}
              aria-label="إزالة من السلة"
            >
              ✕
            </button>
            <div className="confirm-img">
              <OfferImage
                offerId={item.offer.id}
                alt={item.offer.title}
                width={96}
                height={96}
                fallback={item.offer.image}
              />
            </div>
            <div className="confirm-info">
              <div className="confirm-info-top">
                <h2 className="confirm-line-title">
                  {item.offer.title}
                  {item.qty > 1 ? ` × ${item.qty}` : ''}
                </h2>
              </div>
              {item.offer.description && <p>{item.offer.description}</p>}
              {item.offer.unit && <p className="confirm-unit">{item.offer.unit}</p>}
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
        <CartFlavors
          items={items}
          itemFlavors={itemFlavors}
          onItemFlavorsChange={setItemFlavors}
          itemCola={itemCola}
          onItemColaChange={setItemCola}
        />
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
        {submitState === 'sending'
          ? (slowSubmit ? '⏳ قربنا نخلص… جاري تأكيد طلبك' : '⏳ جاري تسجيل الطلب…')
          : form.submitLabel}
      </button>
      {submitError && (
        <p className="field-msg error" role="alert" style={{ textAlign: 'center', marginTop: 12 }}>
          {submitError}
        </p>
      )}
      <button type="button" className="back-btn" onClick={onBack}>
        رجوع
      </button>
    </section>
  );
}
