export default function QtyStepper({ qty, onChange, label = 'الكمية' }) {
  return (
    <div className="bundle-qty" onClick={(e) => e.stopPropagation()} role="group" aria-label={label}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(qty - 1)}
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
        onClick={() => onChange(qty + 1)}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  );
}
