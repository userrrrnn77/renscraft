import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CoinsIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import moment from "moment";
import { useAppContext } from "../context/AppContext";
import { errorMessage } from "../api/api";
import {
  createCheckout,
  getOrder,
  getPaymentConfig,
  isPaymentsDisabled,
  listOrders,
} from "../api/payments";
import { describeOrder, formatIdr, TONE_CLASSES } from "../utils/billing";
import { isPaidAndCredited, pollOrder } from "../utils/orderPolling";
import { hideSnap, loadSnap } from "../utils/snap";
import { openManualPayment } from "../utils/manualBilling";

const HISTORY_LIMIT = 5;

const SETTLED_KEYS = {
  failed: "buyCredits.settled.failed",
  expired: "buyCredits.settled.expired",
  canceled: "buyCredits.settled.canceled",
  refunded: "buyCredits.settled.refunded",
  chargeback: "buyCredits.settled.chargeback",
};

function ActivePanel({ active, onContinue, onStop }) {
  const { t } = useTranslation();
  const status = active.order?.status;

  let titleKey = "buyCredits.completeTitle";
  let bodyKey = "buyCredits.completeBody";
  if (status === "paid") {
    titleKey = "buyCredits.receivedTitle";
    bodyKey = "buyCredits.receivedBody";
  } else if (status === "challenge") {
    titleKey = "buyCredits.reviewTitle";
    bodyKey = "buyCredits.reviewBody";
  } else if (active.hint === "checking") {
    titleKey = "buyCredits.confirmingTitle";
    bodyKey = "buyCredits.confirmingBody";
  } else if (active.hint === "waiting") {
    titleKey = "buyCredits.waitingTitle";
    bodyKey = "buyCredits.waitingBody";
  }

  const canContinue =
    active.hint === "waiting" && status !== "paid" && status !== "challenge";

  return (
    <div
      role="status"
      className="mb-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
      <div className="flex items-start gap-3">
        <Loader2Icon
          size={16}
          className="mt-0.5 shrink-0 animate-spin text-zinc-700 dark:text-zinc-300"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {t(titleKey)}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t(bodyKey)}
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("buyCredits.orderPrefix", { id: active.orderId })}
          </p>
          {active.hint === "waiting" && (
            <div className="mt-3 flex gap-2">
              {canContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="cursor-pointer rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                  {t("buyCredits.continuePayment")}
                </button>
              )}
              <button
                type="button"
                onClick={onStop}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
                {t("buyCredits.stopWaiting")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const BuyCreditsModal = ({ onClose, initialPackageId = null }) => {
  const { t } = useTranslation();
  const { credits, refreshCredits } = useAppContext();

  const [config, setConfig] = useState({ state: "loading" });
  const [configAttempt, setConfigAttempt] = useState(0);
  const [orders, setOrders] = useState([]);
  const [busyPackage, setBusyPackage] = useState(null);
  const [active, setActive] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const mountedRef = useRef(true);
  const onCloseRef = useRef(onClose);
  const refreshCreditsRef = useRef(refreshCredits);
  useEffect(() => {
    onCloseRef.current = onClose;
    refreshCreditsRef.current = refreshCredits;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadOrders = async () => {
    try {
      const list = await listOrders();
      if (mountedRef.current) setOrders(list);
    } catch {
      // history is a nice-to-have
    }
  };

  useEffect(() => {
    let cancelled = false;
    setConfig({ state: "loading" });
    getPaymentConfig()
      .then((data) => {
        if (!cancelled) setConfig({ state: "ready", data });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isPaymentsDisabled(err)) setConfig({ state: "disabled" });
        else {
          setConfig({
            state: "error",
            message: errorMessage(err, t("buyCredits.loadFailed")),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [configAttempt, t]);

  useEffect(() => {
    refreshCreditsRef.current();
    loadOrders();
  }, []);

  const paying = active?.hint === "paying";
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !paying) onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paying]);

  const activeId = active?.orderId;
  useEffect(() => {
    if (!activeId) return;

    const controller = new AbortController();

    pollOrder({
      fetchOrder: () => getOrder(activeId),
      signal: controller.signal,
      onUpdate: (order) =>
        setActive((a) => (a && a.orderId === activeId ? { ...a, order } : a)),
    })
      .then(async (order) => {
        if (!order || controller.signal.aborted) return;
        hideSnap();

        if (isPaidAndCredited(order)) {
          await refreshCreditsRef.current();
          toast.success(t("buyCredits.creditsAdded", { count: order.credits }));
          onCloseRef.current();
          return;
        }
        const key = SETTLED_KEYS[order.status];
        toast.error(key ? t(key) : t("buyCredits.settled.notCompleted"));
        setActive(null);
        loadOrders();
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        hideSnap();
        toast.error(errorMessage(err, t("buyCredits.lostConnection")));
        setActive(null);
        loadOrders();
      });

    return () => controller.abort();
  }, [activeId, t]);

  const setHint = (orderId, next, onlyFrom) =>
    setActive((a) =>
      a && a.orderId === orderId && (!onlyFrom || onlyFrom.includes(a.hint))
        ? { ...a, hint: next }
        : a,
    );

  const openSnap = async (order) => {
    if (config.state !== "ready") return;
    if (!order.snapToken) {
      toast.error(t("buyCredits.alreadyPaid"));
      return;
    }

    try {
      await loadSnap(config.data);
    } catch (err) {
      toast.error(err.message);
      loadOrders();
      return;
    }
    if (!mountedRef.current) return;

    const id = order.orderId;
    setActive({
      orderId: id,
      credits: order.credits,
      amount: order.amount,
      snapToken: order.snapToken,
      hint: "paying",
      order: null,
    });

    try {
      window.snap.pay(order.snapToken, {
        onSuccess: () => setHint(id, "checking"),
        onPending: () => setHint(id, "waiting", ["paying"]),
        onError: () => {
          toast.error(t("buyCredits.paymentFailed"));
          setHint(id, "waiting", ["paying"]);
        },
        onClose: () => setHint(id, "waiting", ["paying"]),
      });
    } catch {
      toast.error(t("buyCredits.snapOpenFailed"));
      setActive(null);
    }
  };

  const handleBuy = async (pkg) => {
    if (busyPackage || paying) return;
    setBusyPackage(pkg.id);
    try {
      const order = await createCheckout(pkg.id);
      await openSnap(order);
    } catch (err) {
      toast.error(errorMessage(err, t("payment.couldNotStart")));
    } finally {
      if (mountedRef.current) setBusyPackage(null);
    }
  };

  const packages = config.state === "ready" ? config.data.packages : [];

  useEffect(() => {
    if (autoStarted || !initialPackageId) return;
    if (config.state !== "ready") return;
    const pkg = packages.find((p) => p.id === initialPackageId);
    if (!pkg) return;
    setAutoStarted(true);
    handleBuy(pkg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStarted, initialPackageId, config.state, packages]);

  const bestId = useMemo(() => {
    if (packages.length < 2) return null;
    return packages.reduce((best, p) =>
      p.amount / p.credits < best.amount / best.credits ? p : best,
    ).id;
  }, [packages]);

  const showPackageGrid = !paying;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs dark:bg-zinc-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !paying) onClose();
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-credits-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50">
          <XIcon size={16} />
        </button>

        <div className="mb-5 pr-6">
          <h3 id="buy-credits-title" className="text-lg font-medium">
            {t("payment.topUpTitle")}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <CoinsIcon size={14} />
            {typeof credits === "number"
              ? t("payment.youHave", { count: credits })
              : t("payment.creditsNeverExpire")}
          </p>
        </div>

        {active && (
          <ActivePanel
            active={active}
            onContinue={() => openSnap(active)}
            onStop={() => setActive(null)}
          />
        )}

        {config.state === "loading" && (
          <div className="flex justify-center py-10 text-zinc-400 dark:text-zinc-500">
            <Loader2Icon size={22} className="animate-spin" />
          </div>
        )}

        {config.state === "disabled" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircleIcon
                size={16}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                  {t("buyCredits.midtransSoonTitle")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                  {t("buyCredits.midtransSoonBody")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openManualPayment();
                  }}
                  className="mt-3 cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                  {t("buyCredits.payManualNow")}
                </button>
              </div>
            </div>
          </div>
        )}

        {config.state === "error" && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p>{config.message}</p>
            <button
              type="button"
              onClick={() => setConfigAttempt((n) => n + 1)}
              className="mt-2 cursor-pointer text-xs font-medium underline">
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {config.state === "ready" && showPackageGrid && (
          <>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/30 dark:bg-amber-500/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    {t("payment.manualHint")}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                    {t("payment.manualHintSub")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openManualPayment();
                  }}
                  className="shrink-0 cursor-pointer rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-600">
                  {t("payment.payManual")}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {packages.map((pkg) => {
                const busy = busyPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`flex flex-col rounded-lg border p-4 ${
                      pkg.id === bestId
                        ? "border-zinc-900 dark:border-zinc-50"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{pkg.label}</span>
                      {pkg.id === bestId && (
                        <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
                          {t("payment.bestValue")}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {pkg.credits}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t("payment.creditsSuffix")}
                    </p>
                    <p className="mt-3 text-sm font-medium">
                      {formatIdr(pkg.amount)}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {t("payment.perCredit", {
                        price: formatIdr(Math.round(pkg.amount / pkg.credits)),
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBuy(pkg)}
                      disabled={Boolean(busyPackage) || paying}
                      className="mt-4 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                      {busy && (
                        <Loader2Icon size={13} className="animate-spin" />
                      )}
                      {busy
                        ? t("payment.opening")
                        : t("payment.buy", { label: pkg.label })}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {orders.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("payment.recentOrders")}
            </p>
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {orders.slice(0, HISTORY_LIMIT).map((o) => {
                const view = describeOrder(o);
                const canPay =
                  o.status === "pending" &&
                  Boolean(o.snapToken) &&
                  o.orderId !== active?.orderId;
                return (
                  <li
                    key={o.orderId}
                    className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {isPaidAndCredited(o) && (
                          <CheckCircle2Icon
                            size={13}
                            className="text-emerald-500"
                          />
                        )}
                        +{o.credits} {t("payment.creditsSuffix")}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                        {formatIdr(o.amount)} · {moment(o.createdAt).fromNow()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canPay && (
                        <button
                          type="button"
                          onClick={() => openSnap(o)}
                          disabled={paying}
                          className="cursor-pointer rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                          {t("payment.pay")}
                        </button>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${TONE_CLASSES[view.tone]}`}>
                        {view.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyCreditsModal;
