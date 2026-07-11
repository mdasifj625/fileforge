"use client";

import React from "react";
import {
  Crop,
  Image as ImageIcon,
  Settings,
  Layers,
  MousePointer2,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

import Link from "next/link";
import { FilePlus2 } from "lucide-react";

const TOOLS = [
  { id: "select", icon: MousePointer2, name: "Select", href: "/image/select" },
  { id: "crop", icon: Crop, name: "Crop", href: "/image/crop" },
  { id: "image", icon: ImageIcon, name: "Image Tools", href: "/image/filters" },
  { id: "layers", icon: Layers, name: "Layers", href: "/image/layers" },
  { id: "pdf-merge", icon: FilePlus2, name: "PDF Merge", href: "/pdf/merge" },
];

export function Toolbar() {
  const { activeTool } = useWorkspaceStore();

  return (
    <nav className="w-16 bg-background border-r border-panel-border flex flex-col items-center py-4 gap-2 z-20">
      <div className="mb-4">
        {/* Logo Placeholder */}
        <Link href="/">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-2 w-full px-2">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              title={tool.name}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pb-4 flex flex-col gap-2 w-full px-2">
        <button
          title="Settings"
          className="w-full aspect-square rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
}
