"use client";

import { EMBED_PROVIDER_META } from "@/lib/editor/embed";
import { EmbedProvider } from "@/lib/editor/types";

type EmbedModalProps = {
  open: boolean;
  provider: EmbedProvider;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const EmbedModal = ({
  open,
  provider,
  value,
  error,
  onChange,
  onClose,
  onSubmit,
}: EmbedModalProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Embed Link
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {EMBED_PROVIDER_META[provider].label}
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Paste link
        </label>
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder={EMBED_PROVIDER_META[provider].placeholder}
          className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
        />

        {error ? (
          <div className="mt-2 text-xs text-red-500">{error}</div>
        ) : (
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Enter or click Ok to insert preview
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
