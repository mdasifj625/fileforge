"use client";

import React, { useEffect } from "react";
import { WorkspaceLayout } from "./WorkspaceLayout";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { TOOL_MENUS } from "@/config/tools";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import GoogleAd from "@/components/ads/GoogleAd";
import StickyBottomAd from "@/components/ads/StickyBottomAd";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface ToolPageLayoutProps {
  toolId: string;
  title: string;
  category: "image" | "pdf" | "video" | "audio" | "ai" | "convert" | "utility";
  relatedTools: { title: string; href: string }[];
  content?: string;
  children?: React.ReactNode;
}

export function ToolPageLayout({
  toolId,
  title,
  relatedTools,
  content,
  children,
}: ToolPageLayoutProps) {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveTool(toolId);
  }, [toolId, setActiveTool]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 border-b border-panel-border bg-background flex items-center px-6 shrink-0 sticky top-0 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="File Forge Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="hidden sm:inline-block">File Forge</span>
        </Link>

        {/* Mobile Tool Title */}
        <div className="md:hidden ml-3 pl-3 border-l border-panel-border">
          <span className="text-sm font-bold text-foreground truncate max-w-[130px] block">
            {title}
          </span>
        </div>

        <nav className="hidden md:flex ml-10 gap-6 text-sm font-medium text-muted-foreground">
          {TOOL_MENUS.map((menu) => (
            <div key={menu.title} className="relative group">
              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors py-4">
                {menu.title}{" "}
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform"
                />
              </div>
              <div className="absolute top-[100%] left-0 w-48 bg-panel border border-panel-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 z-50">
                {menu.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Right Nav (Theme & Auth) */}
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/auth"
            className="hidden md:flex text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Log In
          </Link>

          <button
            onClick={() =>
              useWorkspaceStore
                .getState()
                .setTheme(
                  useWorkspaceStore.getState().theme === "dark"
                    ? "light"
                    : "dark",
                )
            }
            className="p-2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
            title="Toggle Theme"
          >
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
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          </button>

          <button
            className="md:hidden p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background border-b border-panel-border z-40 p-4 flex flex-col gap-6 overflow-y-auto">
          {TOOL_MENUS.map((menu) => (
            <div key={menu.title} className="flex flex-col gap-2">
              <div className="font-bold text-foreground px-2">
                {menu.title} Tools
              </div>
              <div className="grid grid-cols-2 gap-2">
                {menu.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 bg-panel border border-panel-border rounded-xl font-medium text-foreground hover:border-primary transition-colors text-sm flex items-center justify-center text-center"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <section className="w-full flex-1 relative z-10 flex flex-row">
          <div className="flex-1 rounded-none ring-0 border-b border-panel-border overflow-hidden bg-background flex flex-col relative min-w-0">
            <WorkspaceLayout title={title}>{children}</WorkspaceLayout>
          </div>

          {/* Vertical Sticky Sidebar AdSense (Desktop Only) */}
          <aside className="hidden xl:flex w-[160px] 2xl:w-[300px] border-l border-panel-border bg-panel flex-col items-center py-6 px-2 2xl:px-4 shrink-0">
            <div className="sticky top-24">
              <GoogleAd
                type="skyscraper"
                format="vertical"
                className="w-[140px] 2xl:w-[268px] h-[600px] rounded-xl"
              />
            </div>
          </aside>
        </section>

        {/* Workspace Leaderboard AdSense */}
        <div className="w-full max-w-7xl mx-auto px-6 py-12">
          <GoogleAd
            type="display"
            format="horizontal"
            className="w-full h-[90px] md:h-[120px] rounded-xl"
            label="Advertisement"
          />
        </div>

        {/* How it works (Redesigned) */}
        <section className="w-full bg-panel/50 border-b border-panel-border py-32 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                How it works
              </h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                File Forge processes your files securely in your browser using
                WASM. Zero server uploads.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              <div className="bg-background border border-panel-border p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                  1. Upload File
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Drag and drop your files into the editor. Your files instantly
                  load into the browser&apos;s memory.
                </p>
              </div>
              <div className="bg-background border border-panel-border p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                  2. Process & Edit
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Adjust settings in the right panel and see live
                  hardware-accelerated previews instantly.
                </p>
              </div>
              <div className="bg-background border border-panel-border p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                  <Shield size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                  3. Export Securely
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Download the finished file directly to your device. Total
                  privacy guaranteed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        {content && (
          <section className="w-full bg-background py-24 border-y border-panel-border">
            <div className="max-w-4xl mx-auto px-6 prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover prose-strong:text-foreground">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </section>
        )}

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

              {/* AdSense In-feed (Related Tools) */}
              <div className="mt-4">
                <GoogleAd
                  type="in-feed"
                  format="rectangle"
                  className="w-full min-h-[250px] rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-panel-border py-8 text-center text-muted-foreground text-sm mt-auto">
        <p>© 2026 File Forge. All rights reserved.</p>
      </footer>

      <StickyBottomAd />
    </div>
  );
}
