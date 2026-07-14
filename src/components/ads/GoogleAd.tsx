"use client";

import { useEffect, useRef } from "react";

interface GoogleAdProps {
  className?: string;
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  layout?: string;
  responsive?: boolean;
  type?: "in-feed" | "in-article" | "display" | "anchor" | "skyscraper";
  label?: string;
}

export default function GoogleAd({
  className = "",
  slotId = "placeholder",
  format = "auto",
  layout,
  responsive = true,
  type = "display",
  label = "Advertisement",
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Initialize ad if Google script is loaded and not a placeholder
      if (
        typeof window !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).adsbygoogle &&
        slotId !== "placeholder"
      ) {
        // Prevent duplicate initialization
        if (!adRef.current?.getAttribute("data-adsbygoogle-status")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).adsbygoogle.push({});
        }
      }
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, [slotId]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-panel/30 border border-panel-border/50 overflow-hidden ${className}`}
    >
      {label && (
        <span className="absolute top-0 left-0 bg-background/80 text-muted-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-br-md z-10 backdrop-blur-sm border-b border-r border-panel-border/50">
          {label}
        </span>
      )}

      {slotId === "placeholder" ? (
        <div className="w-full h-full min-h-[90px] flex items-center justify-center p-4">
          <span className="text-muted-foreground/50 font-medium text-sm text-center">
            AdSense Space <br className="md:hidden" />
            <span className="text-xs">({type})</span>
          </span>
        </div>
      ) : (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with actual publisher ID
          data-ad-slot={slotId}
          data-ad-format={format}
          data-ad-layout={layout}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      )}
    </div>
  );
}
