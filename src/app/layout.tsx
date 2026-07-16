import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "File Forge - Local AI & WebAssembly File Processor",
  description:
    "Process images, PDFs, videos, and audio directly in your browser. 100% private, local-first editing using WASM and WebGL.",
  openGraph: {
    title: "File Forge - Local AI & WebAssembly File Processor",
    description:
      "Process images, PDFs, videos, and audio directly in your browser. 100% private, local-first editing using WASM and WebGL.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalErrorHandler>
          <ThemeProvider>{children}</ThemeProvider>
        </GlobalErrorHandler>
      </body>
    </html>
  );
}
