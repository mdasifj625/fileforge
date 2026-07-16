import { useState, useEffect } from "react";
import { db } from "@/db";
import { Layer } from "@/types/layer";

export function useLayerBlobs(layers: Layer[]) {
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBlobs = async () => {
      if (layers.length === 0) {
        if (mounted) {
          setBlobs({});
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const newBlobs: Record<string, Blob> = {};
      let changed = false;

      const layerFetchPromises = layers.map(async (layer) => {
        if (blobs[layer.fileId]) {
          return { id: layer.fileId, blob: blobs[layer.fileId], cached: true };
        }
        try {
          const fileRecord = await db.files.get(layer.fileId);
          return {
            id: layer.fileId,
            blob: fileRecord?.blob || null,
            cached: false,
          };
        } catch (e) {
          console.error("Failed to load blob for layer", layer.fileId, e);
          return { id: layer.fileId, blob: null, cached: false };
        }
      });

      const results = await Promise.all(layerFetchPromises);

      for (const res of results) {
        if (res.blob) {
          newBlobs[res.id] = res.blob;
          if (!res.cached) changed = true;
        }
      }

      if (mounted && changed) {
        setBlobs((prev) => ({ ...prev, ...newBlobs }));
      }
      if (mounted) {
        setIsLoading(false);
      }
    };

    fetchBlobs();

    return () => {
      mounted = false;
    };
  }, [layers, blobs]);

  return { blobs, isLoading };
}
