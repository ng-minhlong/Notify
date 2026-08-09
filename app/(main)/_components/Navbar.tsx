"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import {
  FileText,
  GitBranch,
  Info,
  MoreHorizontal,
  Star,
  PanelLeft
} from "lucide-react";

import { Title } from "./Title";
import { Banner } from "./Banner";
import { Menu } from "./Menu";
import { Collaborative } from "./Collaboration";

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = ({
  isCollapsed,
  onResetWidth,
}: NavbarProps) => {
  const params = useParams();

  const document = useQuery(api.documents.getById, {
    documentId: params.documentId as Id<"documents">,
  });

  if (document === undefined) {
    return (
      <nav className="flex h-[54px] w-full items-center gap-x-2 border-b bg-background px-3">
        <Title.Skeleton />
        <Menu.Skeleton />
      </nav>
    );
  }

  if (document === null) {
    return null;
  }

  return (
    <>
      <nav className="flex h-[54px] w-full items-center border-b bg-background px-3">
        {/* LEFT */}
        <div className="flex min-w-0 flex-1 items-center">
          {/* Sidebar / reset width */}
          {isCollapsed && (
            <button
              onClick={onResetWidth}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MenuIcon />
            </button>
          )}

          {/* Document icon */}
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Page"
          >
            <FileText className="h-[18px] w-[18px]" />
          </button>

          {/* Collaboration icon */}
          <button
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Collaboration"
          >
            <GitBranch className="h-[17px] w-[17px]" />
          </button>

          {/* Title */}
          <div className="ml-2 min-w-0">
            <Title initialData={document} />
          </div>

          {/* Star */}
          <button
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Add to favorites"
          >
            <Star className="h-[17px] w-[17px]" />
          </button>

          {/* Info */}
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Page information"
          >
            <Info className="h-[17px] w-[17px]" />
          </button>

          {/* More */}
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="More"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-x-2">
          <Collaborative initialData={document} />

          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Toggle panel"
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
        </div>
      </nav>

      {document.isArchived && (
        <Banner documentId={document._id} />
      )}
    </>
  );
};

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="m13 9 2 3-2 3" />
    </svg>
  );
}