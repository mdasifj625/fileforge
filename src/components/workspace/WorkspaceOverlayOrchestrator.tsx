import React from "react";
import { useToolStore } from "@/store/useToolStore";
import { toolRegistry } from "@/lib/toolRegistry";
import { PDFWorkspaceArea } from "@/components/workspace/PDFWorkspaceArea";
import { VideoWorkspaceArea } from "@/components/workspace/VideoWorkspaceArea";
import { AudioWorkspaceArea } from "@/components/workspace/AudioWorkspaceArea";
import { UtilityWorkspaceArea } from "@/components/workspace/UtilityWorkspaceArea";

import { FeatureErrorBoundary } from "@/components/FeatureErrorBoundary";

export function WorkspaceOverlayOrchestrator() {
  const activeTool = useToolStore((s) => s.activeTool);
  const activeToolDef = activeTool ? toolRegistry[activeTool] : undefined;
  const ActiveWorkspaceOverlay = activeToolDef?.WorkspaceOverlayComponent;

  const resetTool = () => {
    useToolStore.getState().setActiveTool(null);
  };

  const renderContent = () => {
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
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <FeatureErrorBoundary
      toolName={activeToolDef?.name || activeTool || "Workspace Tool"}
      onReset={resetTool}
    >
      {content}
    </FeatureErrorBoundary>
  );
}
