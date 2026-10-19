// src/components/BuilderImageUploader.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Trans, useTranslation } from "react-i18next";
import {
  ImageIcon,
  Loader2Icon,
  TrashIcon,
  UploadCloudIcon,
} from "lucide-react";
import api, { errorMessage } from "../api/api";

const MAX_FILE_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

const BuilderImageUploader = ({ projectId, initialImages = [], onChange }) => {
  const { t } = useTranslation();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const uploadOne = async (file) => {
    const res = await api.post(`/api/projects/${projectId}/images`, file, {
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      maxBodyLength: MAX_FILE_MB * 1024 * 1024 + 1024 * 1024,
      maxContentLength: MAX_FILE_MB * 1024 * 1024 + 1024 * 1024,
    });
    return res.data;
  };

  const handleFiles = useCallback(
    async (files) => {
      const list = Array.from(files || []);
      if (list.length === 0) return;

      const tooBig = list.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
      if (tooBig.length > 0) {
        toast.error(
          t("images.tooBig", { count: tooBig.length, max: MAX_FILE_MB }),
        );
      }

      const ok = list.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
      if (ok.length === 0) return;

      setUploading(true);
      let latest = images;
      for (const file of ok) {
        try {
          const data = await uploadOne(file);
          latest = data.uploadedImages || latest;
          setImages(latest);
          onChange?.(latest);
        } catch (err) {
          toast.error(
            errorMessage(err, t("images.uploadFailed", { name: file.name })),
          );
        }
      }
      setUploading(false);
      if (ok.length > 0) {
        toast.success(t("images.added", { count: ok.length }));
      }
    },
    [images, onChange, projectId, t],
  );

  const handleRemove = async (url) => {
    if (!window.confirm(t("images.confirmRemove"))) return;
    try {
      const { data } = await api.delete(`/api/projects/${projectId}/images`, {
        data: { url },
      });
      const next = data.uploadedImages || [];
      setImages(next);
      onChange?.(next);
    } catch (err) {
      toast.error(errorMessage(err, t("images.removeFailed")));
    }
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t("images.title")}
        </p>
      </div>

      <div className="p-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition ${
            dragOver
              ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-500/10"
              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          }`}>
          {uploading ? (
            <Loader2Icon
              size={20}
              className="animate-spin text-zinc-400 dark:text-zinc-500"
            />
          ) : (
            <UploadCloudIcon
              size={20}
              className="text-zinc-400 dark:text-zinc-500"
            />
          )}
          <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {uploading ? t("images.uploading") : t("images.dropOrClick")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
            {t("images.accept", { max: MAX_FILE_MB })}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {images.length === 0 ? (
          <div className="py-6 text-center">
            <ImageIcon
              size={20}
              className="mx-auto text-zinc-300 dark:text-zinc-700"
            />
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("images.emptyHint")}
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {images.map((img, i) => (
              <li
                key={img.url}
                className="group flex items-center gap-2 rounded-lg border border-zinc-100 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="size-9 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={img.url}
                    alt={img.name || `Image ${i + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {img.name || `Image ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ref-img-{String(i + 1).padStart(2, "0")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(img.url)}
                  aria-label={t("images.removeAria")}
                  className="shrink-0 cursor-pointer rounded p-1 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <TrashIcon size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {images.length > 0 && (
        <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
          <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            <Trans
              i18nKey="images.refHint"
              components={[
                <code key="0" className="font-mono" />,
                <em key="1" />,
              ]}
            />
          </p>
        </div>
      )}
    </div>
  );
};

export default BuilderImageUploader;
