"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function ImageCropPage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool("crop");
  }, [setActiveTool]);

  return null;
}
