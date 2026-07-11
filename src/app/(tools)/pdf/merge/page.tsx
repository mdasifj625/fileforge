"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function PDFMergePage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool("pdf-merge");
  }, [setActiveTool]);

  return null;
}
