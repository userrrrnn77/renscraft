// src/components/status/statusStyles.js

export const STATUS_STYLES = {
  operational: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  degraded: {
    bar: "bg-amber-400",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  outage: {
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  maintenance: {
    bar: "bg-sky-500",
    dot: "bg-sky-500",
    pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
  },
  nodata: {
    bar: "bg-zinc-300 dark:bg-zinc-700",
    dot: "bg-zinc-300 dark:bg-zinc-700",
    pill: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
    text: "text-zinc-500 dark:text-zinc-400",
  },
  unknown: {
    bar: "bg-zinc-300 dark:bg-zinc-700",
    dot: "bg-zinc-300 dark:bg-zinc-700",
    pill: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
    text: "text-zinc-500 dark:text-zinc-400",
  },
};
