export type Format = "image/png" | "image/jpeg" | "image/webp";
export type FitMode = "stretch" | "contain" | "cover";

export const formatSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  return (bytes / 1024).toFixed(1) + " KB";
};

export const calculateDrawRect = (
  cw: number,
  ch: number,
  iw: number,
  ih: number,
  fit: FitMode,
) => {
  if (fit === "stretch") return { x: 0, y: 0, w: cw, h: ch };
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;
  let drawWidth = cw,
    drawHeight = ch,
    offsetX = 0,
    offsetY = 0;
  if (fit === "contain") {
    if (imgRatio > canvasRatio) {
      drawHeight = cw / imgRatio;
      offsetY = (ch - drawHeight) / 2;
    } else {
      drawWidth = ch * imgRatio;
      offsetX = (cw - drawWidth) / 2;
    }
  } else if (fit === "cover") {
    if (imgRatio > canvasRatio) {
      drawWidth = ch * imgRatio;
      offsetX = (cw - drawWidth) / 2;
    } else {
      drawHeight = cw / imgRatio;
      offsetY = (ch - drawHeight) / 2;
    }
  }
  return { x: offsetX, y: offsetY, w: drawWidth, h: drawHeight };
};
