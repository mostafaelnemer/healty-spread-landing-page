import {
  offerNeedsFlavors,
  offerNeedsColaConfig,
  offerNeedsBundleConfig,
  spreadDistributionTotal,
  colaDistributionTotal,
} from '../utils/cartState.js';
import FlavorPicker from './FlavorPicker.jsx';
import ColaFlavorDist, { defaultColaFlavors } from './ColaFlavorDist.jsx';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabic = (n) => n.toString().replace(/\d/g, (d) => ARABIC_DIGITS[d]);

/**
 * Bundle configuration block — the spread part reuses FlavorPicker and
 * the cola part reuses ColaFlavorDist, exactly as those components are
 * used by the standalone Spread / Cola offers.
 */
function BundleConfig({
  item,
  index,
  itemFlavors,
  onItemFlavorsChange,
  itemCola,
  onItemColaChange,
}) {
  const spreadTotal = spreadDistributionTotal(item);
  const colaTotal = colaDistributionTotal(item);

  return (
    <details className="fp-cart-line fp-cart-line--bundle" open>
      <summary className="fp-cart-line-title">
        {item.offer.title}
        {item.qty > 1 ? ` × ${item.qty}` : ''}
        <span className="fp-cart-line-toggle" aria-hidden="true">▾</span>
      </summary>

      <div className="fp-cart-line-body">
        <div className="bundle-config-panel">
          <div className="bundle-config-header">
            <span className="bundle-config-num" aria-hidden="true">🍫</span>
            <p className="bundle-config-title">اختار نكهات الـ {toArabic(spreadTotal)} برطمانات</p>
            <span className="bundle-config-count">Healthy Spread</span>
          </div>
          <FlavorPicker
            embedded
            total={spreadTotal}
            maxFlavors={item.offer.configuration?.spread?.maxFlavors ?? 9}
            flavors={itemFlavors[index]}
            onChange={(f) =>
              onItemFlavorsChange((prev) => prev.map((x, idx) => (idx === index ? { ...f } : x)))
            }
          />
        </div>

        <div className="bundle-config-panel bundle-config-panel--cola">
          <div className="bundle-config-header">
            <span className="bundle-config-num" aria-hidden="true">🥤</span>
            <p className="bundle-config-title">اختار توزيع زجاجات الكولا</p>
            <span className="bundle-config-count">Healthy Cola</span>
          </div>
          <p className="bundle-config-sub">
            شرنك ×{item.qty} · {toArabic(colaTotal)} زجاجة (كولا / ليمون نعناع)
          </p>
          <ColaFlavorDist
            embedded
            total={colaTotal}
            flavors={itemCola?.[index] ?? defaultColaFlavors(colaTotal)}
            onChange={(f) =>
              onItemColaChange((prev) => prev.map((x, idx) => (idx === index ? { ...f } : x)))
            }
          />
        </div>
      </div>
    </details>
  );
}

export default function CartFlavors({
  items,
  itemFlavors,
  onItemFlavorsChange,
  itemCola,
  onItemColaChange,
}) {
  if (items.length === 0) return null;

  const needsConfig = (item) =>
    offerNeedsFlavors(item.offer) || offerNeedsColaConfig(item.offer) || offerNeedsBundleConfig(item.offer);
  if (!items.some(needsConfig)) return null;

  return (
    <div className="fp-cart-panel" role="region" aria-label="اختيار النكهات">
      <div className="fp-cart-panel-header">
        <span className="fp-step-num" aria-hidden="true">🍫</span>
        <div>
          <p className="fp-step-title">اختار النكهات والكميات</p>
          <p className="fp-step-sub">وزّع البرطمانات والزجاجات لكل عرض في سلتك</p>
        </div>
      </div>

      {items.map((item, i) => {
        if (offerNeedsBundleConfig(item.offer)) {
          return (
            <BundleConfig
              key={`${item.offer.id}-${i}`}
              item={item}
              index={i}
              itemFlavors={itemFlavors}
              onItemFlavorsChange={onItemFlavorsChange}
              itemCola={itemCola}
              onItemColaChange={onItemColaChange}
            />
          );
        }

        if (offerNeedsFlavors(item.offer)) {
          return (
            <details key={`${item.offer.id}-${i}`} className="fp-cart-line" open>
              <summary className="fp-cart-line-title">
                {item.offer.title}
                {item.qty > 1 ? ` × ${item.qty}` : ''}
                <span className="fp-cart-line-toggle" aria-hidden="true">▾</span>
              </summary>
              <div className="fp-cart-line-body">
                <FlavorPicker
                  embedded
                  total={spreadDistributionTotal(item)}
                  maxFlavors={item.offer.maxFlavors ?? 4}
                  flavors={itemFlavors[i]}
                  onChange={(f) =>
                    onItemFlavorsChange((prev) => prev.map((x, idx) => (idx === i ? { ...f } : x)))
                  }
                />
              </div>
            </details>
          );
        }

        if (offerNeedsColaConfig(item.offer)) {
          return (
            <details key={`${item.offer.id}-${i}`} className="fp-cart-line" open>
              <summary className="fp-cart-line-title">
                {item.offer.title}
                {item.qty > 1 ? ` × ${item.qty}` : ''}
                <span className="fp-cart-line-toggle" aria-hidden="true">▾</span>
              </summary>
              <div className="fp-cart-line-body">
                <ColaFlavorDist
                  embedded
                  total={colaDistributionTotal(item)}
                  flavors={itemCola?.[i] ?? defaultColaFlavors(colaDistributionTotal(item))}
                  onChange={(f) =>
                    onItemColaChange((prev) => prev.map((x, idx) => (idx === i ? { ...f } : x)))
                  }
                />
              </div>
            </details>
          );
        }

        return null;
      })}
    </div>
  );
}
