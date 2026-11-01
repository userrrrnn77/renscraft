// src/components/status/UptimeBars.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { STATUS_STYLES } from "./statusStyles";

const parseLocalDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const UptimeBars = ({ days }) => {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState(-1);

  const total = days.length;

  return (
    <div className="w-full">
      <div
        role="group"
        className="flex gap-0.5 h-8 w-full"
        aria-label={t("status.uptime", { value: "" })}>
        {days.map((d, i) => {
          const style = STATUS_STYLES[d.status] || STATUS_STYLES.nodata;
          const align =
            i < 5
              ? "left-0"
              : i >= total - 5
                ? "right-0"
                : "left-1/2 -translate-x-1/2";
          const dateLabel = (() => {
            try {
              return new Intl.DateTimeFormat(i18n.language, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(parseLocalDate(d.date));
            } catch {
              return d.date;
            }
          })();
          const aria = `${dateLabel}, ${
            d.uptime == null
              ? t("status.state.nodata")
              : `${d.uptime}% · ${t("status.checks", { count: d.checks })}`
          }`;
          return (
            <div
              key={d.date}
              className="relative flex-1"
              tabIndex={0}
              aria-label={aria}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((cur) => (cur === i ? -1 : cur))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((cur) => (cur === i ? -1 : cur))}
              onClick={() => setActive((cur) => (cur === i ? -1 : i))}>
              <div className={`h-full w-full rounded-xs ${style.bar}`} />
              {active === i && (
                <div
                  className={`pointer-events-none absolute bottom-full z-20 mb-2 ${align}`}>
                  <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-left text-[11px] leading-tight text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    <div className="font-medium whitespace-nowrap">
                      {dateLabel}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {d.uptime == null
                        ? t("status.state.nodata")
                        : t("status.uptime", { value: d.uptime })}
                    </div>
                    {d.checks > 0 && (
                      <div className="mt-0.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {t("status.checks", { count: d.checks })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
        <span>{t("status.daysAgo")}</span>
        <span>{t("status.today")}</span>
      </div>
    </div>
  );
};

export default UptimeBars;
