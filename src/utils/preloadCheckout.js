let started = false;

/** Preload checkout route chunk (StepConfirm + FlavorPicker) in the background. */
export function preloadCheckout() {
  if (started) return;
  started = true;
  import('../components/StepConfirm.jsx');
}
