import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

const INPUT_CLS =
  "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition bg-white ring-1 ring-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-400 disabled:opacity-60 dark:bg-zinc-900 dark:ring-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600";

const GLASS_CLS =
  "w-full rounded-xl ring-1 bg-white/70 backdrop-blur-xl ring-zinc-200/80 dark:bg-white/5 dark:ring-white/15";

const fmtPhone = (digits) => {
  const rest = String(digits).replace(/\D/g, "").replace(/^62/, "");
  const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(
    Boolean,
  );
  return `+62 ${parts.join("-")}`;
};

const displayValue = (slot) => {
  if (slot.value == null) return "";
  return slot.kind === "phone" ? fmtPhone(slot.value) : slot.value;
};

const splitQuestion = (q) => {
  const m = String(q).match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { text: m[1], hint: m[2] } : { text: q, hint: null };
};

const initialStep = (brief) => {
  const bySlot = Object.fromEntries(brief.slots.map((s) => [s.key, s]));
  const idx = brief.questionKeys.findIndex((k) => {
    const s = bySlot[k];
    return s && s.value == null && !s.skipped;
  });
  return idx === -1 ? "summary" : idx;
};

function SlotInput({
  slot,
  value,
  onChange,
  onSubmit,
  onPick,
  disabled,
  autoFocus,
}) {
  const { kind } = slot;

  if (kind === "choice") {
    return (
      <div className="flex flex-wrap gap-2">
        {(slot.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onPick?.(opt)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer disabled:opacity-50 ${
              value === opt
                ? "bg-red-600 border-red-500 text-white dark:bg-red-500 dark:border-red-500"
                : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:border-white/25 dark:text-zinc-100 dark:hover:bg-white/20"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (kind === "longtext" || kind === "list") {
    return (
      <textarea
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        rows={kind === "list" ? 6 : 4}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={`${INPUT_CLS} resize-none`}
      />
    );
  }

  const type =
    kind === "phone"
      ? "tel"
      : kind === "email"
        ? "email"
        : kind === "url"
          ? "url"
          : "text";

  const input = (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      disabled={disabled}
      inputMode={kind === "phone" ? "tel" : undefined}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit?.();
        }
      }}
      className={kind === "handle" ? `${INPUT_CLS} pl-7` : INPUT_CLS}
    />
  );

  if (kind !== "handle") return input;
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm select-none dark:text-white/60">
        @
      </span>
      {input}
    </div>
  );
}

function QuestionStep({
  slot,
  index,
  total,
  canGoBack,
  onAnswer,
  onBack,
  onDone,
  onSkipAll,
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(displayValue(slot));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { text, hint } = splitQuestion(slot.question);

  const send = async (payload) => {
    setBusy(true);
    setError("");
    const errs = await onAnswer({ [slot.key]: payload });
    setBusy(false);
    const msg = errs?.[slot.key] || errs?.__error;
    if (msg) setError(msg);
    else onDone();
  };

  return (
    <div>
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        {text}
      </p>
      {hint && (
        <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">{hint}</p>
      )}

      <div className="mt-4">
        <SlotInput
          slot={slot}
          value={value}
          onChange={setValue}
          onSubmit={() => send(value)}
          onPick={(opt) => send(opt)}
          disabled={busy}
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-500 mt-2 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack || busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800">
          <ArrowLeftIcon size={14} />
          {t("brief.back")}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => send(null)}
            disabled={busy}
            className="px-3 py-2 rounded-md text-sm text-zinc-600 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {t("brief.skip")}
          </button>
          {slot.kind !== "choice" && (
            <button
              type="button"
              onClick={() => send(value)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer dark:bg-red-500 dark:hover:bg-red-600">
              {busy ? (
                <Loader2Icon size={14} className="animate-spin" />
              ) : (
                <>
                  {t("brief.next")}
                  <ArrowRightIcon size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {index < total - 1 && (
        <button
          type="button"
          onClick={onSkipAll}
          disabled={busy}
          className="mt-4 text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 cursor-pointer dark:text-white/50 dark:hover:text-white/80">
          {t("brief.skipAll")}
        </button>
      )}
    </div>
  );
}

function InlineEdit({ slot, onAnswer, onClose }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(displayValue(slot));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (payload) => {
    setBusy(true);
    setError("");
    const errs = await onAnswer({ [slot.key]: payload });
    setBusy(false);
    const msg = errs?.[slot.key] || errs?.__error;
    if (msg) setError(msg);
    else onClose();
  };

  return (
    <div className="mt-2">
      <SlotInput
        slot={slot}
        value={value}
        onChange={setValue}
        onSubmit={() => send(value)}
        onPick={(opt) => send(opt)}
        disabled={busy}
        autoFocus
      />
      {error && (
        <p className="text-sm text-red-500 mt-2 dark:text-red-400">{error}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        {slot.kind !== "choice" && (
          <button
            type="button"
            onClick={() => send(value)}
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer dark:bg-red-500 dark:hover:bg-red-600">
            {busy ? t("brief.saving") : t("brief.save")}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="px-3 py-1.5 rounded-md text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer dark:text-white/80 dark:hover:bg-white/10">
          {t("brief.cancel")}
        </button>
      </div>
    </div>
  );
}

function Summary({
  brief,
  onAnswer,
  onGenerate,
  onCancel,
  generating,
  actionsRef,
  onAddExtra,
  onRemoveExtra,
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [extraLabel, setExtraLabel] = useState("");
  const [extraKind, setExtraKind] = useState("text");
  const [extraValue, setExtraValue] = useState("");
  const [extraBusy, setExtraBusy] = useState(false);

  const submitExtra = async (e) => {
    e?.preventDefault();
    if (!extraLabel.trim() || !extraValue.trim()) return;
    setExtraBusy(true);
    const res = await onAddExtra({
      label: extraLabel.trim(),
      kind: extraKind,
      value: extraValue.trim(),
    });
    setExtraBusy(false);
    if (res?.ok) {
      setExtraLabel("");
      setExtraValue("");
      setExtraKind("text");
      setAddOpen(false);
    }
  };

  return (
    <div>
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        {t("brief.summary")}
      </p>
      <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
        {t("brief.summarySub")}
      </p>

      <div className="mt-4 divide-y divide-zinc-200 dark:divide-white/10 max-h-[50vh] overflow-y-auto pr-1">
        {brief.slots.map((slot) => {
          const filled = slot.value != null && slot.value !== "";
          const removable = slot.origin === "user";
          return (
            <div key={slot.key} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-zinc-400 dark:text-white/50">
                    {slot.label}
                  </p>
                  {filled ? (
                    <p className="text-sm text-zinc-900 mt-0.5 line-clamp-2 whitespace-pre-line wrap-break-word dark:text-zinc-50">
                      {displayValue(slot)}
                    </p>
                  ) : (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-white/50">
                      {slot.group === "style"
                        ? t("brief.aiChoice")
                        : t("brief.placeholder")}
                    </span>
                  )}
                </div>
                {editing !== slot.key && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(slot.key)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10">
                      <PencilIcon size={12} />
                      {filled ? t("brief.change") : t("brief.fill")}
                    </button>
                    {removable && (
                      <button
                        type="button"
                        onClick={() => onRemoveExtra?.(slot.key)}
                        disabled={generating}
                        aria-label={t("brief.removeExtra")}
                        className="cursor-pointer rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                        <Trash2Icon size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {editing === slot.key && (
                <InlineEdit
                  slot={slot}
                  onAnswer={onAnswer}
                  onClose={() => setEditing(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        {!addOpen ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={generating}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            <PlusIcon size={12} /> {t("brief.addExtra")}
          </button>
        ) : (
          <form
            onSubmit={submitExtra}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <input
              value={extraLabel}
              onChange={(e) => setExtraLabel(e.target.value)}
              placeholder={t("brief.extraLabelPlaceholder")}
              maxLength={60}
              required
              className={INPUT_CLS}
            />
            <select
              value={extraKind}
              onChange={(e) => setExtraKind(e.target.value)}
              className={INPUT_CLS}>
              <option value="text">{t("brief.kindText")}</option>
              <option value="longtext">{t("brief.kindLongtext")}</option>
              <option value="list">{t("brief.kindList")}</option>
            </select>
            {extraKind === "list" || extraKind === "longtext" ? (
              <textarea
                rows={4}
                value={extraValue}
                onChange={(e) => setExtraValue(e.target.value)}
                placeholder={t("brief.extraValuePlaceholder")}
                required
                className={`${INPUT_CLS} resize-none`}
              />
            ) : (
              <input
                value={extraValue}
                onChange={(e) => setExtraValue(e.target.value)}
                placeholder={t("brief.extraValuePlaceholder")}
                required
                className={INPUT_CLS}
              />
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={extraBusy}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {extraBusy ? (
                  <Loader2Icon size={12} className="animate-spin" />
                ) : (
                  t("brief.save")
                )}
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                disabled={extraBusy}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                {t("brief.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-4 dark:text-zinc-400">
        {t("brief.answeringIsFree")}
      </p>

      <div
        ref={actionsRef}
        className="flex items-center justify-between gap-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={generating}
          className="px-3 py-2 rounded-md text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 cursor-pointer dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10">
          {t("brief.cancel")}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer dark:bg-red-500 dark:hover:bg-red-600">
          {generating && <Loader2Icon size={14} className="animate-spin" />}
          {t("brief.generate")}
        </button>
      </div>
    </div>
  );
}

const BriefWizard = ({
  brief,
  onAnswer,
  onCategoryChange,
  onCancel,
  onGenerate,
  generating = false,
  onAddExtra,
  onRemoveExtra,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(() => initialStep(brief));
  const [catOpen, setCatOpen] = useState(false);
  const [catBusy, setCatBusy] = useState(false);
  const summaryActionsRef = useRef(null);
  const didMountRef = useRef(false);

  const categoryId = brief.category.id;
  useEffect(() => {
    setStep(initialStep(brief));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (step !== "summary") return;

    const el = summaryActionsRef.current;
    if (!el) return;

    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);

    return () => clearTimeout(t);
  }, [step]);

  const keys = brief.questionKeys;
  const total = keys.length;
  const inQuestions = step !== "summary" && keys[step] !== undefined;
  const slot = inQuestions
    ? brief.slots.find((s) => s.key === keys[step])
    : null;

  const goNext = () => {
    if (typeof step === "number" && step + 1 < total) setStep(step + 1);
    else setStep("summary");
  };
  const goBack = () => {
    if (step === "summary") setStep(Math.max(total - 1, 0));
    else if (typeof step === "number" && step > 0) setStep(step - 1);
  };

  const pickCategory = async (id) => {
    setCatOpen(false);
    if (id === categoryId) return;
    setCatBusy(true);
    await onCategoryChange(id);
    setCatBusy(false);
  };

  return (
    <div className={`${GLASS_CLS} mt-6 p-5 text-left`}>
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setCatOpen((o) => !o)}
            disabled={catBusy || generating}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 cursor-pointer dark:bg-white/10 dark:border-white/25 dark:text-zinc-100 dark:hover:bg-white/20">
            {catBusy ? (
              <Loader2Icon size={12} className="animate-spin" />
            ) : null}
            {brief.category.label}
            <ChevronDownIcon size={12} />
          </button>
          {catOpen && (
            <div className="absolute z-20 left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg bg-white ring-1 ring-zinc-200 shadow-xl py-1 dark:bg-zinc-900 dark:ring-white/25">
              {brief.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCategory(c.id)}
                  className={`block w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 ${
                    c.id === categoryId
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {inQuestions && (
          <span className="text-xs text-zinc-500 dark:text-white/60">
            {t("brief.questionOf", { current: step + 1, total })}
          </span>
        )}
      </div>

      <div className="h-1 rounded-full bg-zinc-200 dark:bg-white/10 mt-3 mb-5 overflow-hidden">
        <div
          className="h-full bg-red-600 transition-all dark:bg-red-500"
          style={{
            width:
              step === "summary" || total === 0
                ? "100%"
                : `${((step + 1) / total) * 100}%`,
          }}
        />
      </div>

      {inQuestions && slot ? (
        <QuestionStep
          key={`${categoryId}:${slot.key}`}
          slot={slot}
          index={step}
          total={total}
          canGoBack={step > 0}
          onAnswer={onAnswer}
          onBack={goBack}
          onDone={goNext}
          onSkipAll={() => setStep("summary")}
        />
      ) : (
        <Summary
          brief={brief}
          onAnswer={onAnswer}
          onGenerate={onGenerate}
          onCancel={onCancel}
          generating={generating}
          actionsRef={summaryActionsRef}
          onAddExtra={onAddExtra}
          onRemoveExtra={onRemoveExtra}
        />
      )}

      {step === "summary" && total > 0 && (
        <button
          type="button"
          onClick={goBack}
          disabled={generating}
          className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer dark:text-white/50 dark:hover:text-white/80">
          <ArrowLeftIcon size={12} />
          {t("brief.backToQuestions")}
        </button>
      )}
    </div>
  );
};

export default BriefWizard;
