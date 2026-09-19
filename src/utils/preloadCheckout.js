let started = false;

export function preloadCheckout() {
  if (started) return;
  started = true;
  import('../components/StepConfirm.jsx');
}
