import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
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
          WebAssembly and WebGL. Zero servers. Infinite speed. Absolute privacy.
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
  );
}
