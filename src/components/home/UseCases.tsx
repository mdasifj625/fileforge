import { ArrowRight } from "lucide-react";

export function UseCases() {
  return (
    <section className="bg-panel/50 border-t border-panel-border py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Who is File Forge For?
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            From quick edits to professional workflows, our local-first
            architecture scales to meet your needs without compromising privacy.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-10 bg-background border border-panel-border rounded-[2rem] transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
            <h3 className="text-2xl font-bold mb-4">Designers & Creators</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Instantly remove backgrounds, convert formats, and compress assets
              for web deployment. The infinite PixiJS canvas gives you a
              familiar workspace without the bloat of heavy design apps.
            </p>
            <ul className="space-y-4 text-sm text-foreground font-medium">
              <li className="flex items-center gap-3 bg-panel p-3 rounded-xl border border-panel-border">
                <ArrowRight size={18} className="text-primary" /> Client-side AI
                masking
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
                <ArrowRight size={18} className="text-primary" /> Merge & split
                PDFs locally
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
  );
}
