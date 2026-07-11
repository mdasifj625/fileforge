"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ImageSelectPage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool("select");
  }, [setActiveTool]);

  return null;
}
