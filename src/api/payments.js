// src/api/payments.js
//
// Thin wrappers over the /api/payments contract
// (server/src/controllers/paymentController.ts). No state in here, no toasts:
// callers decide what to show. Errors are { error: string }, read them with
// errorMessage() from ./api.
import api from "./api";

// GET /api/payments/packages  (PUBLIC, no login: used by the pricing page)
// -> { packages: [{ id, credits, amount, label }], costs: { generate, revision, subdomain: { cost, days } }, freeCredits, methods }
// 503 { error: "Payments are disabled" } when the server runs with PAYMENTS_ENABLED=false
export const getPublicPackages = async () => {
  const { data } = await api.get("/api/payments/packages");
  return data;
};

// Harga + durasi subdomain dari server (bukan hardcode di client).
// -> { cost: number, days: number | null } atau null kalau belum tersedia.
// Satu-satunya tempat yang tahu bentuk `costs.subdomain`: kalau backend beda
// bentuk, cukup ubah normalizeSubdomainPricing.
const normalizeSubdomainPricing = (raw) => {
  if (typeof raw === "number" && raw > 0) return { cost: raw, days: null };
  if (raw && typeof raw === "object" && Number(raw.cost) > 0) {
    const days = Number(raw.days);
    return { cost: Number(raw.cost), days: days > 0 ? days : null };
  }
  return null;
};

let subdomainPricingPromise = null;

export const getSubdomainPricing = () => {
  if (subdomainPricingPromise) return subdomainPricingPromise;
  subdomainPricingPromise = getPublicPackages()
    .then((data) => normalizeSubdomainPricing(data?.costs?.subdomain))
    .catch(() => {
      // Jangan cache kegagalan: buka modal berikutnya boleh coba lagi.
      subdomainPricingPromise = null;
      return null;
    });
  return subdomainPricingPromise;
};

// GET /api/payments/config
// -> { packages: [{ id, credits, amount, label }], clientKey, snapUrl, isProduction }
// 503 { error: "Payments are disabled" } when the server runs with PAYMENTS_ENABLED=false
export const getPaymentConfig = async () => {
  const { data } = await api.get("/api/payments/config");
  return data;
};

// POST /api/payments/checkout { packageId }
// -> 201 (new order) or 200 (the same still-open order, double click) with
//    { orderId, snapToken, redirectUrl, amount, credits, expiresAt }
// 400 unknown package | 429 too many unpaid orders / attempts | 502 Midtrans down
export const createCheckout = async (packageId) => {
  const { data } = await api.post("/api/payments/checkout", { packageId });
  return data;
};

// GET /api/payments/orders/:orderId (owner only, 404 otherwise)
// -> { orderId, status, credits, amount, credited, paidAt }
// The server asks Midtrans itself when the order is still open and older than ~20s,
// so polling this is also what reconciles a missed webhook.
export const getOrder = async (orderId) => {
  const { data } = await api.get(
    `/api/payments/orders/${encodeURIComponent(orderId)}`,
  );
  return data;
};

// GET /api/payments/orders -> { orders: [...last 20] }
// An order that can still be paid also carries { snapToken, redirectUrl }.
export const listOrders = async () => {
  const { data } = await api.get("/api/payments/orders");
  return Array.isArray(data?.orders) ? data.orders : [];
};

export const isPaymentsDisabled = (err) => err?.response?.status === 503;
