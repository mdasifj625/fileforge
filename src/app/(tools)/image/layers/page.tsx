"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ImageLayersPage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool("layers");
  }, [setActiveTool]);

  return null;
}
