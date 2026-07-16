import React from "react";
import { FileLayer as Layer } from "@/store/useWorkspaceStore";
import { LayerCropSettings } from "./LayerCropSettings";
import { SmartCropSettings } from "./SmartCropSettings";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface Props {
  layer?: Layer;
}

export function CropSettings({ layer }: Readonly<Props>) {
  const updateLayerTransform = useWorkspaceStore((s) => s.updateLayerTransform);

  if (!layer || layer.type !== "image") {
    return (
      <div className="text-xs text-muted-foreground text-center">
        Crop tool requires an image layer.
      </div>
    );
  }

  return (
    <>
      {layer.originalWidth > 0 && (
        <>
          <LayerCropSettings
            layer={layer}
            updateLayerTransform={updateLayerTransform}
          />
          <SmartCropSettings layer={layer} />
        </>
      )}
    </>
  );
}
