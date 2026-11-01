// FILE: client/src/components/ChatPanel.jsx

import { BotIcon, BotMessageSquareIcon, UserIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import PromptInput from "./PromptInput";

// Markdown ringan untuk pesan AI. react-markdown tidak merender HTML mentah
// (tanpa rehype-raw), dan urlTransform bawaannya membuang protokol berbahaya.
const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </strong>
  ),
  h1: ({ children }) => (
    <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </p>
  ),
  h3: ({ children }) => (
    <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px] tracking-normal dark:bg-zinc-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-md bg-zinc-100 p-2 text-[12px] last:mb-0 dark:bg-zinc-800 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
};

const ChatPanel = ({
  messages,
  onSend,
  loading,
  disabled = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current.scrollIntoView({ behavior: "auto" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header Chat (Opsional, buat naruh tombol Close) */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t("chat.panelTitle")}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="hidden md:inline-flex p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            title={t("chat.closePanel")}>
            <XIcon size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm text-center dark:text-zinc-500">
              {t("chat.emptyState")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg._id ?? msg.timestamp ?? i}>
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
                {msg.role === "user" ? (
                  // Prompt user ditampilkan apa adanya: markdown bisa merusak
                  // teks biasa (tanda *, #, baris baru).
                  <p className="text-[13px] tracking-wider whitespace-pre-wrap wrap-break-word text-zinc-700 dark:text-zinc-300">
                    {msg.content}
                  </p>
                ) : (
                  <div className="text-[13px] tracking-wider wrap-break-word text-zinc-700 dark:text-zinc-300">
                    <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
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
              <div className="flex items-center gap-2">
                <div className="dot-loader text-zinc-900 dark:text-zinc-100">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  {t("chat.revising")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
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
