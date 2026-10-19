// src/utils/topup.js
//
// Satu pintu buat semua tombol "Top Up". Server ngasih tau method apa aja
// yang aktif lewat GET /api/payments/packages (`methods`). Hasilnya di-cache
// sekali per page-load, jadi klik kedua dst nggak perlu network lagi.
//
// Urutan prioritas:
//   1. Midtrans (kalau PAYMENTS_ENABLED=true)
//   2. Manual transfer (kalau MANUAL_ENABLED=true)
//
// Kalau dua-duanya off (mis. server down), keluar toast biar user nggak bingung.
import toast from "react-hot-toast";
import i18n from "../i18n";
import { getPublicPackages } from "../api/payments";
import { openBuyCredits } from "./billing";
import { openManualPayment } from "./manualBilling";

const NO_METHODS = { midtrans: false, manual: false };
const METHODS_TIMEOUT_MS = 5000;

let methodsPromise = null;

export const getPaymentMethods = () => {
  if (methodsPromise) return methodsPromise;

  methodsPromise = Promise.race([
    getPublicPackages(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("methods timeout")),
        METHODS_TIMEOUT_MS,
      ),
    ),
  ])
    .then((data) => {
      const m = data?.methods;
      return m && typeof m === "object" ? m : NO_METHODS;
    })
    .catch(() => {
      // Jangan cache kegagalan: klik berikutnya boleh coba lagi.
      methodsPromise = null;
      return NO_METHODS;
    });

  return methodsPromise;
};

// Resolve: "midtrans" | "manual" | null (nggak ada method).
export const openTopUp = async (packageId = null) => {
  const methods = await getPaymentMethods();

  if (methods.midtrans) {
    openBuyCredits(packageId);
    return "midtrans";
  }
  if (methods.manual) {
    openManualPayment(packageId);
    return "manual";
  }

  toast.error(i18n.t("buyCredits.topUpsDisabled"));
  return null;
};
