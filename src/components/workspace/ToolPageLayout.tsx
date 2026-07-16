"use client";

import React, { useEffect } from "react";
import { WorkspaceLayout } from "./WorkspaceLayout";
import { useToolStore } from "@/store/useToolStore";
import { TOOL_MENUS } from "@/config/tools";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import GoogleAd from "@/components/ads/GoogleAd";
import StickyBottomAd from "@/components/ads/StickyBottomAd";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

interface ToolPageLayoutProps {
  toolId: string;
  title: string;
  category: "image" | "pdf" | "video" | "audio" | "ai" | "convert" | "utility";
  relatedTools?: { title: string; href: string }[];
  content?: string;
  children?: React.ReactNode;
}

export function ToolPageLayout({
  toolId,
  title,
  category,
  relatedTools,
  content,
  children,
}: ToolPageLayoutProps) {
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  useEffect(() => {
    setActiveTool(toolId);
  }, [toolId, setActiveTool]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

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
        <section className="order-4 md:order-3 w-full bg-panel/50 border-b border-panel-border py-32 backdrop-blur-sm">
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
          <section className="order-5 md:order-4 w-full bg-background py-24 border-y border-panel-border">
            <div className="max-w-4xl mx-auto px-6 prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover prose-strong:text-foreground">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* FAQ & Related Tools */}
        <section className="order-3 md:order-5 w-full max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-16">
          <div className="md:col-span-2 order-last md:order-first">
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
                  hundred megabytes work perfectly, meaning you can process
                  large media without worrying about arbitrary upload caps.
                </p>
              </div>
              <div className="border border-panel-border bg-panel p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-2">
                  Can I use this offline?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. File Forge is designed as a Progressive Web App
                  (PWA). Once loaded, all necessary processing engines are
                  cached on your device, allowing you to use the tool without an
                  internet connection.
                </p>
              </div>
              <div className="border border-panel-border bg-panel p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-2">
                  Does it degrade quality?
                </h3>
                <p className="text-muted-foreground">
                  No, unless you explicitly choose to compress the file. We use
                  high-fidelity, desktop-grade algorithms inside WebAssembly,
                  ensuring that conversions and edits maintain maximum quality.
                </p>
              </div>
            </div>
          </div>

          <div className="order-first md:order-last">
            <h2 className="text-2xl font-bold mb-8">Related Tools</h2>
            <div className="flex flex-col gap-3">
              {(
                relatedTools ||
                TOOL_MENUS.find((m) => m.title.toLowerCase() === category)
                  ?.items.filter(
                    (tool) => tool.href !== `/${category}/${toolId}`,
                  )
                  .map((rt) => ({ title: rt.name, href: rt.href })) ||
                []
              ).map((rt) => (
                <Link
                  key={rt.href}
                  href={rt.href}
                  className="group flex items-center justify-between p-4 bg-panel border border-panel-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <span className="font-medium text-sm">{rt.title}</span>
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

      <Footer />

      <StickyBottomAd />
    </div>
  );
}
