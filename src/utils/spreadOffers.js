// The dashboard decides the offer type (jars / choco bar / both) through the
// flavor groups it saves, so a custom slug still gets the right picker, weight
// and counters. Local landingData is only the fallback for legacy offers.
function resolveConfiguration(bundle, local, units) {
  const groups = Array.isArray(bundle.flavorGroups) ? bundle.flavorGroups : [];
  const hasSpread = groups.includes('spread');
  const hasChocoBar = groups.includes('chocoBar');
  const localConfig = local?.configuration;

  if (hasSpread && hasChocoBar) {
    if (localConfig?.type === 'spreadAndChocoBar') return localConfig;
    // No local split for a new mixed offer: share the pieces between both products.
    const spreadUnits = Math.max(1, Math.ceil(units / 2));
    return { type: 'spreadAndChocoBar', spreadUnits, chocoBarUnits: Math.max(1, units - spreadUnits) };
  }
  if (hasChocoBar) return { ...(localConfig?.type === 'chocoBar' ? localConfig : {}), type: 'chocoBar', total: units };
  if (hasSpread) return localConfig?.type === 'flavors' ? localConfig : undefined;
  // Local fallback bundles carry no flavor groups: keep their own configuration.
  return localConfig?.type === 'chocoBar' ? { ...localConfig, total: units } : localConfig;
}

export function mapSpreadOffer(bundle, local, { spreadFlavors = [], chocoBarFlavors = [] } = {}) {
  const components = Array.isArray(bundle.components) && bundle.components.length ? bundle.components : null;
  const units = Math.max(1, Number(bundle.units) || 1);
  const configuration = components ? { type: 'components' } : resolveConfiguration(bundle, local, units);
  const type = configuration?.type;

  return {
    ...local,
    ...bundle,
    components,
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
