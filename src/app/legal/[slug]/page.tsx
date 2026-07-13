import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Privacy from "@/content/legal/privacy.mdx";
import Terms from "@/content/legal/terms.mdx";
import Contact from "@/content/legal/contact.mdx";

const contentMap = {
  privacy: Privacy,
  terms: Terms,
  contact: Contact,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "privacy") return { title: "Privacy Policy | File Forge" };
  if (slug === "terms") return { title: "Terms of Service | File Forge" };
  if (slug === "contact") return { title: "Contact Us | File Forge" };
  return { title: "Legal | File Forge" };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== "privacy" && slug !== "terms" && slug !== "contact") {
    notFound();
  }

  const Content = contentMap[slug as keyof typeof contentMap];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <Navigation />
      <div className="flex-grow py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={20} /> Back to Home
          </Link>
          <div className="prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground max-w-none">
            <Content />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
