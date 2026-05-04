"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PlusCircle,
  Globe,
  User,
  Sparkles,
  LayoutGrid,
  ArrowRight,
  Layers3,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type TemplateDoc = Doc<"templates">;
type CategoryDoc = Doc<"categories_template">;

const TemplateCard = ({
  template,
  categoryName,
  onClick,
}: {
  template: TemplateDoc;
  categoryName?: string;
  onClick: () => void;
}) => {
  const updatedTime = template.updatedAt ?? template._creationTime;

  return (
    <button
      onClick={onClick}
      className="group text-left overflow-hidden rounded-3xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/15 via-background to-muted/60 p-5">
        {template.coverImage ? (
          <img
            src={template.coverImage}
            alt={template.title}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/80 shadow-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            <div className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              {template.isPublic ? "Public" : "Private"}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
            {template.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {categoryName ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                <Layers3 className="h-3.5 w-3.5" />
                {categoryName}
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
              Updated {new Date(updatedTime).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {template.content || "No description available."}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-primary/80">
            Open details
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
};

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
    <div className="aspect-[16/9] animate-pulse bg-muted/70" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted/70" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
      <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
    </div>
  </div>
);

const DocumentsPage = () => {
  const { user } = useUser();
  const router = useRouter();

  const create = useMutation(api.templates.create);
  const applyTemplate = useMutation(api.templates.applyTemplate);

  const categories = useQuery(api.categories_template.get);
  const publicTemplates = useQuery(api.templates.getPublicTemplates, {
    categoryId: undefined,
  });
  const myTemplates = useQuery(
    api.templates.getByUserId,
    user?.id ? { userId: user.id } : "skip",
  );

  const [tab, setTab] = useState<"public" | "mine">("public");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"categories_template"> | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDoc | null>(
    null,
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDoc>();
    categories?.forEach((c) => map.set(c._id, c));
    return map;
  }, [categories]);

  const filteredPublicTemplates = useQuery(
    api.templates.getPublicTemplates,
    selectedCategoryId ? { categoryId: selectedCategoryId } : {},
  );

  const onCreate = () => {
    const promise = create({ title: "Template" }).then((templateId) =>
      router.push(`/templates/${templateId}`),
    );

    toast.promise(promise, {
      loading: "Creating a new template...",
      success: "New template created!",
      error: "Failed to create template.",
    });
  };

  const activeTemplates = tab === "public" ? filteredPublicTemplates : myTemplates;
  const isLoading =
    activeTemplates === undefined ||
    (tab === "public" && categories === undefined) ||
    (tab === "mine" && user?.id && myTemplates === undefined);

  const emptyState =
    tab === "public"
      ? "No public templates found in this category."
      : "You do not have any templates yet.";

  return (
    <div className="min-h-full bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border bg-background shadow-sm">
          <div className="relative isolate px-5 py-6 sm:px-8 sm:py-8">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.10),transparent_28%)]" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Template library
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Explore public templates or manage your own
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Browse public templates by category, or switch to your
                    personal workspace to continue editing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                    <Globe className="h-4 w-4" />
                    Public marketplace
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                    <User className="h-4 w-4" />
                    My templates
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                    <LayoutGrid className="h-4 w-4" />
                    Responsive layout
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-3">
                <Button
                  onClick={onCreate}
                  size="lg"
                  className="h-12 rounded-2xl px-5 shadow-sm"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create new template
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "public" ? "default" : "outline"}
            className="rounded-2xl"
            onClick={() => setTab("public")}
          >
            <Globe className="mr-2 h-4 w-4" />
            Public
          </Button>

          <Button
            type="button"
            variant={tab === "mine" ? "default" : "outline"}
            className="rounded-2xl"
            onClick={() => setTab("mine")}
          >
            <User className="mr-2 h-4 w-4" />
            My Templates
          </Button>
        </div>

        {tab === "public" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Filter by category</h2>
                <p className="text-sm text-muted-foreground">
                  Pick one category to narrow down public templates.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() => setSelectedCategoryId(null)}
              >
                Reset
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setSelectedCategoryId(null)}
              >
                All categories
              </Button>

              {categories?.map((category) => (
                <Button
                  key={category._id}
                  type="button"
                  size="sm"
                  variant={
                    selectedCategoryId === category._id ? "default" : "outline"
                  }
                  className="shrink-0 rounded-full"
                  onClick={() => setSelectedCategoryId(category._id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {tab === "public"
                ? `${activeTemplates?.length ?? 0} public templates`
                : `${activeTemplates?.length ?? 0} templates in your workspace`}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : activeTemplates && activeTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {activeTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  categoryName={
                    template.categoryId
                      ? categoryMap.get(template.categoryId)?.name
                      : undefined
                  }
                  onClick={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-background px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{emptyState}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "public"
                  ? "Try another category or come back later."
                  : "Create a new template to start building your workspace."}
              </p>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTemplate?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {selectedTemplate?.categoryId ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                  <Layers3 className="h-3.5 w-3.5" />
                  {categoryMap.get(selectedTemplate.categoryId)?.name}
                </span>
              ) : null}

              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                {selectedTemplate?.isPublic ? "Public" : "Private"}
              </span>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {selectedTemplate?.content || "No description available."}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                if (!selectedTemplate) return;
                router.push(`/templates/${selectedTemplate._id}`);
              }}
            >
              See template detail
            </Button>

            <Button
              className="rounded-2xl"
              onClick={() => {
                if (!selectedTemplate) return;
                const promise = applyTemplate({ templateId: selectedTemplate._id }).then((documentId) => {
                  router.push(`/documents/${documentId}`);
                });
                toast.promise(promise, {
                  loading: "Creating document from template...",
                  success: "Document created from template successfully!",
                  error: "Failed to create document from template.",
                });
              }}
            >
              Apply this template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;