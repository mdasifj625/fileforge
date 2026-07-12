"use client";

import React, { useEffect } from "react";
import { WorkspaceLayout } from "./WorkspaceLayout";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

interface ToolPageLayoutProps {
  toolId: string;
  title: string;
  description: string;
  category: "image" | "pdf" | "video" | "audio" | "ai" | "convert" | "utility";
  relatedTools: { title: string; href: string }[];
  children?: React.ReactNode;
}

export function ToolPageLayout({
  toolId,
  title,
  description,
  category,
  relatedTools,
  children,
}: ToolPageLayoutProps) {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool(toolId);
  }, [toolId, setActiveTool]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Site Header */}
      <header className="h-16 border-b border-panel-border bg-background flex items-center px-6 shrink-0 sticky top-0 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
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
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          File Forge
        </Link>
        <nav className="hidden md:flex ml-10 gap-6 text-sm font-medium text-muted-foreground">
          <Link
            href="/image/compress"
            className="hover:text-foreground transition-colors"
          >
            Image Tools
          </Link>
          <Link
            href="/pdf/merge"
            className="hover:text-foreground transition-colors"
          >
            PDF Tools
          </Link>
          <Link
            href="/video/compress"
            className="hover:text-foreground transition-colors"
          >
            Video Tools
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Tool Header Section */}
        <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-20 text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 rounded-full">
            {category} Tool
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </section>

        {/* Editor Area (WorkspaceLayout provides Toolbar, Canvas, Properties, Export, etc.) */}
        <section className="w-full px-4 md:px-8 mb-24">
          <WorkspaceLayout>{children}</WorkspaceLayout>
        </section>

        {/* How it works */}
        <section className="w-full bg-panel border-y border-panel-border py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg">
                Fast, secure, and entirely in your browser.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background border border-panel-border p-6 rounded-2xl">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Upload File</h3>
                <p className="text-muted-foreground">
                  Drag and drop your files into the editor. We support all major
                  formats.
                </p>
              </div>
              <div className="bg-background border border-panel-border p-6 rounded-2xl">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Process & Edit</h3>
                <p className="text-muted-foreground">
                  Adjust settings in the right panel and see live previews
                  instantly.
                </p>
              </div>
              <div className="bg-background border border-panel-border p-6 rounded-2xl">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Export Securely</h3>
                <p className="text-muted-foreground">
                  Download the finished file. Everything happens locally so your
                  data stays private.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ & Related Tools */}
        <section className="w-full max-w-5xl mx-auto px-4 py-24 grid md:grid-cols-3 gap-16">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="border border-panel-border bg-panel p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-2">Are my files secure?</h3>
                <p className="text-muted-foreground">
                  Yes! File Forge processes your files entirely locally in your
                  web browser. We never upload your files to any external
                  servers.
                </p>
              </div>
              <div className="border border-panel-border bg-panel p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-2">
                  Is there a file size limit?
                </h3>
                <p className="text-muted-foreground">
                  Since processing happens in your browser, the limit depends on
                  your device&apos;s memory. Typically, files up to a few
                  hundred megabytes work perfectly.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-8">Related Tools</h2>
            <div className="flex flex-col gap-3">
              {relatedTools.map((rt) => (
                <Link
                  key={rt.href}
                  href={rt.href}
                  className="group flex items-center justify-between p-4 bg-panel border border-panel-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <span className="font-medium">{rt.title}</span>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-panel-border py-8 text-center text-muted-foreground text-sm mt-auto">
        <p>© 2026 File Forge. All rights reserved.</p>
      </footer>
    </div>
  );
}
