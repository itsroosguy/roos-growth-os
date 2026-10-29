import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roos StudioX Business OS — WhatsApp CRM & Sales Automation",
  description:
    "A calm, human CRM for WhatsApp conversations, sales pipelines, and team operations by Roos StudioX.",
  keywords: [
    "Roos StudioX Business OS",
    "WhatsApp CRM",
    "Sales Pipeline",
    "Customer Messaging",
    "Team Inbox",
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
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Google+Sans+Text:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F5F0] text-[#12141A] antialiased selection:bg-[#FF5A1F] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
