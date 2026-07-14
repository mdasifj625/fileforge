"use client";

import { useState } from "react";
import { X } from "lucide-react";
import GoogleAd from "./GoogleAd";

export default function StickyBottomAd() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <>
      {/* Invisible spacer block that exists in normal document flow. 
          This prevents the fixed ad from covering the footer, 
          and vanishes when the ad is closed. */}
      <div
        className="w-full h-[80px] md:h-[120px] shrink-0"
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none pb-safe">
        <div className="max-w-[728px] mx-auto flex justify-center pointer-events-auto relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-8 right-2 md:right-4 bg-background/90 text-muted-foreground hover:text-foreground p-1.5 rounded-t-lg border border-b-0 border-panel-border/50 backdrop-blur-md transition-colors"
            aria-label="Close Advertisement"
          >
            <X size={16} />
          </button>
          <GoogleAd
            type="anchor"
            format="horizontal"
            className="w-full min-h-[50px] md:min-h-[90px] h-auto rounded-t-xl border-b-0 bg-background/95 backdrop-blur-md"
            label="Advertisement"
          />
        </div>
      </div>
    </>
  );
}
