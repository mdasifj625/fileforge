import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
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
  );
}
