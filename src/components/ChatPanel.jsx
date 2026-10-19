import { BotIcon, BotMessageSquareIcon, UserIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import PromptInput from "./PromptInput";

const ChatPanel = ({ messages, onSend, loading, disabled = false }) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current.scrollIntoView({ behavior: "auto" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm text-center dark:text-zinc-500">
              {t("chat.emptyState")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className="flex gap-2.5 items-start">
              <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-50 dark:bg-zinc-900">
                {msg.role === "user" ? (
                  <UserIcon
                    size={14}
                    className="text-zinc-500 dark:text-zinc-400"
                  />
                ) : (
                  <BotMessageSquareIcon
                    size={14}
                    className="text-zinc-700 dark:text-zinc-300"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider dark:text-zinc-500">
                  {msg.role === "user" ? t("chat.you") : t("chat.ai")}
                </p>
                <p className="text-[13px] tracking-wider whitespace-pre-wrap wrap-break-word text-zinc-700 dark:text-zinc-300">
                  {msg.content.split("- `/").map((text, i) => (
                    <span key={i} className="block mt-3">
                      <span className={i === 0 ? "hidden" : ""}>- `/</span>
                      {text}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-100 dark:bg-zinc-800">
              <BotIcon size={13} className="text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-zinc-400 mb-2 uppercase tracking-wider dark:text-zinc-500">
                {t("chat.ai")}
              </p>
              <div className="dot-loader text-zinc-900 dark:text-zinc-100">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <PromptInput
          onSubmit={onSend}
          loading={loading}
          disabled={disabled}
          placeholder={
            disabled ? t("chat.placeholderDisabled") : t("chat.placeholder")
          }
          autoFocus
        />
      </div>
    </div>
  );
};

export default ChatPanel;
