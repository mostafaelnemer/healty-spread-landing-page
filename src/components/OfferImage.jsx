import { useEffect, useState } from 'react';
import { loadOfferImage } from '../utils/offerImages.js';

export default function OfferImage({ offerId, alt, width = 90, height = 90, className = '' }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadOfferImage(offerId).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [offerId]);

  if (!src) {
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
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
