"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { TOOL_MENUS } from "@/config/tools";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-full border-b border-panel-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm shadow-primary/20">
              <Image
                src="/logo.png"
                alt="File Forge Logo"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            File Forge
          </Link>
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
            <Link
              href="/auth"
              className="hidden md:flex ml-4 px-4 py-2 text-foreground font-bold text-sm hover:opacity-80 transition-opacity"
            >
              Log In
            </Link>
          </div>
          <button
            className="md:hidden p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
