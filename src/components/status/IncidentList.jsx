// src/components/status/IncidentList.jsx
import { useTranslation } from "react-i18next";
import { STATUS_STYLES } from "./statusStyles";

const IncidentList = ({ incidents }) => {
  const { t, i18n } = useTranslation();

  const fmt = (iso) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {t("status.incidents.title")}
      </h2>
      {(!incidents || incidents.length === 0) && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          {t("status.incidents.none")}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {incidents?.map((inc) => {
          const style = STATUS_STYLES[inc.status] || STATUS_STYLES.unknown;
          return (
            <li
              key={inc.id}
              className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.pill}`}>
                  <span className={`size-1.5 rounded-full ${style.dot}`} />
                  {t(`status.state.${inc.status}`)}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t(`status.services.${inc.service}`, {
                    defaultValue: inc.service,
                  })}
                </span>
                {!inc.resolved_at && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">
                    {t("status.incidents.ongoing")}
                  </span>
                )}
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <div>
                  {t("status.incidents.started", { time: fmt(inc.started_at) })}
                </div>
                {inc.resolved_at && (
                  <div>
                    {t("status.incidents.resolved", {
                      time: fmt(inc.resolved_at),
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default IncidentList;
