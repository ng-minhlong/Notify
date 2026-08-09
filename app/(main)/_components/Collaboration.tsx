"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { useOrigin } from "@/hooks/useOrigin";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
    Check,
    Copy,
    FilePenLine,
    Globe,
    Lock,
} from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

interface CollaborativeProps {
    initialData: Doc<"documents">;
}

type AccessMode = "private" | "view" | "edit";

export const Collaborative = ({
    initialData,
}: CollaborativeProps) => {
    const origin = useOrigin();
    const update = useMutation(api.documents.update);
    const { user } = useUser();

    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] =
        useState<"share" | "export">("share");

    const url = `${origin}/documents/${initialData._id}`;

    /**
     * false + false = Private
     * true  + false = Public / View Only
     * true  + true  = Public / Editable
     */
    const currentMode: AccessMode =
        !initialData.isPublished
            ? "private"
            : initialData.isCollaborative
                ? "edit"
                : "view";

    const modeConfig = {
        private: {
            label: "Private",
            description: "Only you can access this note.",
            icon: Lock,
        },
        view: {
            label: "Public — View Only",
            description: "Anyone with the link can view this note.",
            icon: Globe,
        },
        edit: {
            label: "Public — Editable",
            description:
                "Anyone with the link can view and edit this note.",
            icon: FilePenLine,
        },
    };

    const CurrentIcon = modeConfig[currentMode].icon;

    const changeAccessMode = (mode: AccessMode) => {
        if (mode === currentMode) {
            return;
        }

        setIsSubmitting(true);

        let promise;

        if (mode === "private") {
            promise = update({
                id: initialData._id,
                isPublished: false,
                isCollaborative: false,
            });
        } else if (mode === "view") {
            promise = update({
                id: initialData._id,
                isPublished: true,
                isCollaborative: false,
            });
        } else {
            promise = update({
                id: initialData._id,
                isPublished: true,
                isCollaborative: true,
            });
        }

        toast.promise(promise, {
            loading: "Updating access...",
            success:
                mode === "private"
                    ? "Note is now private."
                    : mode === "view"
                        ? "Note is now publicly available."
                        : "Note is now publicly editable.",
            error: "Failed to update access.",
        });

        promise.finally(() => {
            setIsSubmitting(false);
        });
    };

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch {
            toast.error("Failed to copy link.");
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="
                        inline-flex h-9 items-center gap-2
                        rounded-md
                        bg-[#0ea5e9]
                        px-3
                        text-sm
                        font-medium
                        text-white
                        shadow-sm
                        transition-colors
                        hover:bg-[#0284c7]
                    "
                >
                    {/* CURRENT ACCESS ICON */}
                    <CurrentIcon className="h-4 w-4" />

                    {/* ALWAYS SHARE */}
                    <span>Share</span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[420px] rounded-xl border p-0 shadow-xl"
            >
                {/* =========================
                    TABS
                ========================== */}
                <div className="flex h-12 items-end border-b px-4">
                    <button
                        onClick={() => setActiveTab("share")}
                        className={`
                            relative h-full px-1 text-sm font-medium
                            ${activeTab === "share"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                        `}
                    >
                        Share

                        {activeTab === "share" && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("export")}
                        className={`
                            relative ml-5 h-full px-1 text-sm font-medium
                            ${activeTab === "export"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                        `}
                    >
                        Export

                        {activeTab === "export" && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500" />
                        )}
                    </button>
                </div>

                {activeTab === "share" ? (
                    <div className="p-4">

                        {/* =========================
                            INVITE
                        ========================== */}
                        <input
                            placeholder="Invite other members"
                            className="
                                h-10 w-full
                                rounded-md
                                border
                                bg-background
                                px-3
                                text-sm
                                outline-none
                                placeholder:text-muted-foreground
                                focus:border-sky-500
                                focus:ring-1
                                focus:ring-sky-500
                            "
                        />

                        {/* =========================
                            OWNER
                        ========================== */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user?.imageUrl}
                                    />
                                </Avatar>

                                <span className="text-sm font-medium">
                                    {user?.fullName}
                                </span>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                Owner
                            </span>
                        </div>

                        {/* =========================
                            MAKE PUBLIC
                        ========================== */}
                        <div className="mt-6">
                            <p className="mb-3 text-sm font-medium">
                                Make Public
                            </p>

                            <div className="rounded-lg border p-1">

                                {/* PRIVATE */}
                                <AccessOption
                                    icon={Lock}
                                    label="Private"
                                    description="Only you can access this note."
                                    active={
                                        currentMode === "private"
                                    }
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        changeAccessMode("private")
                                    }
                                />

                                {/* PUBLIC VIEW */}
                                <AccessOption
                                    icon={Globe}
                                    label="Public — View Only"
                                    description="Anyone with the link can view this note."
                                    active={
                                        currentMode === "view"
                                    }
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        changeAccessMode("view")
                                    }
                                />

                                {/* PUBLIC EDIT */}
                                <AccessOption
                                    icon={FilePenLine}
                                    label="Public — Editable"
                                    description="Anyone with the link can view and edit this note."
                                    active={
                                        currentMode === "edit"
                                    }
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        changeAccessMode("edit")
                                    }
                                />
                            </div>
                        </div>

                        {/* =========================
                            COPY LINK
                        ========================== */}
                        {currentMode !== "private" && (
                            <button
                                onClick={onCopy}
                                className="
                                    mt-4
                                    flex h-9 w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-md
                                    bg-[#0ea5e9]
                                    text-sm
                                    font-medium
                                    text-white
                                    transition-colors
                                    hover:bg-[#0284c7]
                                "
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy Link
                                        <span className="ml-1 text-xs opacity-70">
                                            Ctrl + Shift + C
                                        </span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    /* EXPORT */
                    <div className="p-4">
                        <button
                            className="
                                flex w-full items-center gap-3
                                rounded-md px-3 py-3
                                text-left
                                hover:bg-muted
                            "
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                                <Copy className="h-4 w-4" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    Export page
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    Export this page to a file
                                </p>
                            </div>
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};


/* =========================================
   ACCESS OPTION
========================================= */

interface AccessOptionProps {
    icon: React.ElementType;
    label: string;
    description: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
}

const AccessOption = ({
    icon: Icon,
    label,
    description,
    active,
    disabled,
    onClick,
}: AccessOptionProps) => {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`
                flex w-full items-center
                justify-between
                rounded-md
                px-3 py-3
                text-left
                transition-colors
                ${active
                    ? "bg-muted"
                    : "hover:bg-muted/70"
                }
                disabled:pointer-events-none
                disabled:opacity-50
            `}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`
                        flex h-9 w-9
                        items-center justify-center
                        rounded-md
                        ${active
                            ? "bg-background"
                            : "bg-muted"
                        }
                    `}
                >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                    <p className="text-sm font-medium">
                        {label}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>

            {active && (
                <Check className="h-4 w-4 shrink-0 text-sky-500" />
            )}
        </button>
    );
};