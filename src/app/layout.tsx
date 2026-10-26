import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROOS STUDIOX — Growth OS | WhatsApp CRM & Automation",
  description:
    "Institutional WhatsApp CRM, commercial pipeline management, and autonomous business workflows by ROOS STUDIOX.",
  keywords: [
    "ROOS STUDIOX",
    "Growth OS",
    "WhatsApp CRM",
    "Business Automation",
    "Enterprise Messaging",
    "Sales Pipeline",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Google+Sans+Text:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F7F8] text-[#0D0D0E] antialiased selection:bg-[#FF7900] selection:text-white font-sans text-[15px]">
        {children}
      </body>
    </html>
  );
}

