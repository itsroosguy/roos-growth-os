import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roos StudioX — Growth Partner for Ambitious Brands",
  description:
    "We combine strategy, design, technology, and AI automation to create high-performance digital ecosystems that strengthen brands and drive revenue growth.",
  keywords: [
    "Creative Intelligence Studio",
    "Brand Strategy",
    "Website Design",
    "AI Automation",
    "Growth Systems",
    "Roos StudioX",
    "Praveen Raj",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-[#2563EB] selection:text-white">
        {children}
      </body>
    </html>
  );
}

