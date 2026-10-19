// src/utils/manualBilling.js

const EVENT = "renscraft:open-manual-payment";

export const openManualPayment = (packageId = null) => {
  if (typeof window === "undefined") return;
  const id = typeof packageId === "string" ? packageId : null;
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { packageId: id } }),
  );
};

export const onOpenManualPayment = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};