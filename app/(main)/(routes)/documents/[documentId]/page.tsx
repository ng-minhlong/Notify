"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { NavToolbar } from "@/components/navtoolbar";
import { MinimizeWindowProvider } from "@/components/minimize-window/MinimizeWindowContext";
import { MinimizeWindowAutoCloser } from "@/components/minimize-window/MinimizeWindowAutoCloser";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { BlockNoteEditor } from "@blocknote/core";
import { TableOfContents } from "@/components/table-of-contents";
import { useEditorFont } from "@/hooks/useEditorFont";

interface DocumentIdPageProps {
  params: Promise<{
    documentId: Id<"documents">;
  }>;
}






const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const { resolvedTheme } = useTheme();

  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  // Hàm lấy text editor cho minimize window
  const getEditorText = () => {
    const blocks = document.querySelectorAll('[data-node-type="blockOuter"]');
    return Array.from(blocks).map(b => b.textContent.trim()).filter(Boolean).join("\n");
  };


  const doc = useQuery(api.documents.getById, {
    documentId: documentId,
  });

  const { editorFont, isFontLoading } = useEditorFont({ enabled: true });

  const update = useMutation(api.documents.update);

  useEffect(() => {
    if (!doc) return;

    const defaultFavicon =
      resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

    window.document.title = `${doc.title || "Untitled"} | Notify`;

    const link = window.document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement;
    if (link) {
      link.href = doc.icon
        ? `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='100'>${doc.icon}</text></svg>`
        : defaultFavicon;
    }

    return () => {
      window.document.title = "Notify";
      if (link) link.href = defaultFavicon;
    };
  }, [doc, resolvedTheme, documentId]);

  useEffect(() => {
    if (!doc) return;
    if (doc.editorFont === editorFont) return;

    update({
      id: documentId,
      editorFont,
    });
  }, [doc, editorFont, documentId, update]);

  const activeFont = doc?.editorFont ?? editorFont;

  const onChange = (content: string) => {
    update({
      id: documentId,
      content,
    });
  };

  if (doc === undefined || isFontLoading) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pt-4 pl-8">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (doc === null) {
    return <div>Not found</div>;
  }

  return (
    <MinimizeWindowProvider>
      <MinimizeWindowAutoCloser getEditorText={getEditorText} documentId={documentId} />
      <div className="pb-35">
        <Cover url={doc.coverImage} />
        <div className="relative mx-auto md:w-[90%]">
          <NavToolbar />
          <p>Created At: {new Date(doc._creationTime).toLocaleString()}</p>
          <p>Last Update At: {new Date(doc.updatedAt || "").toLocaleString()}</p>
          <Toolbar initialData={doc} editorFont={activeFont} />
          <Editor
            onChange={onChange}
            initialContent={doc.content}
            onEditorReady={setEditor}
            editorFont={activeFont}
          />
          <TableOfContents editor={editor} />
        </div>
      </div>
    </MinimizeWindowProvider>
  );
};
export default DocumentIdPage;
