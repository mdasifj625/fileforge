"use client";

import Link from "next/link";
import { TOOL_MENUS } from "@/config/tools";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="w-full border-b border-panel-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            File Forge
          </div>
          <div className="flex items-center gap-4 hidden md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
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
            <Link
              href="/auth"
              className="hidden md:flex ml-4 px-4 py-2 text-foreground font-bold text-sm hover:opacity-80 transition-opacity"
            >
              Log In
            </Link>
            <Link
              href="/image/compress"
              className="ml-4 px-4 py-2 bg-foreground text-background text-sm font-bold rounded-full hover:bg-foreground/90 transition-all shadow-md"
            >
              Launch App
            </Link>
          </div>
          <button
            className="md:hidden p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

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
          <Link
            href="/image/compress"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-4 p-4 bg-foreground text-background text-center rounded-xl font-bold transition-all"
          >
            Launch App
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          100% Local Browser Processing
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-8 leading-[1.1]">
          The Ultimate{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Privacy-First
          </span>{" "}
          File Workspace
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Process images, PDFs, and media directly in your browser using
          WebAssembly and WebGL. Zero server uploads. Infinite speed. Total
          privacy.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/image/compress"
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 text-lg"
          >
            Start Editing Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Tools Showcase */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Professional Tools. Zero Friction.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/image/compress"
            className="group block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Image Suite
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Compress, crop, resize, and convert images instantly in your
                browser.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            href="/pdf/merge"
            className="group block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                PDF Tools
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Merge, split, and manipulate PDF documents securely locally.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            href="/video/compress"
            className="group block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Video Tools
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Trim, compress, and convert videos locally with WASM encoding.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            href="/ai/remove-background"
            className="group block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                AI Magic
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Remove backgrounds and upscale images using client-side AI
                models.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-panel-border">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold">100% Private</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your files never leave your device. Everything is processed
              locally in your browser memory. We literally cannot see your data.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold">WASM Accelerated</h3>
            <p className="text-muted-foreground leading-relaxed">
              By leveraging WebAssembly and Web Workers, File Forge bypasses
              standard Javascript limitations for desktop-class performance.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold">Figma-like Canvas</h3>
            <p className="text-muted-foreground leading-relaxed">
              Say goodbye to clunky form-based editors. Experience a fluid,
              infinite canvas with non-destructive layers and history.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-panel-border py-12 text-center text-muted-foreground">
        <p className="text-sm">
          Built with Next.js, PixiJS, and WebAssembly. File Forge &copy;{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
