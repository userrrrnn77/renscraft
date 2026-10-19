// src/utils/billing.js
//
// Small shared pieces of the top-up feature that have no React in them.

// ── Open the "Buy credits" modal from anywhere ──────────────────────────────
// AppContext (a 402 toast), the header pill and the home pill all need to open the
// same modal, and AppContext sits ABOVE the modal in the tree. A window event keeps
// them decoupled: no context, no prop drilling, no circular import.
//
// openBuyCredits()            -> grid of packages, user picks one
// openBuyCredits("starter")   -> straight to checkout for that package
//                                (used by the pricing page, where the user
//                                already picked the package by clicking its card)
const OPEN_EVENT = "renscraft:open-buy-credits";

export const openBuyCredits = (packageId = null) => {
  if (typeof window === "undefined") return;
  const id = typeof packageId === "string" ? packageId : null;
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { detail: { packageId: id } }),
  );
};

// returns the unsubscribe function. `handler` is called with a CustomEvent whose
// `detail.packageId` is string | null.
export const onOpenBuyCredits = (handler) => {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
};

// ── Money ───────────────────────────────────────────────────────────────────
const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatIdr = (amount) => idr.format(amount);

// ── Order status -> label + badge colors (full class names: Tailwind scans them) ──
export const TONE_CLASSES = {
  amber:
    "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  green:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  red: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
  neutral:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};

const ORDER_STATUS = {
  pending: { label: "Waiting for payment", tone: "amber" },
  challenge: { label: "Under review", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  expired: { label: "Expired", tone: "neutral" },
  canceled: { label: "Canceled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
  chargeback: { label: "Reversed", tone: "red" },
};

export function describeOrder(order, now = Date.now()) {
  if (order.status === "paid" && !order.credited) {
    return { label: "Adding credits", tone: "amber" };
  }
  if (
    order.status === "pending" &&
    new Date(order.expiresAt).getTime() <= now
  ) {
    return ORDER_STATUS.expired;
  }
  return ORDER_STATUS[order.status] ?? { label: order.status, tone: "neutral" };
}
