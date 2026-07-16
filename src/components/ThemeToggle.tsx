"use client";

import { useToolStore } from "@/store/useToolStore";

export default function ThemeToggle() {
  return (
    <button
      onClick={() =>
        useToolStore
          .getState()
          .setTheme(
            useToolStore.getState().theme === "dark" ? "light" : "dark",
          )
      }
      className="p-2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
      title="Toggle Theme"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
    </button>
  );
}
