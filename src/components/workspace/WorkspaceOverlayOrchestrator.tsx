import React from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { toolRegistry } from "@/lib/toolRegistry";
import { PDFWorkspaceArea } from "./PDFWorkspaceArea";
import { VideoWorkspaceArea } from "./VideoWorkspaceArea";
import { AudioWorkspaceArea } from "./AudioWorkspaceArea";
import { UtilityWorkspaceArea } from "./UtilityWorkspaceArea";

export function WorkspaceOverlayOrchestrator() {
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const activeToolDef = activeTool ? toolRegistry[activeTool] : undefined;
  const ActiveWorkspaceOverlay = activeToolDef?.WorkspaceOverlayComponent;

  if (ActiveWorkspaceOverlay) {
    return <ActiveWorkspaceOverlay />;
  }

  if (
    activeTool?.startsWith("pdf-") ||
    activeTool?.startsWith("ai-summarize-pdf") ||
    activeTool?.startsWith("ai-translate-document")
  ) {
    return <PDFWorkspaceArea />;
  }

  if (activeTool?.startsWith("video-")) {
    return <VideoWorkspaceArea />;
  }

  if (activeTool?.startsWith("audio-")) {
    return <AudioWorkspaceArea />;
  }

  if (activeTool?.startsWith("utility-")) {
    return <UtilityWorkspaceArea />;
  }

  return null;
}
