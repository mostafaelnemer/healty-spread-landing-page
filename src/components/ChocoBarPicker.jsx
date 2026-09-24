import { chocoBarFlavors } from '../data/landingData.js';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabic = (n) => n.toString().replace(/\d/g, (d) => ARABIC_DIGITS[d]);

export function emptyChocoBarFlavors() {
  return Object.fromEntries(chocoBarFlavors.map((f) => [f.id, 0]));
}

function buildRecord(qtys) {
  return Object.fromEntries(chocoBarFlavors.map((f) => [f.id, qtys[f.id] ?? 0]));
}

export default function ChocoBarPicker({ total, flavors, onChange, embedded = false }) {
  const qtys = flavors ?? emptyChocoBarFlavors();
  const used = chocoBarFlavors.reduce((s, f) => s + (qtys[f.id] ?? 0), 0);
  const remaining = total - used;
  const isDone = remaining === 0;

  const summary = chocoBarFlavors
    .filter((f) => (qtys[f.id] ?? 0) > 0)
    .map((f) => `${qtys[f.id]} ${f.shortLabel}`)
    .join(' + ');

  const apply = (next) => onChange(buildRecord(next));

  const increment = (id) => {
    if (remaining === 0) return;
    apply({ ...qtys, [id]: (qtys[id] ?? 0) + 1 });
  };

  const decrement = (id) => {
    if ((qtys[id] ?? 0) === 0) return;
    apply({ ...qtys, [id]: qtys[id] - 1 });
  };

  const body = (
    <>
      <div className={`fp-remaining-chip${isDone ? ' fp-remaining-chip--done' : ''}`}>
        {isDone
          ? `تم التوزيع ✓  ${summary}`
          : `باقي ${toArabic(remaining)} قطعة للتوزيع`}
      </div>

      <div className="fp-qty-list">
        {chocoBarFlavors.map((f) => {
          const qty = qtys[f.id] ?? 0;
          const canAdd = remaining > 0;

          return (
            <div
              key={f.id}
              className={`fp-qty-row${qty > 0 ? ' fp-qty-row--active' : ''}`}
            >
              <img
                src={f.image}
                alt={f.shortLabel}
                className="fp-qty-img"
                width={44}
                height={44}
                loading="lazy"
                decoding="async"
              />
              <span className="fp-qty-name">
                <span className="fp-qty-name-main">{f.shortLabel}</span>
                {f.weight && <span className="fp-qty-weight">{f.weight}</span>}
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
          <p className="fp-step-title">اختار نكهات الشيكولاتة بار</p>
          <p className="fp-step-sub">وزّع الـ {toArabic(total)} قطعة على النكهات اللي تحبها</p>
        </div>
      </div>
      {body}
    </div>
  );
}
