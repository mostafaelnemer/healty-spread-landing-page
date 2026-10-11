import { useMemo } from 'react';
import { landingData, spreadFlavors, chocoBarFlavors } from './data/landingData.js';
import { useOffers } from './useOffers.js';
import { mapSpreadOffer } from './utils/spreadOffers.js';

const localById = Object.fromEntries(landingData.offers.map(offer => [offer.id, offer]));
const LOCAL_BUNDLES = landingData.offers.map(offer => ({
  ...offer,
  name: offer.title,
  description: offer.amount,
  units: offer.configuration?.type === 'spreadAndChocoBar'
    ? offer.configuration.spreadUnits + offer.configuration.chocoBarUnits
    : offer.configuration?.total ?? offer.unitsPerPack,
}));

export function useSpreadOffers() {
  const { bundles, ready } = useOffers('spread', LOCAL_BUNDLES);
  const offers = useMemo(() => bundles.map(bundle => mapSpreadOffer(bundle, localById[bundle.id], { spreadFlavors, chocoBarFlavors })), [bundles]);
  return { offers, ready };
}
