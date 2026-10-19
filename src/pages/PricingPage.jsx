import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircleIcon,
  CheckIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import SiteNav from "../components/SiteNav";
import { useAppContext } from "../context/AppContext";
import { errorMessage } from "../api/api";
import { getPublicPackages, isPaymentsDisabled } from "../api/payments";
import { formatIdr } from "../utils/billing";
import usePageMeta from "../utils/usePageMeta";
import { openManualPayment } from "../utils/manualBilling";
import { openTopUp } from "../utils/topup";

const GRID_STYLE_LIGHT = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)",
};

const GRID_STYLE_DARK = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)",
};

const PricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppContext();

  const [state, setState] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState("midtrans");

  usePageMeta({
    title: t("meta.pricingTitle", "Pricing — Renscraft"),
    description: t(
      "meta.pricingDescription",
      "Simple credit packs for Renscraft. Pay once in rupiah, credits never expire.",
    ),
  });

  const data = state.status === "ready" ? state.data : null;
  const packages = data?.packages ?? [];

  useEffect(() => {
    if (!data) return;
    if (!data.methods?.midtrans && data.methods?.manual) setMethod("manual");
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getPublicPackages()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isPaymentsDisabled(err)) setState({ status: "disabled" });
        else {
          setState({
            status: "error",
            message: errorMessage(err, t("pricing.loadError")),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, t]);

  const bestId = useMemo(() => {
    if (packages.length < 2) return null;
    return packages.reduce((best, p) =>
      p.amount / p.credits < best.amount / best.credits ? p : best,
    ).id;
  }, [packages]);

  const handleBuy = (pkg) => {
    if (!user) return navigate("/register");
    if (method === "manual") openManualPayment(pkg.id);
    else openTopUp(pkg.id);
  };

  return (
    <div className="min-h-dvh bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-24">
        {data?.methods?.midtrans && data?.methods?.manual && (
          <div className="mt-2 md:mt-6 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {data.methods.midtrans && (
              <button
                type="button"
                onClick={() => setMethod("midtrans")}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition ${
                  method === "midtrans"
                    ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}>
                {t("pricing.methodAuto")}
              </button>
            )}
            {data.methods.manual && (
              <button
                type="button"
                onClick={() => setMethod("manual")}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition ${
                  method === "manual"
                    ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}>
                {t("pricing.methodManual")}
              </button>
            )}
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-150 overflow-hidden">
          <div
            className="absolute inset-0 dark:hidden"
            style={GRID_STYLE_LIGHT}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={GRID_STYLE_DARK}
          />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-130 rounded-full bg-red-500/[0.07] blur-[140px] dark:bg-red-500/15" />
        </div>

        <header className="relative max-w-2xl mt-4 md:mt-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            {t("pricing.title")}
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {data
              ? t("pricing.subtitleWithCosts", {
                  generate: data.costs.generate,
                  revision: data.costs.revision,
                })
              : t("pricing.subtitle")}
          </p>
          {data?.freeCredits > 0 && (
            <p className="mt-2 text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
              {t("pricing.freeCreditsNote", { count: data.freeCredits })}
            </p>
          )}
        </header>

        {state.status === "loading" && (
          <div className="flex justify-center py-24 text-zinc-400 dark:text-zinc-500">
            <Loader2Icon size={24} className="animate-spin" />
          </div>
        )}

        {state.status === "disabled" && (
          <div className="mt-12 flex max-w-xl items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
            {t("pricing.disabled")}
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-12 max-w-xl rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p>{state.message}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-2 text-xs font-medium underline cursor-pointer">
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {data && (
          <section
            aria-label="Credit packs"
            className="relative mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {packages.map((pkg) => {
              const best = pkg.id === bestId;
              const websites = Math.floor(pkg.credits / data.costs.generate);
              return (
                <article
                  key={pkg.id}
                  className={`relative flex flex-col rounded-2xl border p-5 md:p-7 transition-all duration-300 hover:-translate-y-1 ${
                    best
                      ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-50 dark:ring-zinc-50 dark:bg-zinc-900/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-none"
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">{pkg.label}</h2>
                    {best && (
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
                        <SparklesIcon size={10} />
                        {t("pricing.bestValue")}
                      </span>
                    )}
                  </div>

                  <p className="mt-5 md:mt-6 text-3xl md:text-4xl font-semibold tracking-tight">
                    {formatIdr(pkg.amount)}
                  </p>
                  <p className="mt-1 text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                    {t("pricing.creditsCount", { count: pkg.credits })}
                  </p>

                  <ul className="mt-5 md:mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    {websites > 0 && (
                      <li className="flex items-start gap-2">
                        <CheckIcon size={15} className="mt-0.5 shrink-0" />
                        {t("pricing.enoughFor", { count: websites })}
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckIcon size={15} className="mt-0.5 shrink-0" />
                      {t("pricing.reviseWithChat", {
                        cost: data.costs.revision,
                      })}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon size={15} className="mt-0.5 shrink-0" />
                      {t("pricing.publishExport")}
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleBuy(pkg)}
                    className={`mt-6 md:mt-8 rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer transition-all ${
                      best
                        ? "bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        : "border border-zinc-200 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    }`}>
                    {user
                      ? t("pricing.buy", { label: pkg.label })
                      : t("pricing.signUpToBuy")}
                  </button>
                </article>
              );
            })}
          </section>
        )}

        <section
          aria-label="Good to know"
          className="relative mt-12 md:mt-20 grid max-w-3xl gap-6 text-sm leading-relaxed text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
          <div>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              {t("pricing.failedBuildsFree")}
            </h2>
            <p className="mt-1 text-xs md:text-sm">
              {t("pricing.failedBuildsFreeText")}
            </p>
          </div>
          {data?.methods?.midtrans ? (
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
                {t("pricing.midtransTitle")}
              </h2>
              <p className="mt-1 text-xs md:text-sm">
                {t("pricing.midtransText")}
              </p>
            </div>
          ) : data?.methods?.manual ? (
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
                {t("pricing.manualTitle")}
              </h2>
              <p className="mt-1 text-xs md:text-sm">
                {t("pricing.manualText")}
              </p>
            </div>
          ) : null}
        </section>

        {!user && (
          <p className="relative mt-10 md:mt-12 text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
            {t("pricing.haveAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
              {t("pricing.signIn")}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
};

export default PricingPage;
