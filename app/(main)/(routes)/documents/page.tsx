"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Sparkles, 
  Search, 
  BrainCircuit, 
  Mic, 
  Calendar, 
  Users, 
  Youtube, 
  LayoutDashboard,
  MessageSquare,
  Network
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DocumentsPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const create = useMutation(api.documents.create);

  const onCreate = () => {
    const title = new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const promise = create({ title }).then((documentId) =>
      router.push(`/documents/${documentId}`),
    );

    toast.promise(promise, {
      loading: "Creating a new note....",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };
  const features = [
    {
      title: "AI Integration",
      description: "Ask AI, Summary & QA",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Smart Search",
      description: "Search across 100+ notes",
      icon: <Search className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Mindmap",
      description: "Visual your thoughts",
      icon: <Network className="h-5 w-5 text-orange-500" />,
      color: "bg-orange-500/10",
    },
    {
      title: "Voice Mode",
      description: "Speech to text",
      icon: <Mic className="h-5 w-5 text-red-500" />,
      color: "bg-red-500/10",
    },
    {
      title: "Collaborate",
      description: "Real-time editing",
      icon: <Users className="h-5 w-5 text-emerald-500" />,
      color: "bg-emerald-500/10",
    },
    {
      title: "Embed Media",
      description: "Drive, YT & Maps",
      icon: <Youtube className="h-5 w-5 text-sky-500" />,
      color: "bg-sky-500/10",
    },
  ];

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-2 bg-primary/5 rounded-full mb-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to {user?.firstName}&apos;s Notify
        </h2>
        <p className="text-muted-foreground text-lg max-w-[600px]">
          Your all-in-one workspace for notes, AI-powered insights, and seamless collaboration.
        </p>
        <div className="pt-4">
          <Button onClick={onCreate} size="lg" className="shadow-md hover:shadow-lg transition-all">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create a new note
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-x-4">
              <div className={`p-2 rounded-lg ${feature.color} transition-colors group-hover:bg-opacity-20`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Special "Floating" AI Note/Chat feature card */}
        <div className="md:col-span-2 lg:col-span-3 mt-2 flex items-center justify-between p-4 rounded-xl border border-dashed bg-muted/30">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium">Minimize Chat: Keep your notes accessible across every browser tab.</span>
            </div>
            <div className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-xs">Learn more</Button>
            </div>
        </div>
      </div>

      {/* Bottom Subtle Indicator */}
      <div className="text-xs text-muted-foreground/60 flex items-center gap-2">
        <BrainCircuit className="h-3 w-3" />
        Powered by Notify AI Engine
      </div>
    </div>
  );
};

export default DocumentsPage;