"use client";

import Link from "next/link";
import Image from "next/image";
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
  Music,
  RefreshCw,
  Wrench,
  UploadCloud,
  Settings,
  Download,
  Cpu,
  WifiOff,
  Unlock,
} from "lucide-react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="w-full border-b border-panel-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm shadow-primary/20">
              <Image
                src="/logo.jpg"
                alt="File Forge Logo"
                width={32}
                height={32}
                className="object-cover"
              />
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
            href="#tools"
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 text-lg"
          >
            Start Editing Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-panel-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How File Forge Works</h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            A seamless, zero-upload workflow designed for speed and security.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -z-10"></div>
          <div className="flex flex-col items-center text-center gap-4 relative">
            <div className="w-16 h-16 bg-panel border-4 border-background text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
              <UploadCloud size={28} />
            </div>
            <h3 className="text-xl font-bold">1. Select Your File</h3>
            <p className="text-muted-foreground leading-relaxed">
              Drag and drop any image, video, audio, or PDF file directly into
              your browser. The file is loaded entirely into local memory.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-4 relative">
            <div className="w-16 h-16 bg-panel border-4 border-background text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
              <Settings size={28} />
            </div>
            <h3 className="text-xl font-bold">2. Process Locally</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our WebAssembly engine and client-side AI models process your data
              using your own CPU and GPU. No data is sent over the network.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-4 relative">
            <div className="w-16 h-16 bg-panel border-4 border-background text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
              <Download size={28} />
            </div>
            <h3 className="text-xl font-bold">3. Instant Export</h3>
            <p className="text-muted-foreground leading-relaxed">
              Download your converted, compressed, or edited files instantly.
              Everything is rendered immediately without waiting in a server
              queue.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Showcase */}
      <section id="tools" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Professional Tools. Zero Friction.
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          <Link
            href="/image/compress"
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
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
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
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
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
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
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
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

          <Link
            href="/audio/compress"
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Music size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Audio Suite
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Compress, trim, and convert audio formats without losing
                quality.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            href="/convert/image-to-pdf"
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Format Converters
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Convert between formats instantly. Image to PDF, MP4 to GIF, and
                more.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Explore <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            href="/utility/qr-generator"
            className="group w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] block p-1 rounded-2xl bg-gradient-to-b from-panel-border to-transparent hover:from-primary/50 transition-all"
          >
            <div className="bg-panel h-full rounded-xl p-6 flex flex-col items-start border border-transparent group-hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-xl flex items-center justify-center mb-6">
                <Wrench size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Utility Belt
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Generate QR codes, extract EXIF data, and other essential tools.
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold">Absolute Privacy</h3>
            <p className="text-muted-foreground leading-relaxed">
              Zero server uploads. Your files are processed entirely within your
              device&apos;s local memory sandbox, ensuring total data security
              and confidentiality.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold">WebAssembly Powered</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bypass traditional browser limits. We utilize compiled WASM
              binaries to deliver desktop-grade computational performance for
              heavy media tasks.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold">Infinite Canvas Editor</h3>
            <p className="text-muted-foreground leading-relaxed">
              Move beyond rigid form inputs. Edit on a fluid, infinite visual
              workspace that supports non-destructive layering and real-time
              previews.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold">Hardware Acceleration</h3>
            <p className="text-muted-foreground leading-relaxed">
              Utilize WebGL and your device&apos;s native GPU for blazing-fast
              image rendering and complex AI model execution directly in the
              browser.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
              <WifiOff size={24} />
            </div>
            <h3 className="text-xl font-bold">Offline Capable</h3>
            <p className="text-muted-foreground leading-relaxed">
              Install as a Progressive Web App (PWA). Once loaded, the core
              engine is cached, allowing you to process files without an
              internet connection.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <Unlock size={24} />
            </div>
            <h3 className="text-xl font-bold">No File Limits</h3>
            <p className="text-muted-foreground leading-relaxed">
              Because files are processed locally, you are completely free from
              arbitrary server-side upload caps. Process files as large as your
              device&apos;s RAM allows.
            </p>
          </div>
        </div>
      </section>
      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-panel-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Who is File Forge For?</h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            From quick edits to professional workflows, our local-first
            architecture scales to meet your needs without compromising privacy.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 bg-panel border border-panel-border rounded-3xl transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <h3 className="text-2xl font-bold mb-4">Designers & Creators</h3>
            <p className="text-muted-foreground mb-6">
              Instantly remove backgrounds, convert formats, and compress assets
              for web deployment. The infinite PixiJS canvas gives you a
              familiar workspace without the bloat of heavy design apps.
            </p>
            <ul className="space-y-3 text-sm text-foreground/80 font-medium">
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> Client-side AI
                masking
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> Batch image
                compression
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> WebP & AVIF
                conversion
              </li>
            </ul>
          </div>
          <div className="p-8 bg-panel border border-panel-border rounded-3xl transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <h3 className="text-2xl font-bold mb-4">Privacy Professionals</h3>
            <p className="text-muted-foreground mb-6">
              Working with sensitive legal, medical, or financial documents?
              Never upload them to a remote server again. Every single byte is
              processed securely within your browser sandbox.
            </p>
            <ul className="space-y-3 text-sm text-foreground/80 font-medium">
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> Merge & split
                PDFs locally
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> Redact
                sensitive information
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" />{" "}
                Offline-capable operations
              </li>
            </ul>
          </div>
          <div className="p-8 bg-panel border border-panel-border rounded-3xl transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <h3 className="text-2xl font-bold mb-4">Video Editors</h3>
            <p className="text-muted-foreground mb-6">
              Cut, trim, and compress raw video files quickly before sharing
              them online. File Forge uses ffmpeg.wasm to encode massive files
              right on your GPU, saving you hours of upload time.
            </p>
            <ul className="space-y-3 text-sm text-foreground/80 font-medium">
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> WASM
                accelerated encoding
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> MP4 to GIF
                creation
              </li>
              <li className="flex items-center gap-3">
                <ArrowRight size={16} className="text-primary" /> Audio track
                extraction
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Comprehensive SEO Content Section */}
      <section className="bg-panel border-y border-panel-border py-24">
        <div className="max-w-4xl mx-auto px-6 prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary">
          <h2 className="text-3xl font-bold text-center mb-12">
            The Next Generation of Browser-Based Processing
          </h2>
          <p>
            Welcome to <strong>File Forge</strong>, the ultimate privacy-first
            workspace. Unlike traditional online converters that upload your
            sensitive documents to remote servers, File Forge operates entirely
            within your web browser. By leveraging powerful web technologies
            like WebAssembly (WASM) and WebGL, we bring desktop-class computing
            power directly to your fingertips.
          </p>
          <h3>How Local Processing Changes Everything</h3>
          <p>
            When you use a traditional file converter, your file is uploaded
            over your internet connection, placed into a remote server queue,
            processed, and then downloaded back to you. This wastes bandwidth,
            costs time, and exposes your private data to third-party data
            breaches. File Forge flips this paradigm. By executing complex
            algorithms directly within your browser&apos;s memory sandbox, your
            files never traverse the network. Your data remains strictly on your
            device.
          </p>
          <h3>Local AI Background Removal</h3>
          <p>
            Need to remove a background from an image? Instead of relying on
            expensive cloud APIs, File Forge downloads the state-of-the-art{" "}
            <em>BEN2 ONNX</em> neural network into your browser&apos;s local
            cache. It processes your images instantly using your own GPU,
            allowing for real-time edge feathering and mask painting without any
            subscription fees or usage limits.
          </p>
          <h3>Client-Side Video & Audio Processing</h3>
          <p>
            Thanks to <code>ffmpeg.wasm</code>, you can trim, convert, and
            compress video files securely. Whether you are generating a GIF from
            an MP4 or extracting an audio track, the WASM engine handles it
            efficiently. Since the files never leave your device, you save
            bandwidth and protect your privacy simultaneously. It&apos;s the
            perfect tool for creators, professionals, and anyone who values data
            security.
          </p>
          <h3>The PixiJS Infinite Canvas</h3>
          <p>
            We don&apos;t just convert files; we let you edit them. The core of
            File Forge is built on top of PixiJS, a blazing fast WebGL 2D
            rendering engine. This provides an infinite, Figma-like canvas where
            you can drag, drop, rotate, and layer your files non-destructively
            before finally rendering your export.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="border border-panel-border bg-panel p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">
              Is File Forge really free?
            </h3>
            <p className="text-muted-foreground">
              Yes. Because we process files using your device&apos;s hardware
              (CPU and GPU) rather than paying for expensive cloud servers, we
              can offer professional-grade tools without the typical
              subscription costs or arbitrary usage limits.
            </p>
          </div>
          <div className="border border-panel-border bg-panel p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">
              Can I use File Forge completely offline?
            </h3>
            <p className="text-muted-foreground">
              Yes! File Forge functions as a Progressive Web App (PWA). Once you
              load the site for the first time, all the necessary WebAssembly
              binaries and AI models are cached in your browser. You can
              disconnect from the internet and continue editing securely.
            </p>
          </div>
          <div className="border border-panel-border bg-panel p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">
              What file formats are supported?
            </h3>
            <p className="text-muted-foreground">
              We support virtually all modern formats. For images: JPG, PNG,
              WebP, AVIF, and SVG. For video: MP4, WebM, MOV, and GIF. For
              audio: MP3, WAV, and AAC. For documents: standard PDF
              manipulation.
            </p>
          </div>
          <div className="border border-panel-border bg-panel p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">
              Do you store any of my data?
            </h3>
            <p className="text-muted-foreground">
              No. We have no servers to store your files. Your files exist only
              in your browser&apos;s local memory (RAM) while you are editing
              them, and are cleared the moment you close the tab.
            </p>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Ready to Drop the Cloud?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-primary-foreground/90 font-medium">
            Join the revolution of zero-upload, local-first file processing.
          </p>
          <Link
            href="#tools"
            className="inline-flex items-center gap-3 px-10 py-5 bg-background text-foreground font-bold rounded-2xl hover:bg-background/90 hover:scale-105 transition-all shadow-2xl text-lg"
          >
            Start Editing Now <ArrowRight size={24} />
          </Link>
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
