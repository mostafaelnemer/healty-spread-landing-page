import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { formatPrice } from '../data/landingData.js';
import OfferImage from './OfferImage.jsx';
import CountdownTimer from './CountdownTimer.jsx';
import { preloadCheckout } from '../utils/preloadCheckout.js';
import { loadOfferImage } from '../utils/offerImages.js';
import {
  incrementCartItem,
  setCartItemQty,
  getCartCount,
  getCartSubtotal,
  cartToCheckoutItems,
} from '../utils/cartState.js';
import { trackMetaEvent, metaParamsFromOffer, metaParamsFromItems } from '../utils/metaPixel.js';

export default function OffersSection({ intro, offers, onCheckout }) {
  const [cart, setCart] = useState({});
  const checkoutGuardRef = useRef(false);

  const cartCount = getCartCount(cart);
  const subtotal = getCartSubtotal(cart, offers);
  const grandTotal = subtotal;

  useEffect(() => {
    offers.forEach((o) => loadOfferImage(o.id));
  }, [offers]);

  const addOfferToCart = (offerId) => {
    preloadCheckout();
    setCart((c) => {
      const isFirstAdd = !c[offerId];
      if (isFirstAdd) {
        const offer = offers.find((o) => o.id === offerId);
        if (offer) trackMetaEvent('AddToCart', metaParamsFromOffer(offer, 1));
      }
      return incrementCartItem(c, offerId);
    });
  };

  const changeQty = (offerId, val) => {
    setCart((c) => setCartItemQty(c, offerId, val));
  };

  const handleCheckout = () => {
    if (checkoutGuardRef.current) return;
    const items = cartToCheckoutItems(cart, offers);
    if (items.length === 0) return;
    checkoutGuardRef.current = true;
    trackMetaEvent('InitiateCheckout', metaParamsFromItems(items, grandTotal));
    onCheckout(items);
  };

  const warmCheckout = () => preloadCheckout();

  const stopCardAdd = (e) => e.stopPropagation();

  return (
    <>
      {cartCount > 0 && (
        <div className="offer-sticky-bar" role="status" aria-live="polite">
          <div className="offer-sticky-info">
            <span className="offer-sticky-title">
              {cartCount === 1 ? 'منتج واحد في السلة' : `${cartCount} منتجات في السلة`}
            </span>
            <span className="offer-sticky-price">{formatPrice(grandTotal)}</span>
          </div>
          <button
            type="button"
            className="offer-sticky-cta"
            onClick={handleCheckout}
            onMouseEnter={warmCheckout}
            onFocus={warmCheckout}
            onTouchStart={warmCheckout}
          >
            أكمل الطلب ←
          </button>
        </div>
      )}

      <section className="section offers-section" id="offers">
        <div className="section-intro light centered">
          <span className="eyebrow">{intro.eyebrow}</span>
          <h2>{intro.title}</h2>
          <p>{intro.description}</p>
          <CountdownTimer />
        </div>

        <a href="#choco-offers" className="choco-teaser-banner">
          <span className="choco-teaser-new">جديد 🆕</span>
          <span className="choco-teaser-text">🍫 شيكولاتة بار 40 جرام — اشتري 4 واحصل على الخامسة هدية · سبريد + بار ب 599 بدل 710 جنيه</span>
          <span className="choco-teaser-arrow">↓</span>
        </a>

        <div className="bundle-list">
          {offers.map((offer, index) => {
            const qty = cart[offer.id] || 0;
            const inCart = qty > 0;
            const displayQty = Math.max(qty, 1);
            const isChocoOffer =
              offer.configuration?.type === 'chocoBar' ||
              offer.configuration?.type === 'spreadAndChocoBar';
            const prevOffer = offers[index - 1];
            const isFirstChoco =
              isChocoOffer &&
              prevOffer?.configuration?.type !== 'chocoBar' &&
              prevOffer?.configuration?.type !== 'spreadAndChocoBar';

            return (
              <React.Fragment key={offer.id}>
                {isFirstChoco && (
                  <div className="offers-divider" id="choco-offers">
                    <span>أو جرب الجديد 🍫</span>
                  </div>
                )}
              <article
                key={offer.id}
                className={`bundle-row${inCart ? ' selected' : ''}${isChocoOffer ? ' bundle-row--choco' : ''}`}
                style={{ '--accent': offer.accent }}
                onClick={() => addOfferToCart(offer.id)}
                role="button"
                tabIndex={0}
                aria-label={`${offer.title} — أضف للسلة`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addOfferToCart(offer.id);
                  }
                }}
              >
                {inCart && <div className="selected-check" aria-hidden="true">✓</div>}
                {offer.badge && <div className="bundle-row-badge">{offer.badge}</div>}

                <div className="bundle-row-img">
                  <OfferImage offerId={offer.id} alt={offer.title} width={90} height={90} />
                </div>

                <div className="bundle-row-info">
                  <h3>{offer.title}</h3>
                  {offer.amount && <p className="bundle-row-amount">{offer.amount}</p>}
                  {offer.description && <p>{offer.description}</p>}
                  {offer.note && <p className="bundle-row-note">{offer.note}</p>}
                  <div className="bundle-row-price">
                    <strong>{formatPrice(offer.price * displayQty)}</strong>
                    <s>{formatPrice(offer.originalPrice * displayQty)}</s>
                    <span className="saving-tag">وفر {formatPrice(offer.saving * displayQty)}</span>
                  </div>
                  {offer.configuration?.type === 'bundle' ? (
                    <p className="bundle-row-meta">🚚 توصيل مجاناً · ⚖️ 375 جرام لكل برطمان · 🥤 350 مل لكل زجاجة كولا</p>
                  ) : offer.configuration?.type === 'chocoBar' ? (
                    <p className="bundle-row-meta">🚚 توصيل مجاناً · ⚖️ 40 جرام للقطعة</p>
                  ) : offer.configuration?.type === 'spreadAndChocoBar' ? (
                    <p className="bundle-row-meta">🚚 توصيل مجاناً · ⚖️ 375 جرام للسبريد · ⚖️ 40 جرام للشيكولاتة بار</p>
                  ) : (
                    <p className="bundle-row-meta">🚚 توصيل مجاناً · ⚖️ 375 جرام لكل برطمان</p>
                  )}

                  {inCart ? (
                    <div
                      className="bundle-qty"
                      onClick={stopCardAdd}
                      role="group"
                      aria-label="الكمية"
                    >
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => changeQty(offer.id, qty - 1)}
                        aria-label="تقليل الكمية"
                      >
                        −
                      </button>
                      <span className="qty-val" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => changeQty(offer.id, qty + 1)}
                        aria-label="زيادة الكمية"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="add-to-cart-btn" aria-hidden="true">
                      🛒 أضف للسلة
                    </span>
                  )}
                </div>
              </article>
              </React.Fragment>
            );
          })}
        </div>

        <div className="trust-pills">
          <span>🚚 توصيل مجاناً</span>
          <span>💳 الدفع عند الاستلام</span>
          <span>🌿 بدون سكر مضاف</span>
        </div>

        {cartCount > 0 && (
          <div className="checkout-summary-bar" aria-live="polite">
            <div className="checkout-summary-rows">
              <div className="checkout-summary-row">
                <span>المنتجات ({cartCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="checkout-summary-row">
                <span>🚚 الشحن</span>
                <span>مجاناً</span>
              </div>
              <div className="checkout-summary-row checkout-summary-total">
                <span>الإجمالي</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              className="next-btn landing-next-btn"
              onClick={handleCheckout}
              onMouseEnter={warmCheckout}
              onFocus={warmCheckout}
              onTouchStart={warmCheckout}
            >
              أكمل الطلب ←
            </button>
          </div>
        )}
      </section>
    </>
  );
}
