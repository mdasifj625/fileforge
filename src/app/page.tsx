"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GoogleAd from "@/components/ads/GoogleAd";
import StickyBottomAd from "@/components/ads/StickyBottomAd";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Image as ImageIcon,
  FileText,
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
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-20">
        {/* Subtle Background */}
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 w-full flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-sm font-semibold text-primary tracking-wide">
              100% Local Browser Processing
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-[1.1]">
            Edit Everything. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Upload Nothing.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Process images, PDFs, and media directly in your browser using
            WebAssembly and WebGL. Zero servers. Infinite speed. Absolute
            privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Link
              href="#tools"
              className="px-8 py-4 w-full sm:w-auto bg-primary text-primary-foreground font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all flex justify-center items-center gap-2 text-lg"
            >
              Start Editing Free <ArrowRight size={20} />
            </Link>
            <a
              href="https://github.com/file-forge"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 w-full sm:w-auto bg-panel border border-panel-border text-foreground font-bold rounded-2xl hover:bg-muted hover:scale-105 transition-all shadow-sm flex justify-center items-center gap-2 text-lg"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <GoogleAd
          type="display"
          format="horizontal"
          className="w-full h-[100px] md:h-[120px] rounded-2xl"
        />
      </div>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            How File Forge Works
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            A seamless, zero-upload workflow designed for speed and absolute
            security.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-panel-border to-transparent -z-10"></div>

          <div className="flex flex-col items-center text-center gap-6 relative group">
            <div className="w-20 h-20 bg-background border border-panel-border text-primary rounded-[2rem] flex items-center justify-center shadow-lg group-hover:shadow-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-110">
              <UploadCloud size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">1. Select Your File</h3>
              <p className="text-muted-foreground leading-relaxed px-4">
                Drag and drop any image, video, audio, or PDF. The file is
                loaded entirely into local browser memory.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-6 relative group">
            <div className="w-20 h-20 bg-background border border-panel-border text-primary rounded-[2rem] flex items-center justify-center shadow-lg group-hover:shadow-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-110">
              <Settings size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">2. Process Locally</h3>
              <p className="text-muted-foreground leading-relaxed px-4">
                Our WebAssembly engine and client-side AI process your data
                using your own CPU and GPU.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-6 relative group">
            <div className="w-20 h-20 bg-background border border-panel-border text-primary rounded-[2rem] flex items-center justify-center shadow-lg group-hover:shadow-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-110">
              <Download size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">3. Instant Export</h3>
              <p className="text-muted-foreground leading-relaxed px-4">
                Download your edited files instantly. Everything renders
                immediately without waiting in a server queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Showcase */}
      <section
        id="tools"
        className="w-full bg-panel/30 border-y border-panel-border py-24 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Professional Tools. Zero Friction.
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Everything you need to edit your files locally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Link
              href="/image/compress"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ImageIcon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                Image Suite
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Compress, crop, resize, and convert images instantly in your
                browser.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/pdf/merge"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                PDF Tools
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Merge, split, and manipulate PDF documents securely locally.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/video/compress"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  width="28"
                  height="28"
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
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                Video Tools
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Trim, compress, and convert videos locally with WASM encoding.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/image/remove-background"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                AI Magic
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Remove backgrounds and upscale images using client-side AI
                models.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/audio/compress"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Music size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                Audio Suite
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Compress, trim, and convert audio formats without losing
                quality.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/convert/image-to-pdf"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                Format Converters
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Convert between formats instantly. Image to PDF, MP4 to GIF, and
                more.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/utility/qr-generator"
              className="group flex flex-col h-full bg-background border border-panel-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wrench size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">
                Utility Belt
              </h3>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed flex-1">
                Generate QR codes, extract EXIF data, and other essential tools.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight size={16} />
              </span>
            </Link>

            {/* AdSense In-feed (Rectangle) */}
            <div className="flex flex-col h-full bg-background border border-panel-border rounded-3xl overflow-hidden">
              <GoogleAd
                type="in-feed"
                format="rectangle"
                className="w-full h-full min-h-[250px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Why Choose Us?
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Built from the ground up for privacy, speed, and reliability.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold">Absolute Privacy</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Zero server uploads. Your files are processed entirely within your
              device&apos;s local memory sandbox, ensuring total data security
              and confidentiality.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <Zap size={28} />
            </div>
            <h3 className="text-2xl font-bold">WebAssembly Powered</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Bypass traditional browser limits. We utilize compiled WASM
              binaries to deliver desktop-grade computational performance for
              heavy media tasks.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <Layers size={28} />
            </div>
            <h3 className="text-2xl font-bold">Infinite Canvas Editor</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Move beyond rigid form inputs. Edit on a fluid, infinite visual
              workspace that supports non-destructive layering and real-time
              previews.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <Cpu size={28} />
            </div>
            <h3 className="text-2xl font-bold">Hardware Acceleration</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Utilize WebGL and your device&apos;s native GPU for blazing-fast
              image rendering and complex AI model execution directly in the
              browser.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <WifiOff size={28} />
            </div>
            <h3 className="text-2xl font-bold">Offline Capable</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Install as a Progressive Web App (PWA). Once loaded, the core
              engine is cached, allowing you to process files without an
              internet connection.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <Unlock size={28} />
            </div>
            <h3 className="text-2xl font-bold">No File Limits</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Because files are processed locally, you are completely free from
              arbitrary server-side upload caps. Process files as large as your
              device&apos;s RAM allows.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-panel/50 border-t border-panel-border py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Who is File Forge For?
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              From quick edits to professional workflows, our local-first
              architecture scales to meet your needs without compromising
              privacy.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-background border border-panel-border rounded-[2rem] transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
              <h3 className="text-2xl font-bold mb-4">Designers & Creators</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Instantly remove backgrounds, convert formats, and compress
                assets for web deployment. The infinite PixiJS canvas gives you
                a familiar workspace without the bloat of heavy design apps.
              </p>
              <ul className="space-y-4 text-sm text-foreground font-medium">
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> Client-side
                  AI masking
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> Batch image
                  compression
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> WebP & AVIF
                  conversion
                </li>
              </ul>
            </div>

            <div className="p-10 bg-background border border-panel-border rounded-[2rem] transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
              <h3 className="text-2xl font-bold mb-4">Privacy Professionals</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Working with sensitive legal, medical, or financial documents?
                Never upload them to a remote server again. Every single byte is
                processed securely within your browser sandbox.
              </p>
              <ul className="space-y-4 text-sm text-foreground font-medium">
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> Merge &
                  split PDFs locally
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> Redact
                  sensitive information
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" />{" "}
                  Offline-capable operations
                </li>
              </ul>
            </div>

            <div className="p-10 bg-background border border-panel-border rounded-[2rem] transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
              <h3 className="text-2xl font-bold mb-4">Video Editors</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Cut, trim, and compress raw video files quickly before sharing
                them online. File Forge uses ffmpeg.wasm to encode massive files
                right on your GPU, saving you hours of upload time.
              </p>
              <ul className="space-y-4 text-sm text-foreground font-medium">
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> WASM
                  accelerated encoding
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> MP4 to GIF
                  creation
                </li>
                <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                  <ArrowRight size={18} className="text-primary" /> Audio track
                  extraction
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* In-Article AdSense */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <GoogleAd
          type="in-article"
          format="fluid"
          layout="in-article"
          className="w-full h-[200px] md:h-[250px] rounded-2xl"
        />
      </section>

      {/* Comprehensive SEO Content Section */}
      <section className="bg-panel border-y border-panel-border py-24">
        <div className="max-w-4xl mx-auto px-6 prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-em:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal">
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white/20 dark:from-black/20 via-transparent to-transparent"></div>
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

      <Footer />

      <StickyBottomAd />
    </div>
  );
}
