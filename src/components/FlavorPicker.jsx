import { spreadFlavors } from '../data/landingData.js';
import './FlavorPicker.css';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabic = (n) => n.toString().replace(/\d/g, (d) => ARABIC_DIGITS[d]);

export function emptyFlavors() {
  return { kids: 0, original: 0, protein: 0, vegan: 0, peanut: 0, prestige: 0, coconut: 0, highProtein: 0, chocolatePeanut: 0 };
}

function buildFlavorRecord(qtys, options) {
  return Object.fromEntries(options.map((f) => [f.id, qtys[f.id] ?? 0]));
}

export default function FlavorPicker({
  total,
  maxFlavors = 4,
  flavors,
  onChange,
  options = spreadFlavors.filter(f => !f.hidden), embedded = false,
}) {
  const qtys = flavors ?? emptyFlavors();
  const used = options.reduce((s, f) => s + (qtys[f.id] ?? 0), 0);
  const remaining = total - used;
  const isDone = remaining === 0;
  const activeFlavors = options.filter((f) => (qtys[f.id] ?? 0) > 0).length;

  const summary = options
    .filter((f) => (qtys[f.id] ?? 0) > 0)
    .map((f) => `${qtys[f.id]} ${f.shortLabel}`)
    .join(' + ');

  const apply = (nextQtys) => onChange(buildFlavorRecord(nextQtys, options));

  const increment = (id) => {
    if (remaining <= 0) return;
    const isNew = (qtys[id] ?? 0) === 0;
    if (isNew && activeFlavors >= maxFlavors) return;
    apply({ ...qtys, [id]: (qtys[id] ?? 0) + 1 });
  };

  const decrement = (id) => {
    if ((qtys[id] ?? 0) === 0) return;
    apply({ ...qtys, [id]: qtys[id] - 1 });
  };

  const body = (
    <>
      <div className={`fp-remaining-chip${isDone ? ' fp-remaining-chip--done' : ''}`}>
        {isDone ? `تم التوزيع ✓  ${summary}` : `باقي ${toArabic(remaining)} برطمان للتوزيع`}
      </div>

      {options.length === 0 && <p role="status">النكهات غير متاحة حاليًا — اختار عرض تاني.</p>}
      <div className="fp-qty-list">
        {options.map((f) => {
          const qty = qtys[f.id] ?? 0;
          const isNew = qty === 0;
          const canAdd = remaining > 0 && !(isNew && activeFlavors >= maxFlavors);

          return (
            <div
              key={f.id}
              className={`fp-qty-row${qty > 0 ? ' fp-qty-row--active' : ''}${f.featured ? ' fp-qty-row--featured' : ''}`}
            >
              {f.image ? <img
                src={f.image}
                alt={f.shortLabel}
                className="fp-qty-img"
                width={44}
                height={44}
                loading="lazy"
                decoding="async"
              /> : <span className="fp-qty-img" aria-hidden="true">🍫</span>}
              <span className="fp-qty-name">
                <span className="fp-qty-name-main">{f.shortLabel}</span>
                {f.weight && <span className="fp-qty-weight">{f.weight}</span>}
                {f.badge && <span className="fp-qty-badge">{f.badge}</span>}
              </span>
              <div className="fp-qty-counter" role="group" aria-label={`كمية ${f.shortLabel}`}>
                <button
                  type="button"
                  className="fp-qty-btn"
                  onClick={() => decrement(f.id)}
                  disabled={qty === 0}
                  aria-label="تقليل"
                >
                  −
                </button>
                <span className="fp-qty-val">{toArabic(qty)}</span>
                <button
                  type="button"
                  className="fp-qty-btn"
                  onClick={() => increment(f.id)}
                  disabled={!canAdd}
                  aria-label="زيادة"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return <div className="fp-embedded">{body}</div>;
  }

  return (
    <div className="fp-wrapper">
      <div className="fp-step-header">
        <span className="fp-step-num" aria-hidden="true">🍫</span>
        <div>
          <p className="fp-step-title">اختار النكهات والكميات</p>
          <p className="fp-step-sub">
            {maxFlavors < 4
              ? `لغاية ${toArabic(maxFlavors)} نكهات مختلفة — المجموع ${toArabic(total)}`
              : `وزّع الـ ${toArabic(total)} برطمان على النكهات اللي تحبها`}
          </p>
        </div>
      </div>
      {body}
    </div>
  );
}
