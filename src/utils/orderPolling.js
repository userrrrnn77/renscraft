// src/utils/orderPolling.js
//
// Polls GET /api/payments/orders/:orderId until the order is settled.
// Plain JS with injectable fetch / clock / sleep so it can be tested without React.
//
// PRD section 8: every 2 s for the first 3 minutes, every 5 s after that,
// for as long as the caller keeps the signal alive (the modal is open).

export const POLL_FAST_MS = 2_000;
export const POLL_FAST_WINDOW_MS = 3 * 60_000;
export const POLL_SLOW_MS = 5_000;
// consecutive network errors before giving up (the order itself stays safe on the server)
export const MAX_POLL_FAILURES = 6;

export const FAILED_STATUSES = ["failed", "expired", "canceled"];
// after the order was paid; never expected while polling a fresh purchase
const REVERSED_STATUSES = ["refunded", "chargeback"];

// "paid" alone is not enough: on a standalone MongoDB the order flips to paid a moment
// before the credits land (credited=true). Only credited orders are a success.
export const isPaidAndCredited = (order) =>
  order?.status === "paid" && order?.credited === true;

export const isSettled = (order) =>
  isPaidAndCredited(order) ||
  FAILED_STATUSES.includes(order?.status) ||
  REVERSED_STATUSES.includes(order?.status);

export const nextDelay = (elapsedMs) =>
  elapsedMs < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS;

export const abortableSleep = (ms, signal) =>
  new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });

// Resolves with the settled order, or null when `signal` was aborted.
// Rejects on 401 / 404 (session gone, order not ours) and after MAX_POLL_FAILURES
// network errors in a row.
export async function pollOrder({
  fetchOrder,
  signal,
  onUpdate,
  now = Date.now,
  sleep = abortableSleep,
}) {
  const startedAt = now();
  let failures = 0;

  while (!signal?.aborted) {
    try {
      const order = await fetchOrder();
      if (signal?.aborted) return null;
      failures = 0;
      onUpdate?.(order);
      if (isSettled(order)) return order;
    } catch (err) {
      if (signal?.aborted) return null;
      const status = err?.response?.status;
      if (status === 401 || status === 404) throw err;
      failures += 1;
      if (failures >= MAX_POLL_FAILURES) throw err;
    }
    await sleep(nextDelay(now() - startedAt), signal);
  }
  return null;
}