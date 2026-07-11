"use client";

import { useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function Home() {
  const theme = useWorkspaceStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  return <WorkspaceLayout />;
}
