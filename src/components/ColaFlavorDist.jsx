import { colaFlavors } from '../data/landingData.js';
import './ColaFlavorDist.css';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabic = (n) => n.toString().replace(/\d/g, (d) => ARABIC_DIGITS[d]);

/** Empty cola distribution record. */
export function emptyColaFlavors() {
  return { cola: 0, lemon: 0 };
}

/** Default distribution: نصف نصف (cola = floor(total / 2)). */
export function defaultColaFlavors(total) {
  const cola = Math.floor(total / 2);
  return { cola, lemon: Math.max(0, total - cola) };
}

/** Cola distribution is always complete once cola + lemon == total. */
export function colaDistributionComplete(total, flavors) {
  const cola = flavors?.cola ?? 0;
  const lemon = flavors?.lemon ?? 0;
  return cola + lemon === total;
}

/**
 * ColaFlavorDist — the original Healthy Cola flavor-distribution control,
 * ported into the shared checkout. The customer chooses how many bottles
 * are كولا vs ليمون نعناع within their pack (total = pack size × qty),
 * via quick presets (كله كولا / نص نص / كله ليمون) or +/- steppers.
 *
 * Props:
 *   total    — total bottles to distribute (pack units × qty)
 *   flavors  — controlled { cola, lemon }
 *   onChange — (newDistribution) => void
 *   embedded — omit outer card wrapper (used inside CartFlavors)
 */
export default function ColaFlavorDist({
  total,
  flavors,
  onChange,
  embedded = false,
}) {
  const cola = Math.max(0, Math.min(total, flavors?.cola ?? 0));
  const lemon = Math.max(0, total - cola);

  const setCola = (next) => {
    const c = Math.max(0, Math.min(total, next));
    onChange({ cola: c, lemon: total - c });
  };

  const applyPreset = (mode) => {
    if (mode === 'allCola') {
      onChange({ cola: total, lemon: 0 });
    } else if (mode === 'allLemon') {
      onChange({ cola: 0, lemon: total });
    } else {
      const half = Math.floor(total / 2);
      onChange({ cola: total - half, lemon: half });
    }
  };

  const halfHalfCola = total - Math.floor(total / 2);
  const colaPct = total > 0 ? Math.round((cola / total) * 100) : 0;

  const body = (
    <>
      <div className="cfd-summary">
        <span className="cfd-chip">
          {toArabic(total)} زجاجة · {toArabic(cola)} كولا · {toArabic(lemon)} ليمون نعناع
        </span>
        <span className="cfd-hint">اضغط «نص نص» للاختيار السريع</span>
      </div>

      <div className="cfd-presets" role="group" aria-label="توزيع سريع">
        <button
          type="button"
          className={`cfd-preset${cola === total ? ' cfd-preset--active' : ''}`}
          onClick={() => applyPreset('allCola')}
        >
          🥤 كله كولا
        </button>
        <button
          type="button"
          className={`cfd-preset${cola === halfHalfCola ? ' cfd-preset--active' : ''}`}
          onClick={() => applyPreset('halfHalf')}
        >
          ⚖️ نص نص
        </button>
        <button
          type="button"
          className={`cfd-preset${cola === 0 ? ' cfd-preset--active' : ''}`}
          onClick={() => applyPreset('allLemon')}
        >
          🍋 كله ليمون
        </button>
      </div>

      <div className="cfd-bar" aria-hidden="true">
        <div className="cfd-bar-cola" style={{ width: `${colaPct}%` }} />
        <div className="cfd-bar-lemon" style={{ width: `${100 - colaPct}%` }} />
      </div>

      <div className="cfd-rows">
        {colaFlavors.map((f) => {
          const qty = f.id === 'cola' ? cola : lemon;
          const minReached = f.id === 'cola' ? cola === 0 : lemon === 0;
          const maxReached = f.id === 'cola' ? cola >= total : lemon >= total;
          return (
            <div key={f.id} className={`cfd-row${qty > 0 ? ' cfd-row--active' : ''}`}>
              <span className="cfd-flavor">
                <span className="cfd-emoji" aria-hidden="true">{f.emoji}</span>
                {f.label}
              </span>
              <div className="fp-qty-counter" role="group" aria-label={`كمية ${f.label}`}>
                <button
                  type="button"
                  className="fp-qty-btn"
                  onClick={() => setCola(f.id === 'cola' ? cola - 1 : cola + 1)}
                  disabled={minReached}
                  aria-label={f.id === 'cola' ? 'تقليل كولا' : 'تقليل ليمون'}
                >
                  −
                </button>
                <span className="fp-qty-val">{toArabic(qty)}</span>
                <button
                  type="button"
                  className="fp-qty-btn"
                  onClick={() => setCola(f.id === 'cola' ? cola + 1 : cola - 1)}
                  disabled={maxReached}
                  aria-label={f.id === 'cola' ? 'زيادة كولا' : 'زيادة ليمون'}
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
    return <div className="cfd-embedded">{body}</div>;
  }

  return (
    <div className="cfd-wrapper">
      <div className="fp-step-header">
        <span className="fp-step-num" aria-hidden="true">🥤</span>
        <div>
          <p className="fp-step-title">اختار توزيع النكهات</p>
          <p className="fp-step-sub">وزّع عبوات الكولا والليمون نعناع زي ما تحب</p>
        </div>
      </div>
      {body}
    </div>
  );
}
