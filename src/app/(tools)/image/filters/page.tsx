"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ImageFiltersPage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool("image");
  }, [setActiveTool]);

  return null;
}
