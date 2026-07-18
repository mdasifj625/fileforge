export function FAQ() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        <div className="border border-panel-border bg-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Is File Forge really free?</h3>
          <p className="text-muted-foreground">
            Yes. Because we process files using your device&apos;s hardware (CPU
            and GPU) rather than paying for expensive cloud servers, we can
            offer professional-grade tools without the typical subscription
            costs or arbitrary usage limits.
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
            We support virtually all modern formats. For images: JPG, PNG, WebP,
            AVIF, and SVG. For video: MP4, WebM, MOV, and GIF. For audio: MP3,
            WAV, and AAC. For documents: standard PDF manipulation.
          </p>
        </div>
        <div className="border border-panel-border bg-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-2">
            Do you store any of my data?
          </h3>
          <p className="text-muted-foreground">
            No. We have no servers to store your files. Your files exist only in
            your browser&apos;s local memory (RAM) while you are editing them,
            and are cleared the moment you close the tab.
          </p>
        </div>
      </div>
    </section>
  );
}
