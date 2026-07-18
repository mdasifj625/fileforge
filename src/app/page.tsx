"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GoogleAd from "@/components/ads/GoogleAd";

import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ToolsShowcase } from "@/components/home/ToolsShowcase";
import { Features } from "@/components/home/Features";
import { UseCases } from "@/components/home/UseCases";
import { SEOContent } from "@/components/home/SEOContent";
import { FAQ } from "@/components/home/FAQ";
import { CallToAction } from "@/components/home/CallToAction";
import StickyBottomAd from "@/components/ads/StickyBottomAd";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      <HeroSection />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <GoogleAd
          type="display"
          format="horizontal"
          className="w-full h-[100px] md:h-[120px] rounded-2xl"
        />
      </div>

      <HowItWorks />

      <ToolsShowcase />

      <Features />

      <UseCases />

      <section className="max-w-4xl mx-auto px-6 py-8">
        <GoogleAd
          type="in-article"
          format="fluid"
          layout="in-article"
          className="w-full h-[200px] md:h-[250px] rounded-2xl"
        />
      </section>

      <SEOContent />

      <FAQ />

      <CallToAction />

      <Footer />

      <StickyBottomAd />
    </div>
  );
}
