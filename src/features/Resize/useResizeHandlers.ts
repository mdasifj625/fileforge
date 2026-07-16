import { useState, useEffect } from "react";
import { FileLayer as ImageLayer } from "@/store/useWorkspaceStore";

interface ResizeHandlersProps {
  layer: ImageLayer;
  doNotEnlarge: boolean;
  lockRatio: boolean;
  updateLayerTransform: (id: string, updates: Partial<ImageLayer>) => void;
}

export function useResizeHandlers({
  layer,
  doNotEnlarge,
  lockRatio,
  updateLayerTransform,
}: ResizeHandlersProps) {
  const storeWidth = Math.round(layer.originalWidth * Math.abs(layer.scaleX));
  const storeHeight = Math.round(layer.originalHeight * Math.abs(layer.scaleY));
  const storeScale = Math.round(Math.abs(layer.scaleX) * 100);

  const [inputWidth, setInputWidth] = useState(storeWidth.toString());
  const [prevStoreWidth, setPrevStoreWidth] = useState(storeWidth);

  if (storeWidth !== prevStoreWidth) {
    setPrevStoreWidth(storeWidth);
    if (parseFloat(inputWidth) !== storeWidth && inputWidth !== "") {
      setInputWidth(storeWidth.toString());
    }
  }

  const [inputHeight, setInputHeight] = useState(storeHeight.toString());
  const [prevStoreHeight, setPrevStoreHeight] = useState(storeHeight);

  if (storeHeight !== prevStoreHeight) {
    setPrevStoreHeight(storeHeight);
    if (parseFloat(inputHeight) !== storeHeight && inputHeight !== "") {
      setInputHeight(storeHeight.toString());
    }
  }

  const [inputScale, setInputScale] = useState(storeScale.toString());
  const [prevStoreScale, setPrevStoreScale] = useState(storeScale);

  if (storeScale !== prevStoreScale) {
    setPrevStoreScale(storeScale);
    if (parseFloat(inputScale) !== storeScale && inputScale !== "") {
      setInputScale(storeScale.toString());
    }
  }

  const handleWidthChange = (valStr: string) => {
    setInputWidth(valStr);
    const val = parseFloat(valStr);
    if (isNaN(val) || val <= 0) return;

    let newScaleX = val / layer.originalWidth;
    if (doNotEnlarge && newScaleX > 1) newScaleX = 1;

    const signX = layer.scaleX < 0 ? -1 : 1;

    if (lockRatio) {
      const signY = layer.scaleY < 0 ? -1 : 1;
      updateLayerTransform(layer.id, {
        scaleX: newScaleX * signX,
        scaleY: newScaleX * signY,
      });
    } else {
      updateLayerTransform(layer.id, {
        scaleX: newScaleX * signX,
      });
    }
  };

  const handleHeightChange = (valStr: string) => {
    setInputHeight(valStr);
    const val = Number.parseFloat(valStr);
    if (Number.isNaN(val) || val <= 0) return;

    let newScaleY = val / layer.originalHeight;
    if (doNotEnlarge && newScaleY > 1) newScaleY = 1;

    const signY = layer.scaleY < 0 ? -1 : 1;

    if (lockRatio) {
      const signX = layer.scaleX < 0 ? -1 : 1;
      updateLayerTransform(layer.id, {
        scaleX: newScaleY * signX,
        scaleY: newScaleY * signY,
      });
    } else {
      updateLayerTransform(layer.id, {
        scaleY: newScaleY * signY,
      });
    }
  };

  const handleScaleChange = (valStr: string | number) => {
    const isStr = typeof valStr === "string";
    if (isStr) setInputScale(valStr);

    const val = typeof valStr === "string" ? Number.parseFloat(valStr) : valStr;
    if (Number.isNaN(val) || val <= 0) return;

    let newScale = val / 100;
    if (doNotEnlarge && newScale > 1) newScale = 1;

    const signX = layer.scaleX < 0 ? -1 : 1;
    const signY = layer.scaleY < 0 ? -1 : 1;

    updateLayerTransform(layer.id, {
      scaleX: newScale * signX,
      scaleY: newScale * signY,
    });
  };

  useEffect(() => {
    if (doNotEnlarge && storeScale > 100) {
      const signX = layer.scaleX < 0 ? -1 : 1;
      const signY = layer.scaleY < 0 ? -1 : 1;

      updateLayerTransform(layer.id, {
        scaleX: 1 * signX,
        scaleY: 1 * signY,
      });
    }
  }, [
    storeScale,
    doNotEnlarge,
    layer.id,
    layer.scaleX,
    layer.scaleY,
    updateLayerTransform,
  ]);

  return {
    inputWidth,
    inputHeight,
    inputScale,
    storeScale,
    handleWidthChange,
    handleHeightChange,
    handleScaleChange,
  };
}
