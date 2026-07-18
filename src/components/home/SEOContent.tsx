export function SEOContent() {
  return (
    <section className="bg-panel border-y border-panel-border py-24">
      <div className="max-w-4xl mx-auto px-6 prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-em:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal">
        <h2 className="text-3xl font-bold text-center mb-12">
          The Next Generation of Browser-Based Processing
        </h2>
        <p>
          Welcome to <strong>File Forge</strong>, the ultimate privacy-first
          workspace. Unlike traditional online converters that upload your
          sensitive documents to remote servers, File Forge operates entirely
          within your web browser. By leveraging powerful web technologies like
          WebAssembly (WASM) and WebGL, we bring desktop-class computing power
          directly to your fingertips.
        </p>
        <h3>How Local Processing Changes Everything</h3>
        <p>
          When you use a traditional file converter, your file is uploaded over
          your internet connection, placed into a remote server queue,
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
          cache. It processes your images instantly using your own GPU, allowing
          for real-time edge feathering and mask painting without any
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
  );
}
