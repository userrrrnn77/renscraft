// src/utils/snap.js
//
// Loads Midtrans snap.js once. The URL and the client key both come from
// GET /api/payments/config (never from a build-time env var), so sandbox and
// production can't get mixed up between client and server.

// The script URL arrives from our API. Only ever inject a script from Midtrans.
const ALLOWED_HOSTS = new Set(["app.sandbox.midtrans.com", "app.midtrans.com"]);
const LOAD_TIMEOUT_MS = 15_000;
const LOAD_ERROR =
  "Could not load the payment window. Check your connection, turn off ad blockers for this site, and try again.";

let pending = null;

export function loadSnap({ snapUrl, clientKey }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The payment window only works in a browser."));
  }
  if (window.snap) return Promise.resolve(window.snap);
  if (pending) return pending;

  let url;
  try {
    url = new URL(snapUrl);
  } catch {
    return Promise.reject(new Error("Payment setup is invalid. Please contact support."));
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname) || !clientKey) {
    return Promise.reject(new Error("Payment setup is invalid. Please contact support."));
  }

  pending = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let timer;

    const fail = () => {
      clearTimeout(timer);
      script.remove();
      pending = null; // a later click can try again
      reject(new Error(LOAD_ERROR));
    };

    script.src = url.href;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      clearTimeout(timer);
      if (window.snap) resolve(window.snap);
      else fail();
    };
    script.onerror = fail;
    timer = setTimeout(fail, LOAD_TIMEOUT_MS);

    document.head.appendChild(script);
  });

  return pending;
}

// Closes the Snap popup if it is open (used once the server has settled the order).
export function hideSnap() {
  try {
    window.snap?.hide?.();
  } catch {
    // popup already gone
  }
}