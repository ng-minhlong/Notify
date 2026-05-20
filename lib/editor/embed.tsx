import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { EmbedProvider } from "@/lib/editor/types";

export const EMBED_PROVIDER_META: Record<
  EmbedProvider,
  {
    label: string;
    placeholder: string;
  }
> = {
  youtube: {
    label: "YouTube",
    placeholder: "Dán link YouTube vào đây",
  },
  drive: {
    label: "Google Drive",
    placeholder: "Dán link Google Drive vào đây",
  },
  figma: {
    label: "Figma",
    placeholder: "Dán link Figma vào đây",
  },
};

const extractYouTubeId = (inputUrl: string): string | null => {
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      const directId = url.searchParams.get("v");
      if (directId) return directId;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
};

export const normalizeEmbedUrl = (
  provider: EmbedProvider,
  inputUrl: string,
): string => {
  const trimmed = inputUrl.trim();

  if (provider === "youtube") {
    const videoId = extractYouTubeId(trimmed);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  }

  if (provider === "drive") {
    try {
      const url = new URL(trimmed);
      const href = url.href;

      if (href.includes("/preview")) return href;
      if (href.includes("/view")) return href.replace("/view", "/preview");
      if (href.includes("/edit")) return href.replace("/edit", "/preview");

      return href;
    } catch {
      return trimmed;
    }
  }

  if (provider === "figma") {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
};

export const getProviderFromEmbedUrl = (
  url: string,
): EmbedProvider | null => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");

    if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
    if (host.endsWith("drive.google.com")) return "drive";
    if (host.endsWith("figma.com")) return "figma";

    return null;
  } catch {
    return null;
  }
};

export const createEmbedBlockSpec = createReactBlockSpec(
  {
    type: "embed",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      provider: {
        default: "youtube",
        values: ["youtube", "drive", "figma"] as const,
      },
      url: {
        default: "",
      },
      embedUrl: {
        default: "",
      },
      title: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const provider = props.block.props.provider as EmbedProvider;
      const originalUrl = props.block.props.url as string;
      const embedUrl = props.block.props.embedUrl as string;
      const title =
        (props.block.props.title as string) || EMBED_PROVIDER_META[provider].label;

      return (
        <div
          className="my-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          contentEditable={false}
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {title}
              </div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {originalUrl}
              </div>
            </div>

            <a
              href={originalUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Open
            </a>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="h-[420px] w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center px-4 text-sm text-zinc-500">
                Không tạo được preview cho link này.
              </div>
            )}
          </div>
        </div>
      );
    },
  },
);
