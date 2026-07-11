"use client";

import React from "react";
import {
  Crop,
  Image as ImageIcon,
  Download,
  Settings,
  Layers,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function Toolbar() {
  const { activeTool, setActiveTool } = useWorkspaceStore();

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "crop", icon: Crop, label: "Crop" },
    { id: "image", icon: ImageIcon, label: "Image Tools" },
    { id: "layers", icon: Layers, label: "Layers" },
  ];

  return (
    <aside className="w-16 flex flex-col items-center py-4 gap-4 bg-zinc-950 z-20">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 group relative",
            activeTool === tool.id
              ? "bg-blue-500/10 text-blue-500"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
          )}
          title={tool.label}
        >
          <tool.icon size={22} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
        </button>
      ))}

      <div className="mt-auto flex flex-col gap-4">
        <button className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all">
          <Settings size={22} />
        </button>
      </div>
    </aside>
  );
}
