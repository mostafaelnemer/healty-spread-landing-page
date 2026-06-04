import { useEffect, useState } from 'react';
import { formatPrice, SHIPPING_FEE } from '../data/landingData.js';
import OfferImage from './OfferImage.jsx';
import { preloadCheckout } from '../utils/preloadCheckout.js';
import { loadOfferImage } from '../utils/offerImages.js';
import {
  incrementCartItem,
  setCartItemQty,
  getCartCount,
  getCartSubtotal,
  getGrandTotal,
  cartToCheckoutItems,
} from '../utils/cartState.js';

export default function OffersSection({ intro, offers, onCheckout }) {
  const [cart, setCart] = useState({});

  const cartCount = getCartCount(cart);
  const subtotal = getCartSubtotal(cart, offers);
  const grandTotal = getGrandTotal(cart, offers, SHIPPING_FEE);

  useEffect(() => {
    offers.forEach((o) => loadOfferImage(o.id));
  }, [offers]);

  const addOfferToCart = (offerId) => {
    preloadCheckout();
    setCart((c) => incrementCartItem(c, offerId));
  };

  const changeQty = (offerId, val) => {
    setCart((c) => setCartItemQty(c, offerId, val));
  };

  const handleCheckout = () => {
    const items = cartToCheckoutItems(cart, offers);
    if (items.length === 0) return;
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
            <span className="offer-sticky-shipping">
              منتجات {formatPrice(subtotal)} + شحن {formatPrice(SHIPPING_FEE)}
            </span>
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
        </div>

        <div className="bundle-list">
          {offers.map((offer) => {
            const qty = cart[offer.id] || 0;
            const inCart = qty > 0;
            const displayQty = Math.max(qty, 1);

            return (
              <article
                key={offer.id}
                className={`bundle-row${inCart ? ' selected' : ''}`}
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
                  <p>{offer.description}</p>
                  {offer.note && <p className="bundle-row-note">{offer.note}</p>}
                  <div className="bundle-row-price">
                    <strong>{formatPrice(offer.price * displayQty)}</strong>
                    <s>{formatPrice(offer.originalPrice * displayQty)}</s>
                    <span className="saving-tag">وفر {formatPrice(offer.saving * displayQty)}</span>
                  </div>
                  <p className="bundle-row-shipping">🚚 + {formatPrice(SHIPPING_FEE)} شحن</p>

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
            );
          })}
        </div>

        <div className="trust-pills">
          <span>📦 شحن {formatPrice(SHIPPING_FEE)} ثابت</span>
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
                <span>{formatPrice(SHIPPING_FEE)}</span>
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
