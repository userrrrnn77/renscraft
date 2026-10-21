// src/components/ConfirmModal.jsx
import { useEffect, useRef } from "react";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";

const TONE = {
  danger: {
    icon: "text-red-600 bg-red-50 ring-red-100 dark:text-red-400 dark:bg-red-500/10 dark:ring-red-500/20",
    button: "bg-red-600 text-white hover:bg-red-700",
  },
  default: {
    icon: "text-zinc-700 bg-zinc-100 ring-zinc-200 dark:text-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700",
    button:
      "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200",
  },
};

const ConfirmModal = ({
  open,
  title,
  // string OR JSX. Rendered inside a div, so <strong> / <span> / <code> are fine.
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busyLabel = "Processing...",
  tone = "danger",
  busy = false,
  onConfirm,
  onClose,
  icon: Icon = AlertTriangleIcon,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    // Focus Cancel, not Confirm. Enter on a destructive dialog should be safe.
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const styles = TONE[tone] ?? TONE.default;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs dark:bg-zinc-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}>
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ${styles.icon}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-modal-title"
              className="text-sm font-semibold tracking-tight">
              {title}
            </h3>
            {description && (
              <div className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${styles.button}`}>
            {busy && <Loader2Icon size={12} className="animate-spin" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
