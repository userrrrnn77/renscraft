import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const PromptInput = ({
  onSubmit,
  loading = false,
  placeholder,
  large = false,
  autoFocus = false,
  variant = "default",
  disabled = false,
  initialValue = "",
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);
  const submittingRef = useRef(false);
  const blocked = loading || disabled;
  const effectivePlaceholder = placeholder ?? t("home.placeholder");

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || blocked || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const ok = await onSubmit(trimmed);
      if (ok !== false) setValue("");
    } finally {
      submittingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (variant === "glass") {
    return (
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl w-full rounded-xl ring-1 overflow-hidden mt-6 transition
          bg-white/70 ring-zinc-200/80 backdrop-blur-xl focus-within:ring-2 focus-within:ring-zinc-400/50
          dark:bg-white/5 dark:ring-white/15 dark:focus-within:ring-white/30">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          disabled={blocked}
          rows={3}
          className="w-full p-4 pb-2 resize-none placeholder:text-zinc-400 outline-none bg-transparent text-zinc-900 text-base dark:placeholder:text-white/40 dark:text-zinc-50"
        />
        <div className="flex items-center justify-end pb-3 px-3 gap-2">
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={!value.trim() || blocked}
              className="flex items-center justify-center p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer dark:bg-red-500 dark:hover:bg-red-600"
              type="submit">
              {loading ? (
                <Loader2Icon size={18} className="animate-spin" />
              ) : (
                <ArrowRightIcon size={18} />
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 rounded-xl transition
        bg-white border border-zinc-200 focus-within:ring-1 focus-within:ring-zinc-300
        dark:bg-zinc-900 dark:border-zinc-800 dark:focus-within:ring-zinc-700
        ${large ? "p-4" : "p-3"}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={effectivePlaceholder}
        disabled={blocked}
        rows={large ? 5 : 1}
        className={`flex-1 bg-transparent border-none outline-none resize-none text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500 ${
          large ? "text-base" : "text-sm"
        }`}
      />
      <button
        onClick={() => handleSubmit()}
        disabled={!value.trim() || blocked}
        className="inline-flex items-center justify-center bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer rounded-full shrink-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        style={{ width: large ? 36 : 24, height: large ? 36 : 24 }}>
        {loading ? (
          <Loader2Icon size={large ? 20 : 15} className="animate-spin" />
        ) : (
          <ArrowRightIcon size={large ? 20 : 15} />
        )}
      </button>
    </div>
  );
};

export default PromptInput;
