import { useEffect, useState } from 'react';
import { loadOfferImage } from '../utils/offerImages.js';
import logo from '../assets/logo.webp';

export default function OfferImage({ offerId, image, alt, width = 90, height = 90, className = '' }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (image) return;
    loadOfferImage(offerId).then((url) => {
      if (!cancelled) setSrc(url || logo);
    });
    return () => {
      cancelled = true;
    };
  }, [offerId, image]);

  const displaySrc = image || src;
  if (!displaySrc) {
    return (
      <div
        className={`offer-img-placeholder ${className}`.trim()}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={displaySrc}
      style={displaySrc === logo ? { objectFit: 'contain', backgroundColor: '#fff' } : undefined}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
