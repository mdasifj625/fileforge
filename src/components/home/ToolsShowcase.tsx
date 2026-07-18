import Link from "next/link";
import {
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Zap,
  Music,
  RefreshCw,
  Wrench,
} from "lucide-react";
import GoogleAd from "@/components/ads/GoogleAd";

export function ToolsShowcase() {
  return (
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
              Remove backgrounds and upscale images using client-side AI models.
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
              Compress, trim, and convert audio formats without losing quality.
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
  );
}
