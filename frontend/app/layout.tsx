import type { Metadata } from "next";
import { Figtree, DM_Mono } from "next/font/google";
import "./globals.css";
import "./qui-colors.css";
import "./qui-shell.css";
import "@/components/components/components.css";
import { Toaster } from "@/components/ui/sonner";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quntem SmartMail",
  description: "Quntem SmartMail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${figtree.variable} ${dmMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
