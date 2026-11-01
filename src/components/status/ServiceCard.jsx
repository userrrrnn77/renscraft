// src/components/status/ServiceCard.jsx
import { useTranslation } from "react-i18next";
import { STATUS_STYLES } from "./statusStyles";
import UptimeBars from "./UptimeBars";

const ServiceCard = ({ service }) => {
  const { t } = useTranslation();
  const style = STATUS_STYLES[service.status] || STATUS_STYLES.unknown;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t(`status.services.${service.id}`)}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {service.latency_ms != null
              ? t("status.latency", { ms: service.latency_ms })
              : "\u2014"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.pill}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {t(`status.state.${service.status}`)}
          </span>
        </div>
      </header>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400">
            {t("status.uptime", {
              value: service.uptime_30d != null ? service.uptime_30d : "\u2014",
            })}
          </span>
        </div>
        <UptimeBars days={service.days} />
      </div>
    </section>
  );
};

export default ServiceCard;
