const loaders = {
  'two-jars':         () => import('../assets/3ard.webp'),
  'three-jars':       () => import('../assets/3ard2.webp'),
  'four-jars':        () => import('../assets/3ard3.webp'),
  'spread-choco-bar': () => import('../assets/3ard.webp'),
};

const cache = new Map();

export function loadOfferImage(offerId) {
  const load = loaders[offerId];
  if (!load) return Promise.resolve(null);
  if (!cache.has(offerId)) {
    cache.set(offerId, load().then((m) => m.default));
  }
  return cache.get(offerId);
}
