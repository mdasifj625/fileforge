import { UploadCloud, Settings, Download } from "lucide-react";

export function HowItWorks() {
  return (
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
              Drag and drop any image, video, audio, or PDF. The file is loaded
              entirely into local browser memory.
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
              Our WebAssembly engine and client-side AI process your data using
              your own CPU and GPU.
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
  );
}
