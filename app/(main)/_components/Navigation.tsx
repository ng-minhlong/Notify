"use client";

import React, { ComponentRef, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useMutation,useQuery  } from "convex/react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { DocumentList } from "./DocumentList";
import { Item } from "./Item";
import { UserItem } from "./UserItem";

import { toast } from "sonner";
import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Calendar,
  Trash,
  Hammer,
  LayoutPanelTop,
  ChartNoAxesColumnIncreasing 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrashBox } from "./TrashBox";
import { useSearch } from "@/hooks/useSearch";
import { useSettings } from "@/hooks/useSettingsModal";
import { useCalendar } from "@/hooks/useCalendarModal";
import { useUpgrade } from "@/hooks/useUpgradeModal";
import { useTools } from "@/hooks/useToolsModal";
import { useTemplates } from "@/hooks/useTemplatesModal";
import { Navbar } from "./Navbar";
import { ScrollableList } from "@/components/scrollable-list";
import { FavoritesList } from "./FavoritesList";
import { ActionTooltip } from "@/components/action-tooltip";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useCalendarNoteCount } from "@/hooks/useCalendarNoteCount";
import { Info } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/limit";


const Navigation = () => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const search = useSearch();
  const settings = useSettings();
  const calendar = useCalendar();
  const upgrade = useUpgrade();
  const tools = useTools();
  const templates = useTemplates();
  const calendarNoteCount = useCalendarNoteCount();

  const { focusMode } = useFocusMode();

  const create = useMutation(api.documents.create);
  const userPlan = useQuery(api.userPlan.getUserPlan);
  const userUsage = useQuery(api.userUsage.getUserUsage);

  const getOrCreateUserPlan = useMutation(api.userPlan.getOrCreateUserPlan);
  const getOrCreateUserUsage = useMutation(api.userUsage.getOrCreateUserUsage);

  const planInitRef = useRef(false);
  const usageInitRef = useRef(false);

  useEffect(() => {
    if (userPlan === null && !planInitRef.current) {
      planInitRef.current = true;
      getOrCreateUserPlan();
    }
  }, [userPlan, getOrCreateUserPlan]);

  useEffect(() => {
    if (userUsage === null && !usageInitRef.current) {
      usageInitRef.current = true;
      getOrCreateUserUsage();
    }
  }, [userUsage, getOrCreateUserUsage]);

  const isResizingRef = useRef(false);
  const sidebarRef = useRef<ComponentRef<"aside">>(null);
  const navbarRef = useRef<ComponentRef<"div">>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  
  
  const getLimitPlanName = (plan?: string) => {
    switch (plan) {
      case "starter":
        return "Starter";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const planKey = getLimitPlanName(userPlan?.plan) as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planKey];

  const storageUsed = userUsage?.storageUsed ?? 0;
  const storageLimit = limits.storageBytes;
  const storagePercent =
    storageLimit > 0 ? Math.min(100, (storageUsed / storageLimit) * 100) : 0;

  const aiRows = [
    {
      label: "Hourly",
      used: userUsage?.aiHourlyUsed ?? 0,
      limit: limits.aiCreditsPerHour,
    },
    {
      label: "Daily",
      used: userUsage?.aiDailyUsed ?? 0,
      limit: limits.aiCreditsPerDay,
    },
    {
      label: "Weekly",
      used: userUsage?.aiWeeklyUsed ?? 0,
      limit: limits.aiCreditsPerWeek,
    },
    {
      label: "Monthly",
      used: userUsage?.aiMonthlyUsed ?? 0,
      limit: limits.aiCreditsPerMonth,
    },
  ];

  useEffect(() => {
    if (isMobile) {
      collapse();
    } else {
      resetWidth();
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      collapse();
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    if (focusMode && params.documentId && !isMobile) {
      collapse();
    } else {
      resetWidth();
    }
  }, [params.documentId, focusMode, isMobile]);

  useEffect(() => {
    if (!navbarRef.current) return;

    if (
      focusMode &&
      params.documentId &&
      !isNavbarHovered &&
      isCollapsed &&
      !isMobile
    ) {
      navbarRef.current.style.setProperty("opacity", "0");
    } else {
      navbarRef.current.style.removeProperty("opacity");
    }
  }, [focusMode, params.documentId, isMobile, isNavbarHovered, isCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        isCollapsed ? resetWidth() : collapse();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    let newWidth = e.clientX;

    if (newWidth < 240) newWidth = 240;
    if (newWidth > 480) newWidth = 480;

    if (sidebarRef.current && navbarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      navbarRef.current.style.setProperty("left", `${newWidth}px`);
      navbarRef.current.style.setProperty(
        "width",
        `calc(100% - ${newWidth}px)`,
      );
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const resetWidth = () => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false);
      setIsResetting(true);

      sidebarRef.current.style.width = isMobile ? "100%" : "240px";
      navbarRef.current.style.removeProperty("width");
      navbarRef.current.style.setProperty(
        "width",
        isMobile ? "0" : "calc(100%-240px)",
      );
      navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");
      setTimeout(() => setIsResetting(false), 300);
    }
  };

  const collapse = () => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(true);
      setIsResetting(true);

      sidebarRef.current.style.width = "0";
      navbarRef.current.style.setProperty("width", "100%");
      navbarRef.current.style.setProperty("left", "0");
      setTimeout(() => setIsResetting(false), 300);
    }
  };

  const handleCreate = () => {
    const promise = create({ title: "Untitled" }).then((documentId) =>
      router.push(`/documents/${documentId}`),
    );

    toast.promise(promise, {
      loading: "Creating a new note....",
      success: "New note created.",
      error: "Failed to create a note.",
    });
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar bg-secondary relative z-300 flex h-full w-60 flex-col overflow-hidden overflow-x-hidden pb-4",
          isResetting && "transition-all duration-300 ease-in-out",
          isMobile && "w-0",
        )}
      >
        <ActionTooltip label="Close sidebar (Ctrl + \)">
          <div
            onClick={collapse}
            role="button"
            className={cn(
              "text-muted-foreground absolute top-3 right-2 h-6 w-6 rounded-sm opacity-0 transition group-hover/sidebar:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-600",
              isMobile && "opacity-100",
            )}
          >
            <ChevronsLeft className="h-6 w-6" />
          </div>
        </ActionTooltip>
        <div>
          <UserItem />
          <Item
            label="Search"
            icon={Search}
            onClick={search.onOpen}
            shortcut="Ctrl + K"
          />
          <Item label="Settings" icon={Settings} onClick={settings.onOpen} />
          <Item label="Calendar" icon={Calendar} onClick={calendar.onOpen} />
          <Item label="New page" onClick={handleCreate} icon={PlusCircle} />
          <Item label="Upgrade" icon={ChartNoAxesColumnIncreasing } onClick={upgrade.onOpen} />
          <Item label="More Tools" icon={Hammer } onClick={tools.onOpen} />
          <Item
            label="Template"
            icon={LayoutPanelTop}
            onClick={() => router.push("/templates")}
          />
        </div>
        <div className="mt-4">
          <div>
            <ScrollableList>
              <FavoritesList />
              <div>
                <p className="text-muted-foreground/60 px-3 py-1 text-xs font-medium">
                  Notes
                </p>
                <DocumentList />
              </div>
            </ScrollableList>
          </div>
          <Item onClick={handleCreate} icon={Plus} label="Add a page" />
          <Popover>
            <PopoverTrigger className="mt-3 w-full">
              <Item label="Trash" icon={Trash} />
            </PopoverTrigger>
            <PopoverContent
              side={isMobile ? "bottom" : "right"}
              className="w-72 p-0"
              collisionPadding={16}
            >
              <TrashBox />
            </PopoverContent>
          </Popover>
        </div>
        <div
          onMouseDown={handleMouseDown}
          onClick={resetWidth}
          className="bg-primary/10 absolute top-0 right-0 h-full w-1 cursor-ew-resize opacity-0 transition group-hover/sidebar:opacity-100"
        ></div>
        <div className="mt-auto px-3 pt-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    userPlan?.plan === "pro"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : userPlan?.plan === "starter"
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {userPlan?.plan === "pro"
                    ? "Pro"
                    : userPlan?.plan === "starter"
                    ? "Starter"
                    : "Free"}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-none">
                    Storage usage
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-medium tabular-nums">
                  {storagePercent.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-xs transition hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    AI limits
                  </span>
                  
                </button>
              </PopoverTrigger>

              <PopoverContent
                side={isMobile ? "top" : "right"}
                align="start"
                className="w-80 rounded-2xl border-border/60 p-3 shadow-lg"
                collisionPadding={16}
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">AI usage</p>
                    <p className="text-xs text-muted-foreground">
                      Reset tự động theo từng khung thời gian.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {aiRows.map((row) => {
                      const percent =
                        row.limit > 0 ? Math.min(100, (row.used / row.limit) * 100) : 0;

                      return (
                        <div key={row.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{row.label}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {row.used} / {row.limit}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </aside>
      <div
        ref={navbarRef}
        onMouseEnter={() => setIsNavbarHovered(true)}
        onMouseLeave={() => setIsNavbarHovered(false)}
        className={cn(
          "absolute top-0 left-60 z-40 w-[calc(100%-240px)] transition-all duration-300",
          isResetting && "transition-all duration-300 ease-in-out",
          isMobile && "left-0 w-full",
        )}
      >
        {!!params.documentId ? (
          (!isMobile || isCollapsed) && (
            <Navbar isCollapsed={isCollapsed} onResetWidth={resetWidth} />
          )
        ) : (
          <nav
            className={cn(
              "w-full bg-transparent px-3 py-2",
              !isCollapsed && "p-0",
            )}
          >
            {isCollapsed && (
              <ActionTooltip label="Open sidebar (Ctrl + \)">
                <button onClick={resetWidth}>
                  <MenuIcon className="text-muted-foreground h-6 w-6" />
                </button>
              </ActionTooltip>
            )}
          </nav>
        )}
        
      </div>
    </>
  );
};
export default Navigation;
