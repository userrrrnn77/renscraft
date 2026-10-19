import { XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PublishModal = ({ publishUrl, onClose }) => {
  const { t } = useTranslation();

  const handleCopyLink = () => {
    if (!publishUrl) return;
    navigator.clipboard.writeText(publishUrl);
    toast.success(t("publish.copied"));
  };

  return (
    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 dark:bg-zinc-950/60">
      <div className="bg-white border border-zinc-200 shadow-lg rounded-xl max-w-md w-full p-6 mx-4 relative dark:bg-zinc-900 dark:border-zinc-800">
        <button
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-50"
          onClick={onClose}
          aria-label={t("common.close")}>
          <XIcon size={16} />
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-zinc-900 mb-1 dark:text-zinc-50">
            {t("publish.title")}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("publish.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 dark:text-zinc-500">
              {t("publish.linkLabel")}
            </label>
            <input
              type="text"
              readOnly
              value={publishUrl}
              className="w-full px-0 py-2 border-b border-zinc-200 text-sm text-zinc-900 bg-transparent outline-none dark:border-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 py-2 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer rounded-lg text-center dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              onClick={handleCopyLink}>
              {t("publish.copyLink")}
            </button>
            <button
              className="flex-1 py-2 border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 cursor-pointer rounded-lg text-center dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => window.open(publishUrl, "_blank")}>
              {t("publish.openSite")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
