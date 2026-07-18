import { ShieldCheck, Zap, Layers, Cpu, WifiOff, Unlock } from "lucide-react";

export function Features() {
  return (
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
            device&apos;s local memory sandbox, ensuring total data security and
            confidentiality.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Zap size={28} />
          </div>
          <h3 className="text-2xl font-bold">WebAssembly Powered</h3>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Bypass traditional browser limits. We utilize compiled WASM binaries
            to deliver desktop-grade computational performance for heavy media
            tasks.
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
            Install as a Progressive Web App (PWA). Once loaded, the core engine
            is cached, allowing you to process files without an internet
            connection.
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
  );
}
