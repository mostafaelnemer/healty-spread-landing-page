import FlavorPicker from './FlavorPicker.jsx';

export default function CartFlavors({ items, itemFlavors, onItemFlavorsChange }) {
  if (items.length === 0) return null;

  return (
    <div className="fp-cart-panel" role="region" aria-label="اختيار النكهات">
      <div className="fp-cart-panel-header">
        <span className="fp-step-num" aria-hidden="true">🍫</span>
        <div>
          <p className="fp-step-title">اختار النكهات والكميات</p>
          <p className="fp-step-sub">وزّع البرطمانات لكل عرض في سلتك</p>
        </div>
      </div>

      {items.map((item, i) => (
        <div key={`${item.offer.id}-${i}`} className="fp-cart-line">
          <p className="fp-cart-line-title">
            {item.offer.title}
            {item.qty > 1 ? ` × ${item.qty}` : ''}
          </p>
          <FlavorPicker
            embedded
            total={item.offer.unitsPerPack * item.qty}
            maxFlavors={item.offer.maxFlavors ?? 4}
            flavors={itemFlavors[i]}
            onChange={(f) =>
              onItemFlavorsChange((prev) => prev.map((x, idx) => (idx === i ? { ...f } : x)))
            }
          />
          {item.offer.giftUnits > 0 && (
            <p className="fp-gift-note">
              🎁 {item.offer.giftUnits} تيوب مجانًا 
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
