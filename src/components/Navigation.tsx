"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { TOOL_MENUS } from "@/config/tools";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const currentTool = TOOL_MENUS.flatMap((m) => m.items).find(
    (i) => i.href === pathname,
  );

  return (
    <>
      <nav className="w-full border-b border-panel-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="File Forge Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="hidden md:inline">File Forge</span>
              {!currentTool && <span className="md:hidden">File Forge</span>}
            </Link>
            {currentTool && (
              <>
                <span className="text-muted-foreground/50 md:hidden font-light text-xl">
                  |
                </span>
                <span className="md:hidden font-bold text-sm truncate max-w-[140px] text-foreground">
                  {currentTool.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 hidden md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              {TOOL_MENUS.map((menu) => (
                <div key={menu.title} className="relative group">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors py-4">
                    {menu.title}{" "}
                    <ChevronDown
                      size={14}
                      className="group-hover:rotate-180 transition-transform"
                    />
                  </div>
                  <div className="absolute top-[100%] left-0 w-48 bg-panel border border-panel-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 z-50">
                    {menu.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-4 py-2 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <ThemeToggle />
            <Link
              href="/auth"
              className="hidden md:flex ml-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors"
            >
              Log In
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background border-b border-panel-border z-40 p-4 flex flex-col gap-6 overflow-y-auto">
          {TOOL_MENUS.map((menu) => (
            <div key={menu.title} className="flex flex-col gap-2">
              <div className="font-bold text-foreground px-2">
                {menu.title} Tools
              </div>
              <div className="grid grid-cols-2 gap-2">
                {menu.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 bg-panel border border-panel-border rounded-xl font-medium text-foreground hover:border-primary transition-colors text-sm flex items-center justify-center text-center"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
