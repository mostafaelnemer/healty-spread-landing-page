// The mixed offer has two independent distributions. Its composition remains
// local until the dashboard supports a separate count for each product type.
export function mapSpreadOffer(bundle, local, { spreadFlavors = [], chocoBarFlavors = [] } = {}) {
  const type = local?.configuration?.type;
  const units = Math.max(1, Number(bundle.units) || 1);
  let configuration = local?.configuration;
  if (type === 'chocoBar') configuration = { ...configuration, total: units };

  return {
    ...local,
    ...bundle,
    spreadFlavors: (bundle.flavorOptions || []).filter(f => f.group === 'spread').map(f => {
      const original = spreadFlavors.find(local => local.id === f.id);
      return { ...original, ...f, image: f.image || original?.image, shortLabel: f.name, label: f.name };
    }),
    chocoBarFlavors: (bundle.flavorOptions || []).filter(f => f.group === 'chocoBar').map(f => {
      const original = chocoBarFlavors.find(local => local.id === f.id);
      return { ...original, ...f, image: f.image || original?.image, shortLabel: f.name, label: f.name };
    }),
    title: bundle.name,
    amount: bundle.description,
    description: '',
    unitsPerPack: type === 'chocoBar' ? undefined
      : type === 'spreadAndChocoBar' ? configuration.spreadUnits : units,
    configuration,
    maxFlavors: local?.maxFlavors ?? 9,
  };
}
