import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-panel-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="File Forge Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              File Forge
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              The ultimate privacy-first file workspace. Process images, PDFs,
              videos, and audio locally in your browser. Fast, secure, and 100%
              free.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-foreground">Tools</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/image/compress"
                  className="hover:text-primary transition-colors"
                >
                  Image Suite
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf/merge"
                  className="hover:text-primary transition-colors"
                >
                  PDF Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/video/compress"
                  className="hover:text-primary transition-colors"
                >
                  Video Encoding
                </Link>
              </li>
              <li>
                <Link
                  href="/audio/compress"
                  className="hover:text-primary transition-colors"
                >
                  Audio Suite
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-foreground">More</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/ai/remove-background"
                  className="hover:text-primary transition-colors"
                >
                  AI Background Removal
                </Link>
              </li>
              <li>
                <Link
                  href="/convert/image-to-pdf"
                  className="hover:text-primary transition-colors"
                >
                  Format Converters
                </Link>
              </li>
              <li>
                <Link
                  href="/utility/qr-generator"
                  className="hover:text-primary transition-colors"
                >
                  Utility Belt
                </Link>
              </li>
              <li>
                <Link
                  href="/#tools"
                  className="hover:text-primary transition-colors"
                >
                  All Features
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-foreground">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-panel-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} File Forge. All rights reserved.
          </p>
          <div className="flex gap-4 text-muted-foreground text-sm font-medium">
            <span>Your files never leave your device.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
