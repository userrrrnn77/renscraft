import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

const Loading = () => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <Loader2Icon
        className="animate-spin text-zinc-950 dark:text-zinc-50"
        size={26}
      />
    </div>
  );
};

export default Loading;
